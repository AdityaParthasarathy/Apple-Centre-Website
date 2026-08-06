'use client'

import { Container } from '@/components/ui/container'
import { SectionHeading } from '@/components/ui/section-heading'
import { AnimatedTestimonials, type AnimatedTestimonial } from '@/components/ui/animated-testimonials'
import type { Faculty } from '@/content/faculty'
import { motion } from 'motion/react'

export function FacultySectionClient({ team }: { team: Faculty[] }) {
  const teamCards: AnimatedTestimonial[] = team.map((f) => ({
    name: f.name,
    designation: f.role,
    quote: f.bio,
    src: f.image,
  }))

  return (
    <section id="faculty" className="py-20 sm:py-32">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-16 max-w-2xl"
        >
          <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-accent">
            Team
          </p>
          <SectionHeading size="xl">Meet the team</SectionHeading>
          <p className="mt-4 text-lg text-muted-foreground">
            The people coordinating and running the Apple Centre at RIT.
          </p>
        </motion.div>

        <AnimatedTestimonials testimonials={teamCards} />
      </Container>
    </section>
  )
}
