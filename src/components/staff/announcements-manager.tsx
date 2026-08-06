'use client'

import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MotionButton } from '@/components/patterns/motion-link'
import { inputClass } from '@/lib/utils'
import type { SheetAnnouncement } from '@/lib/sheet-types'

const EMPTY_FORM = { title: '', body: '', published: true, pinned: false }
type FormState = typeof EMPTY_FORM

export function AnnouncementsManager({ initialAnnouncements }: { initialAnnouncements: SheetAnnouncement[] }) {
  const [announcements, setAnnouncements] = useState(initialAnnouncements)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      if (editingId) {
        const res = await fetch(`/api/staff/announcements/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        const resBody = await res.json().catch(() => null)
        if (!res.ok) throw new Error(resBody?.error ?? 'Failed to update the announcement.')
        setAnnouncements((prev) => prev.map((a) => (a.id === editingId ? { ...a, ...form } : a)))
      } else {
        const res = await fetch('/api/staff/announcements', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        const resBody = await res.json().catch(() => null)
        if (!res.ok) throw new Error(resBody?.error ?? 'Failed to save the announcement.')
        if (resBody?.announcement) setAnnouncements((prev) => [resBody.announcement as SheetAnnouncement, ...prev])
      }
      cancelEdit()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const togglePublished = async (item: SheetAnnouncement) => {
    const next = { ...item, published: !item.published }
    setAnnouncements((prev) => prev.map((a) => (a.id === item.id ? next : a)))
    try {
      const res = await fetch(`/api/staff/announcements/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: next.published }),
      })
      if (!res.ok) throw new Error()
    } catch {
      setAnnouncements((prev) => prev.map((a) => (a.id === item.id ? item : a)))
      setError('Failed to update publish state.')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this announcement? This can't be undone.")) return
    try {
      const res = await fetch(`/api/staff/announcements/${id}`, { method: 'DELETE' })
      const body = await res.json().catch(() => null)
      if (!res.ok) throw new Error(body?.error ?? 'Failed to delete the announcement.')
      setAnnouncements((prev) => prev.filter((a) => a.id !== id))
      if (editingId === id) cancelEdit()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete the announcement.')
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
            <label className="mb-1.5 block text-sm font-medium text-foreground">Title</label>
            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Body</label>
            <textarea required rows={3} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} className={inputClass} />
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

          <MotionButton
            type="submit"
            size="lg"
            disabled={submitting}
            className="disabled:pointer-events-none disabled:opacity-80"
          >
            {submitting ? 'Saving…' : editingId ? 'Save changes' : 'Post announcement'}
          </MotionButton>
        </form>
      </Card>

      <div className="space-y-3">
        {announcements.length === 0 && <p className="text-sm text-muted-foreground">No announcements yet.</p>}
        {announcements.map((item) => (
          <Card key={item.id} className="flex items-start justify-between gap-4 p-4">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-foreground">{item.title}</p>
                {item.pinned && <Badge variant="accent" className="text-xs">Pinned</Badge>}
                <Badge variant={item.published ? 'secondary' : 'muted'} className="text-xs">
                  {item.published ? 'Published' : 'Draft'}
                </Badge>
              </div>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.body}</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <MotionButton variant="outline" size="sm" onClick={() => togglePublished(item)}>
                {item.published ? 'Unpublish' : 'Publish'}
              </MotionButton>
              <MotionButton variant="outline" size="icon-sm" onClick={() => startEdit(item)} aria-label="Edit">
                <Pencil className="h-3.5 w-3.5" />
              </MotionButton>
              <MotionButton variant="outline" size="icon-sm" onClick={() => handleDelete(item.id)} aria-label="Delete">
                <Trash2 className="h-3.5 w-3.5" />
              </MotionButton>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
