'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { Upload, X } from 'lucide-react'
import { Modal } from '@/components/staff/modal'
import { MotionButton } from '@/components/patterns/motion-link'
import { Select, SelectTrigger, SelectValue, SelectPopup, SelectItem } from '@/components/ui/select'
import { inputClass } from '@/lib/utils'
import { MAX_BATCH, preparePhotos, type PreparedPhoto } from '@/lib/prepare-photos'
import type { SheetGalleryImage } from '@/lib/sheet-types'

export type PhotoCategory = SheetGalleryImage['category']
const CATEGORIES: PhotoCategory[] = ['workshop', 'event', 'facility', 'community']

export interface FolderFormValues {
  name: string
  description: string
  category: PhotoCategory
  photos: PreparedPhoto[]
}

/** Making a folder (with the photos that go in it) or renaming one. Photos
 *  can only be chosen when making it; a folder that exists gets more from its
 *  own "Add Photos" button. */
export function FolderDialog({
  open,
  mode,
  initial,
  onSubmit,
  onClose,
}: {
  open: boolean
  mode: 'new' | 'edit'
  initial: FolderFormValues
  onSubmit: (values: FolderFormValues) => void
  onClose: () => void
}) {
  const [name, setName] = useState(initial.name)
  const [description, setDescription] = useState(initial.description)
  const [category, setCategory] = useState<PhotoCategory>(initial.category)
  const [photos, setPhotos] = useState<PreparedPhoto[]>(initial.photos)
  const [preparing, setPreparing] = useState<{ done: number; total: number } | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const chooseFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (files.length === 0) return
    setNotice(null)

    const room = MAX_BATCH - photos.length
    const chosen = files.slice(0, Math.max(0, room))
    setPreparing({ done: 0, total: chosen.length })
    const { photos: prepared, failed } = await preparePhotos(chosen, (done) => setPreparing({ done, total: chosen.length }))
    setPreparing(null)
    setPhotos((prev) => [...prev, ...prepared])

    const problems = []
    if (files.length > chosen.length) problems.push(`Only ${MAX_BATCH} photos can be added at once, so ${files.length - chosen.length} were left out.`)
    if (failed) problems.push(`${failed} ${failed === 1 ? 'file' : 'files'} couldn't be read as pictures.`)
    if (problems.length) setNotice(problems.join(' '))
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || preparing) return
    onSubmit({ name: name.trim(), description: description.trim(), category, photos })
  }

  const label =
    mode === 'edit'
      ? 'Save changes'
      : photos.length === 0
        ? 'Create folder'
        : `Create folder with ${photos.length} ${photos.length === 1 ? 'photo' : 'photos'}`

  return (
    <Modal open={open} title={mode === 'new' ? 'New folder' : 'Edit folder'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label htmlFor="folderName" className="mb-1.5 block text-sm font-medium text-foreground">
            Folder name
          </label>
          <input
            id="folderName"
            required
            maxLength={80}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Energize Hackathon 2026"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="folderDescription" className="mb-1.5 block text-sm font-medium text-foreground">
            Description <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <textarea
            id="folderDescription"
            rows={2}
            maxLength={300}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={inputClass}
          />
        </div>

        {mode === 'new' && (
          <>
            <div>
              <label htmlFor="folderCategory" className="mb-1.5 block text-sm font-medium text-foreground">
                Category for these photos
              </label>
              <Select value={category} onValueChange={(value) => setCategory(value as PhotoCategory)}>
                <SelectTrigger id="folderCategory" className="capitalize">
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

            <div>
              <span className="mb-1.5 block text-sm font-medium text-foreground">Photos</span>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                {photos.map((photo) => (
                  <div key={photo.key} className="relative aspect-square overflow-hidden rounded-lg border border-border">
                    <Image src={photo.preview} alt={photo.name} fill className="object-cover" unoptimized />
                    <button
                      type="button"
                      onClick={() => setPhotos((prev) => prev.filter((p) => p.key !== photo.key))}
                      aria-label={`Remove ${photo.name}`}
                      className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={preparing !== null || photos.length >= MAX_BATCH}
                  className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border text-muted-foreground transition-colors hover:border-ring hover:text-foreground disabled:opacity-60"
                >
                  <Upload className="h-5 w-5" aria-hidden="true" />
                  <span className="text-xs">{photos.length === 0 ? 'Choose photos' : 'Add more'}</span>
                </button>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={chooseFiles} className="hidden" aria-label="Choose photos for this folder" />
              <p className="mt-2 text-xs text-muted-foreground" aria-live="polite">
                {preparing
                  ? `Getting photos ready… ${preparing.done} of ${preparing.total}`
                  : photos.length === 0
                    ? 'You can add photos now, or later from the folder itself.'
                    : `${photos.length} ${photos.length === 1 ? 'photo' : 'photos'} ready. The first one becomes the folder's cover, and you can change that afterwards.`}
              </p>
              {notice && (
                <p className="mt-1 text-xs text-destructive" role="alert">
                  {notice}
                </p>
              )}
            </div>
          </>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <MotionButton type="button" variant="outline" onClick={onClose}>
            Cancel
          </MotionButton>
          <MotionButton type="submit" disabled={!name.trim() || preparing !== null}>
            {label}
          </MotionButton>
        </div>
      </form>
    </Modal>
  )
}
