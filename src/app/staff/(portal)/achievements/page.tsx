import type { Metadata } from 'next'
import { callAppsScript } from '@/lib/apps-script'
import type { SheetAchievement } from '@/lib/sheet-types'
import { AchievementsManager } from '@/components/staff/achievements-manager'

export const metadata: Metadata = {
  title: 'Achievements | Faculty Portal',
}

async function loadAchievements(): Promise<{ achievements: SheetAchievement[]; error: string | null }> {
  try {
    const result = await callAppsScript<{ items: SheetAchievement[] }>('listAchievements')
    return { achievements: result.items, error: null }
  } catch (error) {
    return {
      achievements: [],
      error: error instanceof Error ? error.message : 'Failed to load achievements.',
    }
  }
}

export default async function StaffAchievementsPage() {
  const { achievements, error } = await loadAchievements()

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Hackathons &amp; achievements</h1>
      <p className="mt-1 text-muted-foreground">
        Post a new win with a photo and a short write-up — it appears on the homepage and the Achievements page,
        newest first.
      </p>
      {error && (
        <p className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          Couldn&apos;t load achievements from the sheet: {error}
        </p>
      )}
      <div className="mt-8">
        <AchievementsManager initialAchievements={achievements} />
      </div>
    </div>
  )
}
