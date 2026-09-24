import { NextResponse } from 'next/server'
import { getFacultySession } from '@/lib/session'
import { callAppsScript } from '@/lib/apps-script'
import type { SheetAchievement } from '@/lib/sheet-types'

export async function GET() {
  const session = await getFacultySession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const result = await callAppsScript<{ items: SheetAchievement[] }>('listAchievements')
    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to list achievements:', error)
    return NextResponse.json({ error: 'Failed to load achievements.' }, { status: 502 })
  }
}

export async function POST(request: Request) {
  const session = await getFacultySession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body?.title || !body?.placement) {
    return NextResponse.json({ error: 'Title and placement are required.' }, { status: 400 })
  }

  try {
    const result = await callAppsScript<{ achievement: SheetAchievement }>('addAchievement', {
      ...body,
      createdBy: session.email,
    })
    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to add achievement:', error)
    return NextResponse.json({ error: 'Failed to save the achievement.' }, { status: 502 })
  }
}
