import { NextResponse } from 'next/server'
import { getFacultySession } from '@/lib/session'
import { callAppsScript } from '@/lib/apps-script'

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getFacultySession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  try {
    const result = await callAppsScript('deleteGalleryImage', { id })
    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to delete gallery image:', error)
    return NextResponse.json({ error: 'Failed to delete the photo.' }, { status: 502 })
  }
}
