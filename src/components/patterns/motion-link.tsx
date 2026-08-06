'use client'

import { motion } from 'motion/react'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { VariantProps } from 'class-variance-authority'

/** next/link with a restrained hover/tap scale — for high-visibility CTAs. */
export const MotionLink = motion.create(Link)

/** Plain anchor variant, for external links that can't go through next/link. */
export const MotionAnchor = motion.create('a')

/** Native <button> styled like the site's Button component, with the same
 *  hover/tap scale as MotionLink — used for portal (faculty admin) actions.
 *  A plain native button rather than wrapping the Base UI Button primitive,
 *  since these are simple click actions (not popup triggers) and the
 *  primitive doesn't forward a ref motion could reliably attach to. */
export function MotionButton({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<typeof motion.button> & VariantProps<typeof buttonVariants>) {
  return (
    <motion.button
      className={cn(buttonVariants({ variant, size, className }))}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      {...props}
    />
  )
}
