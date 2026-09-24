'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import { motion } from 'motion/react'
import { Trash2, Upload } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { MotionButton } from '@/components/patterns/motion-link'
import { Select, SelectTrigger, SelectValue, SelectPopup, SelectItem } from '@/components/ui/select'
import { compressImage } from '@/lib/image-compress'
import { ConfirmDialog } from '@/components/staff/confirm-dialog'
import { tempId, useLatest, useOptimisticList } from '@/hooks/use-optimistic-list'
import { inputClass, cardImage } from '@/lib/utils'
import type { SheetGalleryImage } from '@/lib/sheet-types'

const CATEGORIES: SheetGalleryImage['category'][] = ['workshop', 'event', 'facility', 'community']

const EMPTY_FORM = { title: '', description: '', category: 'event' as SheetGalleryImage['category'] }
type FormState = typeof EMPTY_FORM

export function GalleryManager({ initialImages }: { initialImages: SheetGalleryImage[] }) {
  const list = useOptimisticList<SheetGalleryImage>(initialImages, {
    endpoint: '/api/staff/gallery',
    itemKey: 'image',
    noun: 'photo',
  })
  const images = list.items
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [preview, setPreview] = useState<string | null>(null)
  const [pending, setPending] = useState<{ base64: string; mimeType: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pendingRef = useLatest(pending)

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
    setError(null)

    const snapshot = { form, pending, preview }
    const payload = {
      title: form.title,
      description: form.description,
      category: form.category,
      base64: pending.base64,
      mimeType: pending.mimeType,
      filename: `${form.title || 'photo'}.jpg`,
    }
    // The tile appears at once, showing the picture itself, while the upload
    // to Drive finishes behind it.
    const draft: SheetGalleryImage = {
      id: tempId(),
      title: form.title,
      description: form.description,
      category: form.category,
      image: preview ?? '',
      date: new Date().toISOString().slice(0, 10),
      createdAt: new Date().toISOString(),
    }
    resetForm()

    const result = await list.add(payload, draft)
    if (result.ok) {
      toast.success('Photo uploaded')
    } else {
      // Hand the form its typing back — unless they have already chosen another photo.
      if (pendingRef.current === null) {
        setForm(snapshot.form)
        setPending(snapshot.pending)
        setPreview(snapshot.preview)
      }
      setError(result.message)
      toast.error(result.message)
    }
  }

  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  const confirmDelete = async () => {
    const id = pendingDeleteId
    setPendingDeleteId(null)
    if (!id) return
    const result = await list.remove(id)
    if (result.ok) {
      toast.success('Photo deleted')
    } else {
      setError(result.message)
      toast.error(result.message)
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
                <label htmlFor="galleryTitle" className="mb-1.5 block text-sm font-medium text-foreground">
                  Title
                </label>
                <input
                  id="galleryTitle"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="galleryDescription" className="mb-1.5 block text-sm font-medium text-foreground">
                  Description
                </label>
                <textarea
                  id="galleryDescription"
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="galleryCategory" className="mb-1.5 block text-sm font-medium text-foreground">
                  Category
                </label>
                <Select value={form.category} onValueChange={(value) => setForm({ ...form, category: value as SheetGalleryImage['category'] })}>
                  <SelectTrigger id="galleryCategory" className="capitalize">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectPopup>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c} className="capitalize">
                        {c}
                      </SelectItem>
                    ))}
                  </SelectPopup>
                </Select>
              </div>
            </div>

            <div className="flex flex-col items-start gap-2">
              <label htmlFor="galleryPhotoInput" className="text-sm font-medium text-foreground">
                Photo
              </label>
              {preview ? (
                <div className="relative h-32 w-32 overflow-hidden rounded-lg border border-border">
                  <Image src={preview} alt="Preview" fill className="object-cover" unoptimized />
                </div>
              ) : (
                <motion.button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  aria-label="Choose photo to upload"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  className="flex h-32 w-32 flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-border text-muted-foreground transition-colors hover:border-ring hover:text-foreground"
                >
                  <Upload className="h-5 w-5" aria-hidden="true" />
                  <span className="text-xs" aria-hidden="true">Choose file</span>
                </motion.button>
              )}
              <input
                ref={fileInputRef}
                id="galleryPhotoInput"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              {preview && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  aria-label="Change photo to upload"
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
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

          <MotionButton type="submit" size="lg">
            Upload photo
          </MotionButton>
        </form>
      </Card>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {images.length === 0 && (
          <p className="text-sm text-muted-foreground">No photos yet — upload one using the form above.</p>
        )}
        {images.map((image) => {
          const saving = list.pending.has(image.id)
          return (
          <div key={image.id} className="gallery-item relative h-40 overflow-hidden rounded-lg border border-border" aria-busy={saving}>
            <Image src={cardImage(image.image, 480)} alt={image.title} fill className={`object-cover ${saving ? 'opacity-60' : ''}`} unoptimized />
            {saving && (
              <span className="absolute left-2 top-2 rounded bg-black/70 px-2 py-0.5 text-xs font-medium text-white">
                Uploading…
              </span>
            )}
            <div className="gallery-item-overlay absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 via-black/0 to-transparent p-3 opacity-0 transition-opacity duration-200">
              <p className="line-clamp-1 text-xs font-semibold text-white">{image.title}</p>
              <MotionButton
                variant="outline"
                size="icon-sm"
                onClick={() => setPendingDeleteId(image.id)}
                disabled={saving}
                aria-label={`Delete "${image.title}"`}
                className="absolute right-2 top-2 size-11 border-white/30 bg-black/40 text-white hover:bg-black/60"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </MotionButton>
            </div>
          </div>
          )
        })}
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
