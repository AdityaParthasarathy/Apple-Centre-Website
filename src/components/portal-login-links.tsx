import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

// The sign-in pages have no site header, so on their own they are a dead end:
// in the desktop app there is no address bar to type "/" into. These two
// links give every sign-in page a way back to the website and across to the
// other portal.

/** "← Back to website", above the page heading. */
export function BackToWebsite() {
  return (
    <Link
      href="/"
      className="mb-6 -ml-2 inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      Back to website
    </Link>
  )
}

/** "Faculty? Go to the Faculty Portal" / "Student? Go to the Members Portal". */
export function OtherPortalLink({ portal }: { portal: 'members' | 'faculty' }) {
  const isMembers = portal === 'members'
  return (
    <p className="mt-6 text-center text-sm text-muted-foreground">
      {isMembers ? 'Are you a student? ' : 'Are you faculty? '}
      <Link
        href={isMembers ? '/members' : '/staff'}
        className="font-medium text-foreground underline underline-offset-2 hover:opacity-80"
      >
        {isMembers ? 'Members Portal' : 'Faculty Portal'}
      </Link>
    </p>
  )
}
