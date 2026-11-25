import { SignJWT, jwtVerify } from 'jose'
import { getSecretKey } from '@/lib/session'

// The members portal's own cookie-based session, signed with the same secret as
// the staff one (and edge-compatible for the same reason: proxy.ts verifies it).
//
// Tokens made here and the staff token must never pass for each other, because a
// member could put their own token into the staff cookie. So every token here
// carries a `kind` and none carries `email`; the staff verifier refuses any
// token with a `kind`, and each verifier below insists on its own.
export const MEMBER_COOKIE_NAME = 'member_session'
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7 // 7 days
// Bumped when members started having passwords: a session from before that point
// (signed in with no proof of who they were) is no longer accepted.
const SESSION_VERSION = 2

export interface MemberSession {
  name: string
  /** Upper-case, no spaces: the key every item a member adds is filed under. */
  enrollment: string
  department: string
}

export async function signMemberToken(session: MemberSession): Promise<string> {
  return new SignJWT({
    kind: 'member',
    v: SESSION_VERSION,
    name: session.name,
    enrollment: session.enrollment,
    department: session.department,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecretKey())
}

/** Safe to call from proxy.ts (Edge runtime) as well as Route Handlers. */
export async function verifyMemberToken(token: string): Promise<MemberSession | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey())
    if (payload.kind !== 'member' || payload.v !== SESSION_VERSION) return null
    if (
      typeof payload.name !== 'string' ||
      typeof payload.enrollment !== 'string' ||
      typeof payload.department !== 'string'
    ) {
      return null
    }
    return { name: payload.name, enrollment: payload.enrollment, department: payload.department }
  } catch {
    return null
  }
}

function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: SESSION_DURATION_SECONDS,
  }
}

/** Server Components / Route Handlers only. */
export async function getMemberSession(): Promise<MemberSession | null> {
  const { cookies } = await import('next/headers')
  const store = await cookies()
  const token = store.get(MEMBER_COOKIE_NAME)?.value
  if (!token) return null
  return verifyMemberToken(token)
}

export async function setMemberSessionCookie(session: MemberSession) {
  const { cookies } = await import('next/headers')
  const token = await signMemberToken(session)
  const store = await cookies()
  store.set(MEMBER_COOKIE_NAME, token, sessionCookieOptions())
}

/** The session cookie as name/value/options, for a handler that builds its own
 *  response (the Google sign-in redirect sets it straight on that response). */
export async function buildMemberSessionCookie(session: MemberSession) {
  return { name: MEMBER_COOKIE_NAME, value: await signMemberToken(session), options: sessionCookieOptions() }
}

export async function clearMemberSessionCookie() {
  const { cookies } = await import('next/headers')
  const store = await cookies()
  store.delete(MEMBER_COOKIE_NAME)
}

// ---------------------------------------------------------------------------
// "Continue with Google", first time: Google has proven the email, but the person
// still has to say their enrollment number and department before an account
// exists. This short-lived cookie carries the proven email across that step. It
// is not a session — it opens nothing but the finish-your-profile form.
// ---------------------------------------------------------------------------

export const MEMBER_GOOGLE_PENDING_COOKIE = 'member_google_pending'
const PENDING_SECONDS = 60 * 15

export interface PendingGoogleMember {
  email: string
  name: string
}

export async function buildPendingGoogleCookie(pending: PendingGoogleMember) {
  // The email is under `googleEmail`, not `email`, on purpose (see the note at the top).
  const value = await new SignJWT({ kind: 'member-google-pending', googleEmail: pending.email, googleName: pending.name })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${PENDING_SECONDS}s`)
    .sign(getSecretKey())
  return {
    name: MEMBER_GOOGLE_PENDING_COOKIE,
    value,
    options: { ...sessionCookieOptions(), maxAge: PENDING_SECONDS },
  }
}

export async function getPendingGoogleMember(): Promise<PendingGoogleMember | null> {
  const { cookies } = await import('next/headers')
  const token = (await cookies()).get(MEMBER_GOOGLE_PENDING_COOKIE)?.value
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, getSecretKey())
    if (payload.kind !== 'member-google-pending') return null
    if (typeof payload.googleEmail !== 'string' || typeof payload.googleName !== 'string') return null
    return { email: payload.googleEmail, name: payload.googleName }
  } catch {
    return null
  }
}

export async function clearPendingGoogleCookie() {
  const { cookies } = await import('next/headers')
  ;(await cookies()).delete(MEMBER_GOOGLE_PENDING_COOKIE)
}
