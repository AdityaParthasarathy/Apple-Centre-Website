import { NextResponse } from 'next/server'
import { getFacultySession } from '@/lib/session'
import { callAppsScript } from '@/lib/apps-script'
import { failureResponse } from '@/lib/api-errors'

// Google Apps Script takes 3-45s to answer (see lib/apps-script.ts), and
// Vercel cuts a function off at its plan default (often 10s) unless the route
// says otherwise — which made photo uploads and saves fail with a bare
// platform error. 60s is the ceiling that is valid on every Vercel plan.
export const maxDuration = 60

// Generic "pick a photo" upload used by every content type that just needs
// a single image URL (Events/Projects/Programs/Facilities/Team) — separate
// from /api/staff/gallery, which creates its Gallery row in the same step.
// Body: { base64, mimeType, filename }
export async function POST(request: Request) {
  const session = await getFacultySession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body?.base64) {
    return NextResponse.json({ error: 'An image is required.' }, { status: 400 })
  }

  try {
    const result = await callAppsScript<{ url: string }>('uploadImage', body)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to upload image:', error)
    return failureResponse(error, 'Failed to upload the photo.')
  }
}
