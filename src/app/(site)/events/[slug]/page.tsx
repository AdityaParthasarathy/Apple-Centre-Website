import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Calendar, Clock, MapPin, Users } from 'lucide-react'
import { Container } from '@/components/ui/container'
import { Badge } from '@/components/ui/badge'
import { EventRegistration } from '@/components/sections/event-registration'
import { events } from '@/content/events'
import { findEventBySlug } from '@/lib/merge-events'
import { getRegisteredCount, isRegistrationOpen } from '@/lib/event-registration'
import { cn, isExternalImage } from '@/lib/utils'

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

  const registered = await getRegisteredCount(event.id)

  const details = [
    {
      label: 'Date',
      icon: Calendar,
      value: event.date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'UTC',
      }),
    },
    { label: 'Time', icon: Clock, value: event.time },
    { label: 'Location', icon: MapPin, value: event.location },
    ...(event.capacity ? [{ label: 'Capacity', icon: Users, value: `${event.capacity} spots` }] : []),
  ]

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

      <section className="py-12 sm:py-16">
        <Container size="lg">
          {/* Banner: the photo sits contained (never cropped — organisers upload
              posters and logos as well as photos) over a blurred copy of
              itself, so the frame is always filled edge to edge. */}
          <div className="relative mb-10 h-64 overflow-hidden rounded-2xl border border-border bg-card sm:h-80 lg:h-[26rem]">
            <Image
              src={event.image}
              alt=""
              aria-hidden="true"
              fill
              className="scale-125 object-cover opacity-50 blur-3xl"
              sizes="100vw"
              unoptimized={isExternalImage(event.image)}
            />
            <Image
              src={event.image}
              alt={event.title}
              fill
              className="object-contain p-4 sm:p-6"
              sizes="(max-width: 1024px) 100vw, 1024px"
              priority
              unoptimized={isExternalImage(event.image)}
            />
          </div>

          {/* Two equal columns whose tops line up: what/when/where and the
              description on the left, the sign-up form on the right. */}
          <div className="grid items-start gap-8 lg:grid-cols-2">
            <div className="space-y-8">
              <div className="rounded-lg border border-border bg-card p-6">
                <dl className="grid gap-x-6 gap-y-5 text-sm sm:grid-cols-2 lg:grid-cols-1">
                  {details.map((item, index) => (
                    <div
                      key={item.label}
                      className={cn('flex items-start gap-3', details.length % 2 === 1 && index === details.length - 1 && 'sm:col-span-2 lg:col-span-1')}
                    >
                      <item.icon className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                      <div>
                        <dt className="font-medium text-foreground">{item.label}</dt>
                        <dd className="text-muted-foreground">{item.value}</dd>
                      </div>
                    </div>
                  ))}
                </dl>
              </div>

              <div>
                <h2 className="mb-3 text-lg font-semibold text-foreground">About this event</h2>
                <p className="whitespace-pre-line text-base leading-relaxed text-muted-foreground">{event.description}</p>
              </div>
            </div>

            <div className="lg:sticky lg:top-28">
              <EventRegistration
                eventId={event.id}
                eventTitle={event.title}
                capacity={event.capacity}
                registered={registered}
                open={isRegistrationOpen(event)}
              />
            </div>
          </div>
        </Container>
      </section>
    </article>
  )
}
