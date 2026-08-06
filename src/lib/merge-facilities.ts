import { facilities as staticFacilities, type Facility } from '@/content/facilities'
import { callAppsScript } from '@/lib/apps-script'
import type { SheetFacility } from '@/lib/sheet-types'

function sheetFacilityToFacility(f: SheetFacility): Facility {
  return {
    id: f.id,
    title: f.title,
    description: f.description,
    image: f.image,
  }
}

/** Static seed facilities plus anything faculty have added via the portal. */
export async function getAllFacilities(): Promise<Facility[]> {
  let sheetFacilities: Facility[] = []
  try {
    const result = await callAppsScript<{ items: SheetFacility[] }>('listFacilities')
    sheetFacilities = result.items.map(sheetFacilityToFacility)
  } catch {
    // Apps Script not configured yet, or temporarily unreachable — the site
    // still works with just the static seed set.
  }
  return [...staticFacilities, ...sheetFacilities]
}
