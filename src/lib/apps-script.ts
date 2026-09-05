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
  url: string,
  secret: string,
  action: string,
  payload: Record<string, unknown>
): Promise<T> {
  // Apps Script Web Apps are occasionally slow (observed 10-40s+ even on
  // success) — without a cap, a sluggish response can stall a Server
  // Component past Next's static-generation budget and fail the whole
  // build. 15s is generous for a Sheets read/write but still leaves room
  // for callers' try/catch to fall back to static content.
  const initial = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, secret, ...payload }),
    redirect: 'manual',
    signal: AbortSignal.timeout(15000),
  })

  const location = initial.headers.get('location')
  const res = initial.status >= 300 && initial.status < 400 && location
    ? await fetch(location, { signal: AbortSignal.timeout(15000) })
    : initial

  const body = (await res.json().catch(() => null)) as AppsScriptResponse | null

  if (!res.ok || !body || body.success !== true) {
    const error = body && 'error' in body ? body.error : undefined
    throw new Error(`Apps Script action "${action}" failed: ${error ?? res.status}`)
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

export async function callAppsScript<T extends Record<string, unknown> = Record<string, unknown>>(
  action: string,
  payload: Record<string, unknown> = {}
): Promise<T> {
  const { GOOGLE_APPS_SCRIPT_URL, GOOGLE_APPS_SCRIPT_SECRET } = process.env
  if (!GOOGLE_APPS_SCRIPT_URL || !GOOGLE_APPS_SCRIPT_SECRET) {
    throw new Error('Apps Script is not configured (missing GOOGLE_APPS_SCRIPT_* env vars).')
  }

  const isReadOnly = action.startsWith('list')
  const call = isReadOnly ? callAppsScriptOnceCached : callAppsScriptOnce

  try {
    return (await call(GOOGLE_APPS_SCRIPT_URL, GOOGLE_APPS_SCRIPT_SECRET, action, payload)) as T
  } catch (err) {
    // Only read-only `list*` actions retry — they're safe to repeat. A
    // write (add/update/delete) that appears to fail client-side may have
    // already committed server-side (this bit us once already, producing a
    // duplicate gallery row), so retrying those would risk double-writes.
    if (!isReadOnly) throw err
    return (await call(GOOGLE_APPS_SCRIPT_URL, GOOGLE_APPS_SCRIPT_SECRET, action, payload)) as T
  }
}
