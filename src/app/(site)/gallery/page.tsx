import type { Metadata } from 'next'
import { Container } from '@/components/ui/container'
import { SectionHeading } from '@/components/ui/section-heading'
import { GalleryBrowser } from '@/components/sections/gallery-browser'
import { FadeIn } from '@/components/patterns/fade-in'
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
      <section className="border-b border-border bg-card py-20 sm:py-28">
        <Container>
          <div className="max-w-2xl">
            <SectionHeading as="h1" size="xl">
              Gallery
            </SectionHeading>
            <FadeIn delay={0.15}>
              <p className="mt-4 text-lg text-muted-foreground">
                Moments from workshops, events, and life at the Centre.
              </p>
            </FadeIn>
          </div>
        </Container>
      </section>

      <section className="py-16 sm:py-24">
        <Container>
          <GalleryBrowser images={images} />
        </Container>
      </section>
    </>
  )
}
