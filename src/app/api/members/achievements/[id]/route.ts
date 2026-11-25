import { NextResponse } from 'next/server'
import { callAppsScript } from '@/lib/apps-script'
import { failureResponse } from '@/lib/api-errors'
import { ACHIEVEMENT_FIELDS, NOT_YOURS, ownsItem, requireMember } from '@/lib/member-api'
import { parseFields } from '@/lib/input-checks'

export const maxDuration = 60

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireMember()
  if ('response' in auth) return auth.response

  const { id } = await params
  const parsed = parseFields(await request.json().catch(() => null), ACHIEVEMENT_FIELDS)
  if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 })

  try {
    if (!(await ownsItem('listAchievements', id, auth.member))) return NextResponse.json(NOT_YOURS, { status: 404 })
    return NextResponse.json(await callAppsScript('updateAchievement', { id, ...parsed.values }))
  } catch (error) {
    console.error('Failed to update member achievement:', error)
    return failureResponse(error, 'Failed to update the achievement.')
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireMember()
  if ('response' in auth) return auth.response

  const { id } = await params

  try {
    if (!(await ownsItem('listAchievements', id, auth.member))) return NextResponse.json(NOT_YOURS, { status: 404 })
    return NextResponse.json(await callAppsScript('deleteAchievement', { id }))
  } catch (error) {
    console.error('Failed to delete member achievement:', error)
    return failureResponse(error, 'Failed to delete the achievement.')
  }
}
