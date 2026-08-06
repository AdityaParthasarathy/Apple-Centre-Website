export interface Project {
  id: string
  title: string
  description: string
  team?: string[]
  technologies?: string[]
  image?: string
  /** Fallback visual (gradient + icon) shown when no real screenshot is available yet. */
  iconKey?: 'bot' | 'sprout' | 'siren' | 'trophy'
  featured?: boolean
  link?: string
}

// Formerly hardcoded here — migrated into the Projects sheet (same ids:
// hey-buddy, vayal-ai, resqnet, apple-x-fest) so the faculty portal can
// manage them. Kept empty rather than deleted so the Project type stays
// defined in one place.
export const projects: Project[] = []
