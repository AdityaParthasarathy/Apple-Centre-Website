import type { Metadata } from 'next'
import { callAppsScript } from '@/lib/apps-script'
import { getMemberSession } from '@/lib/member-session'
import { memberKey } from '@/lib/member-api'
import type { SheetProject } from '@/lib/sheet-types'
import { MemberProjectsManager } from '@/components/members/projects-manager'

export const metadata: Metadata = {
  title: 'Projects | Members Portal',
}

async function loadProjects(owner: string): Promise<{ projects: SheetProject[]; error: string | null }> {
  try {
    const result = await callAppsScript<{ items: SheetProject[] }>('listProjects')
    return { projects: result.items.filter((item) => item.createdBy === owner), error: null }
  } catch (error) {
    return { projects: [], error: error instanceof Error ? error.message : 'Failed to load your projects.' }
  }
}

export default async function MemberProjectsPage() {
  const member = await getMemberSession()
  if (!member) return null
  const { projects, error } = await loadProjects(memberKey(member))

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Projects</h1>
      <p className="mt-1 text-muted-foreground">
        Add the projects you have built. They appear on the public Projects page once saved.
      </p>
      {error && (
        <p className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          Couldn&apos;t load your projects from the sheet: {error}
        </p>
      )}
      <div className="mt-8">
        <MemberProjectsManager initialProjects={projects} member={member} />
      </div>
    </div>
  )
}
