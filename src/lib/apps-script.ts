import { unstable_cache } from 'next/cache'

interface AppsScriptSuccess {
  success: true
  [key: string]: unknown
}

interface AppsScriptFailure {
  success: false
  error?: string
}

type AppsScriptResponse = AppsScriptSuccess | AppsScriptFailure

/** Google gave back something that isn't our script's own JSON reply (its
 *  "Page not found" / "Script function not found: doGet" HTML, a timeout, a
 *  dropped connection). For a write that means the outcome is UNKNOWN — the
 *  change may well have been committed — unlike a JSON `success: false`,
 *  which is a definite refusal. */
class AppsScriptAmbiguousError extends Error {}

/**
 * Calls the Google Apps Script Web App that backs every piece of
 * server-managed data on this site (applications, events, announcements,
 * gallery, faculty accounts) — one shared secret-gated endpoint, dispatched
 * by an `action` field.
 *
 * Apps Script Web Apps respond to POST with a 302 to a
 * script.googleusercontent.com "echo" URL that must be re-fetched as a GET.
 * Browsers and curl do this method conversion automatically for
 * POST-originated redirects, but Node's fetch doesn't reliably do the same
 * for this specific cross-domain redirect — it was following it as a
 * malformed POST and getting a 404 back. Following it manually here instead.
 */
async function callAppsScriptOnce<T extends Record<string, unknown>>(
  action: string,
  payload: Record<string, unknown>
): Promise<T> {
  // Read here rather than taking url/secret as arguments: everything passed
  // to the unstable_cache-wrapped version below becomes part of its cache
  // key, and Next prints that key (secret included) whenever a call fails.
  const { GOOGLE_APPS_SCRIPT_URL: url, GOOGLE_APPS_SCRIPT_SECRET: secret } = process.env
  if (!url || !secret) {
    throw new Error('Apps Script is not configured (missing GOOGLE_APPS_SCRIPT_* env vars).')
  }

  // Apps Script Web Apps are occasionally slow (observed 10-40s+ even on
  // success) — without a cap, a sluggish response can stall a Server
  // Component past Next's static-generation budget and fail the whole
  // build. 15s is generous for a Sheets read but still leaves room for
  // callers' try/catch to fall back to static content.
  //
  // Writes (add/update/delete/upload) get 45s instead: they only ever run
  // from the staff portal at request time, never during a build, and a
  // Drive upload in particular has been seen taking well past 15s — a
  // timeout there just tells faculty their photo failed when it's merely slow.
  const timeoutMs = action.startsWith('list') ? 15000 : 45000

  let res: Response
  try {
    const initial = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, secret, ...payload }),
      redirect: 'manual',
      signal: AbortSignal.timeout(timeoutMs),
    })

    const location = initial.headers.get('location')
    res = initial.status >= 300 && initial.status < 400 && location
      ? await fetch(location, { signal: AbortSignal.timeout(timeoutMs) })
      : initial
  } catch (err) {
    throw new AppsScriptAmbiguousError(`Apps Script action "${action}" got no reply: ${err instanceof Error ? err.message : err}`, { cause: err })
  }

  const body = (await res.json().catch(() => null)) as AppsScriptResponse | null

  if (!body || typeof body.success !== 'boolean') {
    throw new AppsScriptAmbiguousError(`Apps Script action "${action}" failed: ${res.status} (reply was not JSON)`)
  }
  if (body.success !== true) {
    throw new Error(`Apps Script action "${action}" failed: ${body.error ?? res.status}`)
  }

  return body as unknown as T
}

// Apps Script Web Apps routinely take 1-4s+ per call, and this is a POST —
// fetch's own automatic request memoization/caching never covers POST, so
// without this every `list*` read paid that full latency completely fresh,
// on every request. That's the entire cost of opening the Labs & Facilities
// or Student Projects iMac scroll window (each renders a section that
// makes exactly one of these calls — see imac-scroll-windows.tsx), and it
// hit every other page that shows faculty-managed content too. 60s matches
// the staleness every one of those routes already accepts elsewhere (see
// `export const revalidate = 60`). Only `list*` (read-only) actions are
// cached — a write's result being action-specific and often one-shot isn't
// something a shared cache should paper over.
const callAppsScriptOnceCached = unstable_cache(callAppsScriptOnce, ['apps-script-list'], { revalidate: 60 })

