import { NextResponse } from 'next/server'
import { getFacultySession } from '@/lib/session'
import { callAppsScript } from '@/lib/apps-script'
import type { SheetFacility } from '@/lib/sheet-types'

export async function GET() {
  const session = await getFacultySession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const result = await callAppsScript<{ items: SheetFacility[] }>('listFacilities')
    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to list facilities:', error)
    return NextResponse.json({ error: 'Failed to load facilities.' }, { status: 502 })
  }
}

export async function POST(request: Request) {
  const session = await getFacultySession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body?.title || !body?.description || !body?.image) {
    return NextResponse.json({ error: 'Title, description, and image are required.' }, { status: 400 })
  }

  try {
    const result = await callAppsScript<{ facility: SheetFacility }>('addFacility', {
      ...body,
      createdBy: session.email,
    })
    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to add facility:', error)
    return NextResponse.json({ error: 'Failed to save the facility.' }, { status: 502 })
  }
}
