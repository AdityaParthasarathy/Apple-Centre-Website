'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { motion } from 'motion/react'
import { Trash2, Upload } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { MotionButton } from '@/components/patterns/motion-link'
import { Select, SelectTrigger, SelectValue, SelectPopup, SelectItem } from '@/components/ui/select'
import { compressImage } from '@/lib/image-compress'
import { ConfirmDialog } from '@/components/staff/confirm-dialog'
import { inputClass } from '@/lib/utils'
import type { SheetGalleryImage } from '@/lib/sheet-types'

const CATEGORIES: SheetGalleryImage['category'][] = ['workshop', 'event', 'facility', 'community']

const EMPTY_FORM = { title: '', description: '', category: 'event' as SheetGalleryImage['category'] }
type FormState = typeof EMPTY_FORM

export function GalleryManager({ initialImages }: { initialImages: SheetGalleryImage[] }) {
  const [images, setImages] = useState(initialImages)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [preview, setPreview] = useState<string | null>(null)
  const [pending, setPending] = useState<{ base64: string; mimeType: string } | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    try {
      const compressed = await compressImage(file)
      setPending(compressed)
      setPreview(`data:${compressed.mimeType};base64,${compressed.base64}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not process that image.')
    }
  }

  const resetForm = () => {
    setForm(EMPTY_FORM)
    setPending(null)
    setPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pending) {
      setError('Choose a photo to upload.')
      return
    }
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/staff/gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          category: form.category,
          base64: pending.base64,
          mimeType: pending.mimeType,
          filename: `${form.title || 'photo'}.jpg`,
        }),
      })
      const body = await res.json().catch(() => null)
      if (!res.ok) throw new Error(body?.error ?? 'Failed to upload the photo.')
      if (body?.image) setImages((prev) => [body.image as SheetGalleryImage, ...prev])
      resetForm()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  const confirmDelete = async () => {
    const id = pendingDeleteId
    setPendingDeleteId(null)
    if (!id) return
    try {
      const res = await fetch(`/api/staff/gallery/${id}`, { method: 'DELETE' })
      const body = await res.json().catch(() => null)
      if (!res.ok) throw new Error(body?.error ?? 'Failed to delete the photo.')
      setImages((prev) => prev.filter((img) => img.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete the photo.')
    }
  }

  return (
    <div className="space-y-8">
      <Card className="p-5">
        <h2 className="mb-4 font-semibold text-foreground">Upload a photo</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-start">
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Title</label>
                <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Description</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Category</label>
                <Select value={form.category} onValueChange={(value) => setForm({ ...form, category: value as SheetGalleryImage['category'] })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectPopup>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectPopup>
                </Select>
              </div>
            </div>

            <div className="flex flex-col items-start gap-2">
              <span className="text-sm font-medium text-foreground">Photo</span>
              {preview ? (
                <div className="relative h-32 w-32 overflow-hidden rounded-lg border border-border">
                  <Image src={preview} alt="Preview" fill className="object-cover" unoptimized />
                </div>
              ) : (
                <motion.button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  className="flex h-32 w-32 flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-border text-muted-foreground transition-colors hover:border-ring hover:text-foreground"
                >
                  <Upload className="h-5 w-5" />
                  <span className="text-xs">Choose file</span>
                </motion.button>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              {preview && (
                <button type="button" onClick={() => fileInputRef.current?.click()} className="text-xs text-muted-foreground hover:text-foreground">
                  Change photo
                </button>
              )}
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <MotionButton
            type="submit"
            size="lg"
            disabled={submitting}
            className="disabled:pointer-events-none disabled:opacity-80"
          >
            {submitting ? 'Uploading…' : 'Upload photo'}
          </MotionButton>
        </form>
      </Card>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {images.length === 0 && <p className="text-sm text-muted-foreground">No photos yet.</p>}
        {images.map((image) => (
          <div key={image.id} className="group relative h-40 overflow-hidden rounded-lg border border-border">
            <Image src={image.image} alt={image.title} fill className="object-cover" unoptimized />
            <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 via-black/0 to-transparent p-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              <p className="line-clamp-1 text-xs font-semibold text-white">{image.title}</p>
              <MotionButton
                variant="outline"
                size="icon-sm"
                onClick={() => setPendingDeleteId(image.id)}
                aria-label="Delete photo"
                className="absolute right-2 top-2 size-11 border-white/30 bg-black/40 text-white hover:bg-black/60"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </MotionButton>
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={pendingDeleteId !== null}
        title="Delete this photo?"
        description="This can't be undone."
        onConfirm={confirmDelete}
        onCancel={() => setPendingDeleteId(null)}
      />
    </div>
  )
}
