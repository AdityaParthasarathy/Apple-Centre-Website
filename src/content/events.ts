export interface Event {
  id: string
  title: string
  description: string
  date: Date
  time: string
  location: string
  category: 'workshop' | 'talk' | 'hackathon' | 'networking'
  image: string
  capacity?: number
  /** Faculty-managed events only — static seed events are always published, unpinned. */
  published?: boolean
  pinned?: boolean
}

// Formerly hardcoded here — migrated into the Events sheet (same id,
// "code-with-swift") so the faculty portal can manage it. Kept empty rather
// than deleted so the Event type stays defined in one place.
export const events: Event[] = []
