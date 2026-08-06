// Deliberately minimal — the public site's chrome ((site)/layout.tsx: dock,
// header, footer, Lenis) doesn't belong here. The authenticated portal shell
// (top bar, nav, logout) lives one level deeper in (portal)/layout.tsx, so
// the login page — reachable without a session — doesn't inherit it.
export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-background text-foreground">{children}</div>
}
