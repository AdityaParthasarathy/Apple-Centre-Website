import { NextResponse } from 'next/server'
import { getFacultySession } from '@/lib/session'
import { callAppsScript } from '@/lib/apps-script'
import type { SheetEvent } from '@/lib/sheet-types'

// Google Apps Script takes 3-45s to answer (see lib/apps-script.ts), and
// Vercel cuts a function off at its plan default (often 10s) unless the route
// says otherwise — which made photo uploads and saves fail with a bare
// platform error. 60s is the ceiling that is valid on every Vercel plan.
export const maxDuration = 60

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
  if (!body?.title || !body?.date || !body?.category || !body?.image) {
    return NextResponse.json({ error: 'Title, date, category, and a photo are required.' }, { status: 400 })
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
