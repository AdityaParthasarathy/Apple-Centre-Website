import { achievements as staticAchievements, type Achievement } from '@/content/achievements'
import { callAppsScript } from '@/lib/apps-script'
import type { SheetAchievement } from '@/lib/sheet-types'

function sheetAchievementToAchievement(a: SheetAchievement): Achievement {
  return {
    id: a.id,
    title: a.title,
    placement: a.placement,
    institution: a.institution || undefined,
    description: a.description || undefined,
    image: a.image || undefined,
  }
}

/** Anything staff have added through the portal (newest first — a fresh win
 *  should be the first thing visitors see), followed by the static seed set. */
export async function getAllAchievements(): Promise<Achievement[]> {
  let sheetAchievements: Achievement[] = []
  try {
    const result = await callAppsScript<{ items: SheetAchievement[] }>('listAchievements')
    sheetAchievements = [...result.items]
      .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
      .map(sheetAchievementToAchievement)
  } catch {
    // Apps Script not configured yet, or temporarily unreachable (or the
    // Achievements tab/actions haven't been deployed) — the site still works
    // with just the static seed set.
  }
  return [...sheetAchievements, ...staticAchievements]
}
