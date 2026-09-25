import type { Event } from '@/content/events'

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
