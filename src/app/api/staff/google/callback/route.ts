import { NextResponse, type NextRequest } from 'next/server'
import { callAppsScript } from '@/lib/apps-script'
import {
  CALLBACK_PATH,
  OAUTH_COOKIE_NAME,
  OAUTH_COOKIE_PATH,
  exchangeCodeForIdToken,
  verifyGoogleIdToken,
} from '@/lib/google-oauth'
import { buildSessionCookie } from '@/lib/session'

export const dynamic = 'force-dynamic'
// Reading the Faculty sheet can be slow (see lib/apps-script.ts).
export const maxDuration = 60

interface FacultyRecord {
  email: string
  name: string
}

type SessionCookie = Awaited<ReturnType<typeof buildSessionCookie>>

// Second leg of "Sign in with Google". Google has proven who the person is;
// this decides whether they may enter: only an email already in the Faculty
// sheet gets a session. Anyone else is sent back to the login page, and no
// session or account is created.
export async function GET(request: NextRequest) {
  const { origin, searchParams } = request.nextUrl

  // Every exit also clears the one-time cookie.
  const finish = (path: string, session?: SessionCookie) => {
    const response = NextResponse.redirect(new URL(path, origin))
    response.cookies.set(OAUTH_COOKIE_NAME, '', { path: OAUTH_COOKIE_PATH, maxAge: 0 })
    if (session) response.cookies.set(session.name, session.value, session.options)
    return response
  }
  const fail = (code: string) => finish(`/staff/login?error=${code}`)

  const googleError = searchParams.get('error')
  if (googleError) return fail(googleError === 'access_denied' ? 'google-cancelled' : 'google-failed')

  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const saved = request.cookies.get(OAUTH_COOKIE_NAME)?.value.split('.') ?? []
  // The state must be the one this browser was given when it left for Google.
  if (!code || !state || saved.length !== 3 || saved[0] !== state) return fail('google-failed')
  const [, nonce, verifier] = saved

  let identity: { email: string; name: string }
  try {
    const idToken = await exchangeCodeForIdToken({ code, redirectUri: `${origin}${CALLBACK_PATH}`, verifier })
    identity = await verifyGoogleIdToken(idToken, nonce)
  } catch (error) {
    console.error('Google sign-in failed:', error)
    return fail('google-failed')
  }

  let faculty: FacultyRecord | null
  try {
    const result = await callAppsScript<{ faculty: FacultyRecord | null }>('getFaculty', { email: identity.email })
    faculty = result.faculty
  } catch (error) {
    console.error('Faculty lookup failed during Google sign-in:', error)
    return fail('google-failed')
  }

  if (!faculty) return fail('not-authorised')

  const cookie = await buildSessionCookie({ email: faculty.email, name: faculty.name || identity.name })
  return finish('/staff', cookie)
}
