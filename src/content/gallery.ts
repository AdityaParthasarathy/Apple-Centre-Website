export interface GalleryImage {
  id: string
  title: string
  description: string
  image: string
  category: 'workshop' | 'event' | 'facility' | 'community'
  date: Date
}

export const galleryImages: GalleryImage[] = [
  {
    id: 'project-review',
    title: 'Project Review',
    description: 'Faculty and staff reviewing a student project at the Apple Centre.',
    image: '/gallery/project-review.jpg',
    category: 'workshop',
    date: new Date('2026-08-01'),
  },
  {
    id: 'guest-interaction',
    title: 'Guest Interaction',
    description: 'Students walking a visiting guest through their work at the Centre.',
    image: '/gallery/guest-interaction.jpg',
    category: 'community',
    date: new Date('2026-08-01'),
  },
  {
    id: 'campus-tour',
    title: 'Campus Tour',
    description: 'Faculty and visiting guests touring the Apple Centre facilities.',
    image: '/gallery/campus-tour.jpg',
    category: 'community',
    date: new Date('2026-08-01'),
  },
  {
    id: 'team-celebration',
    title: 'Team Celebration',
    description: 'The Apple Centre team and students celebrating together.',
    image: '/gallery/team-celebration.jpg',
    category: 'community',
    date: new Date('2026-08-01'),
  },
  {
    id: 'classroom-session',
    title: 'Classroom Session',
    description: 'A training session in progress at the Apple Centre.',
    image: '/gallery/classroom-session.jpg',
    category: 'workshop',
    date: new Date('2026-08-01'),
  },
  {
    id: 'school-visit-group',
    title: 'School Visit',
    description: 'Visiting school students getting a walkthrough of the Apple Centre lab.',
    image: '/gallery/school-visit-group.jpg',
    category: 'event',
    date: new Date('2026-08-01'),
  },
  {
    id: 'school-visit-briefing',
    title: 'School Visit Briefing',
    description: 'Centre staff briefing visiting school students on the Apple ecosystem.',
    image: '/gallery/school-visit-briefing.jpg',
    category: 'event',
    date: new Date('2026-08-01'),
  },
  {
    id: 'lab-overview',
    title: 'The iMac Lab',
    description: 'Students working at the Apple Centre\'s iMac workstations.',
    image: '/gallery/lab-overview.jpg',
    category: 'facility',
    date: new Date('2026-08-01'),
  },
  {
    id: 'research-showcase',
    title: 'Research Showcase',
    description: 'Students presenting research and projects to visiting guests.',
    image: '/gallery/research-showcase.jpg',
    category: 'event',
    date: new Date('2026-08-01'),
  },
]
