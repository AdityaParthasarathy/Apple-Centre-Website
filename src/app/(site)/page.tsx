import { HeroSection } from '@/components/sections/hero'
import { IMacScrollWindows } from '@/components/patterns/imac-scroll-windows'
import { AboutSection } from '@/components/sections/about'
import { LabsFacilitiesSection } from '@/components/sections/labs-facilities'
import { CentreSpaceSection } from '@/components/sections/centre-space'
import { ProjectsSection } from '@/components/sections/projects'
import { EventsSection } from '@/components/sections/events'
import { GallerySection } from '@/components/sections/gallery'
import { FacultySection } from '@/components/sections/faculty'
import { AnnouncementsSection } from '@/components/sections/announcements'
import { PhotoWallSection } from '@/components/sections/photo-wall'
import { CtaBand } from '@/components/sections/cta-band'
import { OpeningReveal } from '@/components/patterns/opening-reveal'

// Announcements are faculty-managed (Google Sheet, not build-time content),
// so this page needs to periodically re-check for new ones rather than only
// ever showing what existed at build time.
export const revalidate = 60

// ?embed=1&section=<id> is how IMacScrollWindows' live iframes (see that
// component) show "the real site, running" inside each colored iMac's
// screen. Critically, an embed request renders ONLY the one requested
// section — not the normal page minus a couple of pieces — so each
// iframe's document is exactly as tall as that section. That's what lets
// scrolling inside an open iMac hand control back to the outer page
// (ordinary browser scroll-chaining) right at the end of its OWN content,
// instead of continuing on into Events/Gallery/whatever came after in a
// normal visit — content that already gets its own moment later, or has no
// iMac at all. It also means an embedded page never renders IMacScrollWindows
// itself, so nothing tries to nest another three copies of the site inside
// itself, forever.
//
// AboutSection / LabsFacilitiesSection / ProjectsSection otherwise only
// render inside that scoped embed: each is meant to exist in exactly one
// place — inside its own iMac window — not there and then again in the
// normal page flow. Known tradeoff: those iframes are decorative
// (aria-hidden) while their iMac is closed, and only become interactive
// once fully open (see imac-scroll-windows.tsx), so that content has no
// accessible path for a keyboard/screen-reader user who can't trigger
// scroll-linked motion. Flagged, not yet resolved.
export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { embed, section } = await searchParams
  const isEmbed = embed === '1'
  const embedSection = typeof section === 'string' ? section : undefined

  if (isEmbed) {
    return (
      <>
        {embedSection === 'about' && <AboutSection />}
        {embedSection === 'facilities' && <LabsFacilitiesSection />}
        {embedSection === 'projects' && <ProjectsSection />}
      </>
    )
  }

  return (
    <>
      <OpeningReveal />
      <AnnouncementsSection />
      <HeroSection />
      <IMacScrollWindows />
      <CentreSpaceSection />
      <EventsSection />
      <GallerySection />
      <FacultySection />
      <PhotoWallSection />
      <CtaBand />
    </>
  )
}
