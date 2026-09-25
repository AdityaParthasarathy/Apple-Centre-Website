import { getAllPrograms } from '@/lib/merge-programs'
import { getAllProjects } from '@/lib/merge-projects'
import { getAllEvents } from '@/lib/merge-events'
import { getAllTeamMembers } from '@/lib/merge-team'
import { getAllFacilities } from '@/lib/merge-facilities'
import { getAllGalleryImages } from '@/lib/merge-gallery'
import { getAllAchievements } from '@/lib/merge-achievements'
import { callAppsScript } from '@/lib/apps-script'
import type { SheetAnnouncement } from '@/lib/sheet-types'
import type { Program } from '@/content/programs'
import type { SearchItem } from '@/lib/search'

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
  const [programs, projects, events, faculty, facilities, gallery, achievements, announcements] = await Promise.all([
    preloaded.programs ?? getAllPrograms(),
    getAllProjects(),
    getAllEvents(),
    getAllTeamMembers(),
    getAllFacilities(),
    getAllGalleryImages(),
    getAllAchievements(),
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
    ...achievements.map((a) => ({
      id: `achievement-${a.id}`,
      title: `${a.title} — ${a.placement}`,
      description: [a.institution, a.description].filter(Boolean).join('. '),
      category: 'Achievement' as const,
      href: '/achievements',
      keywords: ['hackathon', 'prize', 'award'],
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
