import { NextResponse, type NextRequest } from 'next/server'
import {
  CALLBACK_PATH,
  OAUTH_COOKIE_NAME,
  OAUTH_COOKIE_PATH,
  buildAuthUrl,
  codeChallenge,
  isGoogleSignInConfigured,
  randomToken,
} from '@/lib/google-oauth'

export const dynamic = 'force-dynamic'

// First leg of "Continue with Google" for members. It uses the same Google
// redirect address as the faculty sign-in (the one already registered in Google
// Cloud), and marks the one-time cookie `member` so the callback there knows
// which portal this person is signing in to.
export async function GET(request: NextRequest) {
  const { origin } = request.nextUrl

  if (!isGoogleSignInConfigured()) {
    return NextResponse.redirect(new URL('/members/login?error=google-not-configured', origin))
  }

  const state = randomToken()
  const nonce = randomToken()
  const verifier = randomToken(48)

  const response = NextResponse.redirect(
    buildAuthUrl({
      redirectUri: `${origin}${CALLBACK_PATH}`,
      state,
      nonce,
      challenge: codeChallenge(verifier),
    })
  )
  response.cookies.set(OAUTH_COOKIE_NAME, `${state}.${nonce}.${verifier}.member`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: OAUTH_COOKIE_PATH,
    maxAge: 60 * 10,
  })
  return response
}
