import { NextResponse } from 'next/server'
import { getFacultySession } from '@/lib/session'
import { callAppsScript } from '@/lib/apps-script'
import type { SheetAnnouncement } from '@/lib/sheet-types'

export async function GET() {
  const session = await getFacultySession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const result = await callAppsScript<{ items: SheetAnnouncement[] }>('listAnnouncements')
    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to list announcements:', error)
    return NextResponse.json({ error: 'Failed to load announcements.' }, { status: 502 })
  }
}

export async function POST(request: Request) {
  const session = await getFacultySession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body?.title || !body?.body) {
    return NextResponse.json({ error: 'Title and body are required.' }, { status: 400 })
  }

  try {
    const result = await callAppsScript<{ announcement: SheetAnnouncement }>('addAnnouncement', {
      ...body,
      createdBy: session.email,
    })
    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to add announcement:', error)
    return NextResponse.json({ error: 'Failed to save the announcement.' }, { status: 502 })
  }
}
