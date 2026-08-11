'use client'

import Link from 'next/link'
import { Container } from '@/components/ui/container'
import { SectionHeading } from '@/components/ui/section-heading'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { ProjectVisual } from '@/components/ui/project-visual'
import { MotionLink } from '@/components/patterns/motion-link'
import { isExternalImage } from '@/lib/utils'
import type { Project } from '@/content/projects'
import { motion } from 'motion/react'
import Image from 'next/image'

export function ProjectsSectionClient({ projects }: { projects: Project[] }) {
  return (
    <section id="projects" className="py-20 sm:py-32">
      <Container>
        <div className="mb-16 max-w-2xl">
          <SectionHeading size="xl">Student projects</SectionHeading>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
            viewport={{ once: true }}
            className="mt-4 text-lg text-muted-foreground"
          >
            Real apps built by our students, from concept to the App Store.
          </motion.p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {projects.map((project, idx) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              viewport={{ once: true }}
            >
              <Link href={`/projects/${project.id}`}>
                <Card className="h-full overflow-hidden group">
                  <div className="relative h-40 overflow-hidden">
                    {project.image ? (
                      <Image
                        src={project.image}
                        alt={project.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, 25vw"
                        unoptimized={isExternalImage(project.image)}
                      />
                    ) : (
                      <ProjectVisual iconKey={project.iconKey} className="absolute inset-0" />
                    )}
                    {project.featured && (
                      <Badge variant="accent" className="absolute top-3 right-3 text-xs">
                        Featured
                      </Badge>
                    )}
                  </div>
                  <div className="p-5 space-y-3">
                    <h3 className="text-lg font-semibold">{project.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {project.description}
                    </p>
                    {project.technologies && project.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {project.technologies.slice(0, 2).map((tech) => (
                          <Badge key={tech} variant="outline" className="text-xs">
                            {tech}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {project.team && project.team.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {project.team.join(', ')}
                      </p>
                    )}
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="text-center mt-12">
          <MotionLink
            href="/projects"
            className={buttonVariants({ size: 'lg' })}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            View All Projects
          </MotionLink>
        </div>
      </Container>
    </section>
  )
}
