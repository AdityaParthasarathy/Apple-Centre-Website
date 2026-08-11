import type { Metadata } from 'next'
import Image from 'next/image'
import { Mail } from 'lucide-react'
import { Container } from '@/components/ui/container'
import { SectionHeading } from '@/components/ui/section-heading'
import { Badge } from '@/components/ui/badge'
import { AvatarPlaceholder } from '@/components/ui/avatar-placeholder'
import { FadeIn } from '@/components/patterns/fade-in'
import { getAllTeamMembers } from '@/lib/merge-team'
import { isExternalImage } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Meet the Team | Centre for Apple Technologies',
  description: "The people coordinating and running the Apple Centre at RIT.",
}

// Faculty-added team members live in the sheet, not build-time content, so
// this route needs to periodically re-check for new ones.
export const revalidate = 60

export default async function FacultyPage() {
  const faculty = await getAllTeamMembers()
  return (
    <>
      <section className="border-b border-border bg-card py-20 sm:py-28">
        <Container>
          <div className="max-w-2xl">
            <SectionHeading as="h1" size="xl">
              Meet the Team
            </SectionHeading>
            <FadeIn delay={0.15}>
              <p className="mt-4 text-lg text-muted-foreground">
                The people coordinating and running the Apple Centre at RIT.
              </p>
            </FadeIn>
          </div>
        </Container>
      </section>

      <section className="py-16 sm:py-24">
        <Container size="lg">
          <div className="divide-y divide-border border-t border-border">
            {faculty.map((person) => (
              <div key={person.id} className="flex flex-col gap-6 py-10 sm:flex-row sm:items-start">
                <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-xl">
                  {person.image ? (
                    <Image
                      src={person.image}
                      alt={person.name}
                      fill
                      className="object-cover"
                      sizes="128px"
                      unoptimized={isExternalImage(person.image)}
                    />
                  ) : (
                    <AvatarPlaceholder name={person.name} className="h-full w-full rounded-xl" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <h2 className="text-xl font-semibold text-foreground">{person.name}</h2>
                    <p className="text-sm text-accent">{person.role}</p>
                  </div>
                  <p className="mt-3 max-w-2xl text-muted-foreground">{person.bio}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    {person.expertise && person.expertise.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {person.expertise.map((skill) => (
                          <Badge key={skill} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {person.contact && (
                      <a
                        href={`mailto:${person.contact}`}
                        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
                      >
                        <Mail className="h-3.5 w-3.5" />
                        {person.contact}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>
    </>
  )
}
