import { NextResponse } from 'next/server'
import { getFacultySession } from '@/lib/session'
import { callAppsScript } from '@/lib/apps-script'
import type { SheetGalleryImage } from '@/lib/sheet-types'

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
    // Never forward Google's own text: for this failure it echoes the value it
    // was given, which (when the setting is wrong) is the Apps Script secret.
    const text = error instanceof Error ? error.message : ''
    // Google never answered in time, or answered with its own error page
    // instead of ours (see AppsScriptAmbiguousError in apps-script.ts).
    const unclearReply = /got no reply|reply was not JSON/i.test(text)
    // The Drive folder setting in Code.gs is missing or wrong (see uploadImageToDrive).
    const folderNotSet = /GALLERY_FOLDER_ID|Invalid file or folder ID/i.test(text)
    return NextResponse.json(
      {
        error: folderNotSet
          ? 'Photo storage is not set up: GALLERY_FOLDER_ID in the Apps Script must be your Drive folder ID. Ask whoever manages the script to fix it.'
          : unclearReply
            ? 'Google was too slow or gave an unclear answer while saving the photo. Please try again.'
            : 'Failed to upload the photo.',
      },
      { status: 502 }
    )
  }
}