// Google's Apps Script Web Apps have wildly uneven latency — sequential
// calls to this same endpoint have been measured anywhere from 2s to 45s,
// with the slow ones sometimes ending in a 404 — so a read that fails
// isn't necessarily a real outage. Two things soften that:
//  - the last successful result per read is kept in memory and served if a
//    later attempt fails (otherwise a blip drops faculty-added content off a
//    public page, or blanks a dashboard count, until the next success), and
//  - identical reads already in flight are shared rather than repeated, so
//    the layout's search index, the page, and the footer all wanting the
//    same list at once cost one request to Google instead of several.
const lastGood = new Map<string, unknown>()
const inFlight = new Map<string, Promise<unknown>>()

// Every "add" action, with the list action to check and the key its reply
// carries the new row under (see the matching handlers in Code.gs).
const ADD_ACTIONS: Record<string, { list: string; key: string }> = {
  addEvent: { list: 'listEvents', key: 'event' },
  addAnnouncement: { list: 'listAnnouncements', key: 'announcement' },
  addGalleryImage: { list: 'listGallery', key: 'image' },
  addProject: { list: 'listProjects', key: 'project' },
  addAchievement: { list: 'listAchievements', key: 'achievement' },
  addTeamMember: { list: 'listTeamMembers', key: 'member' },
  addProgram: { list: 'listPrograms', key: 'program' },
  addFacility: { list: 'listFacilities', key: 'facility' },
}

// Google's occasional garbled reply (see AppsScriptAmbiguousError) has
// repeatedly hit writes that had in fact succeeded — a "failed" toast for a
// saved change, and a delete that then can't be retried because the row is
// already gone. Retrying blindly is what previously produced a duplicate
// gallery row, so each kind of write is handled by whether repeating it is
// harmless:
//  - update / upload: same input, same result — just retry once.
//  - delete: retry once; "not found" on the retry means the first try worked.
//  - add: the row's id is fixed up front, then the sheet is read back to see
//    whether it landed before anything is repeated. If that read-back itself
//    fails, the outcome stays unknown and the error surfaces as-is rather
//    than risk a second row.
async function callWrite<T extends Record<string, unknown>>(
  action: string,
  payload: Record<string, unknown>
): Promise<T> {
  const add = ADD_ACTIONS[action]
  const body = add && !payload.id ? { ...payload, id: crypto.randomUUID() } : payload

  if (!add && !/^(update|delete|upload)/.test(action)) return callAppsScriptOnce<T>(action, body)

  const attempt = async (): Promise<T> => {
    try {
      return await callAppsScriptOnce<T>(action, body)
    } catch (err) {
      if (!(err instanceof AppsScriptAmbiguousError) || !add) throw err
      const existing = await callAppsScriptOnce<{ items: { id: string }[] }>(add.list, {}).catch(() => null)
      // Not the ambiguous type on purpose: callWrite retries only that one,
      // and with the outcome unverifiable a retry could add a second row.
      if (!existing) throw new Error(err.message, { cause: err })
      const landed = existing.items.find((item) => String(item.id) === String(body.id))
      if (landed) return { success: true, [add.key]: landed } as unknown as T
      throw err
    }
  }

  try {
    return await attempt()
  } catch (err) {
    if (!(err instanceof AppsScriptAmbiguousError)) throw err
  }

  try {
    return await attempt()
  } catch (err) {
    if (action.startsWith('delete') && err instanceof Error && /not found/i.test(err.message)) {
      return { success: true } as unknown as T
    }
    throw err
  }
}

export async function callAppsScript<T extends Record<string, unknown> = Record<string, unknown>>(
  action: string,
  payload: Record<string, unknown> = {}
): Promise<T> {
  // Only read-only `list*` actions are cached/shared. Writes are never
  // served from a cache; they get their own careful retry in callWrite.
  if (!action.startsWith('list')) return callWrite<T>(action, payload)

  const key = `${action}:${JSON.stringify(payload)}`
  const pending = inFlight.get(key)
  if (pending) return pending as Promise<T>

  const request = (async () => {
    try {
      let result: T
      try {
        result = (await callAppsScriptOnceCached(action, payload)) as T
      } catch {
        result = (await callAppsScriptOnceCached(action, payload)) as T
      }
      lastGood.set(key, result)
      return result
    } catch (err) {
      if (lastGood.has(key)) return lastGood.get(key) as T
      throw err
    }
  })().finally(() => inFlight.delete(key))

  inFlight.set(key, request)
  return request
}
