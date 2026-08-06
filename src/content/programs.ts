export interface Program {
  id: string
  title: string
  description: string
  duration: string
  level: 'beginner' | 'intermediate' | 'advanced'
  topics: string[]
  image: string
}

// Formerly hardcoded here — migrated into the Programs sheet (same ids) so
// the faculty portal can manage them. Kept empty rather than deleted so the
// Program type stays defined in one place.
export const programs: Program[] = []
