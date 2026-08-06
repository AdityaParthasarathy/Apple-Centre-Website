'use client'

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

  return (
    <nav className="-mb-px mt-4 flex items-center gap-1 overflow-x-auto border-b border-border">
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
  )
}
