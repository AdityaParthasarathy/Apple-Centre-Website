export interface Facility {
  id: string
  title: string
  description: string
  image: string
}

// Formerly hardcoded here — migrated into the Facilities sheet (same ids)
// so the faculty portal can manage them. Kept empty rather than deleted so
// the Facility type stays defined in one place.
export const facilities: Facility[] = []
