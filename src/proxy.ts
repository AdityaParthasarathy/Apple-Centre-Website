import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/session'
import { verifyMemberToken, MEMBER_COOKIE_NAME } from '@/lib/member-session'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname === '/members' || pathname.startsWith('/members/')) {
    const token = request.cookies.get(MEMBER_COOKIE_NAME)?.value
    const member = token ? await verifyMemberToken(token) : null

    // Reachable without a session: the sign-in page, and the page where someone
    // arriving from Google finishes setting up their account.
    if (pathname === '/members/login' || pathname === '/members/complete-profile') {
      if (member) return NextResponse.redirect(new URL('/members', request.url))
      return NextResponse.next()
    }
    if (!member) return NextResponse.redirect(new URL('/members/login', request.url))
    return NextResponse.next()
  }

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
  matcher: ['/staff/:path*', '/members/:path*'],
}
