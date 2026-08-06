import { NextResponse } from 'next/server'
import { getFacultySession } from '@/lib/session'
import { callAppsScript } from '@/lib/apps-script'
import type { SheetGalleryImage } from '@/lib/sheet-types'

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
    return NextResponse.json({ error: 'Failed to upload the photo.' }, { status: 502 })
  }
}
