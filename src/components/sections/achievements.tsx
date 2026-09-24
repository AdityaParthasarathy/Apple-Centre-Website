import { getAllAchievements } from '@/lib/merge-achievements'
import { AchievementsSectionClient } from '@/components/sections/achievements-client'

// Server Component so the Apps Script call (server-only secret) stays off
// the client — merges the static seed achievements with anything staff have
// added, then hands the result to the client component for the motion bits.
export async function AchievementsSection() {
  const achievements = await getAllAchievements()
  return <AchievementsSectionClient achievements={achievements} />
}
