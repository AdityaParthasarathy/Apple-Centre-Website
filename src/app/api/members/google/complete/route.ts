import { NextResponse } from 'next/server'
import { compare } from 'bcryptjs'
import { callAppsScript } from '@/lib/apps-script'
import { clearPendingGoogleCookie, getPendingGoogleMember, setMemberSessionCookie } from '@/lib/member-session'
import { parseFields } from '@/lib/input-checks'
import { addressOf, clearWrong, lockedOut, mayCreateAccount, noteAccountCreated, noteWrong } from '@/lib/member-throttle'
import type { MemberRecord } from '@/lib/member-api'

// The last step of the first "Continue with Google": Google has proven the email
// (it is in the short-lived cookie); the member says their enrollment number and
// department, and the account is created.
//
// If that enrollment number already has an account (made with a username and
// password), the person can connect their Google account to it by entering that
// account's password — otherwise anyone could take over a number by signing in
// with Google.
export async function POST(request: Request) {
  const pending = await getPendingGoogleMember()
  if (!pending) {
    return NextResponse.json({ error: 'Your Google sign-in expired. Please start again.', expired: true }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const parsed = parseFields(body, {
    name: { label: 'Name', required: true, max: 80 },
    enrollment: { label: 'Enrollment number', kind: 'enrollment', required: true, max: 20 },
    department: { label: 'Department', required: true, max: 80 },
  })
  if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 })
  const { name, enrollment, department } = parsed.values
  const address = addressOf(request)

  const signedIn = async (member: { name: string; enrollment: string; department: string }) => {
    await setMemberSessionCookie({ name: member.name, enrollment: member.enrollment, department: member.department })
    await clearPendingGoogleCookie()
    return NextResponse.json({ success: true, name: member.name })
  }

  try {
    if (!mayCreateAccount(address)) {
      return NextResponse.json({ error: 'Too many accounts made from this connection. Try again later.' }, { status: 429 })
    }
    const result = await callAppsScript<{ created: boolean; conflict?: string; member?: MemberRecord }>('registerMember', {
      enrollment,
      name,
      department,
      email: pending.email,
    })
    if (result.created && result.member) {
      noteAccountCreated(address)
      return signedIn(result.member)
    }
    // Connected to this Google account in the meantime: just sign in.
    if (result.conflict === 'email' && result.member) return signedIn(result.member)

    // The number has an account. Connecting needs its password.
    const existing = result.member
    if (!existing) return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 502 })

    const password = typeof body?.password === 'string' ? body.password : ''
    if (!password) {
      return NextResponse.json(
        {
          error:
            'That enrollment number already has an account. To connect your Google account to it, enter that account’s password.',
          needsPassword: true,
        },
        { status: 409 }
      )
    }
    if (existing.email && existing.email !== pending.email) {
      return NextResponse.json({ error: 'That account is already connected to a different Google account.' }, { status: 409 })
    }
    const tryKey = `${address}|${enrollment}`
    if (lockedOut(tryKey)) {
      return NextResponse.json({ error: 'Too many wrong passwords. Wait 15 minutes and try again.' }, { status: 429 })
    }
    if (!existing.passwordHash || !(await compare(password, existing.passwordHash))) {
      noteWrong(tryKey)
      return NextResponse.json({ error: 'That password is wrong.', needsPassword: true }, { status: 401 })
    }
    clearWrong(tryKey)
    if (!existing.email) await callAppsScript('updateMemberEmail', { enrollment: existing.enrollment, email: pending.email })
    return signedIn(existing)
  } catch (error) {
    console.error('Finishing member Google sign-in failed:', error)
    return NextResponse.json({ error: "Couldn't finish setting up your account. Please try again." }, { status: 502 })
  }
}
