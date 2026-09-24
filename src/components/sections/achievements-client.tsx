'use client'

import { motion } from 'motion/react'
import { Container } from '@/components/ui/container'
import { SectionHeading } from '@/components/ui/section-heading'
import { AnimatedCtaLink } from '@/components/patterns/motion-link'
import { AchievementCard } from '@/components/sections/achievement-card'
import { AchievementStats } from '@/components/sections/achievement-stats'
import type { Achievement } from '@/content/achievements'

const PREVIEW_COUNT = 6

export function AchievementsSectionClient({ achievements }: { achievements: Achievement[] }) {
  const preview = achievements.slice(0, PREVIEW_COUNT)

  return (
    <section id="achievements" className="py-20 sm:py-32">
      <Container>
        <div className="mb-12 max-w-2xl">
          <SectionHeading size="xl">Hackathons &amp; achievements</SectionHeading>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
            viewport={{ once: true }}
            className="mt-4 text-lg text-muted-foreground"
          >
            Prizes and awards our students have brought home from hackathons, paper presentations, project expos and
            pitch competitions.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="mb-10"
        >
          <AchievementStats achievements={achievements} />
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {preview.map((achievement, idx) => (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: (idx % 3) * 0.1 }}
              viewport={{ once: true }}
            >
              <AchievementCard achievement={achievement} clampDescription />
            </motion.div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <AnimatedCtaLink href="/achievements" size="lg">
            View All Achievements
          </AnimatedCtaLink>
        </div>
      </Container>
    </section>
  )
}
