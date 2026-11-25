import { NextResponse } from 'next/server'
import { callAppsScript } from '@/lib/apps-script'
import { failureResponse } from '@/lib/api-errors'
import { NOT_YOURS, ownsItem, PROJECT_FIELDS, requireMember } from '@/lib/member-api'
import { parseFields } from '@/lib/input-checks'

export const maxDuration = 60

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireMember()
  if ('response' in auth) return auth.response

  const { id } = await params
  const parsed = parseFields(await request.json().catch(() => null), PROJECT_FIELDS)
  if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 })

  try {
    if (!(await ownsItem('listProjects', id, auth.member))) return NextResponse.json(NOT_YOURS, { status: 404 })
    return NextResponse.json(await callAppsScript('updateMemberProject', { id, ...parsed.values }))
  } catch (error) {
    console.error('Failed to update member project:', error)
    return failureResponse(error, 'Failed to update the project.')
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireMember()
  if ('response' in auth) return auth.response

  const { id } = await params

  try {
    if (!(await ownsItem('listProjects', id, auth.member))) return NextResponse.json(NOT_YOURS, { status: 404 })
    return NextResponse.json(await callAppsScript('deleteMemberProject', { id }))
  } catch (error) {
    console.error('Failed to delete member project:', error)
    return failureResponse(error, 'Failed to delete the project.')
  }
}
