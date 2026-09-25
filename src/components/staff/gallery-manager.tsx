'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import { motion } from 'motion/react'
import { FolderOpen, Pencil, Star, Trash2, Upload, X } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { MotionButton } from '@/components/patterns/motion-link'
import { Select, SelectTrigger, SelectValue, SelectPopup, SelectItem } from '@/components/ui/select'
import { AddItemButton } from '@/components/staff/add-item-button'
import { FolderDialog, type FolderFormValues, type PhotoCategory } from '@/components/staff/folder-dialog'
import { compressImage } from '@/lib/image-compress'
import { MAX_BATCH, preparePhotos, runPool, type PreparedPhoto } from '@/lib/prepare-photos'
import { ConfirmDialog } from '@/components/staff/confirm-dialog'
import { tempId, useLatest, useOptimisticList } from '@/hooks/use-optimistic-list'
import { cn, inputClass, cardImage, slugify } from '@/lib/utils'
import type { SheetAlbum, SheetGalleryImage } from '@/lib/sheet-types'

const CATEGORIES: PhotoCategory[] = ['workshop', 'event', 'facility', 'community']

const EMPTY_FORM = { title: '', description: '', category: 'event' as PhotoCategory, album: '' }
type FormState = typeof EMPTY_FORM

const EMPTY_FOLDER: FolderFormValues = { name: '', description: '', category: 'event', photos: [] }

const newest = (a: SheetGalleryImage, b: SheetGalleryImage) =>
  (b.createdAt ?? b.date ?? '').localeCompare(a.createdAt ?? a.date ?? '')

