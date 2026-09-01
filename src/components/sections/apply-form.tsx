'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { motion } from 'motion/react'
import { CheckCircle2, Plus, Upload, X } from 'lucide-react'
import { TextEffect } from '@/components/patterns/text-effect'
import { StatefulButton } from '@/components/ui/stateful-button'
import { Select, SelectTrigger, SelectValue, SelectPopup, SelectItem } from '@/components/ui/select'
import { TagInput } from '@/components/ui/tag-input'
import { RadioCardGroup, type RadioCardOption } from '@/components/ui/radio-card'
import { compressImage } from '@/lib/image-compress'
import { fileToBase64 } from '@/lib/file-to-base64'

const inputClass =
  'w-full rounded-lg border border-border bg-input px-3.5 py-2.5 text-sm outline-none transition focus:border-ring focus:ring-1 focus:ring-ring/50'

const yearOptions = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Faculty / Staff', 'Other']

// A learning centre spanning Swift/SwiftUI/ARKit/etc., not a single
// framework interview — so this asks about comfort with *their own* stack
// rather than rating React specifically, and the options read as an honest
// self-check rather than a pass/fail skill test.
const TECH_COMFORT_OPTIONS: RadioCardOption[] = [
  { value: 'comfortable', title: 'Comfortable', description: 'I can build things solo.' },
  { value: 'guided', title: 'Getting there', description: 'I can follow along, but need some guidance.' },
  { value: 'new', title: 'New to this', description: "I'm just starting out, and excited to learn." },
]

const MAX_PROJECTS = 3

interface ScreenshotState {
  base64: string
  mimeType: string
  preview: string
}

/** One project's fields. Description/links are plain uncontrolled inputs —
 *  new FormData(form) picks them up automatically at submit as long as
 *  they're mounted, no need to mirror them into React state. The
 *  screenshot is the exception: it needs client-side compression before
 *  it can travel as a form value, so it's tracked in state and written
 *  into hidden inputs once ready. */
function ProjectBlock({
  index,
  canRemove,
  onRemove,
}: {
  index: number
  canRemove: boolean
  onRemove: () => void
}) {
  const n = index + 1
  const [screenshot, setScreenshot] = useState<ScreenshotState | null>(null)
  const [uploading, setUploading] = useState(false)
  const [shotError, setShotError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setShotError(null)
    setUploading(true)
    try {
      const { base64, mimeType } = await compressImage(file)
      setScreenshot({ base64, mimeType, preview: `data:${mimeType};base64,${base64}` })
    } catch (err) {
      setShotError(err instanceof Error ? err.message : 'Could not process that image.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4 rounded-lg border border-border p-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-foreground">Project {n}</h4>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"
          >
            <X className="h-3.5 w-3.5" />
            Remove
          </button>
        )}
      </div>

      <div>
        <label htmlFor={`project${n}Description`} className="mb-1.5 block text-sm font-medium text-foreground">
          What is it?
        </label>
        <textarea
          id={`project${n}Description`}
          name={`project${n}Description`}
          required
          rows={2}
          placeholder="A short description of the project and what you built."
          className={inputClass}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`project${n}SourceLink`} className="mb-1.5 block text-sm font-medium text-foreground">
            Source / zip link
          </label>
          <input
            id={`project${n}SourceLink`}
            name={`project${n}SourceLink`}
            type="url"
            placeholder="GitHub repo, Google Drive, etc."
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor={`project${n}LiveLink`} className="mb-1.5 block text-sm font-medium text-foreground">
            Live link <span className="font-normal text-muted-foreground">(if deployed)</span>
          </label>
          <input
            id={`project${n}LiveLink`}
            name={`project${n}LiveLink`}
            type="url"
            placeholder="App Store, deployed URL, etc."
            className={inputClass}
          />
        </div>
      </div>
      <p className="-mt-2 text-xs text-muted-foreground">Provide at least one of the two links above.</p>

      <div>
        <span className="mb-1.5 block text-sm font-medium text-foreground">
          Screenshot <span className="font-normal text-muted-foreground">(optional)</span>
        </span>
        <div className="flex items-center gap-3">
          {screenshot ? (
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-border">
              <Image src={screenshot.preview} alt="" fill className="object-cover" unoptimized />
            </div>
          ) : (
            <motion.button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              className="flex h-20 w-20 shrink-0 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border text-muted-foreground transition-colors hover:border-ring hover:text-foreground disabled:pointer-events-none disabled:opacity-70"
            >
              <Upload className="h-4 w-4" />
              <span className="text-[11px]">{uploading ? 'Processing…' : 'Choose file'}</span>
            </motion.button>
          )}
          {screenshot && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Change photo
            </button>
          )}
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
        {shotError && (
          <p className="mt-1.5 text-xs text-destructive" role="alert">
            {shotError}
          </p>
        )}
      </div>

      <input type="hidden" name={`project${n}ScreenshotBase64`} value={screenshot?.base64 ?? ''} />
      <input type="hidden" name={`project${n}ScreenshotMimeType`} value={screenshot?.mimeType ?? ''} />
    </div>
  )
}

