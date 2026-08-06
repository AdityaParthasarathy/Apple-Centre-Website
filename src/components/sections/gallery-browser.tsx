'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion } from 'motion/react'
import { cn, isExternalImage } from '@/lib/utils'
import { GalleryLightbox } from '@/components/ui/gallery-lightbox'
import type { GalleryImage } from '@/content/gallery'

const CATEGORIES: Array<{ id: GalleryImage['category'] | 'all'; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'workshop', label: 'Workshops' },
  { id: 'event', label: 'Events' },
  { id: 'facility', label: 'Facilities' },
  { id: 'community', label: 'Community' },
]

export function GalleryBrowser({ images }: { images: GalleryImage[] }) {
  const [activeCategory, setActiveCategory] = useState<GalleryImage['category'] | 'all'>('all')
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const filtered =
    activeCategory === 'all'
      ? images
      : images.filter((image) => image.category === activeCategory)

  return (
    <div>
      <div className="mb-10 flex flex-wrap gap-2">
        {CATEGORIES.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => setActiveCategory(category.id)}
            aria-pressed={activeCategory === category.id}
            className={cn(
              'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
              activeCategory === category.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            )}
          >
            {category.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((image, idx) => (
          <motion.div
            key={image.id}
            layout
            layoutId={`gallery-image-${image.id}`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
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
              <p className="line-clamp-2 text-xs text-white/80">{image.description}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="py-16 text-center text-sm text-muted-foreground">
          No photos in this category yet.
        </p>
      )}

      <GalleryLightbox images={filtered} activeIndex={activeIndex} onIndexChange={setActiveIndex} />
    </div>
  )
}
