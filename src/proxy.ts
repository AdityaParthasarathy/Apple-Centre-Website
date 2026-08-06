import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/session'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value
  const session = token ? await verifySessionToken(token) : null

  if (pathname === '/staff/login') {
    // Already signed in — no reason to see the login page again.
    if (session) return NextResponse.redirect(new URL('/staff', request.url))
    return NextResponse.next()
  }

  if (!session) {
    return NextResponse.redirect(new URL('/staff/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/staff/:path*'],
}
