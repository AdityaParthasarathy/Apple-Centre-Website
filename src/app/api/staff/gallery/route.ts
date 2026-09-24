import { NextResponse } from 'next/server'
import { getFacultySession } from '@/lib/session'
import { callAppsScript } from '@/lib/apps-script'
import type { SheetGalleryImage } from '@/lib/sheet-types'
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
    const result = await callAppsScript<{ items: SheetGalleryImage[] }>('listGallery')
    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to list gallery images:', error)
    return NextResponse.json({ error: 'Failed to load gallery photos.' }, { status: 502 })
  }
}

// Body: { title, description, category, base64, mimeType, filename }
// The image itself is decoded and saved to Drive on the Apps Script side —
// this route just forwards it there (with an auth check first) and appends
// a Gallery sheet row.
export async function POST(request: Request) {
  const session = await getFacultySession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body?.title || !body?.category || !body?.base64) {
    return NextResponse.json({ error: 'Title, category, and an image are required.' }, { status: 400 })
  }

  try {
    const result = await callAppsScript<{ image: SheetGalleryImage }>('addGalleryImage', {
      ...body,
      createdBy: session.email,
    })
    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to add gallery image:', error)
    return failureResponse(error, 'Failed to upload the photo.')
  }
}
