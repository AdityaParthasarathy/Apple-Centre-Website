import type { Metadata } from 'next'
import Link from 'next/link'
import { Calendar, MapPin } from 'lucide-react'
import { Container } from '@/components/ui/container'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EventsCalendar } from '@/components/patterns/events-calendar'
import { PageHero } from '@/components/patterns/page-hero'
import { getAllEvents } from '@/lib/merge-events'

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
          <div className="grid gap-4 sm:grid-cols-2">
            {sortedEvents.map((event) => (
              <Link key={event.id} href={`/events/${event.id}`}>
                <Card className="h-full p-5 transition-shadow hover:shadow-md">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-foreground">{event.title}</h3>
                    <Badge variant="secondary" className="shrink-0 text-xs capitalize">
                      {event.category}
                    </Badge>
                  </div>
                  <p className="mb-3 text-sm text-muted-foreground">{event.description}</p>
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
                </Card>
              </Link>
            ))}
          </div>
        </Container>
      </section>
    </>
  )
}
