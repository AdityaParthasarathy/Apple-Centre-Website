import { NextResponse } from 'next/server'
import { getFacultySession } from '@/lib/session'
import { callAppsScript } from '@/lib/apps-script'

const VALID_STATUSES = ['Pending', 'Reviewed', 'Accepted', 'Rejected']

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getFacultySession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json().catch(() => null)
  if (!body?.status || !VALID_STATUSES.includes(body.status)) {
    return NextResponse.json({ error: 'A valid status is required.' }, { status: 400 })
  }

  try {
    const result = await callAppsScript('updateApplicationStatus', { id, status: body.status })
    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to update application status:', error)
    return NextResponse.json({ error: 'Failed to update the application.' }, { status: 502 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getFacultySession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  try {
    const result = await callAppsScript('deleteApplication', { id })
    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to delete application:', error)
    return NextResponse.json({ error: 'Failed to delete the application.' }, { status: 502 })
  }
}
