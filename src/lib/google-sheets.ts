import { randomUUID } from 'node:crypto'
import { dropAccessToken, getAccessToken, readSheetId, SheetsAccessError } from '@/lib/google-auth'

// Talks to the spreadsheet directly through Google's Sheets API instead of
// through the Apps Script web app. Every action here answers with the same
// JSON the script does (see scripts/apps-script/Code.gs, which this mirrors
// handler for handler), so nothing that calls callAppsScript can tell which
// one it got. The difference is speed: a call is one direct request that
// finishes in a fraction of a second, where the script needs 3-40s and
// sometimes loses its reply.

const API_BASE = () => process.env.GOOGLE_SHEETS_API_URL || 'https://sheets.googleapis.com'
const REQUEST_TIMEOUT_MS = 10_000
const OPERATION_BUDGET_MS = 25_000

type Cell = string | number | boolean
type Obj = Record<string, unknown>

/** Google didn't answer, or answered with a passing error (rate limit, 5xx).
 *  A write that hits this may or may not have been applied, so the operations
 *  below are built to be safe to repeat. */
class TransientError extends Error {}
class TabMissingError extends Error {}

// ---------------------------------------------------------------------------
// HTTP
// ---------------------------------------------------------------------------

async function api<T = unknown>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  for (let pass = 0; ; pass++) {
    const token = await getAccessToken()
    let res: Response
    try {
      res = await fetch(API_BASE() + path, {
        method: init.method ?? 'GET',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: init.body === undefined ? undefined : JSON.stringify(init.body),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      })
    } catch (err) {
      throw new TransientError(`got no reply from Google Sheets: ${err instanceof Error ? err.message : err}`, { cause: err })
    }

    // An expired token: sign in again and repeat once.
    if (res.status === 401 && pass === 0) {
      dropAccessToken()
      continue
    }

    const json = (await res.json().catch(() => null)) as { error?: { message?: string } } | null
    if (res.ok) return json as T

    const message = json?.error?.message ?? String(res.status)
    if (res.status === 401 || res.status === 403 || res.status === 404) {
      throw new SheetsAccessError(`Google Sheets refused access (${res.status}): ${message}`)
    }
    if (res.status === 400 && /unable to parse range/i.test(message)) throw new TabMissingError(message)
    if (res.status === 429 || res.status >= 500) {
      throw new TransientError(`got no reply from Google Sheets: ${res.status} ${message}`)
    }
    throw new Error(`Google Sheets rejected the request (${res.status}): ${message}`)
  }
}

const sheetPath = (suffix = '') => `/v4/spreadsheets/${readSheetId()}${suffix}`
const valuesPath = (range: string, suffix = '') => sheetPath(`/values/${encodeURIComponent(range)}${suffix}`)
const quote = (tab: string) => `'${tab.replace(/'/g, "''")}'`

// ---------------------------------------------------------------------------
// Spreadsheet facts that rarely change: its time zone (needed to read dates
// back exactly as the script did) and each tab's numeric id (needed to delete
// a row).
// ---------------------------------------------------------------------------

interface Meta {
  timeZone: string
  tabIds: Map<string, number>
  at: number
}
let meta: Meta | null = null

async function getMeta(force = false): Promise<Meta> {
  if (meta && !force && Date.now() - meta.at < 10 * 60_000) return meta
  const data = await api<{
    properties?: { timeZone?: string }
    sheets?: { properties: { sheetId: number; title: string } }[]
  }>(sheetPath('?fields=properties.timeZone,sheets.properties(sheetId,title)'))
  meta = {
    timeZone: data.properties?.timeZone || 'UTC',
    tabIds: new Map((data.sheets ?? []).map((s) => [s.properties.title, s.properties.sheetId])),
    at: Date.now(),
  }
  return meta
}

async function tabId(tab: string): Promise<number> {
  let id = (await getMeta()).tabIds.get(tab)
  if (id === undefined) id = (await getMeta(true)).tabIds.get(tab)
  if (id === undefined) throw new Error(`Sheet tab "${tab}" not found.`)
  return id
}

// ---------------------------------------------------------------------------
// Reading a tab. Values come back unformatted, with dates as serial numbers
// (days since 1899-12-30) — the same underlying value the script's getValues()
// turned into a Date. Anything written through the script that Sheets took for
// a date therefore arrives as a number and is converted back below.
// ---------------------------------------------------------------------------

