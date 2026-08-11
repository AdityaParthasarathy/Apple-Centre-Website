import type { Metadata } from 'next'
import { Container } from '@/components/ui/container'
import { EventsCalendar } from '@/components/patterns/events-calendar'
import { PageHero } from '@/components/patterns/page-hero'
import { EventsGrid } from '@/components/sections/events-grid'
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
          <EventsGrid events={sortedEvents} />
        </Container>
      </section>
    </>
  )
}
