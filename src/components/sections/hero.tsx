'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { AnnouncementBadge } from '@/components/patterns/announcement-badge'
import { FlipWords } from '@/components/patterns/flip-words'
import { TextEffect } from '@/components/patterns/text-effect'
import { Container } from '@/components/ui/container'
import { buttonVariants } from '@/components/ui/button'
import { MotionLink } from '@/components/patterns/motion-link'
import { IMacMarqueeField } from '@/components/patterns/imac-marquee-field'
import { motion, useScroll, useTransform } from 'motion/react'
import { ArrowRight } from 'lucide-react'

const HERO_FLIP_WORDS = ['innovation', 'technology', 'design', 'possibility']

export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null)

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  })

  // As the hero scrolls past, its content sinks and fades rather than just
  // sliding off screen — a quiet, deliberate exit instead of a hard cut.
  const contentOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0])
  const contentScale = useTransform(scrollYProgress, [0, 1], [1, 0.92])
  const contentY = useTransform(scrollYProgress, [0, 1], [0, -60])
  const indicatorOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0])

  return (
    <section
      ref={sectionRef}
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background py-20 sm:py-32"
    >
      {/* bg-background makes Hero opaque, so the sitewide wave field
          (mounted in (site)/layout.tsx) is fully covered here — Hero gets
          its own background instead: a dimmed marquee of colorway iMacs
          (imac-marquee-field.tsx). The scroll-triggered iMac windows
          (About, Labs & Facilities, Student Projects — each with a real
          id, so "Learn more" below still lands on the right one via plain
          hash scrolling) live in IMacScrollWindows right after Hero (see
          page.tsx) rather than here. */}
      <IMacMarqueeField />

      <motion.div style={{ opacity: contentOpacity, scale: contentScale, y: contentY }}>
        <Container size="lg" className="flex flex-col items-center gap-7 sm:gap-9">
          <AnnouncementBadge
            text="Applications open for Fall 2026"
            href="/programs"
            variant="accent"
          />

          <h1 className="text-center text-6xl font-black tracking-tight text-foreground sm:text-7xl lg:text-8xl">
            <TextEffect
              as="span"
              per="word"
              preset="fade-in-blur"
              delay={0.2}
              speedReveal={1.2}
            >
              Where creativity meets
            </TextEffect>{' '}
            <span className="text-accent">
              <FlipWords words={HERO_FLIP_WORDS} duration={3000} />
            </span>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="max-w-xl text-center text-lg text-muted-foreground sm:text-xl"
          >
            The Centre for Apple Technologies at RIT — where students learn to build for the Apple ecosystem, hands-on.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="mt-2 flex items-center gap-8"
          >
            <MotionLink
              href="/programs"
              className={buttonVariants({ size: 'lg', className: 'px-7' })}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            >
              Explore Programs
            </MotionLink>
            <Link
              href="#about"
              className="inline-flex items-center gap-1 text-base font-medium text-foreground transition-opacity hover:opacity-70"
            >
              Learn more
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </Container>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        style={{ opacity: indicatorOpacity }}
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="text-xs text-muted-foreground sm:text-sm">Scroll to explore</div>
      </motion.div>
    </section>
  )
}