interface TabRow {
  sheetRow: number
  cells: unknown[]
  obj: Obj
}
interface Tab {
  name: string
  headers: string[]
  rows: TabRow[]
}

// Tabs the site makes for itself the first time it needs them, so there is no
// manual sheet setup for these features.
const AUTO_TABS: Record<string, string[]> = {
  Registrations: ['id', 'eventId', 'eventTitle', 'eventDate', 'name', 'email', 'phone', 'college', 'year', 'registeredAt'],
  Albums: ['id', 'name', 'slug', 'description', 'cover', 'createdBy', 'createdAt'],
}

/** `create`: make the tab if it is missing (writes always do; a plain read of
 *  a tab that doesn't exist yet just comes back empty, so looking at the site
 *  never changes the sheet — except Registrations, which has always made
 *  itself on first look). */
async function readTab(name: string, create = name === 'Registrations'): Promise<Tab> {
  let data: { values?: unknown[][] }
  try {
    data = await api(valuesPath(quote(name)) + '?valueRenderOption=UNFORMATTED_VALUE&dateTimeRenderOption=SERIAL_NUMBER')
  } catch (err) {
    if (err instanceof TabMissingError) {
      const headers = AUTO_TABS[name]
      if (!headers) throw new Error(`Sheet tab "${name}" not found. See README.md.`)
      if (create) await createTab(name, headers)
      return { name, headers, rows: [] }
    }
    throw err
  }
  const values = data.values ?? []
  const headers = (values[0] ?? []).map((h) => String(h).trim())
  const rows: TabRow[] = []
  values.slice(1).forEach((cells, i) => {
    const obj: Obj = {}
    headers.forEach((h, c) => {
      obj[h] = cells[c] ?? ''
    })
    rows.push({ sheetRow: i + 2, cells, obj })
  })
  return { name, headers, rows }
}

const isBlankRow = (row: TabRow) => row.cells.every((c) => c === '' || c === null || c === undefined)
const liveRows = (tab: Tab) => tab.rows.filter((row) => !isBlankRow(row))

// A serial number is wall-clock time in the spreadsheet's time zone; turn it
// back into the UTC instant it stands for.
function offsetAt(utcMs: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(utcMs))
  const n = (type: string) => Number(parts.find((p) => p.type === type)?.value)
  const asUtc = Date.UTC(n('year'), n('month') - 1, n('day'), n('hour'), n('minute'), n('second'))
  return asUtc - Math.floor(utcMs / 1000) * 1000
}

const SERIAL_EPOCH = Date.UTC(1899, 11, 30)

function serialToDate(serial: number, timeZone: string): Date {
  const wallClock = SERIAL_EPOCH + Math.round(serial * 86_400_000)
  let utc = wallClock - offsetAt(wallClock, timeZone)
  utc = wallClock - offsetAt(utc, timeZone)
  return new Date(utc)
}

// Mirrors dateOnly() / isoString() / toBool() in Code.gs.
function dateOnly(value: unknown): string {
  if (typeof value === 'number') return new Date(SERIAL_EPOCH + Math.floor(value) * 86_400_000).toISOString().slice(0, 10)
  return String(value ?? '')
}
function isoString(value: unknown, timeZone: string): string {
  if (typeof value === 'number') return serialToDate(value, timeZone).toISOString()
  return String(value ?? '')
}
const toBool = (v: unknown) => v === true || String(v).toLowerCase() === 'true'

// An event time typed as "6:00 PM" is turned into a time-of-day by Sheets, and
// arrives as a fraction of a day.
function timeText(value: unknown): unknown {
  if (typeof value !== 'number' || value >= 1) return value
  const minutes = Math.round(value * 24 * 60)
  const h = Math.floor(minutes / 60) % 24
  const m = minutes % 60
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`
}

function normalizeDriveImageUrl(url: unknown): unknown {
  const match = /[?&]id=([^&]+)/.exec(String(url ?? ''))
  if (!match) return url
  return `https://lh3.googleusercontent.com/d/${match[1]}=w1600`
}

// A row's id: a plain string, except that early ids shaped like a timestamp
// were turned into dates by Sheets (see idsMatch in Code.gs).
function idsMatch(cell: unknown, id: unknown, timeZone: string): boolean {
  if (typeof cell === 'number') return String(cell) === String(id) || isoString(cell, timeZone) === String(id)
  return String(cell ?? '') === String(id)
}

