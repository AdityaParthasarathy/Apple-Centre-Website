import type { Metadata } from 'next'
import { Container } from '@/components/ui/container'
import { PageHero } from '@/components/patterns/page-hero'
import { ProgramsGrid } from '@/components/sections/programs-grid'
import { getAllPrograms } from '@/lib/merge-programs'

export const metadata: Metadata = {
  title: 'Programs | Centre for Apple Technologies',
  description:
    'Comprehensive, hands-on programs designed to take you from fundamentals to shipping real apps on the Apple ecosystem.',
}

// Faculty-added programs live in the sheet, not build-time content, so this
// route needs to periodically re-check for new ones.
export const revalidate = 60

export default async function ProgramsPage() {
  const programs = await getAllPrograms()
  return (
    <>
      <PageHero
        title="Programs"
        subtitle="Comprehensive, hands-on programs designed to take you from fundamentals to shipping real apps on the Apple ecosystem."
        image="/centre-space/magic-keyboard.jpg"
      />

      <section className="py-16 sm:py-24">
        <Container>
          <ProgramsGrid programs={programs} />
        </Container>
      </section>
    </>
  )
}
