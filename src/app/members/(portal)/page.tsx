import { Suspense } from 'react'
import Link from 'next/link'
import type { Metadata } from 'next'
import { Card } from '@/components/ui/card'
import { getMemberSession } from '@/lib/member-session'
import { callAppsScript } from '@/lib/apps-script'
import { memberKey } from '@/lib/member-api'

export const metadata: Metadata = {
  title: 'Dashboard | Members Portal',
}

const CARDS = [
  { label: 'Photos', action: 'listGallery', href: '/members/gallery' },
  { label: 'Projects', action: 'listProjects', href: '/members/projects' },
  { label: 'Achievements', action: 'listAchievements', href: '/members/achievements' },
]

// Each count degrades to "—" on its own rather than taking the whole dashboard
// down, and streams in separately (Google's latency is uneven).
async function Count({ action, owner }: { action: string; owner: string }) {
  let count: number | null
  try {
    const result = await callAppsScript<{ items: { createdBy?: string }[] }>(action)
    count = (result.items ?? []).filter((item) => item.createdBy === owner).length
  } catch {
    count = null
  }
  return <>{count ?? '—'}</>
}

export default async function MemberDashboardPage() {
  const member = await getMemberSession()
  if (!member) return null
  const owner = memberKey(member)

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Welcome, {member.name}</h1>
      <p className="mt-1 text-muted-foreground">
        {member.department} · {member.enrollment}
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {CARDS.map((card) => (
          <Link key={card.href} href={card.href}>
            <Card className="p-5">
              <p className="text-sm text-muted-foreground">{card.label}</p>
              <p className="mt-2 text-3xl font-bold text-foreground">
                <Suspense fallback={<span className="text-muted-foreground">…</span>}>
                  <Count action={card.action} owner={owner} />
                </Suspense>
              </p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
