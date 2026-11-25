import { NextResponse } from 'next/server'
import { callAppsScript } from '@/lib/apps-script'
import { failureResponse } from '@/lib/api-errors'
import { requireMember } from '@/lib/member-api'
import { checkJpegBase64 } from '@/lib/input-checks'

// See the note on maxDuration in /api/staff/upload.
export const maxDuration = 60

// The "pick a photo" upload for a project or achievement form. Body: { base64 }
// — the JPEG the browser made from the chosen picture.
export async function POST(request: Request) {
  const auth = await requireMember()
  if ('response' in auth) return auth.response

  const body = await request.json().catch(() => null)
  if (!checkJpegBase64(body?.base64)) {
    return NextResponse.json({ error: 'Choose a picture to upload (it must be under about 3 MB).' }, { status: 400 })
  }

  try {
    const result = await callAppsScript<{ url: string }>('uploadImage', {
      base64: body.base64,
      mimeType: 'image/jpeg',
      filename: 'member-photo.jpg',
    })
    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to upload member image:', error)
    return failureResponse(error, 'Failed to upload the photo.')
  }
}
