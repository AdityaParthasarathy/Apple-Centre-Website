'use client'

import { useState } from 'react'
import { motion } from 'motion/react'
import { CheckCircle2 } from 'lucide-react'
import { TextEffect } from '@/components/patterns/text-effect'
import { TextMorph } from '@/components/core/text-morph'
import { buttonVariants } from '@/components/ui/button'
import { Select, SelectTrigger, SelectValue, SelectPopup, SelectItem } from '@/components/ui/select'
import { TagInput } from '@/components/ui/tag-input'
import { cn } from '@/lib/utils'

const inputClass =
  'w-full rounded-lg border border-border bg-input px-3.5 py-2.5 text-sm outline-none transition focus:border-ring focus:ring-1 focus:ring-ring/50'

const yearOptions = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Faculty / Staff', 'Other']

export function ApplyForm() {
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      const formData = new FormData(e.currentTarget)
      const res = await fetch('/api/apply', { method: 'POST', body: formData })

      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error ?? 'Something went wrong. Please try again.')
      }

      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-lg border border-accent/30 bg-accent/5 p-8 text-center"
      >
        <CheckCircle2 className="mx-auto mb-3 h-8 w-8 text-accent" />
        <TextEffect
          as="p"
          per="char"
          preset="scale"
          speedReveal={2}
          className="font-semibold text-foreground"
        >
          Application received!
        </TextEffect>
        <p className="mt-2 text-sm text-muted-foreground">
          The Apple Centre team has been notified and will review your application shortly.
        </p>
      </motion.div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-foreground">
            Full Name
          </label>
          <input id="name" name="name" type="text" required className={inputClass} />
        </div>
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-foreground">
            Email
          </label>
          <input id="email" name="email" type="email" required className={inputClass} />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-foreground">
            Phone Number
          </label>
          <input id="phone" name="phone" type="tel" className={inputClass} />
        </div>
        <div>
          <label htmlFor="year" className="mb-1.5 block text-sm font-medium text-foreground">
            Year
          </label>
          <Select name="year" required>
            <SelectTrigger id="year">
              <SelectValue placeholder="Select your year" />
            </SelectTrigger>
            <SelectPopup>
              {yearOptions.map((year) => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectPopup>
          </Select>
        </div>
      </div>

      <div>
        <label htmlFor="skills" className="mb-1.5 block text-sm font-medium text-foreground">
          Skills
        </label>
        <TagInput
          name="skills"
          placeholder="Type a skill and press Enter (e.g. Swift, Figma, Python)"
        />
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className={cn(
          buttonVariants({ size: 'lg' }),
          'w-full sm:w-auto disabled:pointer-events-none disabled:opacity-80'
        )}
      >
        <TextMorph>{submitting ? 'Submitting...' : 'Submit Application'}</TextMorph>
      </button>
    </form>
  )
}
