import { Suspense } from 'react'
import Link from 'next/link'
import type { Metadata } from 'next'
import { Card } from '@/components/ui/card'
import { getFacultySession } from '@/lib/session'
import { callAppsScript } from '@/lib/apps-script'

export const metadata: Metadata = {
  title: 'Dashboard | Faculty Portal',
}

const CARDS = [
  { label: 'Events', action: 'listEvents', href: '/staff/events' },
  { label: 'Registrations', action: 'listRegistrations', href: '/staff/registrations' },
  { label: 'Announcements', action: 'listAnnouncements', href: '/staff/announcements' },
  { label: 'Gallery photos', action: 'listGallery', href: '/staff/gallery' },
  { label: 'Applications', action: 'listApplications', href: '/staff/applications' },
  { label: 'Projects', action: 'listProjects', href: '/staff/projects' },
  { label: 'Achievements', action: 'listAchievements', href: '/staff/achievements' },
  { label: 'Team members', action: 'listTeamMembers', href: '/staff/team' },
  { label: 'Programs', action: 'listPrograms', href: '/staff/programs' },
  { label: 'Facilities', action: 'listFacilities', href: '/staff/facilities' },
]

// Apps Script may not be set up yet (new deployment, missing sheet tabs) —
// each count degrades to "—" independently rather than taking the whole
// dashboard down.
async function Count({ action }: { action: string }) {
  let count: number | null
  try {
    const result = await callAppsScript<{ items: unknown[] }>(action)
    count = result.items?.length ?? 0
  } catch {
    count = null
  }
  return <>{count ?? '—'}</>
}

export default async function StaffDashboardPage() {
  const session = await getFacultySession()

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-foreground">
        Welcome{session ? `, ${session.name}` : ''}
      </h1>
      <p className="mt-1 text-muted-foreground">Manage the Centre&apos;s live content from here.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CARDS.map((card) => (
          <Link key={card.href} href={card.href}>
            <Card className="p-5">
              <p className="text-sm text-muted-foreground">{card.label}</p>
              {/* Each count streams in on its own: Apps Script latency is
                  wildly uneven (2s to 45s observed), and awaiting all nine
                  up front meant the page — and the Faculty nav with it —
                  waited on whichever call was slowest. */}
              <p className="mt-2 text-3xl font-bold text-foreground">
                <Suspense fallback={<span className="text-muted-foreground">…</span>}>
                  <Count action={card.action} />
                </Suspense>
              </p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
