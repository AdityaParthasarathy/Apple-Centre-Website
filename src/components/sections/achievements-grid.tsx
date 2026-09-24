'use client'

import { motion } from 'motion/react'
import { AchievementCard } from '@/components/sections/achievement-card'
import type { Achievement } from '@/content/achievements'

export function AchievementsGrid({ achievements }: { achievements: Achievement[] }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {achievements.map((achievement, idx) => (
        <motion.div
          key={achievement.id}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: (idx % 3) * 0.08 }}
          viewport={{ once: true }}
        >
          <AchievementCard achievement={achievement} as="h2" />
        </motion.div>
      ))}
    </div>
  )
}
