// Checks the direct Google Sheets connection (see the "Direct Sheets access"
// section of scripts/apps-script/README.md) without starting the website:
//
//   node scripts/check-google-sheets.mjs
//
// It reads GOOGLE_SERVICE_ACCOUNT_JSON and GOOGLE_SHEET_ID from .env.local (or
// the environment), signs in as the service account, lists the sheet's tabs,
// checks each tab has the columns the site reads, and proves the account can
// write by creating a scratch tab, writing a cell to it and deleting it again.
// Nothing in your real tabs is touched.

import fs from 'node:fs'
import { importPKCS8, SignJWT } from 'jose'

const REQUIRED = {
  Events: ['id', 'title', 'description', 'date', 'time', 'location', 'category', 'image', 'capacity', 'published', 'pinned', 'createdBy', 'createdAt'],
  Announcements: ['id', 'title', 'body', 'published', 'pinned', 'createdBy', 'createdAt'],
  Gallery: ['id', 'title', 'description', 'image', 'category', 'date', 'createdBy', 'createdAt'],
  Projects: ['id', 'title', 'description', 'team', 'technologies', 'image', 'iconKey', 'featured', 'link', 'createdBy', 'createdAt'],
  Achievements: ['id', 'title', 'placement', 'institution', 'description', 'image', 'createdBy', 'createdAt'],
  TeamMembers: ['id', 'name', 'role', 'bio', 'image', 'expertise', 'contact', 'createdBy', 'createdAt'],
  Programs: ['id', 'title', 'description', 'duration', 'level', 'topics', 'image', 'createdBy', 'createdAt'],
  Facilities: ['id', 'title', 'description', 'image', 'createdBy', 'createdAt'],
  Faculty: ['email', 'password_hash', 'name'],
  Applications: ['id', 'name', 'email', 'phone', 'year', 'skills', 'status', 'submittedAt'],
}

// (These two exist only so the script can be tested against a stand-in for Google.)
const TOKEN_URL = process.env.GOOGLE_TOKEN_URL || 'https://oauth2.googleapis.com/token'
const API_URL = process.env.GOOGLE_SHEETS_API_URL || 'https://sheets.googleapis.com'

const green = (s) => `\x1b[32m${s}\x1b[0m`
const red = (s) => `\x1b[31m${s}\x1b[0m`
const yellow = (s) => `\x1b[33m${s}\x1b[0m`
let problems = 0
const ok = (s) => console.log(green('  ✓ ') + s)
const bad = (s) => { problems++; console.log(red('  ✗ ') + s) }
const warn = (s) => console.log(yellow('  ! ') + s)

// ---- config ----
function loadEnv() {
  const env = { ...process.env }
  if (fs.existsSync('.env.local')) {
    for (const line of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
      const m = /^([A-Z_][A-Z0-9_]*)=(.*)$/.exec(line)
      if (!m || env[m[1]] !== undefined) continue
      env[m[1]] = m[2].trim().replace(/^(['"])([\s\S]*)\1$/, '$2')
    }
  }
  return env
}
const env = loadEnv()

console.log('\nConfiguration')
const rawKey = env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim()
let account = null
if (!rawKey) bad('GOOGLE_SERVICE_ACCOUNT_JSON is not set (in .env.local or the environment).')
else {
  for (const text of [rawKey, Buffer.from(rawKey, 'base64').toString('utf8'), rawKey.replace(/\r?\n/g, '\\n')]) {
    try {
      const parsed = JSON.parse(text)
      if (parsed.client_email && parsed.private_key) { account = parsed; break }
    } catch {}
  }
  if (!account) bad('GOOGLE_SERVICE_ACCOUNT_JSON is set but is not the contents of a service-account key file (it needs "client_email" and "private_key").')
  else ok(`service account: ${account.client_email}`)
}
const idMatch = /\/d\/([a-zA-Z0-9_-]+)/.exec(env.GOOGLE_SHEET_ID ?? '')
const sheetId = idMatch?.[1] ?? env.GOOGLE_SHEET_ID?.trim()
if (!sheetId) bad('GOOGLE_SHEET_ID is not set (the long id in your sheet\'s address, or the whole address).')
else ok(`sheet id: ${sheetId}`)
if (!account || !sheetId) finish()

// ---- sign in ----
console.log('\nSigning in')
let token
try {
  const now = Math.floor(Date.now() / 1000)
  const key = await importPKCS8(account.private_key.replace(/\\n/g, '\n'), 'RS256')
  const assertion = await new SignJWT({ scope: 'https://www.googleapis.com/auth/spreadsheets' })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setIssuer(account.client_email)
    .setAudience(TOKEN_URL)
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(key)
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }),
  })
  const body = await res.json()
  if (!res.ok) throw new Error(`${body.error}: ${body.error_description ?? ''}`)
  token = body.access_token
  ok('Google accepted the key')
} catch (err) {
  bad(`sign-in failed: ${err.message}`)
  finish()
}

