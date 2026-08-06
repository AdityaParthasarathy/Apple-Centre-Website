import { NextResponse } from 'next/server'
import { getFacultySession } from '@/lib/session'
import { callAppsScript } from '@/lib/apps-script'
import type { SheetEvent } from '@/lib/sheet-types'

export async function GET() {
  const session = await getFacultySession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const result = await callAppsScript<{ items: SheetEvent[] }>('listEvents')
    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to list events:', error)
    return NextResponse.json({ error: 'Failed to load events.' }, { status: 502 })
  }
}

export async function POST(request: Request) {
  const session = await getFacultySession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body?.title || !body?.date || !body?.category) {
    return NextResponse.json({ error: 'Title, date, and category are required.' }, { status: 400 })
  }

  try {
    const result = await callAppsScript<{ event: SheetEvent }>('addEvent', {
      ...body,
      createdBy: session.email,
    })
    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to add event:', error)
    return NextResponse.json({ error: 'Failed to save the event.' }, { status: 502 })
  }
}
