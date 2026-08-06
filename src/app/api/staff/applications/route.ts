import { NextResponse } from 'next/server'
import { getFacultySession } from '@/lib/session'
import { callAppsScript } from '@/lib/apps-script'
import type { SheetApplication } from '@/lib/sheet-types'

export async function GET() {
  const session = await getFacultySession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const result = await callAppsScript<{ items: SheetApplication[] }>('listApplications')
    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to list applications:', error)
    return NextResponse.json({ error: 'Failed to load applications.' }, { status: 502 })
  }
}
