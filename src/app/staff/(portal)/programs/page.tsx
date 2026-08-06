import type { Metadata } from 'next'
import { callAppsScript } from '@/lib/apps-script'
import type { SheetProgram } from '@/lib/sheet-types'
import { ProgramsManager } from '@/components/staff/programs-manager'

export const metadata: Metadata = {
  title: 'Programs | Faculty Portal',
}

async function loadPrograms(): Promise<{ programs: SheetProgram[]; error: string | null }> {
  try {
    const result = await callAppsScript<{ items: SheetProgram[] }>('listPrograms')
    return { programs: result.items, error: null }
  } catch (error) {
    return {
      programs: [],
      error: error instanceof Error ? error.message : 'Failed to load programs.',
    }
  }
}

export default async function StaffProgramsPage() {
  const { programs, error } = await loadPrograms()

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Programs</h1>
      <p className="mt-1 text-muted-foreground">Edit the programs offered — no redeploy needed for a typo fix or a new offering.</p>
      {error && (
        <p className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          Couldn&apos;t load programs from the sheet: {error}
        </p>
      )}
      <div className="mt-8">
        <ProgramsManager initialPrograms={programs} />
      </div>
    </div>
  )
}
