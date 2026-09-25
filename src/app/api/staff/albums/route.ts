import { NextResponse } from 'next/server'
import { getFacultySession } from '@/lib/session'
import { callAppsScript } from '@/lib/apps-script'
import { failureResponse } from '@/lib/api-errors'
import { slugify } from '@/lib/utils'
import type { SheetAlbum } from '@/lib/sheet-types'

export const maxDuration = 60

const ID_PATTERN = /^[A-Za-z0-9-]{8,64}$/

export async function GET() {
  const session = await getFacultySession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const result = await callAppsScript<{ items: SheetAlbum[] }>('listAlbums')
    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to list folders:', error)
    return NextResponse.json({ error: 'Failed to load folders.' }, { status: 502 })
  }
}

// Body: { id?, name, description? }. The id may come from the browser so the
// folder and the photos uploaded into it can be tied together before Google
// has answered; sending the same one again is the same folder, not a second.
export async function POST(request: Request) {
  const session = await getFacultySession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const name = typeof body?.name === 'string' ? body.name.trim() : ''
  const description = typeof body?.description === 'string' ? body.description.trim() : ''
  if (!name || name.length > 80) {
    return NextResponse.json({ error: 'Give the folder a name (up to 80 characters).' }, { status: 400 })
  }
  if (description.length > 300) {
    return NextResponse.json({ error: 'The description can be at most 300 characters.' }, { status: 400 })
  }
  if (body.id !== undefined && !(typeof body.id === 'string' && ID_PATTERN.test(body.id))) {
    return NextResponse.json({ error: 'Invalid folder id.' }, { status: 400 })
  }

  try {
    // The address is made from the name, and no two folders may share one.
    const existing = await callAppsScript<{ items: SheetAlbum[] }>('listAlbums', {}, { fresh: true }).catch(() => null)
    const taken = new Set((existing?.items ?? []).filter((a) => a.id !== body.id).map((a) => a.slug))
    const base = slugify(name) || 'folder'
    let slug = base
    for (let n = 2; taken.has(slug); n++) slug = `${base}-${n}`

    const result = await callAppsScript<{ album: SheetAlbum }>('addAlbum', {
      ...(body.id ? { id: body.id } : {}),
      name,
      slug,
      description,
      createdBy: session.email,
    })
    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to create folder:', error)
    return failureResponse(error, 'Failed to create the folder.')
  }
}
