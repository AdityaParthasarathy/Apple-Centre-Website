import Link from 'next/link'
import Image from 'next/image'
import { Container } from '@/components/ui/container'
import { buttonVariants } from '@/components/ui/button'
import type { Program } from '@/content/programs'
import { MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'

const PROGRAM_LINK_COUNT = 4

// A dark ground, matching the CTA band right above it — the two read as one
// continuous close to the page rather than a bold band dropping into a
// plain white footer. Real program titles replace what used to be four
// hardcoded, made-up course names — passed in from the layout (which
// already fetches programs for search) rather than fetched here again, so
// this stays a plain sync component instead of a second live round-trip to
// the same sheet.
export function SiteFooter({ programs }: { programs: Program[] }) {
  const featuredPrograms = programs.slice(0, PROGRAM_LINK_COUNT)

  return (
    <footer className="bg-foreground text-background">
      <Container className="py-12 sm:py-16">
        <div className="mb-10 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Image src="/logo-icon.png" alt="" width={24} height={24} className="rounded-md" />
              <span className="font-semibold">Apple Centre</span>
            </div>
            <p className="text-sm text-background/60">
              Innovation hub for Apple ecosystem technologies at RIT Chennai
            </p>
          </div>

          {/* Programs — real titles, not placeholders */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Programs</h3>
            <ul className="space-y-2 text-sm text-background/60">
              {featuredPrograms.length > 0 ? (
                featuredPrograms.map((program) => (
                  <li key={program.id}>
                    <Link href="/programs" className="transition hover:text-background">
                      {program.title}
                    </Link>
                  </li>
                ))
              ) : (
                <li>
                  <Link href="/programs" className="transition hover:text-background">
                    View all programs
                  </Link>
                </li>
              )}
            </ul>
          </div>

          {/* Resources */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Resources</h3>
            <ul className="space-y-2 text-sm text-background/60">
              <li><Link href="/events" className="transition hover:text-background">Events</Link></li>
              <li><Link href="/projects" className="transition hover:text-background">Projects</Link></li>
              <li><Link href="/gallery" className="transition hover:text-background">Gallery</Link></li>
              <li><Link href="/faculty" className="transition hover:text-background">Team</Link></li>
            </ul>
          </div>

          {/* Contact — only claims that are actually true */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Get in Touch</h3>
            <p className="flex items-center gap-2 text-sm text-background/60">
              <MapPin className="h-4 w-4 shrink-0" />
              RIT Chennai Campus
            </p>
            <Link
              href="/apply"
              className={cn(buttonVariants({ size: 'sm', variant: 'secondary' }), 'bg-background/10 text-background hover:bg-background/20')}
            >
              Apply Now
            </Link>
          </div>
        </div>

        {/* Bottom */}
        <div className="flex flex-col items-center gap-4 border-t border-background/10 pt-8 text-sm text-background/50 sm:flex-row sm:justify-between">
          <p>&copy; 2026 Centre for Apple Technologies, RIT. All rights reserved.</p>
        </div>
      </Container>
    </footer>
  )
}