// ---------------------------------------------------------------------------
// Writing. Every write reads the tab first (to find the columns and the row),
// then makes one call. Writes to one tab are queued so two from this server
// can't interleave; across servers the read and the write sit back to back,
// so the window for a clash is one round trip.
// ---------------------------------------------------------------------------

const queues = new Map<string, Promise<unknown>>()
function inQueue<T>(tab: string, fn: () => Promise<T>): Promise<T> {
  const run = (queues.get(tab) ?? Promise.resolve()).catch(() => undefined).then(fn)
  queues.set(tab, run)
  return run
}

const RAW = 'valueInputOption=RAW'

// RAW writes each value exactly as given — a phone number keeps its leading
// zero, "=1+1" stays text — where the script's appendRow typed values as a
// person would.
function cellValue(v: unknown): Cell {
  if (v === null || v === undefined) return ''
  if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return v
  return JSON.stringify(v)
}

function colLetter(index: number): string {
  let s = ''
  for (let n = index + 1; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s
  return s
}

/** A column added to an existing tab after the sheet was first set up (the
 *  Gallery's `album`). If it isn't there yet, its heading is written into the
 *  next free cell of the header row. */
async function ensureColumns(tab: Tab, columns: string[]): Promise<void> {
  for (const column of columns) {
    if (tab.headers.includes(column)) continue
    await api(valuesPath(`${quote(tab.name)}!${colLetter(tab.headers.length)}1`) + `?${RAW}`, { method: 'PUT', body: { values: [[column]] } })
    tab.headers.push(column)
  }
}

async function appendRow(tabName: string, row: Obj, extraColumns: string[] = []): Promise<void> {
  return inQueue(tabName, async () => {
    const tab = await readTab(tabName, true)
    await ensureColumns(tab, extraColumns)
    // An id already in the sheet means this exact add already happened — the
    // website derives an add's id from its content and repeats it when a reply
    // is lost — so it is skipped rather than added twice.
    const zone = (await getMeta()).timeZone
    if (row.id && tab.rows.some((r) => idsMatch(r.obj.id, row.id, zone))) return
    await api(valuesPath(quote(tabName), ':append') + `?${RAW}&insertDataOption=INSERT_ROWS`, {
      method: 'POST',
      body: { values: [tab.headers.map((h) => (Object.prototype.hasOwnProperty.call(row, h) ? cellValue(row[h]) : ''))] },
    })
  })
}

async function updateRowById(tabName: string, id: unknown, updates: Obj, extraColumns: string[] = []): Promise<boolean> {
  return inQueue(tabName, async () => {
    const tab = await readTab(tabName, true)
    if (!tab.headers.includes('id')) throw new Error(`Sheet "${tabName}" has no "id" column.`)
    const zone = (await getMeta()).timeZone
    const hit = tab.rows.find((r) => idsMatch(r.obj.id, id, zone))
    if (!hit) return false
    await ensureColumns(tab, extraColumns.filter((c) => c in updates))
    const data = Object.keys(updates)
      .filter((key) => tab.headers.includes(key))
      .map((key) => ({
        range: `${quote(tabName)}!${colLetter(tab.headers.indexOf(key))}${hit.sheetRow}`,
        values: [[cellValue(updates[key])]],
      }))
    if (data.length) {
      await api(sheetPath('/values:batchUpdate'), { method: 'POST', body: { valueInputOption: 'RAW', data } })
    }
    return true
  })
}

async function deleteRowById(tabName: string, id: unknown): Promise<boolean> {
  return inQueue(tabName, async () => {
    const tab = await readTab(tabName, true)
    if (!tab.headers.includes('id')) throw new Error(`Sheet "${tabName}" has no "id" column.`)
    const zone = (await getMeta()).timeZone
    const hit = tab.rows.find((r) => idsMatch(r.obj.id, id, zone))
    if (!hit) return false
    await deleteSheetRow(tabName, hit.sheetRow)
    return true
  })
}

async function deleteSheetRow(tabName: string, sheetRow: number) {
  await api(sheetPath(':batchUpdate'), {
    method: 'POST',
    body: {
      requests: [
        { deleteDimension: { range: { sheetId: await tabId(tabName), dimension: 'ROWS', startIndex: sheetRow - 1, endIndex: sheetRow } } },
      ],
    },
  })
}

// ---------------------------------------------------------------------------
// Each tab: how a row reads, how a new one is built. (Same fields, same
// defaults as the handlers in Code.gs.)
// ---------------------------------------------------------------------------

interface Entity {
  tab: string
  /** The key the add reply carries the new row under. */
  key: string
  notFound: string
  /** Columns the tab may not have yet; they are added when first written to. */
  extraColumns?: string[]
  read: (row: Obj, zone: string) => Obj
  build: (body: Obj) => Obj
}

const now = () => new Date().toISOString()
const by = (body: Obj) => body.createdBy || ''

const ENTITIES: Record<string, Entity> = {
  Event: {
    tab: 'Events',
    key: 'event',
    notFound: 'Event not found.',
    read: (row, zone) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      date: dateOnly(row.date),
      time: timeText(row.time),
      location: row.location,
      category: row.category,
      image: row.image,
      capacity: row.capacity ? Number(row.capacity) : undefined,
      published: row.published === '' || row.published === undefined ? true : toBool(row.published),
      pinned: toBool(row.pinned),
      createdBy: row.createdBy,
      createdAt: isoString(row.createdAt, zone),
    }),
    build: (body) => ({
      id: body.id || randomUUID(),
      title: body.title,
      description: body.description,
      date: body.date,
      time: body.time,
      location: body.location,
      category: body.category,
      image: body.image,
      capacity: body.capacity || '',
      published: body.published !== false,
      pinned: !!body.pinned,
      createdBy: by(body),
      createdAt: now(),
    }),
  },
  Announcement: {
    tab: 'Announcements',
    key: 'announcement',
    notFound: 'Announcement not found.',
    read: (row, zone) => ({
      id: row.id,
      title: row.title,
      body: row.body,
      published: toBool(row.published),
      pinned: toBool(row.pinned),
      createdBy: row.createdBy,
      createdAt: isoString(row.createdAt, zone),
    }),
    build: (body) => ({
      id: body.id || randomUUID(),
      title: body.title,
      body: body.body,
      published: body.published !== false,
      pinned: !!body.pinned,
      createdBy: by(body),
      createdAt: now(),
    }),
  },
  GalleryImage: {
    tab: 'Gallery',
    key: 'image',
    notFound: 'Photo not found.',
    extraColumns: ['album'],
    read: (row, zone) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      image: normalizeDriveImageUrl(row.image),
      category: row.category,
      album: String(row.album ?? ''),
      date: dateOnly(row.date),
      createdBy: row.createdBy,
      createdAt: isoString(row.createdAt, zone),
    }),
    // The photo is already in Drive by the time this runs (the site uploads it
    // first and passes its address as `image`).
    build: (body) => ({
      id: body.id || randomUUID(),
      title: body.title,
      description: body.description || '',
      image: body.image,
      category: body.category,
      album: body.album || '',
      date: now().slice(0, 10),
      createdBy: by(body),
      createdAt: now(),
    }),
  },
  Album: {
    tab: 'Albums',
    key: 'album',
    notFound: 'Folder not found.',
    read: (row, zone) => ({
      id: row.id,
      name: row.name,
      slug: String(row.slug ?? ''),
      description: row.description || '',
      cover: row.cover || '',
      createdBy: row.createdBy,
      createdAt: isoString(row.createdAt, zone),
    }),
    build: (body) => ({
      id: body.id || randomUUID(),
      name: body.name,
      slug: body.slug,
      description: body.description || '',
      cover: body.cover || '',
      createdBy: by(body),
      createdAt: now(),
    }),
  },
  Project: {
    tab: 'Projects',
    key: 'project',
    notFound: 'Project not found.',
    read: (row, zone) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      team: row.team || '',
      technologies: row.technologies || '',
      image: row.image || '',
      iconKey: row.iconKey || '',
      featured: toBool(row.featured),
      link: row.link || '',
      createdBy: row.createdBy,
      createdAt: isoString(row.createdAt, zone),
    }),
    build: (body) => ({
      id: body.id || randomUUID(),
      title: body.title,
      description: body.description,
      team: body.team || '',
      technologies: body.technologies || '',
      image: body.image || '',
      iconKey: body.iconKey || '',
      featured: !!body.featured,
      link: body.link || '',
      createdBy: by(body),
      createdAt: now(),
    }),
  },
  Achievement: {
    tab: 'Achievements',
    key: 'achievement',
    notFound: 'Achievement not found.',
    read: (row, zone) => ({
      id: row.id,
      title: row.title,
      placement: row.placement,
      institution: row.institution || '',
      description: row.description || '',
      image: normalizeDriveImageUrl(row.image),
      createdBy: row.createdBy,
      createdAt: isoString(row.createdAt, zone),
    }),
    build: (body) => ({
      id: body.id || randomUUID(),
      title: body.title,
      placement: body.placement,
      institution: body.institution || '',
      description: body.description || '',
      image: body.image || '',
      createdBy: by(body),
      createdAt: now(),
    }),
  },
  TeamMember: {
    tab: 'TeamMembers',
    key: 'member',
    notFound: 'Team member not found.',
    read: (row, zone) => ({
      id: row.id,
      name: row.name,
      role: row.role,
      bio: row.bio,
      image: row.image || '',
      expertise: row.expertise || '',
      contact: row.contact || '',
      createdBy: row.createdBy,
      createdAt: isoString(row.createdAt, zone),
    }),
    build: (body) => ({
      id: body.id || randomUUID(),
      name: body.name,
      role: body.role,
      bio: body.bio,
      image: body.image || '',
      expertise: body.expertise || '',
      contact: body.contact || '',
      createdBy: by(body),
      createdAt: now(),
    }),
  },
  Program: {
    tab: 'Programs',
    key: 'program',
    notFound: 'Program not found.',
    read: (row, zone) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      duration: row.duration,
      level: row.level,
      topics: row.topics || '',
      image: row.image,
      createdBy: row.createdBy,
      createdAt: isoString(row.createdAt, zone),
    }),
    build: (body) => ({
      id: body.id || randomUUID(),
      title: body.title,
      description: body.description,
      duration: body.duration,
      level: body.level,
      topics: body.topics || '',
      image: body.image,
      createdBy: by(body),
      createdAt: now(),
    }),
  },
  Facility: {
    tab: 'Facilities',
    key: 'facility',
    notFound: 'Facility not found.',
    read: (row, zone) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      image: row.image,
      createdBy: row.createdBy,
      createdAt: isoString(row.createdAt, zone),
    }),
    build: (body) => ({
      id: body.id || randomUUID(),
      title: body.title,
      description: body.description,
      image: body.image,
      createdBy: by(body),
      createdAt: now(),
    }),
  },
}

