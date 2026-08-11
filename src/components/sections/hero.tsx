'use client'

import { useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { AnnouncementBadge } from '@/components/patterns/announcement-badge'
import { FlipWords } from '@/components/patterns/flip-words'
import { TextEffect } from '@/components/patterns/text-effect'
import { Container } from '@/components/ui/container'
import { buttonVariants } from '@/components/ui/button'
import { MotionLink } from '@/components/patterns/motion-link'
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
  // The backdrop photo drifts slightly slower than the page scrolls — a
  // shallow parallax that reads as depth without ever separating far enough
  // to reveal empty space beneath it.
  const imageY = useTransform(scrollYProgress, [0, 1], ['0%', '18%'])

  return (
    <section
      ref={sectionRef}
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden py-20 sm:py-32"
    >
      {/* Real photography, not decoration — the Centre's own lab, so the
          hero opens on the actual place this site is about instead of an
          empty white screen. A dark scrim (not a blur or a color blob)
          keeps the white headline legible without hiding the room. */}
      <motion.div className="absolute inset-0 -z-10" style={{ y: imageY }}>
        <Image
          src="/centre-space/lab-wide.jpg"
          alt=""
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(11,11,15,0.88)_0%,rgba(11,11,15,0.82)_45%,rgba(11,11,15,0.94)_100%)]" />
      </motion.div>

      <motion.div style={{ opacity: contentOpacity, scale: contentScale, y: contentY }}>
        <Container size="lg" className="flex flex-col items-center gap-7 sm:gap-9">
          <AnnouncementBadge
            text="Applications open for Fall 2026"
            href="/programs"
            variant="accent"
          />

          <h1 className="text-center text-6xl font-black tracking-tight text-white sm:text-7xl lg:text-8xl">
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
            className="max-w-xl text-center text-lg text-white/70 sm:text-xl"
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
              className="inline-flex items-center gap-1 text-base font-medium text-white transition-opacity hover:opacity-70"
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
        <div className="text-xs text-white/60 sm:text-sm">Scroll to explore</div>
      </motion.div>
    </section>
  )
}
