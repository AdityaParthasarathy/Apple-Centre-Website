// The client-safe half of search: what a result looks like and how a query
// filters them. Building the list lives in search-index.ts, which reads the
// sheet on the server and so must never be imported from a client component.

export type SearchCategory =
  | 'Program'
  | 'Project'
  | 'Event'
  | 'Faculty'
  | 'Facility'
  | 'Gallery'
  | 'Achievement'
  | 'Announcement'

export interface SearchItem {
  id: string
  title: string
  description: string
  category: SearchCategory
  href: string
  keywords: string[]
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
