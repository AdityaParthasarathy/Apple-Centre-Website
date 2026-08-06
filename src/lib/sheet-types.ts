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

export interface SheetApplication {
  id: string
  name: string
  email: string
  phone: string
  year: string
  skills: string
  status: ApplicationStatus
  submittedAt?: string
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
