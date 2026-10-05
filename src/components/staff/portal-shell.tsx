'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ExternalLink, Menu, X } from 'lucide-react'
import { PortalNav } from '@/components/staff/portal-nav'
import { LogoutButton } from '@/components/staff/logout-button'
import { AvatarPlaceholder } from '@/components/ui/avatar-placeholder'
import { cn } from '@/lib/utils'
import { usePendingApplications } from '@/hooks/use-pending-applications'

function Brand({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Link
      href="/staff"
      onClick={onNavigate}
      className="flex items-center gap-2.5 text-lg font-semibold text-foreground transition-opacity hover:opacity-80"
    >
      <Image src="/rit-icon.png" alt="" width={28} height={28} className="rounded-md" />
      <span>Faculty Portal</span>
    </Link>
  )
}

// Everything inside the panel — shared by the fixed desktop sidebar and the
// mobile drawer so the two can never drift apart.
function PanelBody({ name, onNavigate }: { name: string; onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className="hidden px-5 pb-4 pt-6 md:block">
        <Brand />
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-2 md:pt-0">
        <PortalNav onNavigate={onNavigate} />
      </div>
      <div className="space-y-3 border-t border-border p-4">
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-9 items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
          View public site
        </Link>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <AvatarPlaceholder name={name} colored className="h-7 w-7 shrink-0 rounded-full text-xs" />
          <span className="truncate">{name}</span>
        </div>
        <LogoutButton />
      </div>
    </div>
  )
}

/** The authenticated portal's frame: a fixed side panel on wide screens, and
 *  on small screens a slim top bar whose menu button slides the same panel in
 *  as a drawer. Presentation only — session gating stays in the layout. */
export function PortalShell({ name, children }: { name: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)
  const pending = usePendingApplications()

  // While the drawer is open: Escape closes it, and the page behind it
  // stops scrolling.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  return (
    <div className="flex min-h-screen">
      {/* Wide screens: the side panel stays put while the page scrolls. */}
      <aside
        aria-label="Portal sidebar"
        className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-border bg-background md:block"
      >
        <PanelBody name={name} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Small screens: slim top bar with the menu button. */}
        <header className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b border-border bg-background/95 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            aria-expanded={open}
            aria-controls="portal-drawer"
            className="relative flex size-11 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-muted/60"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
            {/* The menu hides the Applications marker, so a dot on the button says "something is waiting". */}
            {pending ? (
              <span aria-hidden="true" className="absolute right-2 top-2 size-2.5 rounded-full bg-red-600 ring-2 ring-background" />
            ) : null}
          </button>
          <Brand />
        </header>

        <main id="main-content" className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>

      {/* Small screens: the drawer. `inert` while closed keeps its links out
          of the tab order and away from screen readers. */}
      <div
        inert={!open}
        className={cn('fixed inset-0 z-50 md:hidden', open ? 'pointer-events-auto' : 'pointer-events-none')}
      >
        <div
          onClick={close}
          aria-hidden="true"
          className={cn(
            'absolute inset-0 bg-black/40 transition-opacity duration-200 motion-reduce:transition-none',
            open ? 'opacity-100' : 'opacity-0'
          )}
        />
        <aside
          id="portal-drawer"
          aria-label="Portal menu"
          className={cn(
            'absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-background shadow-xl transition-transform duration-300 motion-reduce:transition-none',
            open ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <div className="flex h-14 shrink-0 items-center justify-between border-b border-border pl-4 pr-2">
            <Brand onNavigate={close} />
            <button
              type="button"
              onClick={close}
              aria-label="Close menu"
              className="flex size-11 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
          <div className="min-h-0 flex-1">
            <PanelBody name={name} onNavigate={close} />
          </div>
        </aside>
      </div>
    </div>
  )
}