/** The keys an update may set: everything the caller sent except the routing fields. */
function updatesFrom(body: Obj): Obj {
  const updates: Obj = {}
  for (const key of Object.keys(body)) {
    if (key !== 'id' && key !== 'action' && key !== 'secret') updates[key] = body[key]
  }
  return updates
}

// ---------------------------------------------------------------------------
// Applications, faculty logins, event registrations
// ---------------------------------------------------------------------------

const APPLICATION_FIELDS = [
  'name',
  'email',
  'phone',
  'year',
  'skills',
  'project1Description',
  'project1SourceLink',
  'project1LiveLink',
  'project1Screenshot',
  'project2Description',
  'project2SourceLink',
  'project2LiveLink',
  'project2Screenshot',
  'project3Description',
  'project3SourceLink',
  'project3LiveLink',
  'project3Screenshot',
]

// Created on first use, like the script did, so there is no manual setup.
async function createTab(name: string, headers: string[]) {
  try {
    await api(sheetPath(':batchUpdate'), { method: 'POST', body: { requests: [{ addSheet: { properties: { title: name } } }] } })
  } catch (err) {
    // Two first uses at once: the other one created it.
    if (!(err instanceof Error) || !/already exists/i.test(err.message)) throw err
  }
  await api(valuesPath(`${quote(name)}!A1`) + `?${RAW}`, { method: 'PUT', body: { values: [headers] } })
  meta = null
}

