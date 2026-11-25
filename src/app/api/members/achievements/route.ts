import { NextResponse } from 'next/server'
import { callAppsScript } from '@/lib/apps-script'
import { failureResponse } from '@/lib/api-errors'
import { ACHIEVEMENT_FIELDS, memberKey, requireMember } from '@/lib/member-api'
import { parseFields } from '@/lib/input-checks'
import type { SheetAchievement } from '@/lib/sheet-types'

// See the note on maxDuration in /api/staff/achievements.
export const maxDuration = 60

export async function POST(request: Request) {
  const auth = await requireMember()
  if ('response' in auth) return auth.response

  const parsed = parseFields(await request.json().catch(() => null), ACHIEVEMENT_FIELDS)
  if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 })

  try {
    const result = await callAppsScript<{ achievement: SheetAchievement }>('addAchievement', {
      ...parsed.values,
      createdBy: memberKey(auth.member),
    })
    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to add member achievement:', error)
    return failureResponse(error, 'Failed to save the achievement.')
  }
}
