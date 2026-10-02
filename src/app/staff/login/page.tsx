import type { Metadata } from 'next'
import { LoginForm } from '@/components/staff/login-form'
import { GoogleSignInButton } from '@/components/staff/google-sign-in-button'
import { isGoogleSignInConfigured } from '@/lib/google-oauth'

export const metadata: Metadata = {
  title: 'Faculty Login | Centre for Apple Technologies',
}

// Set by /api/staff/google/callback when a Google sign-in doesn't complete.
const GOOGLE_ERRORS: Record<string, string> = {
  'not-authorised':
    "That Google account isn't set up for the Faculty Portal. Ask a coordinator to add your email, or sign in with your password.",
  'google-cancelled': 'Google sign-in was cancelled.',
  'google-failed': "Couldn't sign in with Google. Please try again.",
  'google-not-configured': 'Google sign-in is not available right now. Please use your email and password.',
}

export default async function StaffLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { error } = await searchParams
  const googleMessage = typeof error === 'string' ? GOOGLE_ERRORS[error] : undefined
  const googleEnabled = isGoogleSignInConfigured()

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Faculty Portal</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to manage events, announcements, and gallery photos.
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
            <GoogleSignInButton />
            <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              or sign in with email
              <span className="h-px flex-1 bg-border" />
            </div>
          </>
        )}

        <LoginForm />
      </div>
    </div>
  )
}
