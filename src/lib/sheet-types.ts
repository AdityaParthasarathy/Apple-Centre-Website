// Shapes returned by the Apps Script Web App for faculty-managed content.
// Dates travel as ISO strings over JSON (no Date object survives the wire),
// unlike the static seed content in src/content/*.ts which uses real Dates.

export interface SheetEvent {
  id: string
  title: string
  description: string
  date: string
  time: string
  location: string
  category: 'workshop' | 'talk' | 'hackathon' | 'networking'
  image: string
  capacity?: number
  published?: boolean
  pinned?: boolean
  createdBy?: string
  createdAt?: string
}

export interface SheetAnnouncement {
  id: string
  title: string
  body: string
  published: boolean
  pinned: boolean
  createdBy?: string
  createdAt: string
}

export interface SheetGalleryImage {
  id: string
  title: string
  description: string
  image: string
  category: 'workshop' | 'event' | 'facility' | 'community'
  date: string
  createdBy?: string
  createdAt?: string
}

export type ApplicationStatus = 'Pending' | 'Reviewed' | 'Accepted' | 'Rejected'

// Up to 3 projects, flattened into project1.../project2.../project3... sheet
// columns rather than one JSON blob column — keeps the raw spreadsheet
// readable by a faculty member who opens it directly, consistent with
// every other content type in this sheet.
export interface SheetApplication {
  id: string
  name: string
  email: string
  phone: string
  year: string
  skills: string
  project1Description?: string
  project1SourceLink?: string
  project1LiveLink?: string
  project1Screenshot?: string
  project2Description?: string
  project2SourceLink?: string
  project2LiveLink?: string
  project2Screenshot?: string
  project3Description?: string
  project3SourceLink?: string
  project3LiveLink?: string
  project3Screenshot?: string
  status: ApplicationStatus
  submittedAt?: string
}

export interface ApplicationProject {
  description: string
  sourceLink: string
  liveLink: string
  screenshot: string
}

/** Un-flattens the project1/2/3 sheet columns back into an array, skipping
 *  any slot that has no description (i.e. wasn't actually filled in). */
export function applicationProjects(app: SheetApplication): ApplicationProject[] {
  const slots = [
    { description: app.project1Description, sourceLink: app.project1SourceLink, liveLink: app.project1LiveLink, screenshot: app.project1Screenshot },
    { description: app.project2Description, sourceLink: app.project2SourceLink, liveLink: app.project2LiveLink, screenshot: app.project2Screenshot },
    { description: app.project3Description, sourceLink: app.project3SourceLink, liveLink: app.project3LiveLink, screenshot: app.project3Screenshot },
  ]
  return slots
    .filter((slot) => slot.description)
    .map((slot) => ({
      description: slot.description ?? '',
      sourceLink: slot.sourceLink ?? '',
      liveLink: slot.liveLink ?? '',
      screenshot: slot.screenshot ?? '',
    }))
}

export interface SheetProject {
  id: string
  title: string
  description: string
  team?: string
  technologies?: string
  image?: string
  iconKey?: 'bot' | 'sprout' | 'siren' | 'trophy'
  featured?: boolean
  link?: string
  createdBy?: string
  createdAt?: string
}

// "TeamMembers" — deliberately not "Faculty", which is the sheet tab that
// stores admin portal LOGIN credentials. This is the public "Meet the Team"
// roster, an unrelated piece of display content.
export interface SheetTeamMember {
  id: string
  name: string
  role: string
  bio: string
  image?: string
  expertise?: string
  contact?: string
  createdBy?: string
  createdAt?: string
}

export interface SheetProgram {
  id: string
  title: string
  description: string
  duration: string
  level: 'beginner' | 'intermediate' | 'advanced'
  topics?: string
  image: string
  createdBy?: string
  createdAt?: string
}

export interface SheetFacility {
  id: string
  title: string
  description: string
  image: string
  createdBy?: string
  createdAt?: string
}
