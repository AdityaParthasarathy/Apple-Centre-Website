'use client'

import Link from 'next/link'
import { motion, AnimatePresence } from 'motion/react'
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  getDaysInMonth,
  getDay,
  isSameDay,
  isToday,
} from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface CalendarEvent {
  id: string
  date: Date
  title: string
  description?: string
}

interface EventsCalendarProps {
  events: CalendarEvent[]
  className?: string
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function EventsCalendar({ events, className = '' }: EventsCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date())

  const monthStart = startOfMonth(currentMonth)
  const daysInMonth = getDaysInMonth(currentMonth)
  const leadingBlanks = getDay(monthStart)
  const trailingBlanks = (7 - ((leadingBlanks + daysInMonth) % 7)) % 7

  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const date = new Date(monthStart.getFullYear(), monthStart.getMonth(), i + 1)
    return { date, events: events.filter((e) => isSameDay(e.date, date)) }
  })

  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1))
    setSelectedDate(null)
  }

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1))
    setSelectedDate(null)
  }

  const selectedDayEvents = selectedDate
    ? events.filter((e) => isSameDay(e.date, selectedDate))
    : []

  return (
    <div className={cn('w-full max-w-md rounded-lg border border-border bg-card p-6', className)}>
      <div className="mb-6 flex items-center justify-between">
        <motion.h3
          key={format(currentMonth, 'MMMM yyyy')}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="text-2xl font-bold text-foreground"
        >
          {format(currentMonth, 'MMMM yyyy')}
        </motion.h3>

        <div className="flex gap-2">
          <Button variant="ghost" size="icon-sm" onClick={handlePrevMonth} aria-label="Previous month">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={handleNextMonth} aria-label="Next month">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Weekday header row */}
      <div className="grid grid-cols-7 text-center text-xs font-medium text-muted-foreground">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="py-1">
            {label}
          </div>
        ))}
      </div>

      {/* Month grid */}
      <div className="mt-1 grid grid-cols-7 gap-1">
        {Array.from({ length: leadingBlanks }).map((_, i) => (
          <div key={`lead-${i}`} />
        ))}

        {days.map(({ date, events: dayEvents }) => {
          const hasEvents = dayEvents.length > 0
          const selected = selectedDate ? isSameDay(date, selectedDate) : false
          const today = isToday(date)

          return (
            <button
              key={date.toISOString()}
              type="button"
              onClick={() => setSelectedDate(date)}
              aria-label={
                format(date, 'EEEE, MMMM d, yyyy') +
                (hasEvents ? ` — ${dayEvents.length} event${dayEvents.length > 1 ? 's' : ''}` : '')
              }
              className={cn(
                'relative flex aspect-square flex-col items-center justify-center rounded-lg text-sm transition-colors',
                selected
                  ? 'bg-accent font-semibold text-accent-foreground'
                  : today
                    ? 'font-semibold text-accent hover:bg-muted'
                    : 'text-foreground hover:bg-muted'
              )}
            >
              {date.getDate()}
              {hasEvents && (
                <span
                  className={cn(
                    'absolute bottom-1 h-1 w-1 rounded-full',
                    selected ? 'bg-accent-foreground' : 'bg-accent'
                  )}
                />
              )}
            </button>
          )
        })}

        {Array.from({ length: trailingBlanks }).map((_, i) => (
          <div key={`trail-${i}`} />
        ))}
      </div>

      {/* Selected day's events */}
      <div className="mt-6 border-t border-border pt-4">
        <AnimatePresence mode="wait">
          {selectedDate && selectedDayEvents.length > 0 ? (
            <motion.div
              key={selectedDate.toISOString()}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              <p className="text-xs font-medium text-muted-foreground">
                {format(selectedDate, 'EEEE, MMMM d')}
              </p>
              {selectedDayEvents.map((event) => (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="block w-full rounded-lg border border-accent/30 bg-accent/5 p-3 text-left transition-colors hover:bg-accent/10"
                >
                  <p className="text-sm font-semibold text-accent">{event.title}</p>
                  {event.description && (
                    <p className="mt-0.5 text-xs text-muted-foreground">{event.description}</p>
                  )}
                </Link>
              ))}
            </motion.div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {selectedDate ? 'No events on this day.' : 'Select a date to see events.'}
            </p>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
