import { NextResponse } from 'next/server'
import { getFacultySession } from '@/lib/session'
import { callAppsScript } from '@/lib/apps-script'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getFacultySession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })

  try {
    const result = await callAppsScript('updateTeamMember', { id, ...body })
    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to update team member:', error)
    return NextResponse.json({ error: 'Failed to update the team member.' }, { status: 502 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getFacultySession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  try {
    const result = await callAppsScript('deleteTeamMember', { id })
    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to delete team member:', error)
    return NextResponse.json({ error: 'Failed to delete the team member.' }, { status: 502 })
  }
}
