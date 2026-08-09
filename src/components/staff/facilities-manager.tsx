'use client'

import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { MotionButton } from '@/components/patterns/motion-link'
import { ImageUploadField } from '@/components/staff/image-upload-field'
import { ConfirmDialog } from '@/components/staff/confirm-dialog'
import { inputClass } from '@/lib/utils'
import type { SheetFacility } from '@/lib/sheet-types'

const EMPTY_FORM = { title: '', description: '', image: '' }
type FormState = typeof EMPTY_FORM

export function FacilitiesManager({ initialFacilities }: { initialFacilities: SheetFacility[] }) {
  const [facilities, setFacilities] = useState(initialFacilities)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const startEdit = (facility: SheetFacility) => {
    setEditingId(facility.id)
    setForm({ title: facility.title, description: facility.description, image: facility.image })
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
        const res = await fetch(`/api/staff/facilities/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        const body = await res.json().catch(() => null)
        if (!res.ok) throw new Error(body?.error ?? 'Failed to update the facility.')
        setFacilities((prev) => prev.map((f) => (f.id === editingId ? { ...f, ...form, id: editingId } : f)))
      } else {
        const res = await fetch('/api/staff/facilities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        const body = await res.json().catch(() => null)
        if (!res.ok) throw new Error(body?.error ?? 'Failed to save the facility.')
        if (body?.facility) setFacilities((prev) => [...prev, body.facility as SheetFacility])
      }
      cancelEdit()
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
      const res = await fetch(`/api/staff/facilities/${id}`, { method: 'DELETE' })
      const body = await res.json().catch(() => null)
      if (!res.ok) throw new Error(body?.error ?? 'Failed to delete the facility.')
      setFacilities((prev) => prev.filter((f) => f.id !== id))
      if (editingId === id) cancelEdit()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete the facility.')
    }
  }

  return (
    <div className="space-y-8">
      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-foreground">{editingId ? 'Edit facility' : 'Add a facility'}</h2>
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
            <label className="mb-1.5 block text-sm font-medium text-foreground">Description</label>
            <textarea
              required
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <ImageUploadField required value={form.image} onChange={(url) => setForm({ ...form, image: url })} />
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
            {submitting ? 'Saving…' : editingId ? 'Save changes' : 'Add facility'}
          </MotionButton>
        </form>
      </Card>

      <div className="space-y-3">
        {facilities.length === 0 && <p className="text-sm text-muted-foreground">No facilities added yet.</p>}
        {facilities.map((facility) => (
          <Card key={facility.id} className="flex items-start justify-between gap-4 p-4">
            <div>
              <p className="font-semibold text-foreground">{facility.title}</p>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{facility.description}</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <MotionButton variant="outline" size="icon-sm" className="size-11" onClick={() => startEdit(facility)} aria-label="Edit">
                <Pencil className="h-3.5 w-3.5" />
              </MotionButton>
              <MotionButton variant="outline" size="icon-sm" className="size-11" onClick={() => setPendingDeleteId(facility.id)} aria-label="Delete">
                <Trash2 className="h-3.5 w-3.5" />
              </MotionButton>
            </div>
          </Card>
        ))}
      </div>

      <ConfirmDialog
        open={pendingDeleteId !== null}
        title="Delete this facility?"
        description="This can't be undone."
        onConfirm={confirmDelete}
        onCancel={() => setPendingDeleteId(null)}
      />
    </div>
  )
}
