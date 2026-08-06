import { SignJWT, jwtVerify } from 'jose'

// Cookie-based faculty session, signed with jose (edge-compatible — this
// gets verified inside middleware, which runs on the Edge runtime and can't
// use bcrypt or other Node-only crypto).
export const SESSION_COOKIE_NAME = 'staff_session'
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7 // 7 days

export interface FacultySession {
  email: string
  name: string
}

function getSecretKey() {
  const secret = process.env.SESSION_SECRET
  if (!secret) {
    throw new Error('SESSION_SECRET is not configured.')
  }
  return new TextEncoder().encode(secret)
}

export async function signSessionToken(session: FacultySession): Promise<string> {
  return new SignJWT({ email: session.email, name: session.name })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecretKey())
}

/** Safe to call from middleware (Edge runtime) as well as Route Handlers. */
export async function verifySessionToken(token: string): Promise<FacultySession | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey())
    if (typeof payload.email !== 'string' || typeof payload.name !== 'string') return null
    return { email: payload.email, name: payload.name }
  } catch {
    return null
  }
}

/** Server Components / Route Handlers only — reads + verifies the session cookie. */
export async function getFacultySession(): Promise<FacultySession | null> {
  const { cookies } = await import('next/headers')
  const store = await cookies()
  const token = store.get(SESSION_COOKIE_NAME)?.value
  if (!token) return null
  return verifySessionToken(token)
}

/** Route Handlers only — sets the signed session cookie after a successful login. */
export async function setSessionCookie(session: FacultySession) {
  const { cookies } = await import('next/headers')
  const token = await signSessionToken(session)
  const store = await cookies()
  store.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DURATION_SECONDS,
  })
}

export async function clearSessionCookie() {
  const { cookies } = await import('next/headers')
  const store = await cookies()
  store.delete(SESSION_COOKIE_NAME)
}
