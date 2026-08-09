'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/staff', label: 'Dashboard' },
  { href: '/staff/events', label: 'Events' },
  { href: '/staff/announcements', label: 'Announcements' },
  { href: '/staff/gallery', label: 'Gallery' },
  { href: '/staff/applications', label: 'Applications' },
  { href: '/staff/projects', label: 'Projects' },
  { href: '/staff/team', label: 'Team' },
  { href: '/staff/programs', label: 'Programs' },
  { href: '/staff/facilities', label: 'Facilities' },
]

export function PortalNav() {
  const pathname = usePathname()
  const scrollRef = useRef<HTMLElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    // With 9 tabs this strip overflows on narrower screens with no visual
    // hint that it scrolls — these edge fades only show up when there's
    // actually more to scroll in that direction, so they disappear once
    // the strip fits or you've scrolled all the way to an edge.
    const updateFades = () => {
      setCanScrollLeft(el.scrollLeft > 1)
      setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1)
    }

    updateFades()
    el.addEventListener('scroll', updateFades, { passive: true })
    const resizeObserver = new ResizeObserver(updateFades)
    resizeObserver.observe(el)

    return () => {
      el.removeEventListener('scroll', updateFades)
      resizeObserver.disconnect()
    }
  }, [])

  return (
    <div className="relative mt-4">
      <nav ref={scrollRef} className="-mb-px flex items-center gap-1 overflow-x-auto border-b border-border">
        {NAV_ITEMS.map((item) => {
          const isActive = item.href === '/staff' ? pathname === '/staff' : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'shrink-0 border-b-2 px-3 pb-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'border-accent text-accent'
                  : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
              )}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute inset-y-0 -bottom-px left-0 w-8 bg-gradient-to-r from-background to-transparent transition-opacity duration-200',
          canScrollLeft ? 'opacity-100' : 'opacity-0'
        )}
      />
      <div
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute inset-y-0 -bottom-px right-0 w-8 bg-gradient-to-l from-background to-transparent transition-opacity duration-200',
          canScrollRight ? 'opacity-100' : 'opacity-0'
        )}
      />
    </div>
  )
}
