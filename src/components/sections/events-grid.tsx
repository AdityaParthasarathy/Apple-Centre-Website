'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Calendar, MapPin } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { isExternalImage } from '@/lib/utils'
import type { Event } from '@/content/events'
import { motion } from 'motion/react'

export function EventsGrid({ events }: { events: Event[] }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {events.map((event, idx) => (
        <motion.div
          key={event.id}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: idx * 0.06 }}
          viewport={{ once: true }}
        >
          <Link href={`/events/${event.id}`}>
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
        </motion.div>
      ))}
    </div>
  )
}
