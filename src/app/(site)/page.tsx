import { HeroSection } from '@/components/sections/hero'
import { AboutSection } from '@/components/sections/about'
import { LabsFacilitiesSection } from '@/components/sections/labs-facilities'
import { CentreSpaceSection } from '@/components/sections/centre-space'
import { ProjectsSection } from '@/components/sections/projects'
import { EventsSection } from '@/components/sections/events'
import { GallerySection } from '@/components/sections/gallery'
import { FacultySection } from '@/components/sections/faculty'
import { AnnouncementsSection } from '@/components/sections/announcements'
import { OpeningReveal } from '@/components/patterns/opening-reveal'

// Announcements are faculty-managed (Google Sheet, not build-time content),
// so this page needs to periodically re-check for new ones rather than only
// ever showing what existed at build time.
export const revalidate = 60

// The real page is a Server Component so it's fully present in the initial
// HTML (SEO, first paint, progressive rendering). OpeningReveal is a
// self-contained fixed-position overlay that sits on top and dismisses
// itself — it never gates whether the content underneath exists. Header,
// dock, and footer live in the root layout since every route needs them.
export default function HomePage() {
  return (
    <>
      <OpeningReveal />
      <AnnouncementsSection />
      <HeroSection />
      <AboutSection />
      <LabsFacilitiesSection />
      <CentreSpaceSection />
      <ProjectsSection />
      <EventsSection />
      <GallerySection />
      <FacultySection />
    </>
  )
}
