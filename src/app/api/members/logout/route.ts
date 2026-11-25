import { NextResponse } from 'next/server'
import { clearMemberSessionCookie } from '@/lib/member-session'

export async function POST() {
  await clearMemberSessionCookie()
  return NextResponse.json({ success: true })
}
