'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Pencil, Trash2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MotionButton } from '@/components/patterns/motion-link'
import { Select, SelectTrigger, SelectValue, SelectPopup, SelectItem } from '@/components/ui/select'
import { ImageUploadField } from '@/components/staff/image-upload-field'
import { ConfirmDialog } from '@/components/staff/confirm-dialog'
import { tempId, useLatest, useOptimisticList } from '@/hooks/use-optimistic-list'
import { inputClass } from '@/lib/utils'
import { formatTimeRange, parseTimeRange } from '@/lib/event-time'
import type { SheetEvent } from '@/lib/sheet-types'

const CATEGORIES: SheetEvent['category'][] = ['workshop', 'talk', 'hackathon', 'networking']

const EMPTY_FORM = {
  title: '',
  description: '',
  date: '',
  startTime: '',
  endTime: '',
  location: '',
  category: 'workshop' as SheetEvent['category'],
  image: '',
  capacity: '',
  published: true,
  pinned: false,
}

type FormState = typeof EMPTY_FORM

export function EventsManager({ initialEvents }: { initialEvents: SheetEvent[] }) {
  const list = useOptimisticList<SheetEvent>(initialEvents, {
    endpoint: '/api/staff/events',
    itemKey: 'event',
    noun: 'event',
    addAt: 'end',
  })
  const events = list.items
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const formRef = useLatest(form)

  const startEdit = (event: SheetEvent) => {
    setEditingId(event.id)
    setForm({
      title: event.title,
      description: event.description,
      date: event.date.slice(0, 10),
      startTime: parseTimeRange(event.time).start,
      endTime: parseTimeRange(event.time).end,
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
    setError(null)
    if (form.endTime && form.endTime <= form.startTime) {
      setError('The end time must be after the start time.')
      return
    }
    const payload = {
      title: form.title,
      description: form.description,
      date: form.date,
      time: formatTimeRange(form.startTime, form.endTime),
      location: form.location,
      category: form.category,
      image: form.image,
      capacity: form.capacity ? Number(form.capacity) : undefined,
      published: form.published,
      pinned: form.pinned,
    }
    const snapshot = form
    const editing = editingId
    // The form clears and the list changes at once; the save finishes behind it.
    cancelEdit()

    if (editing) {
      const previous = events.find((x) => x.id === editing)
      const result = await list.update(editing, payload, { ...previous, ...payload, id: editing } as SheetEvent)
      if (result.ok) toast.success('Event updated')
      else restoreForm(snapshot, editing, result.message)
    } else {
      const result = await list.add(payload, { ...payload, id: tempId(), createdAt: new Date().toISOString() } as SheetEvent)
      if (result.ok) toast.success('Event added')
      else restoreForm(snapshot, null, result.message)
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
      toast.success('Event deleted')
    } else {
      setError(result.message)
      toast.error(result.message)
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
              <label htmlFor="eventTitle" className="mb-1.5 block text-sm font-medium text-foreground">
                Title
              </label>
              <input
                id="eventTitle"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="eventCategory" className="mb-1.5 block text-sm font-medium text-foreground">
                Category
              </label>
              <Select
                value={form.category}
                onValueChange={(value) => setForm({ ...form, category: value as SheetEvent['category'] })}
              >
                <SelectTrigger id="eventCategory" className="capitalize">
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

          <div>
            <label htmlFor="eventDescription" className="mb-1.5 block text-sm font-medium text-foreground">
              Description
            </label>
            <textarea
              id="eventDescription"
              required
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className={inputClass}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="eventDate" className="mb-1.5 block text-sm font-medium text-foreground">
                Date
              </label>
              <input
                id="eventDate"
                type="date"
                required
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className={inputClass}
              />
            </div>
            {/* Real time pickers, not free text: letters can't be typed, and
                the two values become "2:00 PM – 5:00 PM" (see lib/event-time.ts). */}
            <div>
              <label htmlFor="eventStartTime" className="mb-1.5 block text-sm font-medium text-foreground">
                Starts at
              </label>
              <input
                id="eventStartTime"
                type="time"
                required
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="eventEndTime" className="mb-1.5 block text-sm font-medium text-foreground">
                Ends at (optional)
              </label>
              <input
                id="eventEndTime"
                type="time"
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="eventLocation" className="mb-1.5 block text-sm font-medium text-foreground">
                Location
              </label>
              <input
                id="eventLocation"
                required
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="eventCapacity" className="mb-1.5 block text-sm font-medium text-foreground">
                Capacity (optional)
              </label>
              <input
                id="eventCapacity"
                type="number"
                min={1}
                step={1}
                inputMode="numeric"
                placeholder="Leave empty for no limit"
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>

          <ImageUploadField required value={form.image} onChange={(url) => setForm({ ...form, image: url })} />

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

          <MotionButton type="submit" size="lg">
            {editingId ? 'Save changes' : 'Add event'}
          </MotionButton>
        </form>
      </Card>

      <div className="space-y-3">
        {sorted.length === 0 && (
          <p className="text-sm text-muted-foreground">No events yet — add one using the form above.</p>
        )}
        {sorted.map((event) => {
          const saving = list.pending.has(event.id)
          return (
          <Card key={event.id} className={`flex items-start justify-between gap-4 p-4 ${saving ? 'opacity-70' : ''}`} aria-busy={saving}>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-foreground">{event.title}</p>
                {saving && <span className="text-xs text-muted-foreground">Saving…</span>}
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
              <MotionButton
                variant="outline"
                size="icon-sm"
                className="size-11"
                onClick={() => startEdit(event)}
                disabled={saving}
                aria-label={`Edit "${event.title}"`}
              >
                <Pencil className="h-3.5 w-3.5" />
              </MotionButton>
              <MotionButton
                variant="outline"
                size="icon-sm"
                className="size-11"
                onClick={() => setPendingDeleteId(event.id)}
                disabled={saving}
                aria-label={`Delete "${event.title}"`}
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
        title="Delete this event?"
        description="This can't be undone."
        onConfirm={confirmDelete}
        onCancel={() => setPendingDeleteId(null)}
      />
    </div>
  )
}
