import { NextResponse } from 'next/server'
import { getMemberSession, type MemberSession } from '@/lib/member-session'
import { callAppsScript } from '@/lib/apps-script'
import type { FieldSpec } from '@/lib/input-checks'

// Shared by the /api/members routes.

/** An account as the sheet holds it. Server-side only: it carries the password hash. */
export interface MemberRecord {
  enrollment: string
  name: string
  department: string
  username: string
  /** The Google account connected to it, if any. */
  email: string
  passwordHash: string
}

export const MIN_PASSWORD = 8

/** Google's per-minute limit on sheet reads was hit (and waiting didn't clear it). */
export const isBusy = (error: unknown) => error instanceof Error && /\b429\b|quota exceeded/i.test(error.message)

export const BUSY_MESSAGE = "The Centre's data service is busy right now. Wait a minute and try again."

/** What every row a member adds is filed under, so their dashboard can count it
 *  and only they can edit or delete it. */
export const memberKey = (member: MemberSession) => `member:${member.enrollment}`

export async function requireMember(): Promise<{ member: MemberSession } | { response: NextResponse }> {
  const member = await getMemberSession()
  if (!member) return { response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  return { member }
}

/** Whether this member added the item. Reads the list fresh: a stale copy could
 *  say a just-deleted item still belongs to them, or miss one they just added. */
export async function ownsItem(
  listAction: 'listGallery' | 'listProjects' | 'listAchievements',
  id: string,
  member: MemberSession
): Promise<boolean> {
  const { items } = await callAppsScript<{ items: { id: string; createdBy?: string }[] }>(listAction, {}, { fresh: true })
  return items.some((item) => String(item.id) === String(id) && item.createdBy === memberKey(member))
}

export const NOT_YOURS = { error: "That item wasn't added by you, or it no longer exists." }

export const GALLERY_CATEGORIES = ['workshop', 'event', 'facility', 'community'] as const

export const GALLERY_FIELDS: Record<string, FieldSpec> = {
  title: { label: 'Title', required: true, max: 120 },
  description: { label: 'Description', max: 500 },
  category: { label: 'Category', kind: 'option', required: true, options: GALLERY_CATEGORIES },
}

export const PROJECT_FIELDS: Record<string, FieldSpec> = {
  title: { label: 'Title', required: true, max: 120 },
  description: { label: 'Description', required: true, max: 2000 },
  team: { label: 'Team', max: 300 },
  technologies: { label: 'Technologies', max: 300 },
  image: { label: 'Photo', kind: 'image', required: true, max: 500 },
  link: { label: 'Project link', kind: 'url', required: true, max: 500 },
  githubLink: { label: 'GitHub repository link', kind: 'github', required: true, max: 300 },
  memberName: { label: 'Your name', required: true, max: 80 },
  enrollment: { label: 'Enrollment number', kind: 'enrollment', required: true, max: 20 },
  department: { label: 'Your department', required: true, max: 80 },
  studyYear: { label: 'Year of study', kind: 'year', required: true },
  mentorName: { label: "Mentor's name", required: true, max: 80 },
  mentorDepartment: { label: "Mentor's department", required: true, max: 80 },
  mentorPosition: { label: "Mentor's position", required: true, max: 80 },
  mentorEmail: { label: "Mentor's email", kind: 'email', required: true, max: 120 },
  mentorPhone: { label: "Mentor's phone number", kind: 'phone', required: true, max: 20 },
}

export const ACHIEVEMENT_FIELDS: Record<string, FieldSpec> = {
  title: { label: 'Competition name', required: true, max: 120 },
  placement: { label: 'Placement', required: true, max: 80 },
  institution: { label: 'Hosted by', max: 120 },
  description: { label: 'Description', max: 2000 },
  image: { label: 'Photo', kind: 'image', required: true, max: 500 },
}
