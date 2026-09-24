import type { Metadata } from 'next'
import { callAppsScript } from '@/lib/apps-script'
import type { SheetRegistration } from '@/lib/sheet-types'
import { RegistrationsManager } from '@/components/staff/registrations-manager'

export const metadata: Metadata = {
  title: 'Registrations | Faculty Portal',
}

// Read from the cache (up to a minute old) so the page opens instantly instead of
// waiting on Google; RegistrationsManager fetches the newest list right after it
// renders.
async function loadRegistrations(): Promise<{ registrations: SheetRegistration[]; error: string | null }> {
  try {
    const result = await callAppsScript<{ items: SheetRegistration[] }>('listRegistrations')
    return { registrations: result.items, error: null }
  } catch (error) {
    return {
      registrations: [],
      error: error instanceof Error ? error.message : 'Failed to load registrations.',
    }
  }
}

export default async function StaffRegistrationsPage() {
  const { registrations, error } = await loadRegistrations()

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Event registrations</h1>
      <p className="mt-1 text-muted-foreground">
        Students who signed up for an event from its page. Download a list per event for the door, or remove someone
        who can&apos;t make it to free up their seat.
      </p>
      {error && (
        <p className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          Couldn&apos;t load registrations from the sheet: {error}
        </p>
      )}
      <div className="mt-8">
        <RegistrationsManager initialRegistrations={registrations} />
      </div>
    </div>
  )
}
