'use client'

import { Container } from '@/components/ui/container'
import { SectionHeading } from '@/components/ui/section-heading'
import { Card } from '@/components/ui/card'
import { Keyboard } from '@/components/ui/keyboard'
import { isExternalImage } from '@/lib/utils'
import type { Facility } from '@/content/facilities'
import { motion } from 'motion/react'
import Image from 'next/image'

export function LabsFacilitiesSectionClient({ facilities }: { facilities: Facility[] }) {
  return (
    <section id="facilities" className="py-20 sm:py-32">
      <Container>
        <div className="mb-16 max-w-2xl">
          <SectionHeading size="xl">Labs &amp; facilities</SectionHeading>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
            viewport={{ once: true }}
            className="mt-4 text-lg text-muted-foreground"
          >
            State-of-the-art spaces designed for building, testing, and prototyping.
          </motion.p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {facilities.map((facility, idx) => (
            <motion.div
              key={facility.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="overflow-hidden group">
                <div className="relative h-56 overflow-hidden">
                  <Image
                    src={facility.image}
                    alt={facility.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, 50vw"
                    unoptimized={isExternalImage(facility.image)}
                  />
                </div>
                <div className="p-6 space-y-2">
                  <h3 className="text-xl font-semibold">{facility.title}</h3>
                  <p className="text-sm text-muted-foreground">{facility.description}</p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="mt-16 max-w-2xl">
          <h3 className="text-xl font-semibold text-foreground">Every workstation, at your fingertips</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            The same Magic Keyboard that sits at every iMac workstation in the lab — try it.
          </p>
        </div>
        <Keyboard showPreview className="mt-8" />
      </Container>
    </section>
  )
}
