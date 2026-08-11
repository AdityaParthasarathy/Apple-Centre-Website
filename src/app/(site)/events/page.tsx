import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Calendar, MapPin } from 'lucide-react'
import { Container } from '@/components/ui/container'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EventsCalendar } from '@/components/patterns/events-calendar'
import { PageHero } from '@/components/patterns/page-hero'
import { getAllEvents } from '@/lib/merge-events'
import { isExternalImage } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Events & Workshops | Centre for Apple Technologies',
  description: 'Hands-on workshops, talks, and hackathons happening at the Centre.',
}

// Faculty-managed events live in the sheet, not build-time content, so this
// route needs to periodically re-check for new ones.
export const revalidate = 60

export default async function EventsPage() {
  const events = await getAllEvents()
  const sortedEvents = [...events].sort((a, b) => a.date.getTime() - b.date.getTime())

  return (
    <>
      <PageHero
        title="Events & Workshops"
        subtitle="Hands-on workshops, talks, and hackathons happening at the Centre."
        image="/centre-space/entrance-sign.jpg"
      />

      <section className="py-16 sm:py-24">
        <Container>
          <div className="flex justify-center">
            <EventsCalendar events={events} />
          </div>
        </Container>
      </section>

      <section className="border-t border-border py-16 sm:py-24">
        <Container>
          <h2 className="mb-8 text-2xl font-bold text-foreground">All Events</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {sortedEvents.map((event) => (
              <Link key={event.id} href={`/events/${event.id}`}>
                <Card className="group h-full overflow-hidden">
                  <div className="relative h-40 overflow-hidden">
                    <Image
                      src={event.image}
                      alt={event.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, 50vw"
                      unoptimized={isExternalImage(event.image)}
                    />
                    <Badge variant="secondary" className="absolute right-3 top-3 text-xs capitalize">
                      {event.category}
                    </Badge>
                  </div>
                  <div className="space-y-3 p-5">
                    <h3 className="font-semibold text-foreground">{event.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>
                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        {event.date.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" />
                        {event.location}
                      </span>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </Container>
      </section>
    </>
  )
}
