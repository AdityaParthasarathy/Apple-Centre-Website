import { SiteHeader } from "@/components/nav/site-header";
import { SiteFooter } from "@/components/footer/site-footer";
import { FloatingDock, type DockItem } from "@/components/patterns/floating-dock";
import { SmoothScroll } from "@/components/patterns/smooth-scroll";
import { Home, GraduationCap, FolderKanban, Calendar, Images, Users } from "lucide-react";

const dockItems: DockItem[] = [
  { id: 'home', label: 'Home', href: '/', icon: <Home className="h-4 w-4" /> },
  { id: 'programs', label: 'Programs', href: '/programs', icon: <GraduationCap className="h-4 w-4" /> },
  { id: 'projects', label: 'Projects', href: '/projects', icon: <FolderKanban className="h-4 w-4" /> },
  { id: 'events', label: 'Events', href: '/events', icon: <Calendar className="h-4 w-4" /> },
  { id: 'gallery', label: 'Gallery', href: '/gallery', icon: <Images className="h-4 w-4" /> },
  { id: 'faculty', label: 'Faculty', href: '/faculty', icon: <Users className="h-4 w-4" /> },
]

export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SmoothScroll>
      <FloatingDock items={dockItems} />
      <div className="isolate flex flex-col min-h-screen">
        <SiteHeader />
        <main className="flex-1 pb-24">{children}</main>
        <SiteFooter />
      </div>
    </SmoothScroll>
  );
}
