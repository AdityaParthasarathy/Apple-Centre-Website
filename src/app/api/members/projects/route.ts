import { NextResponse } from 'next/server'
import { callAppsScript } from '@/lib/apps-script'
import { failureResponse } from '@/lib/api-errors'
import { memberKey, PROJECT_FIELDS, requireMember } from '@/lib/member-api'
import { parseFields } from '@/lib/input-checks'
import type { SheetProject } from '@/lib/sheet-types'

// See the note on maxDuration in /api/staff/projects.
export const maxDuration = 60

export async function POST(request: Request) {
  const auth = await requireMember()
  if ('response' in auth) return auth.response

  const parsed = parseFields(await request.json().catch(() => null), PROJECT_FIELDS)
  if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 })

  try {
    // Never featured: that is staff's call.
    const result = await callAppsScript<{ project: SheetProject }>('addMemberProject', {
      ...parsed.values,
      featured: false,
      createdBy: memberKey(auth.member),
    })
    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to add member project:', error)
    return failureResponse(error, 'Failed to save the project.')
  }
}
