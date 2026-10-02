import { redirect } from 'next/navigation'
import { getFacultySession } from '@/lib/session'
import { PortalShell } from '@/components/staff/portal-shell'
import { SkipLink } from '@/components/patterns/skip-link'

// The staff pages read Apps Script on the server; see the note in the API routes.
export const maxDuration = 60

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await getFacultySession()
  // Middleware already gates /staff/**, but a Server Component shouldn't
  // rely on that alone — the matcher config could drift from this tree.
  if (!session) redirect('/staff/login')

  return (
    <>
      <SkipLink />
      <PortalShell name={session.name}>{children}</PortalShell>
    </>
  )
}
