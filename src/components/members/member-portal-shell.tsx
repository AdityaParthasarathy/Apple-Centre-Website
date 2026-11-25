'use client'

import { PortalFrame } from '@/components/staff/portal-shell'
import { LogoutButton } from '@/components/staff/logout-button'
import { MemberNav } from '@/components/members/member-nav'

/** The members portal's frame: the faculty portal's own, with the members' navigation. */
export function MemberPortalShell({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <PortalFrame
      title="Members Portal"
      homeHref="/members"
      name={name}
      renderNav={(onNavigate) => <MemberNav onNavigate={onNavigate} />}
      logout={<LogoutButton endpoint="/api/members/logout" redirectTo="/members/login" />}
    >
      {children}
    </PortalFrame>
  )
}
