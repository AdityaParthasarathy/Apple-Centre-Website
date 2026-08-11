'use client'

import Link from 'next/link'
import { Container } from '@/components/ui/container'
import { SectionHeading } from '@/components/ui/section-heading'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EventsCalendar } from '@/components/patterns/events-calendar'
import type { Event } from '@/content/events'
import { motion } from 'motion/react'
import { Calendar, MapPin } from 'lucide-react'

export function EventsSectionClient({ events }: { events: Event[] }) {
  const calendarEvents = events.map((e) => ({
    id: e.id,
    date: e.date,
    title: e.title,
    description: e.time,
  }))

  return (
    <section id="events" className="py-20 sm:py-32">
      <Container>
        <div className="mb-16 max-w-2xl">
          <SectionHeading size="xl">Events &amp; workshops</SectionHeading>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
            viewport={{ once: true }}
            className="mt-4 text-lg text-muted-foreground"
          >
            Hands-on workshops, talks, and hackathons happening at the Centre.
          </motion.p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr] items-start">
          <EventsCalendar events={calendarEvents} className="mx-auto lg:mx-0" />

          <div className="space-y-4">
            {events.map((event, idx) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
                viewport={{ once: true }}
              >
                <Link href={`/events/${event.id}`}>
                  <Card className="p-5 transition-shadow hover:shadow-md">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-foreground">{event.title}</h3>
                      <Badge variant="secondary" className="text-xs capitalize shrink-0">
                        {event.category}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{event.description}</p>
                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        {event.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} &middot; {event.time}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" />
                        {event.location}
                      </span>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  )
}
