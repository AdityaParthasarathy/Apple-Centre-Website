import type { Metadata } from 'next'
import { Container } from '@/components/ui/container'
import { PageHero } from '@/components/patterns/page-hero'
import { AchievementsGrid } from '@/components/sections/achievements-grid'
import { AchievementStats } from '@/components/sections/achievement-stats'
import { getAllAchievements } from '@/lib/merge-achievements'

export const metadata: Metadata = {
  title: 'Hackathons & Achievements | Centre for Apple Technologies',
  description:
    'Prizes and awards our students have won at hackathons, paper presentations, project expos and pitch competitions.',
}

// Staff-added achievements live in the sheet, not build-time content, so
// this route needs to periodically re-check for new ones.
export const revalidate = 60

export default async function AchievementsPage() {
  const achievements = await getAllAchievements()
  return (
    <>
      <PageHero
        title="Hackathons & Achievements"
        subtitle="Prizes and awards our students have won at hackathons, paper presentations, project expos and pitch competitions."
        image="/centre-space/lab-wide.jpg"
      />

      <section className="py-16 sm:py-24">
        <Container>
          <div className="mb-10">
            <AchievementStats achievements={achievements} />
          </div>
          <AchievementsGrid achievements={achievements} />
        </Container>
      </section>
    </>
  )
}
