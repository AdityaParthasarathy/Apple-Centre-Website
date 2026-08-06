import type { Metadata } from 'next'
import { callAppsScript } from '@/lib/apps-script'
import type { SheetEvent } from '@/lib/sheet-types'
import { EventsManager } from '@/components/staff/events-manager'

export const metadata: Metadata = {
  title: 'Events | Faculty Portal',
}

async function loadEvents(): Promise<{ events: SheetEvent[]; error: string | null }> {
  try {
    const result = await callAppsScript<{ items: SheetEvent[] }>('listEvents')
    return { events: result.items, error: null }
  } catch (error) {
    return {
      events: [],
      error: error instanceof Error ? error.message : 'Failed to load events.',
    }
  }
}

export default async function StaffEventsPage() {
  const { events, error } = await loadEvents()

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Events</h1>
      <p className="mt-1 text-muted-foreground">
        Add, edit, or remove events — changes appear on the public site within a minute.
      </p>
      {error && (
        <p className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          Couldn&apos;t load events from the sheet: {error}
        </p>
      )}
      <div className="mt-8">
        <EventsManager initialEvents={events} />
      </div>
    </div>
  )
}
