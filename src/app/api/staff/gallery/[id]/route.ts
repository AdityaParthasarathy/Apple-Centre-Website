import { NextResponse } from 'next/server'
import { getFacultySession } from '@/lib/session'
import { callAppsScript } from '@/lib/apps-script'
import { failureResponse } from '@/lib/api-errors'

// Google Apps Script takes 3-45s to answer (see lib/apps-script.ts), and
// Vercel cuts a function off at its plan default (often 10s) unless the route
// says otherwise — which made photo uploads and saves fail with a bare
// platform error. 60s is the ceiling that is valid on every Vercel plan.
export const maxDuration = 60

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getFacultySession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  try {
    const result = await callAppsScript('deleteGalleryImage', { id })
    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to delete gallery image:', error)
    return failureResponse(error, 'Failed to delete the photo.')
  }
}

// Moves a photo into a folder (or out of one, with an empty `album`), and edits
// its caption. Body: any of { album, title, description, category }.
const CATEGORIES = ['workshop', 'event', 'facility', 'community']

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getFacultySession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })

  const updates: Record<string, string> = {}
  for (const key of ['album', 'title', 'description', 'category']) {
    if (!(key in body)) continue
    const value = body[key]
    if (typeof value !== 'string' || value.length > 500) return NextResponse.json({ error: `Invalid ${key}.` }, { status: 400 })
    if (key === 'category' && !CATEGORIES.includes(value)) return NextResponse.json({ error: 'Invalid category.' }, { status: 400 })
    if (key === 'title' && !value.trim()) return NextResponse.json({ error: 'A photo needs a title.' }, { status: 400 })
    updates[key] = value
  }
  if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'Nothing to change.' }, { status: 400 })

  try {
    return NextResponse.json(await callAppsScript('updateGalleryImage', { id, ...updates }))
  } catch (error) {
    console.error('Failed to update gallery image:', error)
    return failureResponse(error, 'Failed to update the photo.')
  }
}
