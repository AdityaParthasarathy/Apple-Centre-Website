import type { Metadata } from 'next'
import { callAppsScript } from '@/lib/apps-script'
import type { SheetAnnouncement } from '@/lib/sheet-types'
import { AnnouncementsManager } from '@/components/staff/announcements-manager'

export const metadata: Metadata = {
  title: 'Announcements | Faculty Portal',
}

async function loadAnnouncements(): Promise<{ announcements: SheetAnnouncement[]; error: string | null }> {
  try {
    const result = await callAppsScript<{ items: SheetAnnouncement[] }>('listAnnouncements')
    return { announcements: result.items, error: null }
  } catch (error) {
    return {
      announcements: [],
      error: error instanceof Error ? error.message : 'Failed to load announcements.',
    }
  }
}

export default async function StaffAnnouncementsPage() {
  const { announcements, error } = await loadAnnouncements()

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Announcements</h1>
      <p className="mt-1 text-muted-foreground">
        Published, pinned announcements appear at the top of the homepage.
      </p>
      {error && (
        <p className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          Couldn&apos;t load announcements from the sheet: {error}
        </p>
      )}
      <div className="mt-8">
        <AnnouncementsManager initialAnnouncements={announcements} />
      </div>
    </div>
  )
}
