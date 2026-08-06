'use client'

import { useState } from 'react'
import { Container } from '@/components/ui/container'
import { SectionHeading } from '@/components/ui/section-heading'
import { buttonVariants } from '@/components/ui/button'
import { GalleryLightbox } from '@/components/ui/gallery-lightbox'
import { MotionLink } from '@/components/patterns/motion-link'
import { isExternalImage } from '@/lib/utils'
import type { GalleryImage } from '@/content/gallery'
import { motion } from 'motion/react'
import Image from 'next/image'

const PREVIEW_COUNT = 6

export function GallerySectionClient({ images }: { images: GalleryImage[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const previewImages = images.slice(0, PREVIEW_COUNT)

  return (
    <section className="py-20 sm:py-32">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-16 max-w-2xl"
        >
          <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-accent">
            Gallery
          </p>
          <SectionHeading size="xl">Moments from the Centre</SectionHeading>
          <p className="mt-4 text-lg text-muted-foreground">
            Workshops, events, and everyday life at the Centre.
          </p>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {previewImages.map((image, idx) => (
            <motion.div
              key={image.id}
              layoutId={`gallery-image-${image.id}`}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: idx * 0.06 }}
              viewport={{ once: true }}
              onClick={() => setActiveIndex(idx)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setActiveIndex(idx)}
              aria-label={`View ${image.title}`}
              className="group relative h-64 cursor-pointer overflow-hidden rounded-lg"
            >
              <Image
                src={image.image}
                alt={image.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                unoptimized={isExternalImage(image.image)}
              />
              <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 via-black/0 to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <p className="text-sm font-semibold text-white">{image.title}</p>
                <p className="text-xs text-white/80 line-clamp-2">{image.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="text-center mt-12">
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
