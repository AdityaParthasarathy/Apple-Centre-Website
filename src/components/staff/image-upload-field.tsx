'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { motion } from 'motion/react'
import { Upload } from 'lucide-react'
import { compressImage } from '@/lib/image-compress'
import { isExternalImage } from '@/lib/utils'

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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    setUploading(true)
    try {
      const { base64, mimeType } = await compressImage(file)
      const res = await fetch('/api/staff/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64, mimeType, filename: file.name }),
      })
      const body = await res.json().catch(() => null)
      if (!res.ok) throw new Error(body?.error ?? 'Failed to upload the photo.')
      onChange(body.url as string)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not upload that image.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-foreground">
        {label}
        {required && !value ? ' (required)' : ''}
      </label>
      <div className="flex items-center gap-3">
        {value ? (
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-border">
            <Image src={value} alt="" fill className="object-cover" unoptimized={isExternalImage(value)} />
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
            <span className="text-[11px]">{uploading ? 'Uploading…' : 'Choose file'}</span>
          </motion.button>
        )}
        {value && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-70"
          >
            {uploading ? 'Uploading…' : 'Change photo'}
          </button>
        )}
      </div>
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
      {error && (
        <p className="mt-1.5 text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
