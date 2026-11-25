import { redirect } from 'next/navigation'
import { getMemberSession } from '@/lib/member-session'
import { MemberPortalShell } from '@/components/members/member-portal-shell'
import { SkipLink } from '@/components/patterns/skip-link'

// The pages read the sheet on the server; see the note in the API routes.
export const maxDuration = 60

export default async function MemberPortalLayout({ children }: { children: React.ReactNode }) {
  const member = await getMemberSession()
  // proxy.ts already gates /members/**, but a Server Component shouldn't
  // rely on that alone — the matcher config could drift from this tree.
  if (!member) redirect('/members/login')

  return (
    <>
      <SkipLink />
      <MemberPortalShell name={member.name}>{children}</MemberPortalShell>
    </>
  )
}
