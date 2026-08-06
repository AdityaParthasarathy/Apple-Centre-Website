import { NextResponse } from 'next/server'
import { getFacultySession } from '@/lib/session'
import { callAppsScript } from '@/lib/apps-script'
import type { SheetProgram } from '@/lib/sheet-types'

export async function GET() {
  const session = await getFacultySession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const result = await callAppsScript<{ items: SheetProgram[] }>('listPrograms')
    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to list programs:', error)
    return NextResponse.json({ error: 'Failed to load programs.' }, { status: 502 })
  }
}

export async function POST(request: Request) {
  const session = await getFacultySession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body?.title || !body?.description || !body?.level) {
    return NextResponse.json({ error: 'Title, description, and level are required.' }, { status: 400 })
  }

  try {
    const result = await callAppsScript<{ program: SheetProgram }>('addProgram', {
      ...body,
      createdBy: session.email,
    })
    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to add program:', error)
    return NextResponse.json({ error: 'Failed to save the program.' }, { status: 502 })
  }
}
