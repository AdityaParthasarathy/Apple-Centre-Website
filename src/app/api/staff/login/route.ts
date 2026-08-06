import { NextResponse } from 'next/server'
import { compare } from 'bcryptjs'
import { callAppsScript } from '@/lib/apps-script'
import { setSessionCookie } from '@/lib/session'

interface FacultyRecord {
  email: string
  passwordHash: string
  name: string
}

// A valid-format bcrypt hash that no real password will ever match — compared
// against on a lookup miss so an unknown email takes the same amount of time
// as a wrong password, instead of returning early and leaking which one it was.
const DUMMY_HASH = '$2a$10$CwTycUXWue0Thq9StjUM0uJ8Dt2m1M3P.hOL91jRQpNfDp2xVYtQe'

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body?.password === 'string' ? body.password : ''

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 })
  }

  let faculty: FacultyRecord | null = null
  try {
    const result = await callAppsScript<{ faculty: FacultyRecord | null }>('getFaculty', { email })
    faculty = result.faculty
  } catch (error) {
    console.error('Faculty lookup failed:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 502 }
    )
  }

  const isValid = await compare(password, faculty?.passwordHash ?? DUMMY_HASH)
  if (!faculty || !isValid) {
    return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 })
  }

  await setSessionCookie({ email: faculty.email, name: faculty.name })
  return NextResponse.json({ success: true, name: faculty.name })
}
