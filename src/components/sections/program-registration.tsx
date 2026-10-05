'use client'

import { useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { Modal } from '@/components/staff/modal'
import { AnimatedCtaButton, MotionButton } from '@/components/patterns/motion-link'
import { StatefulButton } from '@/components/ui/stateful-button'
import { RegistrationFields } from '@/components/sections/registration-fields'
import { isValidPhone, MISSING_DETAILS_MESSAGE } from '@/lib/event-registration'

/** The "Register" button on a program's card and the little form it opens:
 *  name, email, phone, college / department and year — nothing more. */
export function ProgramRegistration({ programId, programTitle }: { programId: string; programTitle: string }) {
  const [open, setOpen] = useState(false)
  // Re-keyed on every opening so a form that was filled in and sent starts blank next time.
  const [openings, setOpenings] = useState(0)

  return (
    <>
      <AnimatedCtaButton
        size="sm"
        aria-haspopup="dialog"
        onClick={() => {
          setOpenings((n) => n + 1)
          setOpen(true)
        }}
      >
        Register
      </AnimatedCtaButton>
      <Modal open={open} title={`Register for ${programTitle}`} onClose={() => setOpen(false)}>
        <ProgramRegistrationForm
          key={openings}
          programId={programId}
          programTitle={programTitle}
          onClose={() => setOpen(false)}
        />
      </Modal>
    </>
  )
}

function ProgramRegistrationForm({
  programId,
  programTitle,
  onClose,
}: {
  programId: string
  programTitle: string
  onClose: () => void
}) {
  const [year, setYear] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<{ email: string; already: boolean } | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    const form = new FormData(e.currentTarget)
    const field = (key: string) => form.get(key)?.toString().trim() ?? ''
    if (!year || !field('name') || !field('college')) {
      setError(MISSING_DETAILS_MESSAGE)
      return
    }
    if (!isValidPhone(field('phone'))) {
      setError('Please enter a valid phone number.')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/programs/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          programId,
          name: field('name'),
          email: field('email'),
          phone: field('phone'),
          college: field('college'),
          year,
          website: field('website'),
        }),
      })
      const body = await res.json().catch(() => null)
      if (!res.ok) throw new Error(body?.error ?? "Couldn't complete your registration. Check your connection and try again.")
      setDone({ email: field('email'), already: !!body?.alreadyRegistered })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't complete your registration. Check your connection and try again.")
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div role="status" className="space-y-4 text-center">
        <CheckCircle2 className="mx-auto h-8 w-8 text-accent" aria-hidden="true" />
        <p className="font-semibold text-foreground">
          {done.already ? "You're already registered!" : "You're registered!"}
        </p>
        <p className="text-sm text-muted-foreground">
          {done.already
            ? `${done.email} is already on the list for ${programTitle}.`
            : `We'll be in touch about ${programTitle}. A confirmation is on its way to ${done.email}.`}
        </p>
        <MotionButton type="button" onClick={onClose}>
          Done
        </MotionButton>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} aria-label={`Register for ${programTitle}`} className="relative space-y-4">
      <RegistrationFields idPrefix="prog" year={year} onYearChange={setYear} />

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2 pt-1">
        <MotionButton type="button" variant="outline" onClick={onClose}>
          Cancel
        </MotionButton>
        <StatefulButton type="submit" animated status={submitting ? 'loading' : 'idle'} disabled={submitting}>
          Register
        </StatefulButton>
      </div>
    </form>
  )
}
