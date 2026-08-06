export interface Faculty {
  id: string
  name: string
  role: string
  bio: string
  /** Real photo — falls back to an initials placeholder until one is available. */
  image?: string
  expertise?: string[]
  contact?: string
}

// Formerly hardcoded here — migrated into the TeamMembers sheet (same ids)
// so the faculty portal can manage them. Kept empty rather than deleted so
// the Faculty type stays defined in one place.
export const faculty: Faculty[] = []