function registrationRow(row: Obj, zone: string) {
  return {
    id: row.id,
    eventId: row.eventId,
    eventTitle: row.eventTitle,
    eventDate: dateOnly(row.eventDate),
    name: row.name,
    email: row.email,
    phone: String(row.phone ?? ''),
    college: row.college || '',
    year: row.year || '',
    registeredAt: isoString(row.registeredAt, zone),
  }
}

async function registerForEvent(body: Obj) {
  const email = String(body.email ?? '').trim().toLowerCase()
  const capacity = Number(body.capacity) || 0
  const zone = () => getMeta().then((m) => m.timeZone)
  const forEvent = (tab: Tab) => liveRows(tab).filter((r) => String(r.obj.eventId) === String(body.eventId))
  const spotsLeft = (taken: number) => (capacity ? Math.max(0, capacity - taken) : null)

  return inQueue('Registrations', async () => {
    const tab = await readTab('Registrations')
    const before = forEvent(tab)
    const existing = before.find((r) => String(r.obj.email).trim().toLowerCase() === email)
    if (existing) {
      return {
        success: true,
        alreadyRegistered: true,
        registration: registrationRow(existing.obj, await zone()),
        spotsLeft: spotsLeft(before.length),
      }
    }
    if (capacity && before.length >= capacity) return { success: false, error: 'This event is full.' }

    const registration = {
      id: randomUUID(),
      eventId: body.eventId,
      eventTitle: body.eventTitle || '',
      eventDate: body.eventDate || '',
      name: body.name,
      email: String(body.email ?? '').trim(),
      phone: String(body.phone ?? ''),
      college: body.college || '',
      year: body.year || '',
      registeredAt: now(),
    }
    // Written without appendRow's id check: the email check above was the dedupe.
    await api(valuesPath(quote('Registrations'), ':append') + `?${RAW}&insertDataOption=INSERT_ROWS`, {
      method: 'POST',
      body: { values: [tab.headers.map((h) => (h in registration ? cellValue((registration as Obj)[h]) : ''))] },
    })

    // Another server may have taken the last seat, or the same email, in the
    // moment between the check and the write. Look again, and if this row is the
    // one that shouldn't exist, take it back out — the earlier row wins.
    const after = await readTab('Registrations')
    const rows = forEvent(after)
    const mine = rows.find((r) => r.obj.id === registration.id)
    if (mine) {
      const position = rows.indexOf(mine)
      const earlier = rows.slice(0, position).find((r) => String(r.obj.email).trim().toLowerCase() === email)
      if (earlier || (capacity && position >= capacity)) {
        await deleteSheetRow('Registrations', mine.sheetRow)
        if (earlier) {
          return { success: true, alreadyRegistered: true, registration: registrationRow(earlier.obj, await zone()), spotsLeft: spotsLeft(position) }
        }
        return { success: false, error: 'This event is full.' }
      }
    }
    return { success: true, alreadyRegistered: false, registration, spotsLeft: spotsLeft(rows.length) }
  })
}

