'use client'

import { useState } from 'react'
import { Container } from '@/components/ui/container'
import { SectionHeading } from '@/components/ui/section-heading'
import { buttonVariants } from '@/components/ui/button'
import { GalleryLightbox } from '@/components/ui/gallery-lightbox'
import { HorizontalScrollCarousel } from '@/components/patterns/horizontal-scroll-carousel'
import { MotionLink } from '@/components/patterns/motion-link'
import type { GalleryImage } from '@/content/gallery'
import { motion } from 'motion/react'

const PREVIEW_COUNT = 6

export function GallerySectionClient({ images }: { images: GalleryImage[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const previewImages = images.slice(0, PREVIEW_COUNT)

  return (
    <section className="py-20 sm:py-32">
      <Container>
        <div className="mb-4 max-w-2xl">
          <SectionHeading size="xl">Moments from the Centre</SectionHeading>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
            viewport={{ once: true }}
            className="mt-4 text-lg text-muted-foreground"
          >
            Workshops, events, and everyday life at the Centre — keep scrolling to browse.
          </motion.p>
        </div>
      </Container>

      <HorizontalScrollCarousel cards={previewImages} onSelect={setActiveIndex} />

      <Container>
        <div className="mt-4 text-center">
          <MotionLink
            href="/gallery"
            className={buttonVariants({ size: 'lg', variant: 'outline' })}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            View Full Gallery
          </MotionLink>
        </div>

        <GalleryLightbox images={previewImages} activeIndex={activeIndex} onIndexChange={setActiveIndex} />
      </Container>
    </section>
  )
}