interface ResumeState {
  base64: string
  mimeType: string
  filename: string
}

export function ApplyForm() {
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [projectCount, setProjectCount] = useState(0)
  const [resume, setResume] = useState<ResumeState | null>(null)
  const [resumeUploading, setResumeUploading] = useState(false)
  const [resumeError, setResumeError] = useState<string | null>(null)
  const resumeInputRef = useRef<HTMLInputElement>(null)

  const handleResumeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setResumeError(null)
    setResumeUploading(true)
    try {
      const { base64, mimeType } = await fileToBase64(file)
      setResume({ base64, mimeType, filename: file.name })
    } catch (err) {
      setResumeError(err instanceof Error ? err.message : 'Could not process that file.')
    } finally {
      setResumeUploading(false)
    }
  }

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

      <div>
        <span className="mb-1.5 block text-sm font-medium text-foreground">
          How comfortable are you with your primary tech stack?
        </span>
        <RadioCardGroup name="techComfort" options={TECH_COMFORT_OPTIONS} />
      </div>

      <div>
        <span className="mb-1.5 block text-sm font-medium text-foreground">
          Resume <span className="font-normal text-muted-foreground">(optional)</span>
        </span>
        <div className="flex items-center gap-3">
          <motion.button
            type="button"
            onClick={() => resumeInputRef.current?.click()}
            disabled={resumeUploading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className="flex items-center gap-2 rounded-lg border border-dashed border-border px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:border-ring hover:text-foreground disabled:pointer-events-none disabled:opacity-70"
          >
            <Upload className="h-4 w-4" />
            {resumeUploading ? 'Processing…' : resume ? 'Change file' : 'Choose file'}
          </motion.button>
          {resume && !resumeUploading && (
            <span className="flex items-center gap-1.5 text-sm text-foreground">
              <CheckCircle2 className="h-4 w-4 text-accent" />
              {resume.filename}
            </span>
          )}
        </div>
        <input
          ref={resumeInputRef}
          type="file"
          accept="application/pdf"
          onChange={handleResumeChange}
          className="hidden"
        />
        {resumeError && (
          <p className="mt-1.5 text-xs text-destructive" role="alert">
            {resumeError}
          </p>
        )}
        <input type="hidden" name="resumeBase64" value={resume?.base64 ?? ''} />
        <input type="hidden" name="resumeMimeType" value={resume?.mimeType ?? ''} />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-foreground">
            Projects <span className="font-normal text-muted-foreground">(optional, up to {MAX_PROJECTS})</span>
          </label>
          {projectCount < MAX_PROJECTS && (
            <button
              type="button"
              onClick={() => setProjectCount((c) => c + 1)}
              className="flex items-center gap-1 text-sm font-medium text-accent hover:opacity-80"
            >
              <Plus className="h-4 w-4" />
              Add a project
            </button>
          )}
        </div>
        {Array.from({ length: projectCount }).map((_, idx) => (
          <ProjectBlock
            key={idx}
            index={idx}
            canRemove={idx === projectCount - 1}
            onRemove={() => setProjectCount((c) => c - 1)}
          />
        ))}
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <StatefulButton
        type="submit"
        size="lg"
        status={submitting ? 'loading' : 'idle'}
        disabled={submitting}
        className="w-full sm:w-auto"
      >
        Submit Application
      </StatefulButton>
    </form>
  )
}
