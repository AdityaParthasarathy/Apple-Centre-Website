import { NextResponse } from 'next/server'
import { getFacultySession } from '@/lib/session'
import { callAppsScript } from '@/lib/apps-script'

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
    return NextResponse.json({ error: 'Failed to upload the photo.' }, { status: 502 })
  }
}
