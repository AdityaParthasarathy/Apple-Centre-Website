import { NextResponse } from 'next/server'
import { getFacultySession } from '@/lib/session'
import { callAppsScript } from '@/lib/apps-script'
import type { SheetProgram } from '@/lib/sheet-types'
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
  if (!body?.title || !body?.description || !body?.level || !body?.image) {
    return NextResponse.json({ error: 'Title, description, level, and a photo are required.' }, { status: 400 })
  }

  try {
    const result = await callAppsScript<{ program: SheetProgram }>('addProgram', {
      ...body,
      createdBy: session.email,
    })
    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to add program:', error)
    return failureResponse(error, 'Failed to save the program.')
  }
}
