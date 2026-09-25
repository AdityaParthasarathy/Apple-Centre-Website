'use client'

import { useId, useRef, useState } from 'react'
import Image from 'next/image'
import { motion } from 'motion/react'
import { Upload } from 'lucide-react'
import { compressImage } from '@/lib/image-compress'
import { isExternalImage, cardImage } from '@/lib/utils'

/** A "choose a photo" field that uploads straight to Drive and hands back a
 *  URL — used anywhere a content type just needs one image (Events,
 *  Projects, Programs, Facilities, Team). Gallery has its own upload flow
 *  since a gallery photo IS the record being created, not one field on a
 *  larger form. */
export function ImageUploadField({
  label = 'Photo',
  required = false,
  value,
  onChange,
}: {
  label?: string
  required?: boolean
  value: string
  onChange: (url: string) => void
}) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const inputId = useId()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    setUploading(true)
    try {
      const { base64, mimeType } = await compressImage(file)
      const send = () =>
        fetch('/api/staff/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ base64, mimeType, filename: file.name }),
        })
      let res = await send()
      let body = await res.json().catch(() => null)
      // Google sometimes drops the reply to an upload; when the server says
      // nothing was saved, sending it again is safe.
      for (let again = 0; !res.ok && body?.retryable === true && again < 2; again++) {
        res = await send()
        body = await res.json().catch(() => null)
      }
      if (!res.ok) {
        // No JSON body means the failure came from the hosting platform (for
        // example the request ran out of time), not from our own route.
        throw new Error(body?.error ?? `The upload didn't finish (error ${res.status}). Please try again.`)
      }
      onChange(body.url as string)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not upload that image.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // Both buttons already carry their own dynamic, specific accessible name
  // via aria-label (built from the `label` prop, e.g. "Choose Headshot
  // photo" vs. "Choose Cover Image photo") — plain "Choose file" text
  // would be indistinguishable from every other ImageUploadField on the
  // same form. The visible text/icon are hidden from the accessibility
  // tree so they don't get read as a second, conflicting name.
  const chooseLabel = uploading ? `Uploading ${label.toLowerCase()}` : `Choose ${label.toLowerCase()}`
  const changeLabel = uploading ? `Uploading ${label.toLowerCase()}` : `Change ${label.toLowerCase()}`

  return (
    <div className="relative">
      {/* `required` used to only add "(required)" to the label — nothing
          stopped the form submitting without a photo, leaving a blank tile
          on the public page. The actual picker is a hidden file input that
          is always empty (the file is uploaded on change and only its URL
          kept), so it can't carry the constraint; this stand-in mirrors
          `value` so the browser's own validation blocks the submit instead.
          Deliberately not readOnly/disabled — both exempt an input from
          validation. */}
      {required && (
        <input
          type="text"
          required
          tabIndex={-1}
          aria-hidden="true"
          value={value}
          onChange={() => {}}
          className="pointer-events-none absolute bottom-0 left-0 h-px w-px opacity-0"
        />
      )}
      <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-foreground">
        {label}
        {required && !value ? ' (required)' : ''}
      </label>
      <div className="flex items-center gap-3">
        {value ? (
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-border">
            <Image src={cardImage(value, 240)} alt="" fill className="object-cover" unoptimized={isExternalImage(value)} />
          </div>
        ) : (
          <motion.button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            aria-label={chooseLabel}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className="flex h-20 w-20 shrink-0 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border text-muted-foreground transition-colors hover:border-ring hover:text-foreground disabled:pointer-events-none disabled:opacity-70"
          >
            <Upload className="h-4 w-4" aria-hidden="true" />
            <span className="text-[11px]" aria-hidden="true">{uploading ? 'Uploading…' : 'Choose file'}</span>
          </motion.button>
        )}
        {value && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            aria-label={changeLabel}
            className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-70"
          >
            <span aria-hidden="true">{uploading ? 'Uploading…' : 'Change photo'}</span>
          </button>
        )}
      </div>
      <input
        ref={fileInputRef}
        id={inputId}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      {error && (
        <p className="mt-1.5 text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
