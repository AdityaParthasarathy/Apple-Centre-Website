import type { Metadata } from 'next'
import { Container } from '@/components/ui/container'
import { GalleryBrowser } from '@/components/sections/gallery-browser'
import { PageHero } from '@/components/patterns/page-hero'
import { getAllGalleryImages } from '@/lib/merge-gallery'

export const metadata: Metadata = {
  title: 'Gallery | Centre for Apple Technologies',
  description: 'Moments from workshops, events, and life at the Centre.',
}

// Faculty-uploaded photos live in the sheet, not build-time content, so this
// route needs to periodically re-check for new ones.
export const revalidate = 60

export default async function GalleryPage() {
  const images = await getAllGalleryImages()
  return (
    <>
      <PageHero
        title="Gallery"
        subtitle="Moments from workshops, events, and life at the Centre."
        image="/centre-space/lab-angle-2.jpg"
      />

      <section className="py-16 sm:py-24">
        <Container>
          <GalleryBrowser images={images} />
        </Container>
      </section>
    </>
  )
}