export function GalleryManager({
  initialImages,
  initialAlbums,
  foldersError,
}: {
  initialImages: SheetGalleryImage[]
  initialAlbums: SheetAlbum[]
  /** Set when the folder list couldn't be loaded; the folder tools are then left out. */
  foldersError: string | null
}) {
  const photos = useOptimisticList<SheetGalleryImage>(initialImages, {
    endpoint: '/api/staff/gallery',
    itemKey: 'image',
    noun: 'photo',
    retries: 2,
  })
  const folders = useOptimisticList<SheetAlbum>(initialAlbums, {
    endpoint: '/api/staff/albums',
    itemKey: 'album',
    noun: 'folder',
  })
  const images = photos.items
  const albums = folders.items
  const foldersOn = foldersError === null

  const albumById = useMemo(() => new Map(albums.map((a) => [a.id, a])), [albums])
  const photosIn = (albumId: string) => images.filter((i) => i.album === albumId).sort(newest)
  /** The photo on a folder's front: the chosen cover if it is still in the folder, else its newest photo. */
  const coverPhotoOf = (album: SheetAlbum) => {
    const inside = photosIn(album.id)
    return (album.cover ? inside.find((p) => p.image === album.cover) : undefined) ?? inside[0]
  }
  const coverOf = (album: SheetAlbum) => coverPhotoOf(album)?.image ?? ''

  const [openId, setOpenId] = useState<string | null>(null)
  const openAlbum = openId ? albumById.get(openId) ?? null : null
  const panelRef = useRef<HTMLDivElement>(null)
  const [folderDialog, setFolderDialog] = useState<
    { mode: 'new'; key: number; initial: FolderFormValues } | { mode: 'edit'; key: number; id: string; initial: FolderFormValues } | null
  >(null)
  const dialogKey = useRef(0)
  const [pendingFolderDelete, setPendingFolderDelete] = useState<string | null>(null)
  const [addCategory, setAddCategory] = useState<PhotoCategory>('event')
  const addInputRef = useRef<HTMLInputElement>(null)
  const [adding, setAdding] = useState(false)

  // ---- the single-photo form (unchanged, plus a folder to put it in) ----
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [preview, setPreview] = useState<string | null>(null)
  const [pending, setPending] = useState<{ base64: string; mimeType: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pendingRef = useLatest(pending)

  // Photos still uploading live only in this tab until Google has them.
  const uploading = photos.pending.size > 0
  useEffect(() => {
    if (!uploading) return
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [uploading])

  // Bring a folder into view when it is opened.
  useEffect(() => {
    if (openId) panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [openId])

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
      ...(form.album ? { album: form.album } : {}),
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
      album: form.album,
      image: preview ?? '',
      date: new Date().toISOString().slice(0, 10),
      createdAt: new Date().toISOString(),
    }
    resetForm()

    const result = await photos.add(payload, draft)
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
    const result = await photos.remove(id)
    if (result.ok) {
      toast.success('Photo deleted')
    } else {
      setError(result.message)
      toast.error(result.message)
    }
  }

  // ---- folders ----

  /** Puts photos into a folder, one upload at a time. Every photo's tile
   *  appears at once and fills in as Google confirms it. One at a time because
   *  that is what Google's script handles best: measured on the real Drive,
   *  three photos took 4.4-5s each in turn (14s in all) but 7-18s each side by
   *  side, with more dropped replies. */
  const uploadInto = async (album: { id: string; name: string }, category: PhotoCategory, batch: PreparedPhoto[]) => {
    const already = photosIn(album.id).length
    let failed = 0
    let firstProblem = ''

    // Every photo's tile shows now; the uploads take their turns behind them.
    const drafts = batch.map((photo, i): SheetGalleryImage => {
      const n = already + i + 1
      return {
        id: tempId(),
        title: n === 1 && batch.length === 1 ? album.name : `${album.name} · ${n}`,
        description: '',
        category,
        album: album.id,
        image: photo.preview,
        date: new Date().toISOString().slice(0, 10),
        createdAt: new Date().toISOString(),
      }
    })
    photos.stage(drafts)

    await runPool(batch, 1, async (photo, i) => {
      const draft = drafts[i]
      const result = await photos.add(
        { title: draft.title, description: '', category, album: album.id, base64: photo.base64, mimeType: photo.mimeType, filename: `${draft.title}.jpg` },
        draft,
        { staged: true }
      )
      if (!result.ok) {
        failed++
        firstProblem ||= result.message
      }
    })

    if (failed === 0) toast.success(batch.length === 1 ? 'Photo added to the folder' : `${batch.length} photos added to the folder`)
    else toast.error(`${failed} of ${batch.length} photos didn't upload. ${firstProblem}`)
  }

  const createFolder = async (values: FolderFormValues) => {
    setFolderDialog(null)
    const id = crypto.randomUUID()
    const draft: SheetAlbum = {
      id,
      name: values.name,
      slug: slugify(values.name) || 'folder',
      description: values.description,
      cover: '',
      createdAt: new Date().toISOString(),
    }
    setOpenId(id)
    const result = await folders.add({ id, name: values.name, description: values.description }, draft)
    if (!result.ok) {
      // Nothing was made: hand back the form, photos and all.
      toast.error(result.message)
      setOpenId(null)
      setFolderDialog({ mode: 'new', key: ++dialogKey.current, initial: values })
      return
    }
    toast.success(`Folder "${values.name}" created`)
    if (values.photos.length > 0) await uploadInto({ id, name: values.name }, values.category, values.photos)
  }

  const saveFolderEdit = async (id: string, values: FolderFormValues) => {
    setFolderDialog(null)
    const previous = albumById.get(id)
    if (!previous) return
    const result = await folders.update(id, { name: values.name, description: values.description }, { ...previous, name: values.name, description: values.description })
    if (result.ok) toast.success('Folder updated')
    else toast.error(result.message)
  }

  const confirmFolderDelete = async () => {
    const id = pendingFolderDelete
    setPendingFolderDelete(null)
    if (!id) return
    if (openId === id) setOpenId(null)
    const result = await folders.remove(id)
    if (result.ok) {
      // The photos stay, just outside any folder.
      photos.setItems((prev) => prev.map((p) => (p.album === id ? { ...p, album: '' } : p)))
      toast.success('Folder deleted — its photos were kept')
    } else {
      toast.error(result.message)
    }
  }

  const movePhoto = async (image: SheetGalleryImage, albumId: string) => {
    if ((image.album ?? '') === albumId) return
    const result = await photos.update(image.id, { album: albumId }, { ...image, album: albumId })
    if (result.ok) toast.success(albumId ? `Moved to "${albumById.get(albumId)?.name ?? 'the folder'}"` : 'Taken out of the folder')
    else toast.error(result.message)
  }

  const makeCover = async (album: SheetAlbum, image: SheetGalleryImage) => {
    const result = await folders.update(album.id, { cover: image.image }, { ...album, cover: image.image })
    if (result.ok) toast.success('Cover changed')
    else toast.error(result.message)
  }

  const addPhotosToOpenFolder = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (!openAlbum || files.length === 0) return
    const chosen = files.slice(0, MAX_BATCH)
    if (files.length > chosen.length) toast.error(`Only ${MAX_BATCH} photos can be added at once, so ${files.length - chosen.length} were left out.`)
    setAdding(true)
    const { photos: prepared, failed } = await preparePhotos(chosen)
    setAdding(false)
    if (failed) toast.error(`${failed} ${failed === 1 ? 'file' : 'files'} couldn't be read as pictures.`)
    if (prepared.length > 0) await uploadInto({ id: openAlbum.id, name: openAlbum.name }, addCategory, prepared)
  }

  const openNewFolderDialog = () => setFolderDialog({ mode: 'new', key: ++dialogKey.current, initial: EMPTY_FOLDER })

  return (
    <div className="space-y-10">
      {foldersError && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          Folders couldn&apos;t be loaded, so the folder tools are hidden for now. Refresh the page to try again.
        </p>
      )}

      {foldersOn && (
        <section aria-labelledby="folders-heading">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 id="folders-heading" className="text-lg font-semibold text-foreground">
                Folders
              </h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Group the photos from one event or occasion. Visitors see each folder on the public gallery.
              </p>
            </div>
            <AddItemButton label="New Folder" onClick={openNewFolderDialog} aria-label="Create a new folder" />
          </div>

          {albums.length === 0 ? (
            <p className="mt-6 text-sm text-muted-foreground">No folders yet — create one to group photos from an event.</p>
          ) : (
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {albums.map((album) => {
                const cover = coverOf(album)
                const saving = folders.pending.has(album.id)
                const count = photosIn(album.id).length
                return (
                  <button
                    key={album.id}
                    type="button"
                    onClick={() => setOpenId(openId === album.id ? null : album.id)}
                    aria-pressed={openId === album.id}
                    aria-label={`Open the folder ${album.name}`}
                    className={cn(
                      'group overflow-hidden rounded-xl border bg-card text-left transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-accent',
                      openId === album.id ? 'border-accent ring-2 ring-accent/40' : 'border-border'
                    )}
                  >
                    <div className="relative h-28 bg-muted">
                      {cover ? (
                        <Image src={cardImage(cover, 480)} alt="" fill className="object-cover" unoptimized />
                      ) : (
                        <FolderOpen className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                      )}
                      {saving && (
                        <span className="absolute left-2 top-2 rounded bg-black/70 px-2 py-0.5 text-xs font-medium text-white">Saving…</span>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="line-clamp-1 text-sm font-semibold text-foreground">{album.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {count} {count === 1 ? 'photo' : 'photos'}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {openAlbum && (
            <Card className="mt-6 scroll-mt-32 space-y-5 p-5 hover:translate-y-0" ref={panelRef}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="flex items-center gap-2 font-semibold text-foreground">
                    <FolderOpen className="h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
                    <span className="truncate">{openAlbum.name}</span>
                    {folders.pending.has(openAlbum.id) && <span className="text-xs font-normal text-muted-foreground">Saving…</span>}
                  </h3>
                  {openAlbum.description && <p className="mt-1 text-sm text-muted-foreground">{openAlbum.description}</p>}
                  <p className="mt-1 text-xs text-muted-foreground">
                    Public address: /gallery/{openAlbum.slug}
                    {photosIn(openAlbum.id).length === 0 && ' — not shown to visitors until it has a photo'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <MotionButton
                    variant="outline"
                    size="sm"
                    disabled={folders.pending.has(openAlbum.id)}
                    onClick={() =>
                      setFolderDialog({
                        mode: 'edit',
                        key: ++dialogKey.current,
                        id: openAlbum.id,
                        initial: { ...EMPTY_FOLDER, name: openAlbum.name, description: openAlbum.description },
                      })
                    }
                  >
                    <Pencil className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" /> Edit
                  </MotionButton>
                  <MotionButton
                    variant="outline"
                    size="sm"
                    disabled={folders.pending.has(openAlbum.id)}
                    onClick={() => setPendingFolderDelete(openAlbum.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" /> Delete folder
                  </MotionButton>
                  <MotionButton variant="outline" size="sm" onClick={() => setOpenId(null)} aria-label="Close this folder">
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                  </MotionButton>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <AddItemButton
                  label="Add Photos"
                  onClick={() => addInputRef.current?.click()}
                  disabled={adding || folders.pending.has(openAlbum.id)}
                  aria-label={`Add photos to ${openAlbum.name}`}
                />
                <input
                  ref={addInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={addPhotosToOpenFolder}
                  className="hidden"
                  aria-label="Choose photos to add to this folder"
                />
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  Tag them as
                  <select
                    value={addCategory}
                    onChange={(e) => setAddCategory(e.target.value as PhotoCategory)}
                    className="rounded-lg border border-border bg-input px-2.5 py-1.5 text-sm capitalize text-foreground"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </label>
                {adding && <span className="text-sm text-muted-foreground">Getting photos ready…</span>}
              </div>

              {photosIn(openAlbum.id).length === 0 ? (
                <p className="text-sm text-muted-foreground">This folder is empty. Use “Add Photos” to put pictures in it.</p>
              ) : (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {photosIn(openAlbum.id).map((image) => (
                    <PhotoTile
                      key={image.id}
                      image={image}
                      saving={photos.pending.has(image.id)}
                      albums={albums}
                      albumById={albumById}
                      isCover={coverPhotoOf(openAlbum)?.id === image.id}
                      onMove={(albumId) => movePhoto(image, albumId)}
                      onDelete={() => setPendingDeleteId(image.id)}
                      onMakeCover={() => makeCover(openAlbum, image)}
                    />
                  ))}
                </div>
              )}
            </Card>
          )}
        </section>
      )}

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
              <div className={cn('grid gap-4', foldersOn && 'sm:grid-cols-2')}>
                <div>
                  <label htmlFor="galleryCategory" className="mb-1.5 block text-sm font-medium text-foreground">
                    Category
                  </label>
                  <Select value={form.category} onValueChange={(value) => setForm({ ...form, category: value as PhotoCategory })}>
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
                {foldersOn && (
                  <div>
                    <label htmlFor="galleryFolder" className="mb-1.5 block text-sm font-medium text-foreground">
                      Folder
                    </label>
                    <select
                      id="galleryFolder"
                      value={form.album}
                      onChange={(e) => setForm({ ...form, album: e.target.value })}
                      className={inputClass}
                    >
                      <option value="">No folder</option>
                      {albums.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
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

      <section aria-labelledby="all-photos-heading">
        <h2 id="all-photos-heading" className="mb-4 font-semibold text-foreground">
          All photos
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {images.length === 0 && (
            <p className="text-sm text-muted-foreground">No photos yet — upload one using the form above.</p>
          )}
          {images.map((image) => (
            <PhotoTile
              key={image.id}
              image={image}
              saving={photos.pending.has(image.id)}
              albums={foldersOn ? albums : []}
              albumById={albumById}
              showFolder
              onMove={(albumId) => movePhoto(image, albumId)}
              onDelete={() => setPendingDeleteId(image.id)}
            />
          ))}
        </div>
      </section>

      {folderDialog && (
        <FolderDialog
          key={folderDialog.key}
          open
          mode={folderDialog.mode}
          initial={folderDialog.initial}
          onClose={() => setFolderDialog(null)}
          onSubmit={(values) => (folderDialog.mode === 'new' ? createFolder(values) : saveFolderEdit(folderDialog.id, values))}
        />
      )}

      <ConfirmDialog
        open={pendingDeleteId !== null}
        title="Delete this photo?"
        description="This can't be undone."
        onConfirm={confirmDelete}
        onCancel={() => setPendingDeleteId(null)}
      />
      <ConfirmDialog
        open={pendingFolderDelete !== null}
        title="Delete this folder?"
        description="The photos inside it are kept — they just won't be in a folder any more."
        confirmLabel="Delete folder"
        onConfirm={confirmFolderDelete}
        onCancel={() => setPendingFolderDelete(null)}
      />
    </div>
  )
}

/** One photo with its hover controls: move to another folder, make it a
 *  folder's cover, delete. */
function PhotoTile({
  image,
  saving,
  albums,
  albumById,
  isCover,
  showFolder,
  onMove,
  onDelete,
  onMakeCover,
}: {
  image: SheetGalleryImage
  saving: boolean
  albums: SheetAlbum[]
  albumById: Map<string, SheetAlbum>
  isCover?: boolean
  showFolder?: boolean
  onMove: (albumId: string) => void
  onDelete: () => void
  onMakeCover?: () => void
}) {
  const folder = image.album ? albumById.get(image.album) : undefined
  return (
    <div className="gallery-item relative h-40 overflow-hidden rounded-lg border border-border" aria-busy={saving}>
      <Image src={cardImage(image.image, 480)} alt={image.title} fill className={cn('object-cover', saving && 'opacity-60')} unoptimized />
      {saving ? (
        <span className="absolute left-2 top-2 rounded bg-black/70 px-2 py-0.5 text-xs font-medium text-white">Uploading…</span>
      ) : isCover ? (
        <span className="absolute left-2 top-2 flex items-center gap-1 rounded bg-black/70 px-2 py-0.5 text-xs font-medium text-white">
          <Star className="h-3 w-3 fill-current" aria-hidden="true" /> Cover
        </span>
      ) : showFolder && folder ? (
        <span className="absolute left-2 top-2 flex max-w-[70%] items-center gap-1 rounded bg-black/70 px-2 py-0.5 text-xs font-medium text-white">
          <FolderOpen className="h-3 w-3 shrink-0" aria-hidden="true" /> <span className="truncate">{folder.name}</span>
        </span>
      ) : null}
      <div className="gallery-item-overlay absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 via-black/0 to-transparent p-3 opacity-0 transition-opacity duration-200">
        <p className="line-clamp-1 text-xs font-semibold text-white">{image.title}</p>
        <div className="mt-1 flex items-center gap-1.5">
          {albums.length > 0 && (
            <select
              aria-label={`Move "${image.title}" to a folder`}
              value={folder ? folder.id : ''}
              disabled={saving}
              onChange={(e) => onMove(e.target.value)}
              className="min-w-0 flex-1 rounded border border-white/30 bg-black/50 px-1.5 py-1 text-xs text-white"
            >
              <option value="" className="text-black">
                No folder
              </option>
              {albums.map((a) => (
                <option key={a.id} value={a.id} className="text-black">
                  {a.name}
                </option>
              ))}
            </select>
          )}
          {onMakeCover && !isCover && (
            <MotionButton
              variant="outline"
              size="icon-sm"
              onClick={onMakeCover}
              disabled={saving}
              aria-label={`Make "${image.title}" the folder's cover`}
              className="size-8 shrink-0 border-white/30 bg-black/40 text-white hover:bg-black/60"
            >
              <Star className="h-3.5 w-3.5" />
            </MotionButton>
          )}
        </div>
        <MotionButton
          variant="outline"
          size="icon-sm"
          onClick={onDelete}
          disabled={saving}
          aria-label={`Delete "${image.title}"`}
          className="absolute right-2 top-2 size-11 border-white/30 bg-black/40 text-white hover:bg-black/60"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </MotionButton>
      </div>
    </div>
  )
}
