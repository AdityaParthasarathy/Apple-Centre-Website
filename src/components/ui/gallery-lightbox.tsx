'use client'

import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useRef } from 'react'
import { useLenis } from 'lenis/react'
import Image from 'next/image'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { isExternalImage } from '@/lib/utils'

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'

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
  const dialogRef = useRef<HTMLDivElement>(null)
  const previouslyFocused = useRef<HTMLElement | null>(null)

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

    // Standard modal focus handling: remember what had focus, move focus
    // into the dialog, trap Tab inside it while open, and give focus back
    // to the trigger on close — without this, a keyboard user's focus is
    // left behind on whatever gallery thumbnail they activated, invisible
    // underneath the now-open overlay.
    previouslyFocused.current = document.activeElement as HTMLElement | null
    const focusables = () =>
      Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) ?? [])
    focusables()[0]?.focus()

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close()
        return
      }
      if (e.key === 'ArrowRight') goNext()
      else if (e.key === 'ArrowLeft') goPrev()

      if (e.key !== 'Tab') return
      const items = focusables()
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
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
      previouslyFocused.current?.focus()
    }
  }, [image, close, goNext, goPrev, lenis])

  return (
    <AnimatePresence>
      {image && (
        <motion.div
          key="gallery-lightbox-backdrop"
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label={image.title}
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
