import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getPendingGoogleMember } from '@/lib/member-session'
import { CompleteProfileForm } from '@/components/members/complete-profile-form'

export const metadata: Metadata = {
  title: 'Finish Setting Up | Members Portal',
}

export default async function CompleteProfilePage() {
  // Only reachable straight after Google has confirmed the person's email.
  const pending = await getPendingGoogleMember()
  if (!pending) redirect('/members/login?error=google-expired')

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">One last step</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            You&apos;re signed in with Google as <span className="font-medium text-foreground">{pending.email}</span>. Tell
            us your enrollment number and department to finish your account.
          </p>
        </div>

        <CompleteProfileForm googleName={pending.name} />
      </div>
    </div>
  )
}
