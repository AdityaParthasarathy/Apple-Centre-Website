'use client'

import { motion } from 'motion/react'
import { useReducedMotion } from '@/hooks/use-reduced-motion'

interface Blob {
  className: string
  drift: { x: number[]; y: number[] }
  duration: number
}

const BLOBS: Blob[] = [
  {
    className: 'left-[-10%] top-[-10%] h-[30rem] w-[30rem] bg-accent/30',
    drift: { x: [0, 40, -20, 0], y: [0, 30, -30, 0] },
    duration: 22,
  },
  {
    className: 'right-[-15%] top-[10%] h-[34rem] w-[34rem] bg-accent/20',
    drift: { x: [0, -30, 20, 0], y: [0, -40, 20, 0] },
    duration: 27,
  },
  {
    className: 'left-[10%] bottom-[-15%] h-[26rem] w-[26rem] bg-primary/14',
    drift: { x: [0, 25, -25, 0], y: [0, -20, 25, 0] },
    duration: 32,
  },
  {
    className: 'right-[5%] bottom-[-20%] h-[28rem] w-[28rem] bg-accent/18',
    drift: { x: [0, -20, 25, 0], y: [0, 25, -20, 0] },
    duration: 25,
  },
]

/**
 * Fixed to the viewport (not the page) so it stays present behind every
 * section as you scroll, rather than being scrolled past like normal page
 * content — a persistent ambient backdrop, not a one-off hero decoration.
 */
export function AuroraBackground() {
  const prefersReducedMotion = useReducedMotion()

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      {BLOBS.map((blob, i) => (
        <motion.div
          key={i}
          className={`absolute rounded-full blur-3xl ${blob.className}`}
          animate={prefersReducedMotion ? undefined : { x: blob.drift.x, y: blob.drift.y }}
          transition={{ duration: blob.duration, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
        />
      ))}
    </div>
  )
}
