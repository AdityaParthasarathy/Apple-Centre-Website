import { NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { callAppsScript } from '@/lib/apps-script'
import { setMemberSessionCookie } from '@/lib/member-session'
import { parseFields } from '@/lib/input-checks'
import { addressOf, mayCreateAccount, noteAccountCreated } from '@/lib/member-throttle'
import { BUSY_MESSAGE, MIN_PASSWORD, isBusy, type MemberRecord } from '@/lib/member-api'

// Creating an account: name, username, enrollment number, department, password.
// Sign-in may wait several seconds for Google's per-minute read limit to clear (see withRetries in google-sheets.ts).
export const maxDuration = 60

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = parseFields(body, {
    name: { label: 'Name', required: true, max: 80 },
    username: { label: 'Username', kind: 'username', required: true, max: 30 },
    enrollment: { label: 'Enrollment number', kind: 'enrollment', required: true, max: 20 },
    department: { label: 'Department', required: true, max: 80 },
  })
  if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 })

  const password = typeof body?.password === 'string' ? body.password : ''
  if (password.length < MIN_PASSWORD) {
    return NextResponse.json({ error: `Choose a password of at least ${MIN_PASSWORD} characters.` }, { status: 400 })
  }
  // bcrypt only reads the first 72 bytes; refuse rather than quietly ignore the rest.
  if (Buffer.byteLength(password) > 72) {
    return NextResponse.json({ error: 'That password is too long (72 characters at most).' }, { status: 400 })
  }

  const address = addressOf(request)
  if (!mayCreateAccount(address)) {
    return NextResponse.json({ error: 'Too many accounts made from this connection. Try again later.' }, { status: 429 })
  }

  const { name, username, enrollment, department } = parsed.values
  try {
    const result = await callAppsScript<{ created: boolean; conflict?: 'enrollment' | 'username' | 'email'; member?: MemberRecord }>(
      'registerMember',
      { enrollment, name, department, username, passwordHash: await hash(password, 10) }
    )
    if (!result.created) {
      return NextResponse.json(
        {
          error:
            result.conflict === 'username'
              ? 'That username is taken. Choose another.'
              : 'That enrollment number already has an account. Sign in instead, or ask a Centre staff member to reset it.',
        },
        { status: 409 }
      )
    }
    noteAccountCreated(address)
    await setMemberSessionCookie({ name, enrollment, department })
    return NextResponse.json({ success: true, name })
  } catch (error) {
    console.error('Member sign-up failed:', error)
    if (isBusy(error)) return NextResponse.json({ error: BUSY_MESSAGE }, { status: 503 })
    return NextResponse.json({ error: "Couldn't create your account right now. Please try again." }, { status: 502 })
  }
}
