'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ProjectVisual } from '@/components/ui/project-visual'
import { isExternalImage } from '@/lib/utils'
import type { Project } from '@/content/projects'
import { motion } from 'motion/react'

export function ProjectsGrid({ projects }: { projects: Project[] }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project, idx) => (
        <motion.div
          key={project.id}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: idx * 0.06 }}
          viewport={{ once: true }}
        >
          <Link href={`/projects/${project.id}`}>
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
                <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
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
        </motion.div>
      ))}
    </div>
  )
}
