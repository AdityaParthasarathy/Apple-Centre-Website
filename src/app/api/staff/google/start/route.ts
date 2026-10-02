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

// First leg of "Sign in with Google": remember a one-time state/nonce/PKCE
// verifier in a short-lived cookie, then send the browser to Google.
export async function GET(request: NextRequest) {
  const { origin } = request.nextUrl

  if (!isGoogleSignInConfigured()) {
    return NextResponse.redirect(new URL('/staff/login?error=google-not-configured', origin))
  }

  const state = randomToken()
  const nonce = randomToken()
  const verifier = randomToken(48)

  const response = NextResponse.redirect(
    buildAuthUrl({
      // Must match a redirect URI registered in Google Cloud exactly.
      redirectUri: `${origin}${CALLBACK_PATH}`,
      state,
      nonce,
      challenge: codeChallenge(verifier),
    })
  )
  response.cookies.set(OAUTH_COOKIE_NAME, `${state}.${nonce}.${verifier}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: OAUTH_COOKIE_PATH,
    maxAge: 60 * 10,
  })
  return response
}
