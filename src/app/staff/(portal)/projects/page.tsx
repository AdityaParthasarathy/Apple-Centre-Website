import type { Metadata } from 'next'
import { callAppsScript } from '@/lib/apps-script'
import type { SheetProject } from '@/lib/sheet-types'
import { ProjectsManager } from '@/components/staff/projects-manager'

export const metadata: Metadata = {
  title: 'Projects | Faculty Portal',
}

async function loadProjects(): Promise<{ projects: SheetProject[]; error: string | null }> {
  try {
    const result = await callAppsScript<{ items: SheetProject[] }>('listProjects')
    return { projects: result.items, error: null }
  } catch (error) {
    return {
      projects: [],
      error: error instanceof Error ? error.message : 'Failed to load projects.',
    }
  }
}

export default async function StaffProjectsPage() {
  const { projects, error } = await loadProjects()

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Projects</h1>
      <p className="mt-1 text-muted-foreground">
        Add student projects as they ship — Featured ones appear first on the homepage.
      </p>
      {error && (
        <p className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          Couldn&apos;t load projects from the sheet: {error}
        </p>
      )}
      <div className="mt-8">
        <ProjectsManager initialProjects={projects} />
      </div>
    </div>
  )
}
