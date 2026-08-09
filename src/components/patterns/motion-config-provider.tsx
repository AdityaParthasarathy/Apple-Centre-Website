'use client'

import { MotionConfig } from 'motion/react'

/** Makes every motion.* animation in the app respect the OS-level "reduce
 *  motion" preference automatically, instead of requiring each animated
 *  component to check for it individually. Framer/Motion still runs
 *  transforms that convey state (e.g. a menu opening) but skips purely
 *  decorative movement for users who've asked for less of it. */
export function MotionConfigProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>
}
