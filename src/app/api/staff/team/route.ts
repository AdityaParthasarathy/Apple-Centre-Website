import { NextResponse } from 'next/server'
import { getFacultySession } from '@/lib/session'
import { callAppsScript } from '@/lib/apps-script'
import type { SheetTeamMember } from '@/lib/sheet-types'

export async function GET() {
  const session = await getFacultySession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const result = await callAppsScript<{ items: SheetTeamMember[] }>('listTeamMembers')
    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to list team members:', error)
    return NextResponse.json({ error: 'Failed to load the team roster.' }, { status: 502 })
  }
}

export async function POST(request: Request) {
  const session = await getFacultySession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body?.name || !body?.role || !body?.bio) {
    return NextResponse.json({ error: 'Name, role, and bio are required.' }, { status: 400 })
  }

  try {
    const result = await callAppsScript<{ member: SheetTeamMember }>('addTeamMember', {
      ...body,
      createdBy: session.email,
    })
    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to add team member:', error)
    return NextResponse.json({ error: 'Failed to save the team member.' }, { status: 502 })
  }
}
