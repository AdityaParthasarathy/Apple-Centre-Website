'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FolderKanban, Images, LayoutDashboard, Trophy, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: '/members', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/members/gallery', label: 'Gallery', icon: Images },
  { href: '/members/projects', label: 'Projects', icon: FolderKanban },
  { href: '/members/achievements', label: 'Achievements', icon: Trophy },
]

/** The members portal's vertical navigation — the same look as the faculty one. */
export function MemberNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()

  return (
    <nav aria-label="Members portal" className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const isActive = item.href === '/members' ? pathname === '/members' : pathname.startsWith(item.href)
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
          </Link>
        )
      })}
    </nav>
  )
}
