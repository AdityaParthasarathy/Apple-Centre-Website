'use client'

import { useRef } from 'react'
import Image from 'next/image'
import { motion, useScroll, useTransform } from 'motion/react'
import { isExternalImage } from '@/lib/utils'

export interface HorizontalScrollCard {
  id: string
  image: string
  title: string
  description: string
}

// A tall (300vh) pinned-scroll section — scroll down through it and the
// track slides horizontally instead of the page scrolling vertically past
// it, same "tall wrapper + sticky stage + useScroll-driven transform"
// vocabulary as the iMac scroll windows (imac-scroll-windows.tsx), just
// translating x instead of animating a shell. Entirely self-contained: it
// doesn't touch that component or its scroll runway.
export function HorizontalScrollCarousel({
  cards,
  onSelect,
}: {
  cards: HorizontalScrollCard[]
  onSelect?: (index: number) => void
}) {
  const targetRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: targetRef })
  const x = useTransform(scrollYProgress, [0, 1], ['1%', '-95%'])

  return (
    <section ref={targetRef} className="relative h-[300vh]">
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        <motion.div style={{ x }} className="flex gap-4 px-4 sm:px-8">
          {cards.map((card, idx) => (
            <button
              key={card.id}
              type="button"
              onClick={() => onSelect?.(idx)}
              aria-label={`View ${card.title}`}
              className="group relative h-72 w-72 shrink-0 overflow-hidden rounded-2xl bg-muted sm:h-[420px] sm:w-[420px]"
            >
              <Image
                src={card.image}
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
