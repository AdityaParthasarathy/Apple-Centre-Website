'use client'

import { useState } from 'react'
import { motion } from 'motion/react'
import { CheckCircle2, Ticket } from 'lucide-react'
import { StatefulButton } from '@/components/ui/stateful-button'
import { RegistrationFields } from '@/components/sections/registration-fields'
import { isValidPhone, MISSING_DETAILS_MESSAGE } from '@/lib/event-registration'

interface EventRegistrationProps {
  eventId: string
  eventTitle: string
  /** Total seats, if the event has a limit. */
  capacity?: number
  /** People already registered, or null if that couldn't be read. */
  registered: number | null
  /** False once the event's day has passed. */
  open: boolean
}

interface Confirmation {
  email: string
  emailed: boolean
}

export function EventRegistration({ eventId, eventTitle, capacity, registered, open }: EventRegistrationProps) {
  const [spotsLeft, setSpotsLeft] = useState<number | null>(
    capacity && registered !== null ? Math.max(0, capacity - registered) : null
  )
  const [year, setYear] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null)

  const full = spotsLeft === 0

  if (confirmation) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        role="status"
        className="rounded-lg border border-accent/30 bg-accent/5 p-5 text-center"
      >
        <CheckCircle2 className="mx-auto mb-3 h-8 w-8 text-accent" aria-hidden="true" />
        <p className="font-semibold text-foreground">You&apos;re registered!</p>
        {/* Also what a first-time student sees if Google garbled the reply to
            their sign-up and the retry found it already saved — so this can't
            claim they'd registered before, only that the seat is theirs. */}
        <p className="mt-2 text-sm text-muted-foreground">
          {confirmation.emailed
            ? `A confirmation is on its way to ${confirmation.email}.`
            : "We've saved your seat, but couldn't send the confirmation email. Please screenshot this page for your records."}
        </p>
        {spotsLeft !== null && capacity ? (
          <p className="mt-2 text-xs text-muted-foreground">
            {spotsLeft} of {capacity} spots left
          </p>
        ) : null}
      </motion.div>
    )
  }

  if (!open) {
    return (
      <div className="rounded-lg border border-border bg-card p-5 text-center">
        <p className="font-semibold text-foreground">Registration closed</p>
        <p className="mt-1 text-sm text-muted-foreground">This event has already taken place.</p>
      </div>
    )
  }

  if (full) {
    return (
      <div className="rounded-lg border border-border bg-card p-5 text-center">
        <p className="font-semibold text-foreground">This event is full</p>
        <p className="mt-1 text-sm text-muted-foreground">
          All {capacity} spots have been taken. Keep an eye on our Events page for the next one.
        </p>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const form = new FormData(e.currentTarget)
    const field = (key: string) => form.get(key)?.toString().trim() ?? ''
    const email = field('email')

    // The browser's own checks cover most of this; the year (a custom select)
    // and the phone number's shape are checked here.
    if (!year || !field('name') || !field('college')) {
      setError(MISSING_DETAILS_MESSAGE)
      setSubmitting(false)
      return
    }
    if (!isValidPhone(field('phone'))) {
      setError('Please enter a valid phone number.')
      setSubmitting(false)
      return
    }

    try {
      const res = await fetch('/api/events/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          name: field('name'),
          email,
          phone: field('phone'),
          college: field('college'),
          year,
          website: field('website'),
        }),
      })
      const body = await res.json().catch(() => null)

      if (!res.ok) {
        if (body?.full) setSpotsLeft(0)
        throw new Error(body?.error ?? "Couldn't complete your registration. Check your connection and try again.")
      }

      if (typeof body.spotsLeft === 'number') setSpotsLeft(body.spotsLeft)
      setConfirmation({ email, emailed: body.emailed !== false })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't complete your registration. Check your connection and try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      aria-label={`Register for ${eventTitle}`}
      className="space-y-4 rounded-lg border border-border bg-card p-5"
    >
      <div>
        <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
          <Ticket className="h-4 w-4 text-accent" aria-hidden="true" />
          Register for this event
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {spotsLeft !== null && capacity
            ? `${spotsLeft} of ${capacity} spots left`
            : 'Free and open to all students.'}
        </p>
      </div>

      <RegistrationFields idPrefix="reg" year={year} onYearChange={setYear} />

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <StatefulButton
        type="submit"
        size="lg"
        animated
        status={submitting ? 'loading' : 'idle'}
        disabled={submitting}
        className="w-full"
      >
        Register
      </StatefulButton>
    </form>
  )
}
