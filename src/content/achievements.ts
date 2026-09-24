export interface Achievement {
  id: string
  /** The competition itself, e.g. "TECHSPRINT'26 (Google Developers)". */
  title: string
  /** What was won, in the organiser's own words — "1st Prize", "Sustainable Innovation Award". */
  placement: string
  /** Host institution / venue. */
  institution?: string
  description?: string
  image?: string
}

export type AchievementTier = 'gold' | 'silver' | 'bronze' | 'special'

/** Placement is free text (staff type whatever the organisers awarded), so
 *  the medal colour is derived from it rather than being a second field
 *  that could disagree with it. Anything that isn't a 1st/2nd/3rd finish
 *  ("Sustainable Innovation Award", "Best Design"…) is a special award. */
export function achievementTier(placement: string): AchievementTier {
  const p = placement.toLowerCase()
  if (/\b(1st|first|winner|champion)/.test(p)) return 'gold'
  if (/\b(2nd|second|runner)/.test(p)) return 'silver'
  if (/\b(3rd|third)/.test(p)) return 'bronze'
  return 'special'
}

const RIT = 'Rajalakshmi Institute of Technology'

// Seed set, best placements first. Anything staff add through the portal
// (see merge-achievements.ts) is shown ahead of these, newest first.
export const achievements: Achievement[] = [
  { id: 'techritz-25', title: "Techritz'25 International TechFest", placement: '1st Prize', institution: RIT },
  { id: 'techsprint-26', title: "TECHSPRINT'26 (Google Developers)", placement: '1st Prize', institution: 'Sri Sairam Engineering College' },
  { id: 'nextgen-ai-26', title: "NEXTGEN-AI'26 Hackathon", placement: '1st Prize', institution: "St. Peter's Engineering College, Hyderabad" },
  { id: 'zyphoria-research-pitch', title: 'Research Pitch — ZYPHORIA', placement: '1st Place', institution: RIT },
  { id: 'designation-agriculture', title: 'Designation — Agriculture', placement: '1st Place', institution: RIT },

  { id: 'technova-26', title: "TECHNOVA'26 Technical Hackathon", placement: '2nd Prize', institution: 'Coimbatore Institute of Technology' },
  { id: 'dscet-paper-presentation', title: 'Paper Presentation', placement: '2nd Prize', institution: 'DSCET' },
  { id: 'dscet-project-expo', title: 'Project Expo', placement: '2nd Prize', institution: 'DSCET' },
  { id: 'designation-fintech', title: 'Designation — Fintech', placement: '2nd Place', institution: RIT },

  { id: 'tech4health-25', title: "TECH4HEALTH'25 Hackathon", placement: '3rd Prize', institution: `${RIT} & Rajalakshmi Medical College` },
  { id: 'agritech-26', title: "AgriTech'26 Pongal Celebration", placement: '3rd Prize', institution: RIT },
  { id: 'startup-sprint-iitm', title: '8-Hour Startup Sprint', placement: '3rd Prize', institution: 'IIT Madras Research Park' },
  { id: 'innoclash-26', title: "INNOCLASH'26 SDG-Aligned 24-Hour International Hybrid Hackathon", placement: '3rd Prize', institution: RIT },
  { id: 'energize-hackathon', title: 'Energize Hackathon', placement: '3rd Prize', institution: RIT },

  { id: 'apple-x-fest-26', title: "APPLE-X-FEST'26 Hackathon", placement: 'Sustainable Innovation Award', institution: RIT },
]
