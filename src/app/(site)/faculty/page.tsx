import type { Metadata } from 'next'
import Image from 'next/image'
import { Mail } from 'lucide-react'
import { Container } from '@/components/ui/container'
import { SectionHeading } from '@/components/ui/section-heading'
import { Card } from '@/components/ui/card'
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
        <Container>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {faculty.map((person) => (
              <Card key={person.id} className="overflow-hidden p-6 text-center">
                <div className="relative mx-auto mb-4 h-28 w-28 overflow-hidden rounded-full">
                  {person.image ? (
                    <Image
                      src={person.image}
                      alt={person.name}
                      fill
                      className="object-cover"
                      sizes="112px"
                      unoptimized={isExternalImage(person.image)}
                    />
                  ) : (
                    <AvatarPlaceholder name={person.name} className="h-full w-full" />
                  )}
                </div>
                <h2 className="font-semibold text-foreground">{person.name}</h2>
                <p className="mb-3 text-sm text-muted-foreground">{person.role}</p>
                <p className="mb-4 text-sm text-muted-foreground">{person.bio}</p>
                {person.expertise && person.expertise.length > 0 && (
                  <div className="mb-4 flex flex-wrap justify-center gap-1.5">
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
              </Card>
            ))}
          </div>
        </Container>
      </section>
    </>
  )
}
