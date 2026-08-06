import { getAllEvents } from '@/lib/merge-events'
import { EventsSectionClient } from '@/components/sections/events-client'

// Server Component so the Apps Script call (server-only secret) stays off
// the client — merges the static seed events with anything faculty have
// added, then hands the result to the client component for the motion bits.
export async function EventsSection() {
  const events = await getAllEvents()
  return <EventsSectionClient events={events} />
}
