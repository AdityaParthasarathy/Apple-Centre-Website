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
export async function callAppsScript<T extends Record<string, unknown> = Record<string, unknown>>(
  action: string,
  payload: Record<string, unknown> = {}
): Promise<T> {
  const { GOOGLE_APPS_SCRIPT_URL, GOOGLE_APPS_SCRIPT_SECRET } = process.env
  if (!GOOGLE_APPS_SCRIPT_URL || !GOOGLE_APPS_SCRIPT_SECRET) {
    throw new Error('Apps Script is not configured (missing GOOGLE_APPS_SCRIPT_* env vars).')
  }

  const initial = await fetch(GOOGLE_APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, secret: GOOGLE_APPS_SCRIPT_SECRET, ...payload }),
    redirect: 'manual',
  })

  const location = initial.headers.get('location')
  const res = initial.status >= 300 && initial.status < 400 && location
    ? await fetch(location)
    : initial

  const body = (await res.json().catch(() => null)) as AppsScriptResponse | null

  if (!res.ok || !body || body.success !== true) {
    const error = body && 'error' in body ? body.error : undefined
    throw new Error(`Apps Script action "${action}" failed: ${error ?? res.status}`)
  }

  return body as unknown as T
}
