import { getAllTeamMembers } from '@/lib/merge-team'
import { FacultySectionClient } from '@/components/sections/faculty-client'

// Server Component so the Apps Script call (server-only secret) stays off
// the client — merges the static seed team roster with anyone faculty have
// added via the portal, then hands the result to the client component.
export async function FacultySection() {
  const team = await getAllTeamMembers()
  return <FacultySectionClient team={team} />
}
