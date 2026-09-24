'use client'

import { motion, useSpring } from 'motion/react'
import { usePageScrollProgress } from '@/hooks/use-scroll-progress'

/** Thin progress bar tracking scroll position through the whole page. */
export function ScrollProgress() {
  const scrollYProgress = usePageScrollProgress()
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 300,
    damping: 40,
    restDelta: 0.001,
  })

  return (
    <motion.div
      style={{ scaleX }}
      className="fixed inset-x-0 top-0 z-50 h-0.5 origin-left bg-accent"
    />
  )
}
