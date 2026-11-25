import { NextResponse } from 'next/server'
import { compare } from 'bcryptjs'
import { callAppsScript } from '@/lib/apps-script'
import { setMemberSessionCookie } from '@/lib/member-session'
import { parseFields } from '@/lib/input-checks'
import { addressOf, clearWrong, lockedOut, noteWrong } from '@/lib/member-throttle'
import type { MemberRecord } from '@/lib/member-api'

// A valid-format bcrypt hash that no real password will ever match — compared
// against on a lookup miss so an unknown username takes the same time as a wrong
// password, instead of answering early and leaking which one it was.
const DUMMY_HASH = '$2a$10$CwTycUXWue0Thq9StjUM0uJ8Dt2m1M3P.hOL91jRQpNfDp2xVYtQe'

const WRONG =
  'Incorrect username or password. If you made your account with Google, use "Continue with Google" instead.'

// Sign in with username + password. (Accounts are made at /api/members/register.)
export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = parseFields(body, { username: { label: 'Username', required: true, max: 30 } })
  if ('error' in parsed) return NextResponse.json({ error: 'Enter your username.' }, { status: 400 })
  const password = typeof body?.password === 'string' ? body.password : ''
  if (!password) return NextResponse.json({ error: 'Enter your password.' }, { status: 400 })

  const { username } = parsed.values
  const tryKey = `${addressOf(request)}|${username}`
  if (lockedOut(tryKey)) {
    return NextResponse.json({ error: 'Too many wrong passwords. Wait 15 minutes and try again.' }, { status: 429 })
  }

  let account: MemberRecord | null
  try {
    account = (await callAppsScript<{ member: MemberRecord | null }>('getMember', { username })).member
  } catch (error) {
    console.error('Member sign-in failed:', error)
    return NextResponse.json({ error: "Couldn't sign you in right now. Please try again." }, { status: 502 })
  }

  const matches = await compare(password, account?.passwordHash || DUMMY_HASH)
  if (!account || !account.passwordHash || !matches) {
    noteWrong(tryKey)
    return NextResponse.json({ error: WRONG }, { status: 401 })
  }

  clearWrong(tryKey)
  await setMemberSessionCookie({ name: account.name, enrollment: account.enrollment, department: account.department })
  return NextResponse.json({ success: true, name: account.name })
}
