import { getAllPrograms } from '@/lib/merge-programs'
import { getAllProjects } from '@/lib/merge-projects'
import { getAllEvents } from '@/lib/merge-events'
import { getAllTeamMembers } from '@/lib/merge-team'
import { getAllFacilities } from '@/lib/merge-facilities'
import { getAllGalleryImages } from '@/lib/merge-gallery'
import { callAppsScript } from '@/lib/apps-script'
import type { SheetAnnouncement } from '@/lib/sheet-types'
import type { Program } from '@/content/programs'

export type SearchCategory =
  | 'Program'
  | 'Project'
  | 'Event'
  | 'Faculty'
  | 'Facility'
  | 'Gallery'
  | 'Announcement'

export interface SearchItem {
  id: string
  title: string
  description: string
  category: SearchCategory
  href: string
  keywords: string[]
}

async function loadPublishedAnnouncements(): Promise<SheetAnnouncement[]> {
  try {
    const result = await callAppsScript<{ items: SheetAnnouncement[] }>('listAnnouncements')
    return result.items.filter((a) => a.published)
  } catch {
    // Apps Script not configured yet, or temporarily unreachable — search
    // just skips announcements rather than breaking.
    return []
  }
}

/** Pulls from the same live-merged sources (static seed + faculty portal
 *  sheet data) the pages themselves render from, so anything a staff member
 *  adds is findable the moment it's published — not just the build-time
 *  seed content. Server-only: hits the Apps Script sheet, so this can't run
 *  from a client component.
 *
 *  Apps Script calls are POST requests, which Next's automatic fetch
 *  memoization doesn't dedupe (only GET is deduped) — so a caller that
 *  already fetched programs elsewhere in the same render (the footer does)
 *  should pass them in here rather than triggering a second live round-trip
 *  to the same sheet. */
export async function buildSearchIndex(preloaded: { programs?: Program[] } = {}): Promise<SearchItem[]> {
  const [programs, projects, events, faculty, facilities, gallery, announcements] = await Promise.all([
    preloaded.programs ?? getAllPrograms(),
    getAllProjects(),
    getAllEvents(),
    getAllTeamMembers(),
    getAllFacilities(),
    getAllGalleryImages(),
    loadPublishedAnnouncements(),
  ])

  return [
    ...programs.map((p) => ({
      id: `program-${p.id}`,
      title: p.title,
      description: p.description,
      category: 'Program' as const,
      href: '/programs',
      keywords: p.topics,
    })),
    ...projects.map((p) => ({
      id: `project-${p.id}`,
      title: p.title,
      description: p.description,
      category: 'Project' as const,
      href: `/projects/${p.id}`,
      keywords: p.technologies ?? [],
    })),
    ...events.map((e) => ({
      id: `event-${e.id}`,
      title: e.title,
      description: e.description,
      category: 'Event' as const,
      href: `/events/${e.id}`,
      keywords: [e.category, e.location],
    })),
    ...faculty.map((f) => ({
      id: `faculty-${f.id}`,
      title: f.name,
      description: f.role,
      category: 'Faculty' as const,
      href: '/faculty',
      keywords: f.expertise ?? [],
    })),
    ...facilities.map((f) => ({
      id: `facility-${f.id}`,
      title: f.title,
      description: f.description,
      category: 'Facility' as const,
      href: '/#facilities',
      keywords: [],
    })),
    ...gallery.map((g) => ({
      id: `gallery-${g.id}`,
      title: g.title,
      description: g.description,
      category: 'Gallery' as const,
      href: '/gallery',
      keywords: [g.category],
    })),
    ...announcements.map((a) => ({
      id: `announcement-${a.id}`,
      title: a.title,
      description: a.body,
      category: 'Announcement' as const,
      href: '/#announcements',
      keywords: [],
    })),
  ]
}

export function searchItems(items: SearchItem[], query: string): SearchItem[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  return items
    .filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.keywords.some((k) => k.toLowerCase().includes(q))
    )
    .slice(0, 8)
}
