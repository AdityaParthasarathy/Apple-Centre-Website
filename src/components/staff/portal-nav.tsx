'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Building2,
  CalendarDays,
  ClipboardList,
  GraduationCap,
  FolderKanban,
  Images,
  Inbox,
  LayoutDashboard,
  Megaphone,
  Trophy,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePendingApplications } from '@/hooks/use-pending-applications'

const NAV_ITEMS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: '/staff', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/staff/events', label: 'Events', icon: CalendarDays },
  { href: '/staff/registrations', label: 'Registrations', icon: ClipboardList },
  { href: '/staff/announcements', label: 'Announcements', icon: Megaphone },
  { href: '/staff/gallery', label: 'Gallery', icon: Images },
  { href: '/staff/applications', label: 'Applications', icon: Inbox },
  { href: '/staff/projects', label: 'Projects', icon: FolderKanban },
  { href: '/staff/achievements', label: 'Achievements', icon: Trophy },
  { href: '/staff/team', label: 'Team', icon: Users },
  { href: '/staff/programs', label: 'Programs', icon: GraduationCap },
  { href: '/staff/facilities', label: 'Facilities', icon: Building2 },
]

/** The portal's vertical navigation, shown in the side panel on wide screens
 *  and inside the slide-in drawer on small ones. `onNavigate` lets the drawer
 *  close itself the moment a link is chosen. */
export function PortalNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const pending = usePendingApplications()

  return (
    <nav aria-label="Faculty portal" className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const isActive = item.href === '/staff' ? pathname === '/staff' : pathname.startsWith(item.href)
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors',
              isActive
                ? 'bg-accent/10 text-accent'
                : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
            )}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            {item.label}
            {item.href === '/staff/applications' && pending ? (
              <span
                role="status"
                aria-label={`${pending} ${pending === 1 ? 'application' : 'applications'} waiting for review`}
                className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 text-[11px] font-bold leading-none text-white"
              >
                {pending > 99 ? '99+' : pending}
              </span>
            ) : null}
          </Link>
        )
      })}
    </nav>
  )
}
