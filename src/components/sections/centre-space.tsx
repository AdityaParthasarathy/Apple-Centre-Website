'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion } from 'motion/react'
import { Container } from '@/components/ui/container'
import { SectionHeading } from '@/components/ui/section-heading'
import { GalleryLightbox } from '@/components/ui/gallery-lightbox'
import { centreSpaceImages } from '@/content/centre-space'

export function CentreSpaceSection() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

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
          <p className="mb-3 font-mono text-xs font-medium uppercase tracking-[0.15em] text-accent">
            The space
          </p>
          <SectionHeading size="xl">Inside the Centre</SectionHeading>
          <p className="mt-4 text-lg text-muted-foreground">
            A look at the actual space where it all happens.
          </p>
        </motion.div>

        <div className="grid auto-rows-[160px] grid-cols-2 gap-4 sm:auto-rows-[200px] sm:grid-cols-4 [grid-auto-flow:dense]">
          {centreSpaceImages.map((item, idx) => (
            <motion.div
              key={item.id}
              layoutId={`gallery-image-${item.id}`}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: idx * 0.06 }}
              viewport={{ once: true }}
              onClick={() => setActiveIndex(idx)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setActiveIndex(idx)}
              aria-label={`View ${item.title}`}
              className={`group relative cursor-pointer overflow-hidden rounded-xl ${
                item.featured ? 'col-span-2 row-span-2' : ''
              }`}
            >
              <Image
                src={item.image}
                alt={item.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                sizes="(max-width: 640px) 50vw, 25vw"
              />
              <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 via-black/0 to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <p className="text-sm font-semibold text-white">{item.title}</p>
                <p className="line-clamp-2 text-xs text-white/80">{item.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </Container>

      <GalleryLightbox images={centreSpaceImages} activeIndex={activeIndex} onIndexChange={setActiveIndex} />
    </section>
  )
}
