'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, useMotionValueEvent, useScroll } from 'motion/react'
import { Container } from '@/components/ui/container'
import { ExpandingSearch } from '@/components/patterns/expanding-search'
import { ApplyNowButton } from '@/components/nav/apply-now-button'
import type { SearchItem } from '@/lib/search-index'

// Primary navigation now lives in the floating dock (bottom of screen);
// this header only carries brand identity and the search/apply actions.
// searchIndex is fetched server-side (see (site)/layout.tsx) since it
// merges in live Apps Script sheet data — a client component can't hit
// that itself.
export function SiteHeader({ searchIndex }: { searchIndex: SearchItem[] }) {
  const { scrollY } = useScroll()
  const [hidden, setHidden] = useState(false)

  useMotionValueEvent(scrollY, 'change', (latest) => {
    const previous = scrollY.getPrevious() ?? 0
    // Stay put near the very top so the header never flickers while
    // settling into place; only react to deliberate scroll movement.
    if (latest < 80) {
      setHidden(false)
      return
    }
    setHidden(latest > previous)
  })

  return (
    <motion.header
      animate={{ y: hidden ? '-100%' : '0%' }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="sticky top-3 z-40 px-3 sm:top-4 sm:px-4"
    >
      {/* Same Liquid Glass recipe as the floating dock (bottom of screen)
          and Card — a floating rounded panel rather than an edge-to-edge
          bar, so the two nav surfaces read as one material language. */}
      <div className="mx-auto max-w-5xl rounded-2xl border border-white/40 bg-background/80 shadow-lg backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <Container className="py-3 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 font-semibold text-lg hover:opacity-80 transition">
            <Image src="/logo-icon.png" alt="" width={28} height={28} className="rounded-md" priority />
            <span>Apple Centre</span>
          </Link>

          <div className="flex items-center gap-4">
            <div className="hidden sm:block">
              <ExpandingSearch placeholder="Search programs, projects, events..." items={searchIndex} />
            </div>
            <ApplyNowButton />
          </div>
        </Container>
      </div>
    </motion.header>
  )
}
