import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { getFacultySession } from '@/lib/session'
import { LogoutButton } from '@/components/staff/logout-button'
import { PortalNav } from '@/components/staff/portal-nav'

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await getFacultySession()
  // Middleware already gates /staff/**, but a Server Component shouldn't
  // rely on that alone — the matcher config could drift from this tree.
  if (!session) redirect('/staff/login')

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <Link href="/staff" className="flex items-center gap-2 text-lg font-semibold text-foreground transition-opacity hover:opacity-80">
              <Image src="/logo-icon.png" alt="" width={26} height={26} className="rounded-md" />
              <span>
                Faculty Portal
              </span>
            </Link>
            <div className="flex items-center gap-3">
              <span className="hidden text-sm text-muted-foreground sm:inline">{session.name}</span>
              <LogoutButton />
            </div>
          </div>
          <PortalNav />
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">{children}</main>
    </div>
  )
}
