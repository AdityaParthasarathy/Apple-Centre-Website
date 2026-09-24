'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Pencil, Trash2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { MotionButton } from '@/components/patterns/motion-link'
import { ImageUploadField } from '@/components/staff/image-upload-field'
import { ConfirmDialog } from '@/components/staff/confirm-dialog'
import { tempId, useLatest, useOptimisticList } from '@/hooks/use-optimistic-list'
import { inputClass } from '@/lib/utils'
import type { SheetFacility } from '@/lib/sheet-types'

const EMPTY_FORM = { title: '', description: '', image: '' }
type FormState = typeof EMPTY_FORM

export function FacilitiesManager({ initialFacilities }: { initialFacilities: SheetFacility[] }) {
  const list = useOptimisticList<SheetFacility>(initialFacilities, {
    endpoint: '/api/staff/facilities',
    itemKey: 'facility',
    noun: 'facility',
    addAt: 'end',
  })
  const facilities = list.items
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const formRef = useLatest(form)

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
      const previous = facilities.find((x) => x.id === editing)
      const result = await list.update(editing, payload, { ...previous, ...payload, id: editing } as SheetFacility)
      if (result.ok) toast.success('Facility updated')
      else restoreForm(snapshot, editing, result.message)
    } else {
      const result = await list.add(payload, { ...payload, id: tempId(), createdAt: new Date().toISOString() } as SheetFacility)
      if (result.ok) toast.success('Facility added')
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
      toast.success('Facility deleted')
    } else {
      setError(result.message)
      toast.error(result.message)
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
            <label htmlFor="facilityTitle" className="mb-1.5 block text-sm font-medium text-foreground">
              Title
            </label>
            <input
              id="facilityTitle"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="facilityDescription" className="mb-1.5 block text-sm font-medium text-foreground">
              Description
            </label>
            <textarea
              id="facilityDescription"
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

          <MotionButton type="submit" size="lg">
            {editingId ? 'Save changes' : 'Add facility'}
          </MotionButton>
        </form>
      </Card>

      <div className="space-y-3">
        {facilities.length === 0 && (
          <p className="text-sm text-muted-foreground">No facilities added yet — add one using the form above.</p>
        )}
        {facilities.map((facility) => {
          const saving = list.pending.has(facility.id)
          return (
          <Card key={facility.id} className={`flex items-start justify-between gap-4 p-4 ${saving ? 'opacity-70' : ''}`} aria-busy={saving}>
            <div>
              <p className="font-semibold text-foreground">{facility.title}</p>
              {saving && <span className="text-xs text-muted-foreground">Saving…</span>}
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{facility.description}</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <MotionButton
                variant="outline"
                size="icon-sm"
                className="size-11"
                onClick={() => startEdit(facility)}
                disabled={saving}
                aria-label={`Edit "${facility.title}"`}
              >
                <Pencil className="h-3.5 w-3.5" />
              </MotionButton>
              <MotionButton
                variant="outline"
                size="icon-sm"
                className="size-11"
                onClick={() => setPendingDeleteId(facility.id)}
                disabled={saving}
                aria-label={`Delete "${facility.title}"`}
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
        title="Delete this facility?"
        description="This can't be undone."
        onConfirm={confirmDelete}
        onCancel={() => setPendingDeleteId(null)}
      />
    </div>
  )
}
