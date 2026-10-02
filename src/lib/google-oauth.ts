import { createHash, randomBytes } from 'node:crypto'
import { createRemoteJWKSet, jwtVerify } from 'jose'

// "Sign in with Google" for the staff portal, done as the standard server-side
// authorization-code flow. Google only proves WHO the person is; whether they
// may enter is decided by the Faculty sheet (see the callback route), and the
// session itself is the same signed cookie the password login sets.

const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_JWKS = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'))

/** Short-lived cookie carrying state + nonce + PKCE verifier between the two legs. */
export const OAUTH_COOKIE_NAME = 'staff_google_oauth'
export const OAUTH_COOKIE_PATH = '/api/staff/google'
export const CALLBACK_PATH = '/api/staff/google/callback'

export function isGoogleSignInConfigured() {
  return !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET
}

export function randomToken(bytes = 32) {
  return randomBytes(bytes).toString('base64url')
}

export function codeChallenge(verifier: string) {
  return createHash('sha256').update(verifier).digest('base64url')
}

export function buildAuthUrl(params: { redirectUri: string; state: string; nonce: string; challenge: string }) {
  const url = new URL(AUTH_URL)
  url.search = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID ?? '',
    redirect_uri: params.redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state: params.state,
    nonce: params.nonce,
    code_challenge: params.challenge,
    code_challenge_method: 'S256',
    // Always show the account chooser — staff often have a personal and a
    // college Google account signed in at once.
    prompt: 'select_account',
  }).toString()
  return url.toString()
}

/** Trades the one-time code for Google's signed ID token. */
export async function exchangeCodeForIdToken(params: { code: string; redirectUri: string; verifier: string }) {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code: params.code,
      client_id: process.env.GOOGLE_CLIENT_ID ?? '',
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      redirect_uri: params.redirectUri,
      grant_type: 'authorization_code',
      code_verifier: params.verifier,
    }),
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`Google refused the sign-in code (HTTP ${res.status}).`)
  const body = (await res.json()) as { id_token?: unknown }
  if (typeof body.id_token !== 'string') throw new Error('Google did not return an ID token.')
  return body.id_token
}

/** Checks Google's signature, issuer, audience and nonce, and that the email is verified. */
export async function verifyGoogleIdToken(idToken: string, nonce: string): Promise<{ email: string; name: string }> {
  const { payload } = await jwtVerify(idToken, GOOGLE_JWKS, {
    issuer: ['https://accounts.google.com', 'accounts.google.com'],
    audience: process.env.GOOGLE_CLIENT_ID,
  })
  if (payload.nonce !== nonce) throw new Error('Sign-in nonce did not match.')
  // Only an address Google has itself verified may be matched against the sheet.
  if (payload.email_verified !== true && payload.email_verified !== 'true') throw new Error('Google email is not verified.')
  const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : ''
  if (!email) throw new Error('Google did not provide an email address.')
  return { email, name: typeof payload.name === 'string' && payload.name ? payload.name : email }
}
