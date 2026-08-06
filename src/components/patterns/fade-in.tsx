'use client'

import { motion } from 'motion/react'
import type { ReactNode } from 'react'

interface FadeInProps {
  children: ReactNode
  delay?: number
  className?: string
}

/** Simple on-mount fade + rise, for content that's visible above the fold. */
export function FadeIn({ children, delay = 0, className }: FadeInProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
