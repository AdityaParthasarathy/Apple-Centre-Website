import Link from 'next/link'
import Image from 'next/image'
import { Container } from '@/components/ui/container'
import { Mail, MapPin, Phone } from 'lucide-react'

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <Container className="py-12 sm:py-16">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Image src="/logo-icon.png" alt="" width={24} height={24} className="rounded-md" />
              <span className="font-semibold">Apple Centre</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Innovation hub for Apple ecosystem technologies at RIT Chennai
            </p>
          </div>

          {/* Links */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Programs</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/programs" className="hover:text-foreground transition">iOS Development</Link></li>
              <li><Link href="/programs" className="hover:text-foreground transition">ARKit</Link></li>
              <li><Link href="/programs" className="hover:text-foreground transition">ML & AI</Link></li>
              <li><Link href="/programs" className="hover:text-foreground transition">Design Systems</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Resources</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/events" className="hover:text-foreground transition">Events</Link></li>
              <li><Link href="/projects" className="hover:text-foreground transition">Projects</Link></li>
              <li><Link href="/gallery" className="hover:text-foreground transition">Gallery</Link></li>
              <li><Link href="/apply" className="hover:text-foreground transition">Apply</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Get in Touch</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>RIT Chennai Campus</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <a href="mailto:contact@rit-apple.edu" className="hover:text-foreground transition">
                  contact@rit-apple.edu
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span>+91 (0) XXX-XXX-XXXX</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-border pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>&copy; 2026 Centre for Apple Technologies, RIT. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-foreground transition">Privacy Policy</a>
            <a href="#" className="hover:text-foreground transition">Terms of Service</a>
            <a href="#" className="hover:text-foreground transition">Code of Conduct</a>
          </div>
        </div>
      </Container>
    </footer>
  )
}
