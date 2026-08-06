import { programs } from '@/content/programs'
import { projects } from '@/content/projects'
import { events } from '@/content/events'
import { faculty } from '@/content/faculty'

export type SearchCategory = 'Program' | 'Project' | 'Event' | 'Faculty'

export interface SearchItem {
  id: string
  title: string
  description: string
  category: SearchCategory
  href: string
  keywords: string[]
}

export function getSearchIndex(): SearchItem[] {
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