// ---------------------------------------------------------------------------
// Dispatch
// ---------------------------------------------------------------------------

/** Runs `fn`, repeating it if Google fails to answer. Everything below is safe
 *  to repeat: adds skip an id that is already there, updates set the same
 *  values, registration checks the email first, and a delete that finds the row
 *  gone means an earlier try worked. */
async function withRetries<T>(action: string, fn: () => Promise<T>): Promise<T> {
  const started = Date.now()
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn()
    } catch (err) {
      const retry = err instanceof TransientError && attempt < 2 && Date.now() - started < OPERATION_BUDGET_MS
      if (!retry) throw err
      await new Promise((r) => setTimeout(r, 300 * (attempt + 1)))
    }
  }
}

const ok = (extra: Obj = {}) => ({ success: true, ...extra })
const fail = (error: string) => ({ success: false, error })

/** Runs one action against the sheet and returns the script-shaped reply:
 *  `{ success: true, ... }`, or `{ success: false, error }` for a refusal.
 *  Throws for anything unexpected, and SheetsAccessError when Google won't let
 *  the service account in (nothing has been changed then). */
export async function sheetsAction(action: string, body: Obj): Promise<Obj> {
  return withRetries(action, () => dispatch(action, body))
}

/** Deleting a folder never deletes its photos — they go back to being unfiled. */
async function deleteAlbum(id: unknown): Promise<Obj> {
  await deleteRowById('Albums', id)
  await inQueue('Gallery', async () => {
    const gallery = await readTab('Gallery')
    const col = gallery.headers.indexOf('album')
    if (col === -1) return
    const data = gallery.rows
      .filter((r) => String(r.obj.album ?? '') === String(id))
      .map((r) => ({ range: `${quote('Gallery')}!${colLetter(col)}${r.sheetRow}`, values: [['']] }))
    if (data.length) await api(sheetPath('/values:batchUpdate'), { method: 'POST', body: { valueInputOption: 'RAW', data } })
  })
  // Gone is gone: a repeat of a delete that already worked is not an error,
  // so a folder that is not found still counts as deleted.
  return ok()
}

