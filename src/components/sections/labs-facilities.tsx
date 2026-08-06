import { getAllFacilities } from '@/lib/merge-facilities'
import { LabsFacilitiesSectionClient } from '@/components/sections/labs-facilities-client'

// Server Component so the Apps Script call (server-only secret) stays off
// the client — merges the static seed facilities with anything faculty have
// added via the portal, then hands the result to the client component.
export async function LabsFacilitiesSection() {
  const facilities = await getAllFacilities()
  return <LabsFacilitiesSectionClient facilities={facilities} />
}
