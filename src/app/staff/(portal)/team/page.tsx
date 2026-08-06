import type { Metadata } from 'next'
import { callAppsScript } from '@/lib/apps-script'
import type { SheetTeamMember } from '@/lib/sheet-types'
import { TeamManager } from '@/components/staff/team-manager'

export const metadata: Metadata = {
  title: 'Team | Faculty Portal',
}

async function loadTeam(): Promise<{ members: SheetTeamMember[]; error: string | null }> {
  try {
    const result = await callAppsScript<{ items: SheetTeamMember[] }>('listTeamMembers')
    return { members: result.items, error: null }
  } catch (error) {
    return {
      members: [],
      error: error instanceof Error ? error.message : 'Failed to load the team roster.',
    }
  }
}

export default async function StaffTeamPage() {
  const { members, error } = await loadTeam()

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Team</h1>
      <p className="mt-1 text-muted-foreground">
        The public &quot;Meet the Team&quot; roster. This is separate from portal login accounts.
      </p>
      {error && (
        <p className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          Couldn&apos;t load the team roster from the sheet: {error}
        </p>
      )}
      <div className="mt-8">
        <TeamManager initialMembers={members} />
      </div>
    </div>
  )
}