async function dispatch(action: string, body: Obj): Promise<Obj> {
  if (action === 'deleteAlbum') return deleteAlbum(body.id)

  // ---- generic: list / add / update / delete for each content tab ----
  const generic = /^(list|add|update|delete)(Events?|Announcements?|GalleryImage|Gallery|Albums?|Projects?|Achievements?|TeamMembers?|Programs?|Facilit(?:ies|y))$/.exec(action)
  if (generic) {
    const [, verb, noun] = generic
    const entity = ENTITIES[SINGULAR[noun] ?? noun]
    if (entity) {
      if (verb === 'list') {
        const [tab, meta] = await Promise.all([readTab(entity.tab), getMeta()])
        return ok({ items: liveRows(tab).map((r) => entity.read(r.obj, meta.timeZone)) })
      }
      if (verb === 'add') {
        const row = entity.build(body)
        await appendRow(entity.tab, row, entity.extraColumns)
        // Reply with what the sheet would say back for this row.
        return ok({ [entity.key]: row })
      }
      if (verb === 'update') {
        return (await updateRowById(entity.tab, body.id, updatesFrom(body), entity.extraColumns)) ? ok() : fail(entity.notFound)
      }
      return (await deleteRowById(entity.tab, body.id)) ? ok() : fail(entity.notFound)
    }
  }

  switch (action) {
    case 'logApplication': {
      const id = randomUUID()
      const row: Obj = { id }
      for (const field of APPLICATION_FIELDS) row[field] = body[field] ?? ''
      row.status = 'Pending'
      row.submittedAt = now()
      await appendRow('Applications', row)
      return ok({ id })
    }
    case 'listApplications': {
      const [tab, meta] = await Promise.all([readTab('Applications'), getMeta()])
      const items = liveRows(tab).map((r, idx) => {
        const item: Obj = { id: r.obj.id || `row-${idx + 2}` }
        for (const field of APPLICATION_FIELDS) item[field] = r.obj[field] || ''
        item.status = r.obj.status || 'Pending'
        item.submittedAt = isoString(r.obj.submittedAt, meta.timeZone)
        return item
      })
      return ok({ items })
    }
    case 'updateApplicationStatus':
      return (await updateRowById('Applications', body.id, { status: body.status })) ? ok() : fail('Application not found.')
    case 'deleteApplication':
      return (await deleteRowById('Applications', body.id)) ? ok() : fail('Application not found.')

    case 'getFaculty': {
      const wanted = String(body.email ?? '').toLowerCase().trim()
      const tab = await readTab('Faculty')
      const match = liveRows(tab).find((r) => String(r.obj.email ?? '').toLowerCase().trim() === wanted)
      if (!match) return ok({ faculty: null })
      return ok({ faculty: { email: match.obj.email, passwordHash: match.obj.password_hash, name: match.obj.name } })
    }

    case 'registerForEvent':
      return registerForEvent(body)
    case 'listRegistrations': {
      const [tab, meta] = await Promise.all([readTab('Registrations'), getMeta()])
      return ok({ items: liveRows(tab).map((r) => registrationRow(r.obj, meta.timeZone)) })
    }
    case 'listRegistrationCounts': {
      const counts = new Map<string, number>()
      for (const r of liveRows(await readTab('Registrations'))) {
        const id = String(r.obj.eventId)
        counts.set(id, (counts.get(id) ?? 0) + 1)
      }
      return ok({ items: [...counts].map(([eventId, count]) => ({ eventId, count })) })
    }
    case 'deleteRegistration':
      return (await deleteRowById('Registrations', body.id)) ? ok() : fail('Registration not found.')
  }

  return fail(`Unknown action: ${action}`)
}

// list/add/update/delete + plural or singular noun → ENTITIES key
const SINGULAR: Record<string, string> = {
  Events: 'Event',
  Announcements: 'Announcement',
  Gallery: 'GalleryImage',
  Albums: 'Album',
  Projects: 'Project',
  Achievements: 'Achievement',
  TeamMembers: 'TeamMember',
  Programs: 'Program',
  Facilities: 'Facility',
  TeamMember: 'TeamMember',
}
