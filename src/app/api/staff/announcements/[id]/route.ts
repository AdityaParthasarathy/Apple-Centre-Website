import { NextResponse } from 'next/server'
import { getFacultySession } from '@/lib/session'
import { callAppsScript } from '@/lib/apps-script'
import { failureResponse } from '@/lib/api-errors'

// Google Apps Script takes 3-45s to answer (see lib/apps-script.ts), and
// Vercel cuts a function off at its plan default (often 10s) unless the route
// says otherwise — which made photo uploads and saves fail with a bare
// platform error. 60s is the ceiling that is valid on every Vercel plan.
export const maxDuration = 60

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getFacultySession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })

  try {
    const result = await callAppsScript('updateAnnouncement', { id, ...body })
    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to update announcement:', error)
    return failureResponse(error, 'Failed to update the announcement.')
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getFacultySession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  try {
    const result = await callAppsScript('deleteAnnouncement', { id })
    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to delete announcement:', error)
    return failureResponse(error, 'Failed to delete the announcement.')
  }
}
