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
        <div className="mb-16 max-w-2xl">
          <SectionHeading size="xl">Meet the team</SectionHeading>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
            viewport={{ once: true }}
            className="mt-4 text-lg text-muted-foreground"
          >
            The people coordinating and running the Apple Centre at RIT.
          </motion.p>
        </div>

        <AnimatedTestimonials testimonials={teamCards} />
      </Container>
    </section>
  )
}
