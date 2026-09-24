import { NextResponse } from 'next/server'
import { getFacultySession } from '@/lib/session'
import { callAppsScript } from '@/lib/apps-script'
import { failureResponse } from '@/lib/api-errors'

// Google Apps Script takes 3-45s to answer (see lib/apps-script.ts), and
// Vercel cuts a function off at its plan default (often 10s) unless the route
// says otherwise — which made photo uploads and saves fail with a bare
// platform error. 60s is the ceiling that is valid on every Vercel plan.
export const maxDuration = 60

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getFacultySession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  try {
    const result = await callAppsScript('deleteRegistration', { id })
    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to delete registration:', error)
    return failureResponse(error, 'Failed to delete the registration.')
  }
}
