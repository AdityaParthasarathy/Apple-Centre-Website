import { programs as staticPrograms, type Program } from '@/content/programs'
import { callAppsScript } from '@/lib/apps-script'
import type { SheetProgram } from '@/lib/sheet-types'

function sheetProgramToProgram(p: SheetProgram): Program {
  return {
    id: p.id,
    title: p.title,
    description: p.description,
    duration: p.duration,
    level: p.level,
    topics: p.topics ? p.topics.split(',').map((v) => v.trim()).filter(Boolean) : [],
    image: p.image,
  }
}

/** Static seed programs plus anything faculty have added via the portal. */
export async function getAllPrograms(): Promise<Program[]> {
  let sheetPrograms: Program[] = []
  try {
    const result = await callAppsScript<{ items: SheetProgram[] }>('listPrograms')
    sheetPrograms = result.items.map(sheetProgramToProgram)
  } catch {
    // Apps Script not configured yet, or temporarily unreachable — the site
    // still works with just the static seed set.
  }
  return [...staticPrograms, ...sheetPrograms]
}
