import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Calendar, Clock, MapPin, Users } from 'lucide-react'
import { Container } from '@/components/ui/container'
import { Badge } from '@/components/ui/badge'
import { AnimatedCtaLink } from '@/components/patterns/motion-link'
import { events } from '@/content/events'
import { findEventBySlug } from '@/lib/merge-events'
import { isExternalImage } from '@/lib/utils'

// Only the static seed events get a page built at deploy time — faculty-added
// events are looked up at request time instead (dynamicParams defaults to
// true, so a slug not in this list still renders on demand).
export function generateStaticParams() {
  return events.map((event) => ({ slug: event.id }))
}

// Covers faculty-added events rendered on demand (not in the list above).
export const revalidate = 60

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const event = await findEventBySlug(slug)
  if (!event) return {}
  return {
    title: `${event.title} | Centre for Apple Technologies`,
    description: event.description,
  }
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const event = await findEventBySlug(slug)

  if (!event) {
    notFound()
  }

  return (
    <article>
      <section className="border-b border-border bg-card py-16 sm:py-20">
        <Container size="lg">
          <Link
            href="/events"
            className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            All Events
          </Link>

          <Badge variant="secondary" className="mb-3 text-xs capitalize">
            {event.category}
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            {event.title}
          </h1>
        </Container>
      </section>

      <section className="py-16 sm:py-20">
        <Container size="lg">
          <div className="grid gap-12 lg:grid-cols-[1fr_320px]">
            <div className="space-y-8">
              <div className="relative h-72 overflow-hidden rounded-lg bg-card sm:h-96">
                <Image
                  src={event.image}
                  alt={event.title}
                  fill
                  className="object-contain"
                  sizes="(max-width: 1024px) 100vw, 66vw"
                  priority
                  unoptimized={isExternalImage(event.image)}
                />
              </div>
              <p className="text-lg leading-relaxed text-muted-foreground">{event.description}</p>
            </div>

            <aside className="space-y-6">
              <div className="rounded-lg border border-border bg-card p-5">
                <dl className="space-y-4 text-sm">
                  <div className="flex items-start gap-3">
                    <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    <div>
                      <dt className="font-medium text-foreground">Date</dt>
                      <dd className="text-muted-foreground">
                        {event.date.toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </dd>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    <div>
                      <dt className="font-medium text-foreground">Time</dt>
                      <dd className="text-muted-foreground">{event.time}</dd>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    <div>
                      <dt className="font-medium text-foreground">Location</dt>
                      <dd className="text-muted-foreground">{event.location}</dd>
                    </div>
                  </div>
                  {event.capacity && (
                    <div className="flex items-start gap-3">
                      <Users className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                      <div>
                        <dt className="font-medium text-foreground">Capacity</dt>
                        <dd className="text-muted-foreground">{event.capacity} spots</dd>
                      </div>
                    </div>
                  )}
                </dl>
              </div>

              <AnimatedCtaLink href="/apply" className="w-full">
                Register Interest
              </AnimatedCtaLink>
            </aside>
          </div>
        </Container>
      </section>
    </article>
  )
}
