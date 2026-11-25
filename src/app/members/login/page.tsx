import type { Metadata } from 'next'
import Link from 'next/link'
import { MemberAuthForm } from '@/components/members/login-form'
import { GoogleSignInButton } from '@/components/staff/google-sign-in-button'
import { isGoogleSignInConfigured } from '@/lib/google-oauth'

export const metadata: Metadata = {
  title: 'Members Login | Centre for Apple Technologies',
}

// Set by the Google sign-in routes when it doesn't complete.
const GOOGLE_ERRORS: Record<string, string> = {
  'google-cancelled': 'Google sign-in was cancelled.',
  'google-failed': "Couldn't sign in with Google. Please try again.",
  'google-not-configured': 'Google sign-in is not available right now. Please use your username and password.',
  'google-expired': 'Your Google sign-in expired. Please start again.',
  'google-busy': "Google confirmed it's you, but the Centre's data service is busy right now. Wait a minute and try again.",
}

export default async function MembersLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { error } = await searchParams
  const googleMessage = typeof error === 'string' ? GOOGLE_ERRORS[error] : undefined
  const googleEnabled = isGoogleSignInConfigured()

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Members Portal</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to add photos, projects, and achievements.
          </p>
        </div>

        {googleMessage && (
          <p
            role="alert"
            className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
          >
            {googleMessage}
          </p>
        )}

        {googleEnabled && (
          <>
            <GoogleSignInButton href="/api/members/google/start" />
            <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              or use a username
              <span className="h-px flex-1 bg-border" />
            </div>
          </>
        )}

        <MemberAuthForm />

        <p className="mt-4 text-center text-xs text-muted-foreground">
          How we use your details:{' '}
          <Link href="/privacy" target="_blank" className="underline underline-offset-2 hover:text-foreground">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  )
}
