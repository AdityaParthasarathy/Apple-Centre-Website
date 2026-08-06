import { events as staticEvents, type Event } from '@/content/events'
import { callAppsScript } from '@/lib/apps-script'
import type { SheetEvent } from '@/lib/sheet-types'

function sheetEventToEvent(e: SheetEvent): Event {
  return {
    id: e.id,
    title: e.title,
    description: e.description,
    date: new Date(e.date),
    time: e.time,
    location: e.location,
    category: e.category,
    image: e.image,
    capacity: e.capacity,
    published: e.published,
    pinned: e.pinned,
  }
}

function sortPinnedThenDate(a: Event, b: Event) {
  if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1
  return a.date.getTime() - b.date.getTime()
}

/** Static seed events (always published) plus published events faculty have
 *  added via the portal, pinned ones first, then chronological. */
export async function getAllEvents(): Promise<Event[]> {
  let sheetEvents: Event[] = []
  try {
    const result = await callAppsScript<{ items: SheetEvent[] }>('listEvents')
    sheetEvents = result.items.filter((e) => e.published !== false).map(sheetEventToEvent)
  } catch {
    // Apps Script not configured yet, or temporarily unreachable — the site
    // still works with just the static seed set.
  }
  return [...staticEvents, ...sheetEvents].sort(sortPinnedThenDate)
}

/** For /events/[slug] — checks the static set first, then falls back to the
 *  sheet for faculty-added events (which don't have a statically generated
 *  page). Unpublished sheet events aren't reachable this way either — a
 *  draft shouldn't be visible just because someone guesses its URL. */
export async function findEventBySlug(slug: string): Promise<Event | null> {
  const staticMatch = staticEvents.find((e) => e.id === slug)
  if (staticMatch) return staticMatch

  try {
    const result = await callAppsScript<{ items: SheetEvent[] }>('listEvents')
    const match = result.items.find((e) => e.id === slug && e.published !== false)
    return match ? sheetEventToEvent(match) : null
  } catch {
    return null
  }
}
