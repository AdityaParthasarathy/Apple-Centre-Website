'use client'

import { motion } from 'motion/react'
import { Container } from '@/components/ui/container'
import { buttonVariants } from '@/components/ui/button'
import { MotionLink } from '@/components/patterns/motion-link'
import { cn } from '@/lib/utils'

// The page's other close: everything above this is white-on-white content
// sections, so the site never lands a single confident color moment before
// the footer. This band and the footer beneath it share the same dark
// ground, bookending the page against the hero's own dark opening.
export function CtaBand() {
  return (
    <section className="bg-foreground py-20 sm:py-28">
      <Container size="md" className="flex flex-col items-center gap-6 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          className="text-4xl font-black tracking-tight text-background sm:text-5xl"
        >
          Ready to build something real?
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          className="max-w-md text-lg text-background/70"
        >
          Applications for the next cohort are open now — no experience with Apple platforms required, just curiosity.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
        >
          <MotionLink
            href="/apply"
            className={cn(buttonVariants({ size: 'lg' }), 'mt-2 bg-accent px-8 text-accent-foreground hover:bg-accent/90')}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            Apply Now
          </MotionLink>
        </motion.div>
      </Container>
    </section>
  )
}
