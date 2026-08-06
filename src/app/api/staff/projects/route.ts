import { NextResponse } from 'next/server'
import { getFacultySession } from '@/lib/session'
import { callAppsScript } from '@/lib/apps-script'
import type { SheetProject } from '@/lib/sheet-types'

export async function GET() {
  const session = await getFacultySession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const result = await callAppsScript<{ items: SheetProject[] }>('listProjects')
    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to list projects:', error)
    return NextResponse.json({ error: 'Failed to load projects.' }, { status: 502 })
  }
}

export async function POST(request: Request) {
  const session = await getFacultySession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body?.title || !body?.description) {
    return NextResponse.json({ error: 'Title and description are required.' }, { status: 400 })
  }

  try {
    const result = await callAppsScript<{ project: SheetProject }>('addProject', {
      ...body,
      createdBy: session.email,
    })
    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to add project:', error)
    return NextResponse.json({ error: 'Failed to save the project.' }, { status: 502 })
  }
}
