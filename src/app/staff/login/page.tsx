import type { Metadata } from 'next'
import { LoginForm } from '@/components/staff/login-form'

export const metadata: Metadata = {
  title: 'Faculty Login | Centre for Apple Technologies',
}

export default function StaffLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Faculty Portal</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to manage events, announcements, and gallery photos.
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
