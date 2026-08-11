import { SiteHeader } from "@/components/nav/site-header";
import { SiteFooter } from "@/components/footer/site-footer";
import { FloatingDock, type DockItem } from "@/components/patterns/floating-dock";
import { SmoothScroll } from "@/components/patterns/smooth-scroll";
import { SkipLink } from "@/components/patterns/skip-link";
import { buildSearchIndex } from "@/lib/search-index";
import { getAllPrograms } from "@/lib/merge-programs";
import { Home, GraduationCap, FolderKanban, Calendar, Images, Users } from "lucide-react";

// Search merges in live Apps Script sheet data (see lib/search-index.ts),
// same freshness window as the other faculty-managed content routes.
export const revalidate = 60;

const dockItems: DockItem[] = [
  { id: 'home', label: 'Home', href: '/', icon: <Home className="h-4 w-4" /> },
  { id: 'programs', label: 'Programs', href: '/programs', icon: <GraduationCap className="h-4 w-4" /> },
  { id: 'projects', label: 'Projects', href: '/projects', icon: <FolderKanban className="h-4 w-4" /> },
  { id: 'events', label: 'Events', href: '/events', icon: <Calendar className="h-4 w-4" /> },
  { id: 'gallery', label: 'Gallery', href: '/gallery', icon: <Images className="h-4 w-4" /> },
  { id: 'faculty', label: 'Faculty', href: '/faculty', icon: <Users className="h-4 w-4" /> },
]

export default async function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Fetched once and shared — buildSearchIndex would otherwise fetch
  // programs a second time itself, doubling a POST call Next doesn't dedupe.
  const programs = await getAllPrograms();
  const searchIndex = await buildSearchIndex({ programs });

  return (
    <SmoothScroll>
      <SkipLink />
      <FloatingDock items={dockItems} />
      <div className="isolate flex flex-col min-h-screen">
        <SiteHeader searchIndex={searchIndex} />
        <main id="main-content" className="flex-1 pb-24">{children}</main>
        <SiteFooter programs={programs} />
      </div>
    </SmoothScroll>
  );
}
