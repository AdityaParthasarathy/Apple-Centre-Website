'use client'

import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MotionButton } from '@/components/patterns/motion-link'
import { Select, SelectTrigger, SelectValue, SelectPopup, SelectItem } from '@/components/ui/select'
import { ImageUploadField } from '@/components/staff/image-upload-field'
import { inputClass } from '@/lib/utils'
import type { SheetEvent } from '@/lib/sheet-types'

const CATEGORIES: SheetEvent['category'][] = ['workshop', 'talk', 'hackathon', 'networking']

const EMPTY_FORM = {
  title: '',
  description: '',
  date: '',
  time: '',
  location: '',
  category: 'workshop' as SheetEvent['category'],
  image: '',
  capacity: '',
  published: true,
  pinned: false,
}

type FormState = typeof EMPTY_FORM

export function EventsManager({ initialEvents }: { initialEvents: SheetEvent[] }) {
  const [events, setEvents] = useState(initialEvents)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const startEdit = (event: SheetEvent) => {
    setEditingId(event.id)
    setForm({
      title: event.title,
      description: event.description,
      date: event.date.slice(0, 10),
      time: event.time,
      location: event.location,
      category: event.category,
      image: event.image,
      capacity: event.capacity ? String(event.capacity) : '',
      published: event.published !== false,
      pinned: !!event.pinned,
    })
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

    const payload = {
      title: form.title,
      description: form.description,
      date: form.date,
      time: form.time,
      location: form.location,
      category: form.category,
      image: form.image,
      capacity: form.capacity ? Number(form.capacity) : undefined,
      published: form.published,
      pinned: form.pinned,
    }

    try {
      if (editingId) {
        const res = await fetch(`/api/staff/events/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const body = await res.json().catch(() => null)
        if (!res.ok) throw new Error(body?.error ?? 'Failed to update the event.')
        setEvents((prev) => prev.map((ev) => (ev.id === editingId ? { ...ev, ...payload, id: editingId } : ev)))
      } else {
        const res = await fetch('/api/staff/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const body = await res.json().catch(() => null)
        if (!res.ok) throw new Error(body?.error ?? 'Failed to save the event.')
        if (body?.event) setEvents((prev) => [...prev, body.event as SheetEvent])
      }
      cancelEdit()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this event? This can\'t be undone.')) return
    try {
      const res = await fetch(`/api/staff/events/${id}`, { method: 'DELETE' })
      const body = await res.json().catch(() => null)
      if (!res.ok) throw new Error(body?.error ?? 'Failed to delete the event.')
      setEvents((prev) => prev.filter((ev) => ev.id !== id))
      if (editingId === id) cancelEdit()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete the event.')
    }
  }

  const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date))

  return (
    <div className="space-y-8">
      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-foreground">{editingId ? 'Edit event' : 'Add an event'}</h2>
          {editingId && (
            <button type="button" onClick={cancelEdit} className="text-sm text-muted-foreground hover:text-foreground">
              Cancel edit
            </button>
          )}
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Title</label>
              <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Category</label>
              <Select
                value={form.category}
                onValueChange={(value) => setForm({ ...form, category: value as SheetEvent['category'] })}
              >
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

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Description</label>
            <textarea
              required
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className={inputClass}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Date</label>
              <input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Time</label>
              <input
                required
                placeholder="2:00 PM – 5:00 PM"
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Capacity (optional)</label>
              <input type="number" min={0} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} className={inputClass} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Location</label>
              <input required value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className={inputClass} />
            </div>
            <ImageUploadField required value={form.image} onChange={(url) => setForm({ ...form, image: url })} />
          </div>

          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={form.published}
                onChange={(e) => setForm({ ...form, published: e.target.checked })}
              />
              Published
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={form.pinned}
                onChange={(e) => setForm({ ...form, pinned: e.target.checked })}
              />
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
            {submitting ? 'Saving…' : editingId ? 'Save changes' : 'Add event'}
          </MotionButton>
        </form>
      </Card>

      <div className="space-y-3">
        {sorted.length === 0 && <p className="text-sm text-muted-foreground">No events yet.</p>}
        {sorted.map((event) => (
          <Card key={event.id} className="flex items-start justify-between gap-4 p-4">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-foreground">{event.title}</p>
                <Badge variant="secondary" className="text-xs capitalize">
                  {event.category}
                </Badge>
                {event.pinned && <Badge variant="accent" className="text-xs">Pinned</Badge>}
                {event.published === false && (
                  <Badge variant="muted" className="text-xs">Draft</Badge>
                )}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {event.date} · {event.time} · {event.location}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <MotionButton variant="outline" size="icon-sm" onClick={() => startEdit(event)} aria-label="Edit">
                <Pencil className="h-3.5 w-3.5" />
              </MotionButton>
              <MotionButton variant="outline" size="icon-sm" onClick={() => handleDelete(event.id)} aria-label="Delete">
                <Trash2 className="h-3.5 w-3.5" />
              </MotionButton>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
