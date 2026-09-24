'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Pencil, Trash2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MotionButton } from '@/components/patterns/motion-link'
import { ConfirmDialog } from '@/components/staff/confirm-dialog'
import { tempId, useLatest, useOptimisticList } from '@/hooks/use-optimistic-list'
import { inputClass } from '@/lib/utils'
import type { SheetAnnouncement } from '@/lib/sheet-types'

const EMPTY_FORM = { title: '', body: '', published: true, pinned: false }
type FormState = typeof EMPTY_FORM

export function AnnouncementsManager({ initialAnnouncements }: { initialAnnouncements: SheetAnnouncement[] }) {
  const list = useOptimisticList<SheetAnnouncement>(initialAnnouncements, {
    endpoint: '/api/staff/announcements',
    itemKey: 'announcement',
    noun: 'announcement',
    addAt: 'start',
  })
  const announcements = list.items
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const formRef = useLatest(form)

  const startEdit = (item: SheetAnnouncement) => {
    setEditingId(item.id)
    setForm({ title: item.title, body: item.body, published: item.published, pinned: item.pinned })
    setError(null)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setError(null)
  }

  // A save that Google ends up refusing hands the form its typing back —
  // unless they have already started on something else in the meantime.
  const restoreForm = (snapshot: FormState, editing: string | null, message: string) => {
    if (JSON.stringify(formRef.current) === JSON.stringify(EMPTY_FORM)) {
      setForm(snapshot)
      setEditingId(editing)
    }
    setError(message)
    toast.error(message)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = { ...form }
    const snapshot = form
    const editing = editingId
    // The form clears and the list changes at once; the save finishes behind it.
    cancelEdit()

    if (editing) {
      const previous = announcements.find((x) => x.id === editing)
      const result = await list.update(editing, payload, { ...previous, ...payload, id: editing } as SheetAnnouncement)
      if (result.ok) toast.success('Announcement updated')
      else restoreForm(snapshot, editing, result.message)
    } else {
      const result = await list.add(payload, { ...payload, id: tempId(), createdAt: new Date().toISOString() } as SheetAnnouncement)
      if (result.ok) toast.success('Announcement posted')
      else restoreForm(snapshot, null, result.message)
    }
  }

  const togglePublished = async (item: SheetAnnouncement) => {
    const result = await list.update(item.id, { published: !item.published }, { ...item, published: !item.published })
    if (!result.ok) {
      setError('Failed to update publish state.')
      toast.error('Failed to update publish state.')
    }
  }

  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  const confirmDelete = async () => {
    const id = pendingDeleteId
    setPendingDeleteId(null)
    if (!id) return
    if (editingId === id) cancelEdit()
    const result = await list.remove(id)
    if (result.ok) {
      toast.success('Announcement deleted')
    } else {
      setError(result.message)
      toast.error(result.message)
    }
  }

  return (
    <div className="space-y-8">
      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-foreground">{editingId ? 'Edit announcement' : 'New announcement'}</h2>
          {editingId && (
            <button type="button" onClick={cancelEdit} className="text-sm text-muted-foreground hover:text-foreground">
              Cancel edit
            </button>
          )}
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="announcementTitle" className="mb-1.5 block text-sm font-medium text-foreground">
              Title
            </label>
            <input
              id="announcementTitle"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="announcementBody" className="mb-1.5 block text-sm font-medium text-foreground">
              Body
            </label>
            <textarea
              id="announcementBody"
              required
              rows={3}
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              className={inputClass}
            />
          </div>
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} />
              Published
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input type="checkbox" checked={form.pinned} onChange={(e) => setForm({ ...form, pinned: e.target.checked })} />
              Pinned (shows first)
            </label>
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <MotionButton type="submit" size="lg">
            {editingId ? 'Save changes' : 'Post announcement'}
          </MotionButton>
        </form>
      </Card>

      <div className="space-y-3">
        {announcements.length === 0 && (
          <p className="text-sm text-muted-foreground">No announcements yet — post one using the form above.</p>
        )}
        {announcements.map((item) => {
          const saving = list.pending.has(item.id)
          return (
          <Card key={item.id} className={`flex items-start justify-between gap-4 p-4 ${saving ? 'opacity-70' : ''}`} aria-busy={saving}>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-foreground">{item.title}</p>
                {saving && <span className="text-xs text-muted-foreground">Saving…</span>}
                {item.pinned && <Badge variant="accent" className="text-xs">Pinned</Badge>}
                <Badge variant={item.published ? 'secondary' : 'muted'} className="text-xs">
                  {item.published ? 'Published' : 'Draft'}
                </Badge>
              </div>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.body}</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <MotionButton variant="outline" size="sm" onClick={() => togglePublished(item)} disabled={saving}>
                {item.published ? 'Unpublish' : 'Publish'}
              </MotionButton>
              <MotionButton
                variant="outline"
                size="icon-sm"
                className="size-11"
                onClick={() => startEdit(item)}
                disabled={saving}
                aria-label={`Edit "${item.title}"`}
              >
                <Pencil className="h-3.5 w-3.5" />
              </MotionButton>
              <MotionButton
                variant="outline"
                size="icon-sm"
                className="size-11"
                onClick={() => setPendingDeleteId(item.id)}
                disabled={saving}
                aria-label={`Delete "${item.title}"`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </MotionButton>
            </div>
          </Card>
          )
        })}
      </div>

      <ConfirmDialog
        open={pendingDeleteId !== null}
        title="Delete this announcement?"
        description="This can't be undone."
        onConfirm={confirmDelete}
        onCancel={() => setPendingDeleteId(null)}
      />
    </div>
  )
}
