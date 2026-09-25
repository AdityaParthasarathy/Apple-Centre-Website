'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { motion, useTransform } from 'motion/react'
import { useElementScrollProgress } from '@/hooks/use-scroll-progress'
import { isExternalImage, cardImage } from '@/lib/utils'

export interface HorizontalScrollCard {
  id: string
  image: string
  title: string
  description: string
}

// A tall (300vh) pinned-scroll section — scroll down through it and the
// track slides horizontally instead of the page scrolling vertically past
// it, same "tall wrapper + sticky stage + scroll-driven transform"
// vocabulary as the iMac scroll windows (imac-scroll-windows.tsx), just
// translating x instead of animating a shell. Entirely self-contained: it
// doesn't touch that component or its scroll runway.
//
// The slide is tied to the stretch where the stage is actually pinned — from
// the moment the section's top reaches the top of the screen until its bottom
// reaches the bottom — not to the section's whole trip through the viewport.
// Measured over the whole trip, roughly the first quarter of the slide
// happened while the section was still scrolling up into view, so the first
// photo had already gone by when it arrived. It also slides exactly as far as
// the photos are wide, so the last one ends fully in view, and holds still for
// a moment at each end.
export function HorizontalScrollCarousel({
  cards,
  onSelect,
}: {
  cards: HorizontalScrollCard[]
  onSelect?: (index: number) => void
}) {
  const targetRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const scrollYProgress = useElementScrollProgress(targetRef, ['start start', 'end end'])

  // How far the track has to travel for its far end to reach the right edge.
  const [distance, setDistance] = useState(0)
  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    const measure = () => setDistance(Math.max(0, track.scrollWidth - window.innerWidth))
    measure()
    window.addEventListener('resize', measure)
    const observer = new ResizeObserver(measure)
    observer.observe(track)
    return () => {
      window.removeEventListener('resize', measure)
      observer.disconnect()
    }
  }, [cards.length])

  const x = useTransform(scrollYProgress, [0.06, 0.94], [0, -distance])

  return (
    <section ref={targetRef} className="relative h-[300vh]">
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        <motion.div ref={trackRef} style={{ x }} className="flex gap-4 px-4 sm:px-8">
          {cards.map((card, idx) => (
            <button
              key={card.id}
              type="button"
              onClick={() => onSelect?.(idx)}
              aria-label={`View ${card.title}`}
              className="group relative h-72 w-72 shrink-0 overflow-hidden rounded-2xl bg-muted sm:h-[420px] sm:w-[420px]"
            >
              <Image
                src={cardImage(card.image)}
                alt={card.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                sizes="(max-width: 640px) 288px, 420px"
                unoptimized={isExternalImage(card.image)}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 text-left">
                <p className="text-lg font-semibold text-white">{card.title}</p>
                <p className="mt-1 line-clamp-2 text-sm text-white/80">{card.description}</p>
              </div>
            </button>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
