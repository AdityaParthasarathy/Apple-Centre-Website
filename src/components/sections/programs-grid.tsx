'use client'

import Image from 'next/image'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { MotionLink } from '@/components/patterns/motion-link'
import { isExternalImage } from '@/lib/utils'
import type { Program } from '@/content/programs'
import { motion } from 'motion/react'

// Level is a real signal a prospective student scans for first — coding it
// by badge weight (outline -> secondary -> accent) means it reads at a
// glance instead of requiring the label text to be parsed.
const LEVEL_BADGE: Record<Program['level'], 'outline' | 'secondary' | 'accent'> = {
  beginner: 'outline',
  intermediate: 'secondary',
  advanced: 'accent',
}

export function ProgramsGrid({ programs }: { programs: Program[] }) {
  return (
    <div className="grid gap-8 sm:grid-cols-2">
      {programs.map((program, idx) => (
        <motion.div
          key={program.id}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: idx * 0.08 }}
          viewport={{ once: true }}
        >
          <Card className="flex h-full flex-col overflow-hidden">
            <div className="relative h-48">
              <Image
                src={program.image}
                alt={program.title}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, 50vw"
                unoptimized={isExternalImage(program.image)}
              />
            </div>
            <div className="flex flex-1 flex-col gap-4 p-6">
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-xl font-semibold text-foreground">{program.title}</h2>
                <Badge variant={LEVEL_BADGE[program.level]} className="shrink-0 capitalize">
                  {program.level}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{program.description}</p>
              <div className="flex flex-wrap gap-1.5">
                {program.topics.map((topic) => (
                  <Badge key={topic} variant="outline" className="text-xs">
                    {topic}
                  </Badge>
                ))}
              </div>
              <div className="mt-auto flex items-center justify-between border-t border-border pt-4">
                <span className="text-sm text-muted-foreground">{program.duration}</span>
                <MotionLink
                  href="/apply"
                  className={buttonVariants({ size: 'sm' })}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                >
                  Apply Now
                </MotionLink>
              </div>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}
