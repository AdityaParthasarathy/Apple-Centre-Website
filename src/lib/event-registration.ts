import type { Event } from '@/content/events'
import { callAppsScript } from '@/lib/apps-script'

export const REGISTRATION_YEARS = [
  '1st Year',
  '2nd Year',
  '3rd Year',
  '4th Year',
  'Postgraduate',
  'Faculty / Staff',
  'Other',
]

/** Event dates are stored as a bare calendar day (YYYY-MM-DD, parsed as UTC
 *  midnight), so this reads it back with no timezone shift. */
export function eventDay(event: Pick<Event, 'date'>): string {
  return event.date.toISOString().slice(0, 10)
}

/** Registration stays open through the event's own day, and closes after. The
 *  Centre is in Chennai, so "today" is today in India — not the server's
 *  (usually UTC) idea of it, which would close an evening event early. */
export function isRegistrationOpen(event: Pick<Event, 'date'>, now: Date = new Date()): boolean {
  const today = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
  return eventDay(event) >= today
}

/** How many people have registered for this event, or null if that couldn't
 *  be read — callers then show the event without a spots-left figure rather
 *  than claim a number they don't have. */
export async function getRegisteredCount(eventId: string): Promise<number | null> {
  try {
    const result = await callAppsScript<{ items: { eventId: string; count: number }[] }>('listRegistrationCounts')
    return result.items.find((item) => String(item.eventId) === eventId)?.count ?? 0
  } catch {
    return null
  }
}
