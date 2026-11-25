// Deliberately minimal, like the staff layout: the public site's chrome doesn't
// belong here, and the signed-in frame lives one level deeper in (portal)/layout.tsx
// so the login page — reachable without a session — doesn't inherit it.
export default function MembersLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-background text-foreground">{children}</div>
}
