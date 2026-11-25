import { NextResponse } from 'next/server'
import { callAppsScript } from '@/lib/apps-script'
import { failureResponse } from '@/lib/api-errors'
import { NOT_YOURS, ownsItem, requireMember } from '@/lib/member-api'

export const maxDuration = 60

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireMember()
  if ('response' in auth) return auth.response

  const { id } = await params

  try {
    if (!(await ownsItem('listGallery', id, auth.member))) return NextResponse.json(NOT_YOURS, { status: 404 })
    return NextResponse.json(await callAppsScript('deleteGalleryImage', { id }))
  } catch (error) {
    console.error('Failed to delete member gallery image:', error)
    return failureResponse(error, 'Failed to delete the photo.')
  }
}
