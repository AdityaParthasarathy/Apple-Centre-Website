import { NextResponse } from 'next/server'
import { getFacultySession } from '@/lib/session'
import { callAppsScript } from '@/lib/apps-script'
import { failureResponse } from '@/lib/api-errors'

export const maxDuration = 60

// Only these can change; the address (slug) is fixed when the folder is made so
// links people have already shared keep working.
const EDITABLE = { name: 80, description: 300, cover: 500 } as const

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getFacultySession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })

  const updates: Record<string, string> = {}
  for (const [key, max] of Object.entries(EDITABLE)) {
    if (!(key in body)) continue
    const value = typeof body[key] === 'string' ? body[key].trim() : null
    if (value === null || value.length > max) return NextResponse.json({ error: `Invalid ${key}.` }, { status: 400 })
    if (key === 'name' && !value) return NextResponse.json({ error: 'A folder needs a name.' }, { status: 400 })
    updates[key] = value
  }
  if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'Nothing to change.' }, { status: 400 })

  try {
    return NextResponse.json(await callAppsScript('updateAlbum', { id, ...updates }))
  } catch (error) {
    console.error('Failed to update folder:', error)
    return failureResponse(error, 'Failed to update the folder.')
  }
}

// Deleting a folder keeps its photos; they just become unfiled.
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getFacultySession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  try {
    return NextResponse.json(await callAppsScript('deleteAlbum', { id }))
  } catch (error) {
    console.error('Failed to delete folder:', error)
    return failureResponse(error, 'Failed to delete the folder.')
  }
}
