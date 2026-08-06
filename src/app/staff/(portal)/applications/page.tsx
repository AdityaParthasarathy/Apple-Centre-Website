import type { Metadata } from 'next'
import { callAppsScript } from '@/lib/apps-script'
import type { SheetApplication } from '@/lib/sheet-types'
import { ApplicationsManager } from '@/components/staff/applications-manager'

export const metadata: Metadata = {
  title: 'Applications | Faculty Portal',
}

async function loadApplications(): Promise<{ applications: SheetApplication[]; error: string | null }> {
  try {
    const result = await callAppsScript<{ items: SheetApplication[] }>('listApplications')
    return { applications: result.items, error: null }
  } catch (error) {
    return {
      applications: [],
      error: error instanceof Error ? error.message : 'Failed to load applications.',
    }
  }
}

export default async function StaffApplicationsPage() {
  const { applications, error } = await loadApplications()

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Applications</h1>
      <p className="mt-1 text-muted-foreground">Everyone who has applied to join the Centre.</p>
      {error && (
        <p className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          Couldn&apos;t load applications from the sheet: {error}
        </p>
      )}
      <div className="mt-8">
        <ApplicationsManager initialApplications={applications} />
      </div>
    </div>
  )
}
