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
import { buildMemberSessionCookie, buildPendingGoogleCookie } from '@/lib/member-session'
import type { MemberRecord } from '@/lib/member-api'

export const dynamic = 'force-dynamic'
// Reading the Faculty sheet can be slow (see lib/apps-script.ts).
export const maxDuration = 60

interface FacultyRecord {
  email: string
  name: string
}

type Cookie = Awaited<ReturnType<typeof buildSessionCookie>>

// Second leg of "Sign in with Google", for both portals (they share this one
// address, which is the only one registered in Google Cloud). Google has proven
// who the person is. For the faculty portal this decides whether they may enter:
// only an email already in the Faculty sheet gets a session. For the members
// portal an account connected to that email signs in; a new email is sent to
// finish setting up an account.
export async function GET(request: NextRequest) {
  const { origin, searchParams } = request.nextUrl
  const saved = request.cookies.get(OAUTH_COOKIE_NAME)?.value.split('.') ?? []
  const forMembers = saved.length === 4 && saved[3] === 'member'
  const loginPath = forMembers ? '/members/login' : '/staff/login'

  // Every exit also clears the one-time cookie.
  const finish = (path: string, ...cookies: Cookie[]) => {
    const response = NextResponse.redirect(new URL(path, origin))
    response.cookies.set(OAUTH_COOKIE_NAME, '', { path: OAUTH_COOKIE_PATH, maxAge: 0 })
    for (const cookie of cookies) response.cookies.set(cookie.name, cookie.value, cookie.options)
    return response
  }
  const fail = (code: string) => finish(`${loginPath}?error=${code}`)

  const googleError = searchParams.get('error')
  if (googleError) return fail(googleError === 'access_denied' ? 'google-cancelled' : 'google-failed')

  const code = searchParams.get('code')
  const state = searchParams.get('state')
  // The state must be the one this browser was given when it left for Google.
  if (!code || !state || (saved.length !== 3 && !forMembers) || saved[0] !== state) return fail('google-failed')
  const [, nonce, verifier] = saved

  let identity: { email: string; name: string }
  try {
    const idToken = await exchangeCodeForIdToken({ code, redirectUri: `${origin}${CALLBACK_PATH}`, verifier })
    identity = await verifyGoogleIdToken(idToken, nonce)
  } catch (error) {
    console.error('Google sign-in failed:', error)
    return fail('google-failed')
  }

  if (forMembers) {
    let member: MemberRecord | null
    try {
      member = (await callAppsScript<{ member: MemberRecord | null }>('getMember', { email: identity.email })).member
    } catch (error) {
      console.error('Member lookup failed during Google sign-in:', error)
      return fail('google-failed')
    }
    if (member) {
      return finish(
        '/members',
        await buildMemberSessionCookie({ name: member.name, enrollment: member.enrollment, department: member.department })
      )
    }
    // First time with this Google account: finish setting up before anything is created.
    return finish('/members/complete-profile', await buildPendingGoogleCookie(identity))
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

  return finish('/staff', await buildSessionCookie({ email: faculty.email, name: faculty.name || identity.name }))
}
