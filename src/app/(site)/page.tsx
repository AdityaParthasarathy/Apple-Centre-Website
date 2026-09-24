import { HeroSection } from '@/components/sections/hero'
import { IMacScrollWindows } from '@/components/patterns/imac-scroll-windows'
import { CentreSpaceSection } from '@/components/sections/centre-space'
import { AchievementsSection } from '@/components/sections/achievements'
import { EventsSection } from '@/components/sections/events'
import { GallerySection } from '@/components/sections/gallery'
import { FacultySection } from '@/components/sections/faculty'
import { AnnouncementsSection } from '@/components/sections/announcements'
import { PhotoWallSection } from '@/components/sections/photo-wall'
import { CtaBand } from '@/components/sections/cta-band'
import { OpeningReveal } from '@/components/patterns/opening-reveal'

// Announcements are faculty-managed (Google Sheet, not build-time content),
// so this page is rebuilt in the background every minute rather than only
// ever showing what existed at build time.
//
// It has to stay free of searchParams/cookies/headers: reading any of them
// opts a route out of pre-rendering, and this page used to (an ?embed=1
// switch for the iMac windows' iframes) — so the home page was rendered on
// every single visit, waiting on Google, while every other page was a static
// file. The iframes now have their own route (see app/embed).
export const revalidate = 60

export default function HomePage() {
  return (
    <>
      <OpeningReveal />
      <AnnouncementsSection />
      <HeroSection />
      <IMacScrollWindows />
      <CentreSpaceSection />
      <AchievementsSection />
      <EventsSection />
      <GallerySection />
      <FacultySection />
      <PhotoWallSection />
      <CtaBand />
    </>
  )
}
