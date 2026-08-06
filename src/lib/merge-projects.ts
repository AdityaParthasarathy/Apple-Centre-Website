import { projects as staticProjects, type Project } from '@/content/projects'
import { callAppsScript } from '@/lib/apps-script'
import type { SheetProject } from '@/lib/sheet-types'

function splitList(value?: string): string[] | undefined {
  if (!value) return undefined
  const items = value.split(',').map((v) => v.trim()).filter(Boolean)
  return items.length > 0 ? items : undefined
}

function sheetProjectToProject(p: SheetProject): Project {
  return {
    id: p.id,
    title: p.title,
    description: p.description,
    team: splitList(p.team),
    technologies: splitList(p.technologies),
    image: p.image || undefined,
    iconKey: p.iconKey || undefined,
    featured: p.featured,
    link: p.link || undefined,
  }
}

/** Static seed projects plus anything faculty have added, featured ones first
 *  (stable sort — relative order otherwise unchanged). */
export async function getAllProjects(): Promise<Project[]> {
  let sheetProjects: Project[] = []
  try {
    const result = await callAppsScript<{ items: SheetProject[] }>('listProjects')
    sheetProjects = result.items.map(sheetProjectToProject)
  } catch {
    // Apps Script not configured yet, or temporarily unreachable — the site
    // still works with just the static seed set.
  }
  return [...staticProjects, ...sheetProjects].sort((a, b) => {
    if (!!a.featured === !!b.featured) return 0
    return a.featured ? -1 : 1
  })
}

/** For /projects/[slug] — checks the static set first, then falls back to the
 *  sheet for faculty-added projects, which don't have a statically generated page. */
export async function findProjectBySlug(slug: string): Promise<Project | null> {
  const staticMatch = staticProjects.find((p) => p.id === slug)
  if (staticMatch) return staticMatch

  try {
    const result = await callAppsScript<{ items: SheetProject[] }>('listProjects')
    const match = result.items.find((p) => p.id === slug)
    return match ? sheetProjectToProject(match) : null
  } catch {
    return null
  }
}
