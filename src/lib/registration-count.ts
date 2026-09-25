import { callAppsScript } from '@/lib/apps-script'

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
