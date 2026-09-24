import { NextResponse } from 'next/server'
import { getFacultySession } from '@/lib/session'
import { callAppsScript } from '@/lib/apps-script'
import type { SheetAchievement } from '@/lib/sheet-types'
import { failureResponse } from '@/lib/api-errors'

// Google Apps Script takes 3-45s to answer (see lib/apps-script.ts), and
// Vercel cuts a function off at its plan default (often 10s) unless the route
// says otherwise — which made photo uploads and saves fail with a bare
// platform error. 60s is the ceiling that is valid on every Vercel plan.
export const maxDuration = 60

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
  if (!body?.title || !body?.placement || !body?.image) {
    return NextResponse.json({ error: 'Title, placement, and a photo are required.' }, { status: 400 })
  }

  try {
    const result = await callAppsScript<{ achievement: SheetAchievement }>('addAchievement', {
      ...body,
      createdBy: session.email,
    })
    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to add achievement:', error)
    return failureResponse(error, 'Failed to save the achievement.')
  }
}
