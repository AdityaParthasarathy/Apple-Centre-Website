import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ExternalLink, Users } from 'lucide-react'
import { Container } from '@/components/ui/container'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { MotionAnchor } from '@/components/patterns/motion-link'
import { ProjectVisual } from '@/components/ui/project-visual'
import { cn, isExternalImage } from '@/lib/utils'
import { projects } from '@/content/projects'
import { findProjectBySlug } from '@/lib/merge-projects'

// Only the static seed projects get a page built at deploy time —
// faculty-added projects are looked up at request time instead
// (dynamicParams defaults to true, so an unlisted slug still renders on demand).
export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.id }))
}

// Covers faculty-added projects rendered on demand (not in the list above).
export const revalidate = 60

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const project = await findProjectBySlug(slug)
  if (!project) return {}
  return {
    title: `${project.title} | Centre for Apple Technologies`,
    description: project.description,
  }
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const project = await findProjectBySlug(slug)

  if (!project) {
    notFound()
  }

  const hasAside = (project.technologies?.length ?? 0) > 0 || (project.team?.length ?? 0) > 0

  return (
    <article>
      <section className="border-b border-border bg-card py-16 sm:py-20">
        <Container size="lg">
          <Link
            href="/projects"
            className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            All Projects
          </Link>

          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              {project.featured && (
                <Badge variant="accent" className="mb-3 text-xs">
                  Featured
                </Badge>
              )}
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                {project.title}
              </h1>
            </div>
            {project.link && (
              <MotionAnchor
                href={project.link}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({ variant: 'outline', className: 'gap-2' })}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              >
                View Project
                <ExternalLink className="h-4 w-4" />
              </MotionAnchor>
            )}
          </div>
        </Container>
      </section>

      <section className="py-16 sm:py-20">
        <Container size="lg">
          <div className={cn('grid gap-12', hasAside && 'lg:grid-cols-[1fr_320px]')}>
            <div className="space-y-8">
              <div className="relative h-72 overflow-hidden rounded-lg sm:h-96">
                {project.image ? (
                  <Image
                    src={project.image}
                    alt={project.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 66vw"
                    priority
                    unoptimized={isExternalImage(project.image)}
                  />
                ) : (
                  <ProjectVisual iconKey={project.iconKey} className="absolute inset-0" />
                )}
              </div>
              <p className="text-lg leading-relaxed text-muted-foreground">
                {project.description}
              </p>
            </div>

            {hasAside && (
              <aside className="space-y-8">
                {project.technologies && project.technologies.length > 0 && (
                  <div>
                    <h2 className="mb-3 text-sm font-semibold text-foreground">Technologies</h2>
                    <div className="flex flex-wrap gap-1.5">
                      {project.technologies.map((tech) => (
                        <Badge key={tech} variant="outline" className="text-xs">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {project.team && project.team.length > 0 && (
                  <div>
                    <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                      <Users className="h-4 w-4" />
                      Team
                    </h2>
                    <ul className="space-y-1.5 text-sm text-muted-foreground">
                      {project.team.map((member) => (
                        <li key={member}>{member}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </aside>
            )}
          </div>
        </Container>
      </section>
    </article>
  )
}
