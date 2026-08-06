'use client'

import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect } from 'react'
import { useLenis } from 'lenis/react'
import Image from 'next/image'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { isExternalImage } from '@/lib/utils'

export interface LightboxImage {
  id: string
  image: string
  title: string
  description: string
}

interface GalleryLightboxProps {
  images: LightboxImage[]
  activeIndex: number | null
  onIndexChange: (index: number | null) => void
}

const navButtonClass =
  'flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70'

export function GalleryLightbox({ images, activeIndex, onIndexChange }: GalleryLightboxProps) {
  const image = activeIndex !== null ? (images[activeIndex] ?? null) : null
  const lenis = useLenis()

  const goNext = useCallback(() => {
    if (activeIndex === null) return
    onIndexChange((activeIndex + 1) % images.length)
  }, [activeIndex, images.length, onIndexChange])

  const goPrev = useCallback(() => {
    if (activeIndex === null) return
    onIndexChange((activeIndex - 1 + images.length) % images.length)
  }, [activeIndex, images.length, onIndexChange])

  const close = useCallback(() => onIndexChange(null), [onIndexChange])

  useEffect(() => {
    if (!image) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      else if (e.key === 'ArrowRight') goNext()
      else if (e.key === 'ArrowLeft') goPrev()
    }
    document.addEventListener('keydown', handleKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    // Locking overflow alone doesn't tell Lenis its scroll loop should
    // pause too — without this it keeps easing toward whatever target it
    // had queued, which can jump the page underneath once the lightbox
    // closes.
    lenis?.stop()
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
      lenis?.start()
    }
  }, [image, close, goNext, goPrev, lenis])

  return (
    <AnimatePresence>
      {image && (
        <motion.div
          key="gallery-lightbox-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 sm:p-8"
          onClick={close}
        >
          {images.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                goPrev()
              }}
              aria-label="Previous image"
              className={`absolute left-3 top-1/2 -translate-y-1/2 sm:left-6 ${navButtonClass}`}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}

          <motion.div
            layoutId={`gallery-image-${image.id}`}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="relative w-full max-w-3xl overflow-hidden rounded-xl bg-card shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-[4/3] w-full">
              <Image
                src={image.image}
                alt={image.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 768px"
                unoptimized={isExternalImage(image.image)}
                priority
              />
            </div>
            <div className="p-5">
              <p className="font-semibold text-foreground">{image.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{image.description}</p>
            </div>
            <button
              type="button"
              onClick={close}
              aria-label="Close"
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>

          {images.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                goNext()
              }}
              aria-label="Next image"
              className={`absolute right-3 top-1/2 -translate-y-1/2 sm:right-6 ${navButtonClass}`}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