const api = async (path, init = {}) => {
  const started = Date.now()
  const res = await fetch(`${API_URL}/v4/spreadsheets/${sheetId}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  })
  const json = await res.json().catch(() => null)
  return { ok: res.ok, status: res.status, json, ms: Date.now() - started }
}

// ---- the sheet ----
console.log('\nThe spreadsheet')
const meta = await api('?fields=properties(title,timeZone),sheets.properties(sheetId,title)')
if (!meta.ok) {
  if (meta.status === 403) bad(`Google says no access (403). Share the sheet with ${account.client_email} as an Editor, and make sure the Google Sheets API is enabled for the project.`)
  else if (meta.status === 404) bad('Google can\'t find that sheet (404). Check GOOGLE_SHEET_ID — and that the sheet is shared with the service account.')
  else bad(`Google answered ${meta.status}: ${meta.json?.error?.message ?? ''}`)
  finish()
}
ok(`"${meta.json.properties.title}" (time zone ${meta.json.properties.timeZone}) — answered in ${meta.ms}ms`)
const tabs = new Map(meta.json.sheets.map((s) => [s.properties.title, s.properties.sheetId]))

console.log('\nTabs and columns')
for (const [tab, columns] of Object.entries(REQUIRED)) {
  if (!tabs.has(tab)) { bad(`tab "${tab}" is missing`); continue }
  const r = await api(`/values/${encodeURIComponent(`'${tab}'!1:1`)}`)
  const headers = (r.json?.values?.[0] ?? []).map((h) => String(h).trim())
  const missing = columns.filter((c) => !headers.includes(c))
  if (missing.length) bad(`"${tab}" has no column named: ${missing.join(', ')}`)
  else ok(`"${tab}" ✓`)
}
if (!tabs.has('Registrations')) warn('no "Registrations" tab yet — that is fine, the site creates it when the first student registers.')

// ---- write access, on a scratch tab ----
console.log('\nWrite access (scratch tab, removed afterwards)')
const scratch = `zz-connection-test-${Date.now()}`
const created = await api(':batchUpdate', { method: 'POST', body: JSON.stringify({ requests: [{ addSheet: { properties: { title: scratch } } }] }) })
if (!created.ok) {
  bad(`could not write: ${created.json?.error?.message ?? created.status}. Is the sheet shared with ${account.client_email} as an Editor (not Viewer)?`)
} else {
  const scratchId = created.json.replies[0].addSheet.properties.sheetId
  const wrote = await api(`/values/${encodeURIComponent(`'${scratch}'!A1`)}?valueInputOption=RAW`, { method: 'PUT', body: JSON.stringify({ values: [['ok']] }) })
  if (wrote.ok) ok(`write took ${wrote.ms}ms`)
  else bad(`write failed: ${wrote.json?.error?.message ?? wrote.status}`)
  const removed = await api(':batchUpdate', { method: 'POST', body: JSON.stringify({ requests: [{ deleteSheet: { sheetId: scratchId } }] }) })
  if (removed.ok) ok('scratch tab removed')
  else warn(`could not remove the scratch tab "${scratch}" — delete it by hand`)
}

finish()

function finish() {
  console.log(problems ? red(`\n${problems} problem${problems === 1 ? '' : 's'} found — fix the ✗ lines above and run this again.\n`) : green('\nAll good. The website will now talk to your sheet directly.\n'))
  process.exit(problems ? 1 : 0)
}
