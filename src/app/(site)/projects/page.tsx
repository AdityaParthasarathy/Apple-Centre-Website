import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Container } from '@/components/ui/container'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ProjectVisual } from '@/components/ui/project-visual'
import { PageHero } from '@/components/patterns/page-hero'
import { getAllProjects } from '@/lib/merge-projects'
import { isExternalImage } from '@/lib/utils'

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
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <Card className="group h-full overflow-hidden">
                  <div className="relative h-48 overflow-hidden">
                    {project.image ? (
                      <Image
                        src={project.image}
                        alt={project.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        unoptimized={isExternalImage(project.image)}
                      />
                    ) : (
                      <ProjectVisual iconKey={project.iconKey} className="absolute inset-0" />
                    )}
                    {project.featured && (
                      <Badge variant="accent" className="absolute right-3 top-3 text-xs">
                        Featured
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-3 p-5">
                    <h2 className="text-lg font-semibold text-foreground">{project.title}</h2>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {project.description}
                    </p>
                    {project.technologies && project.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {project.technologies.map((tech) => (
                          <Badge key={tech} variant="outline" className="text-xs">
                            {tech}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </Container>
      </section>
    </>
  )
}
