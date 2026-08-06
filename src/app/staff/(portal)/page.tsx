import Link from 'next/link'
import type { Metadata } from 'next'
import { Card } from '@/components/ui/card'
import { getFacultySession } from '@/lib/session'
import { callAppsScript } from '@/lib/apps-script'

export const metadata: Metadata = {
  title: 'Dashboard | Faculty Portal',
}

// Apps Script may not be set up yet (new deployment, missing sheet tabs) —
// each count degrades to "—" independently rather than taking the whole
// dashboard down.
async function safeCount(action: string): Promise<number | null> {
  try {
    const result = await callAppsScript<{ items: unknown[] }>(action)
    return result.items?.length ?? 0
  } catch {
    return null
  }
}

export default async function StaffDashboardPage() {
  const session = await getFacultySession()
  const [events, announcements, gallery, applications, projects, team, programs, facilities] = await Promise.all([
    safeCount('listEvents'),
    safeCount('listAnnouncements'),
    safeCount('listGallery'),
    safeCount('listApplications'),
    safeCount('listProjects'),
    safeCount('listTeamMembers'),
    safeCount('listPrograms'),
    safeCount('listFacilities'),
  ])

  const cards = [
    { label: 'Events', value: events, href: '/staff/events' },
    { label: 'Announcements', value: announcements, href: '/staff/announcements' },
    { label: 'Gallery photos', value: gallery, href: '/staff/gallery' },
    { label: 'Applications', value: applications, href: '/staff/applications' },
    { label: 'Projects', value: projects, href: '/staff/projects' },
    { label: 'Team members', value: team, href: '/staff/team' },
    { label: 'Programs', value: programs, href: '/staff/programs' },
    { label: 'Facilities', value: facilities, href: '/staff/facilities' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-foreground">
        Welcome{session ? `, ${session.name}` : ''}
      </h1>
      <p className="mt-1 text-muted-foreground">Manage the Centre&apos;s live content from here.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Link key={card.href} href={card.href}>
            <Card className="p-5">
              <p className="text-sm text-muted-foreground">{card.label}</p>
              <p className="mt-2 text-3xl font-bold text-foreground">{card.value ?? '—'}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
