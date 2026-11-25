import type { Metadata } from 'next'
import { callAppsScript } from '@/lib/apps-script'
import { getMemberSession } from '@/lib/member-session'
import { memberKey } from '@/lib/member-api'
import type { SheetAchievement } from '@/lib/sheet-types'
import { MemberAchievementsManager } from '@/components/members/achievements-manager'

export const metadata: Metadata = {
  title: 'Achievements | Members Portal',
}

async function loadAchievements(owner: string): Promise<{ achievements: SheetAchievement[]; error: string | null }> {
  try {
    const result = await callAppsScript<{ items: SheetAchievement[] }>('listAchievements')
    return { achievements: result.items.filter((item) => item.createdBy === owner), error: null }
  } catch (error) {
    return { achievements: [], error: error instanceof Error ? error.message : 'Failed to load your achievements.' }
  }
}

export default async function MemberAchievementsPage() {
  const member = await getMemberSession()
  if (!member) return null
  const { achievements, error } = await loadAchievements(memberKey(member))

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Achievements</h1>
      <p className="mt-1 text-muted-foreground">
        Post the hackathons and competitions you have won. They appear on the public Achievements page once saved.
      </p>
      {error && (
        <p className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          Couldn&apos;t load your achievements from the sheet: {error}
        </p>
      )}
      <div className="mt-8">
        <MemberAchievementsManager initialAchievements={achievements} />
      </div>
    </div>
  )
}
