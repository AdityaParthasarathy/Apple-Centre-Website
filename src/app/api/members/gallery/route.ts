import { NextResponse } from 'next/server'
import { callAppsScript } from '@/lib/apps-script'
import { failureResponse } from '@/lib/api-errors'
import { GALLERY_FIELDS, memberKey, requireMember } from '@/lib/member-api'
import { checkJpegBase64, parseFields } from '@/lib/input-checks'
import type { SheetGalleryImage } from '@/lib/sheet-types'

// See the note on maxDuration in /api/staff/gallery.
export const maxDuration = 60

// Body: { title, description, category, base64 } — the photo goes to the public
// gallery, filed under the signed-in member.
export async function POST(request: Request) {
  const auth = await requireMember()
  if ('response' in auth) return auth.response

  const body = await request.json().catch(() => null)
  const parsed = parseFields(body, GALLERY_FIELDS)
  if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 })
  if (!checkJpegBase64(body?.base64)) {
    return NextResponse.json({ error: 'Choose a photo to upload (it must be under about 3 MB).' }, { status: 400 })
  }

  try {
    const result = await callAppsScript<{ image: SheetGalleryImage }>('addGalleryImage', {
      ...parsed.values,
      base64: body.base64,
      mimeType: 'image/jpeg',
      filename: `${parsed.values.title.replace(/[^\w\- ]+/g, '').trim().slice(0, 60) || 'photo'}.jpg`,
      createdBy: memberKey(auth.member),
    })
    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to add member gallery image:', error)
    return failureResponse(error, 'Failed to upload the photo.')
  }
}
