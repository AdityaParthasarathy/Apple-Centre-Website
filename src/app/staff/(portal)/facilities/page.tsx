import type { Metadata } from 'next'
import { callAppsScript } from '@/lib/apps-script'
import type { SheetFacility } from '@/lib/sheet-types'
import { FacilitiesManager } from '@/components/staff/facilities-manager'

export const metadata: Metadata = {
  title: 'Facilities | Faculty Portal',
}

async function loadFacilities(): Promise<{ facilities: SheetFacility[]; error: string | null }> {
  try {
    const result = await callAppsScript<{ items: SheetFacility[] }>('listFacilities')
    return { facilities: result.items, error: null }
  } catch (error) {
    return {
      facilities: [],
      error: error instanceof Error ? error.message : 'Failed to load facilities.',
    }
  }
}

export default async function StaffFacilitiesPage() {
  const { facilities, error } = await loadFacilities()

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Facilities</h1>
      <p className="mt-1 text-muted-foreground">Edit the labs &amp; facilities copy shown on the homepage.</p>
      {error && (
        <p className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          Couldn&apos;t load facilities from the sheet: {error}
        </p>
      )}
      <div className="mt-8">
        <FacilitiesManager initialFacilities={facilities} />
      </div>
    </div>
  )
}
