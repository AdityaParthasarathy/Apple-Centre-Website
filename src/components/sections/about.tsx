'use client'

import Image from 'next/image'
import { Container } from '@/components/ui/container'
import { SectionHeading } from '@/components/ui/section-heading'
import { motion } from 'motion/react'

export function AboutSection() {
  return (
    <section id="about" className="py-20 sm:py-32">
      <Container size="lg">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <motion.div
            initial={{ clipPath: 'inset(0 0 100% 0)' }}
            whileInView={{ clipPath: 'inset(0 0 0% 0)' }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            viewport={{ once: true }}
            className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl lg:order-2"
          >
            <motion.div
              initial={{ scale: 1.15 }}
              whileInView={{ scale: 1 }}
              transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
              viewport={{ once: true }}
              className="absolute inset-0"
            >
              <Image
                src="/centre-space/entrance-sign.jpg"
                alt="The Apple Centre at Rajalakshmi Institute of Technology"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            className="lg:order-1"
          >
            <SectionHeading size="xl" className="mb-6">
              About the Centre
            </SectionHeading>
            <div className="space-y-5 text-lg text-muted-foreground">
              <p>
                The Centre for Apple Technologies is RIT&apos;s dedicated space for mastering the Apple ecosystem — Swift, SwiftUI, ARKit, and the platforms behind real, shipped software.
              </p>
              <p>
                Small cohorts. Real hardware. Direct mentorship from faculty and industry practitioners.
              </p>
            </div>

            <div className="mt-10 grid gap-8 border-t border-border pt-8 sm:grid-cols-2">
              <div>
                <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-foreground">
                  Vision
                </h3>
                <p className="text-sm text-muted-foreground">
                  RIT&apos;s home for innovation and entrepreneurship in the Apple ecosystem.
                </p>
              </div>
              <div>
                <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-foreground">
                  Mission
                </h3>
                <p className="text-sm text-muted-foreground">
                  Preparing the next generation of Apple platform developers through hands-on education, real facilities, and mentorship.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </Container>
    </section>
  )
}
