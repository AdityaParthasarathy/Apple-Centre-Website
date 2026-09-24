import { NextResponse } from 'next/server'
import { getFacultySession } from '@/lib/session'
import { callAppsScript } from '@/lib/apps-script'

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
