'use client'

import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { useLenis } from 'lenis/react'
import { cn } from '@/lib/utils'

export interface DockItem {
  id: string
  label: string
  href: string
  icon: React.ReactNode
}

interface FloatingDockProps {
  items: DockItem[]
  className?: string
}

// Magnification only engages for devices that actually support hover with a
// precise pointer (mouse/trackpad) — on touch, the media query never
// matches, so every icon just renders at its resting size with no
// dependency on a hover state that touch can't produce.
function useHoverCapable() {
  // Always starts false, matching what SSR renders — updated after mount in
  // the effect below. Reading window.matchMedia in a useState initializer
  // instead would let the server and the client's first render disagree,
  // which is exactly the hydration-mismatch bug OpeningReveal had earlier.
  const [canHover, setCanHover] = useState(false)

  useEffect(() => {
    const query = window.matchMedia('(hover: hover) and (pointer: fine)')
    // Syncing with a browser API unavailable during SSR — can only happen
    // after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCanHover(query.matches)
    const handler = (e: MediaQueryListEvent) => setCanHover(e.matches)
    query.addEventListener('change', handler)
    return () => query.removeEventListener('change', handler)
  }, [])

  return canHover
}

export function FloatingDock({ items, className }: FloatingDockProps) {
  const mouseX = useMotionValue(Infinity)
  const canHover = useHoverCapable()

  // A fixed-position dock always sits at the same screen coordinates
  // regardless of scroll position, so it ends up overlapping whatever
  // content happens to be there — confirmed happening on several pages
  // (About/Mission, Inside the Centre photos, the Events calendar). Same
  // hide-on-scroll-down / reveal-on-scroll-up treatment SiteHeader already
  // uses solves it: the dock ducks away exactly when someone scrolls into
  // new content, and comes back the moment they scroll back up.
  const { scrollY } = useScroll()
  const [hidden, setHidden] = useState(false)

  useMotionValueEvent(scrollY, 'change', (latest) => {
    const previous = scrollY.getPrevious() ?? 0
    if (latest < 80) {
      setHidden(false)
      return
    }
    setHidden(latest > previous)
  })

  return (
    <motion.nav
      aria-label="Primary"
      onMouseMove={(e) => mouseX.set(e.clientX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      // x is pinned at -50% (for horizontal centering) in both states so it
      // composes with the animated y into a single transform — a Tailwind
      // -translate-x-1/2 class would otherwise fight motion's inline style.
      initial={{ opacity: 0, y: 20, x: '-50%' }}
      animate={{ opacity: 1, y: hidden ? 140 : 0, x: '-50%' }}
      // y gets its own fast transition so the scroll-driven hide/show reacts
      // immediately — everything else keeps the slower, delayed entrance
      // that plays once on mount.
      transition={{
        y: { duration: 0.25, ease: [0.16, 1, 0.3, 1] },
        default: { duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] },
      }}
      className={cn(
        'fixed bottom-6 left-1/2 z-40 flex items-end gap-2 rounded-2xl border border-border bg-background/80 px-3 py-2.5 shadow-lg backdrop-blur-xl supports-[backdrop-filter]:bg-background/60',
        className
      )}
    >
      {items.map((item) => (
        <DockIcon key={item.id} item={item} mouseX={mouseX} canHover={canHover} />
      ))}
    </motion.nav>
  )
}

function DockIcon({
  item,
  mouseX,
  canHover,
}: {
  item: DockItem
  mouseX: MotionValue<number>
  canHover: boolean
}) {
  const ref = useRef<HTMLAnchorElement>(null)
  const [isFocused, setIsFocused] = useState(false)
  const lenis = useLenis()

  const distance = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect()
    if (!bounds) return Infinity
    return val - (bounds.left + bounds.width / 2)
  })

  // Icons within 120px of the pointer scale up to 44px, tapering back to
  // the 32px resting size beyond that — classic dock magnification. When
  // hover isn't available (touch), the output range collapses to a flat
  // 44px instead — that resting size is also the tap target, and 32px
  // falls short of the 44x44px minimum touch target guideline.
  const targetSize = useTransform(
    distance,
    [-120, 0, 120],
    canHover ? [32, 44, 32] : [44, 44, 44]
  )
  const size = useSpring(targetSize, {
    mass: 0.1,
    stiffness: 200,
    damping: 14,
  })

  const showLabel = isFocused

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const [path, hash] = item.href.split('#')
    // Plain page link (no hash) — let the browser navigate normally.
    if (!hash) return
    // Anchor pointing at a different page (e.g. "/#about" while on
    // "/projects") — let the browser do a full navigation there; it'll
    // land on that page and jump to the hash natively, respecting the
    // scroll-margin-top set globally for the sticky header.
    const isCurrentPage = path === '' || path === window.location.pathname
    if (!isCurrentPage) return
    const target = document.querySelector<HTMLElement>(`#${hash}`)
    if (!target) return
    // Same-page anchor: go through Lenis so the jump uses the same smooth
    // scroll as everything else — calling the native scrollIntoView
    // directly would fight Lenis's own scroll animation instead of
    // cooperating with it. -80 mirrors the scroll-margin-top elsewhere,
    // clearing the sticky header.
    e.preventDefault()
    if (lenis) {
      lenis.scrollTo(target, { offset: -80 })
    } else {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    history.pushState(null, '', `#${hash}`)
  }

  return (
    <a
      ref={ref}
      href={item.href}
      aria-label={item.label}
      onClick={handleClick}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      className="group relative flex flex-col items-center"
    >
      {/* Tooltip: shown on hover (CSS-only, so it also works without JS
          re-render) and on keyboard focus (via isFocused state), never
          dependent on the magnify animation to be visible. */}
      <span
        role="tooltip"
        className={cn(
          'pointer-events-none absolute -top-8 whitespace-nowrap rounded-md border border-border bg-popover px-2 py-1 text-xs font-medium text-popover-foreground opacity-0 shadow-sm transition-opacity duration-150 group-hover:opacity-100',
          showLabel && 'opacity-100'
        )}
      >
        {item.label}
      </span>

      <motion.span
        style={{ width: size, height: size }}
        className="relative flex items-center justify-center rounded-full bg-muted text-foreground outline-none ring-accent transition-colors group-hover:bg-accent group-hover:text-accent-foreground group-focus-visible:ring-2"
      >
        {item.icon}
      </motion.span>
    </a>
  )
}
