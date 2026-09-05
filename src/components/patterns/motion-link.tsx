'use client'

import { motion } from 'motion/react'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { VariantProps } from 'class-variance-authority'
import type { ComponentProps, ReactNode } from 'react'

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

export const ANIMATED_BUTTON_SIZES = {
  sm: 'px-5 py-2 text-sm',
  default: 'px-6 py-2.5 text-sm',
  lg: 'px-7 py-3 text-base',
} as const

export interface AnimatedCtaLinkProps extends Omit<ComponentProps<typeof MotionLink>, 'children'> {
  size?: keyof typeof ANIMATED_BUTTON_SIZES
  /** Use on a dark section (cta-band, photo-wall) — see
   *  .animated-button--on-dark in globals.css. */
  onDark?: boolean
  children: ReactNode
}

/** The site's shared ripple-fill CTA — see .animated-button in globals.css
 *  for the visual, and the callers (hero, cta-band, photo-wall,
 *  projects-client, programs-grid, event detail, 404, the header's Apply
 *  Now pill) for where it's used. Wraps `children` in its own span rather
 *  than styling MotionLink directly, since the growing fill is a real
 *  sibling element that needs to sit behind the label regardless of what
 *  the label contains (plain text, an icon plus text, etc). */
export function AnimatedCtaLink({
  className,
  size = 'default',
  onDark = false,
  children,
  ...props
}: AnimatedCtaLinkProps) {
  return (
    <MotionLink
      className={cn('animated-button', onDark && 'animated-button--on-dark', ANIMATED_BUTTON_SIZES[size], className)}
      whileTap={{ scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      {...props}
    >
      <span className="animated-button-content">{children}</span>
      <span className="animated-button-fill" aria-hidden="true" />
    </MotionLink>
  )
}
