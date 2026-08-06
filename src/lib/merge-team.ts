import { faculty as staticTeam, type Faculty } from '@/content/faculty'
import { callAppsScript } from '@/lib/apps-script'
import type { SheetTeamMember } from '@/lib/sheet-types'

function sheetMemberToFaculty(m: SheetTeamMember): Faculty {
  return {
    id: m.id,
    name: m.name,
    role: m.role,
    bio: m.bio,
    image: m.image || undefined,
    expertise: m.expertise ? m.expertise.split(',').map((v) => v.trim()).filter(Boolean) : undefined,
    contact: m.contact || undefined,
  }
}

/** Static seed team members plus anything faculty have added via the portal. */
export async function getAllTeamMembers(): Promise<Faculty[]> {
  let sheetMembers: Faculty[] = []
  try {
    const result = await callAppsScript<{ items: SheetTeamMember[] }>('listTeamMembers')
    sheetMembers = result.items.map(sheetMemberToFaculty)
  } catch {
    // Apps Script not configured yet, or temporarily unreachable — the site
    // still works with just the static seed set.
  }
  return [...staticTeam, ...sheetMembers]
}
