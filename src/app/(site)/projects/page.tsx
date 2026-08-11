import type { Metadata } from 'next'
import { Container } from '@/components/ui/container'
import { PageHero } from '@/components/patterns/page-hero'
import { ProjectsGrid } from '@/components/sections/projects-grid'
import { getAllProjects } from '@/lib/merge-projects'

export const metadata: Metadata = {
  title: 'Student Projects | Centre for Apple Technologies',
  description: 'Real apps built by our students, from concept to the App Store.',
}

// Faculty-added projects live in the sheet, not build-time content, so this
// route needs to periodically re-check for new ones.
export const revalidate = 60

export default async function ProjectsPage() {
  const projects = await getAllProjects()
  return (
    <>
      <PageHero
        title="Student Projects"
        subtitle="Real apps built by our students, from concept to the App Store."
        image="/centre-space/imac-front.jpg"
      />

      <section className="py-16 sm:py-24">
        <Container>
          <ProjectsGrid projects={projects} />
        </Container>
      </section>
    </>
  )
}
