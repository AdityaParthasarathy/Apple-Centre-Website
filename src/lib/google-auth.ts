import { importPKCS8, SignJWT } from 'jose'

// Server-to-server sign-in for the Google Sheets API. A "service account" is a
// robot Google account with its own key; the spreadsheet is shared with its
// email address like it would be with a person. Signing in is one small
// request, and the resulting token lasts an hour, so it is kept and reused.

interface ServiceAccount {
  client_email: string
  private_key: string
}

// Overridable so the test suite can point these at a local stand-in for Google.
const TOKEN_URL = () => process.env.GOOGLE_TOKEN_URL || 'https://oauth2.googleapis.com/token'
const SCOPE = 'https://www.googleapis.com/auth/spreadsheets'

/** The service account key, from GOOGLE_SERVICE_ACCOUNT_JSON: the downloaded
 *  key file's contents as-is (or the same, base64-encoded). Null if the
 *  variable is missing or unreadable, which just means "use Apps Script". */
function readServiceAccount(): ServiceAccount | null {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim()
  if (!raw) return null
  // As pasted, base64, or - if an env-file loader turned the key's \n escapes
  // into real line breaks inside the JSON - with those breaks put back.
  const attempts = [raw, Buffer.from(raw, 'base64').toString('utf8'), raw.replace(/\r?\n/g, '\\n')]
  for (const text of attempts) {
    try {
      const parsed = JSON.parse(text) as Partial<ServiceAccount>
      if (parsed.client_email && parsed.private_key) {
        // Pasted into a one-line env var, the key's line breaks arrive as a
        // literal backslash-n.
        return { client_email: parsed.client_email, private_key: parsed.private_key.replace(/\\n/g, '\n') }
      }
    } catch {
      // try the next form
    }
  }
  return null
}

/** The spreadsheet's id, from GOOGLE_SHEET_ID: either the id itself or the
 *  whole address of the sheet. */
export function readSheetId(): string | null {
  const raw = process.env.GOOGLE_SHEET_ID?.trim()
  if (!raw) return null
  return /\/d\/([a-zA-Z0-9_-]+)/.exec(raw)?.[1] ?? raw
}

export function isDirectSheetsConfigured() {
  return !!readSheetId() && !!readServiceAccount()
}

/** Google refused the service account itself — a bad key, or a sheet that was
 *  never shared with it. Nothing was changed, so callers may fall back to
 *  Apps Script instead of failing. */
export class SheetsAccessError extends Error {}

let cached: { token: string; expiresAt: number; email: string } | null = null
let signingIn: Promise<string> | null = null

export async function getAccessToken(): Promise<string> {
  const account = readServiceAccount()
  if (!account) throw new SheetsAccessError('GOOGLE_SERVICE_ACCOUNT_JSON is missing or unreadable.')
  if (cached && cached.email === account.client_email && cached.expiresAt - Date.now() > 60_000) return cached.token
  // Simultaneous first requests share one sign-in rather than each making their own.
  if (signingIn) return signingIn

  signingIn = (async () => {
    try {
      const now = Math.floor(Date.now() / 1000)
      const key = await importPKCS8(account.private_key, 'RS256')
      const assertion = await new SignJWT({ scope: SCOPE })
        .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
        .setIssuer(account.client_email)
        .setAudience(TOKEN_URL())
        .setIssuedAt(now)
        .setExpirationTime(now + 3600)
        .sign(key)

      const res = await fetch(TOKEN_URL(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }),
        signal: AbortSignal.timeout(10_000),
      })
      const body = (await res.json().catch(() => null)) as { access_token?: string; expires_in?: number; error?: string } | null
      if (!res.ok || !body?.access_token) {
        // 4xx = Google rejected the key itself; anything else is a passing outage.
        if (res.status >= 400 && res.status < 500) {
          throw new SheetsAccessError(`Google refused the service account sign-in (${body?.error ?? res.status}).`)
        }
        throw new Error(`Google sign-in failed (${res.status}).`)
      }
      cached = {
        token: body.access_token,
        expiresAt: Date.now() + (body.expires_in ?? 3600) * 1000,
        email: account.client_email,
      }
      return body.access_token
    } finally {
      signingIn = null
    }
  })()
  return signingIn
}

/** Forget the token — after Google says it was rejected. */
export function dropAccessToken() {
  cached = null
}
