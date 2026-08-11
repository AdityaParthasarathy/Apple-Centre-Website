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
import { inputClass } from '@/lib/utils'
import type { SheetProgram } from '@/lib/sheet-types'

const LEVELS: SheetProgram['level'][] = ['beginner', 'intermediate', 'advanced']

const EMPTY_FORM = {
  title: '',
  description: '',
  duration: '',
  level: 'beginner' as SheetProgram['level'],
  topics: '',
  image: '',
}
type FormState = typeof EMPTY_FORM

export function ProgramsManager({ initialPrograms }: { initialPrograms: SheetProgram[] }) {
  const [programs, setPrograms] = useState(initialPrograms)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const startEdit = (program: SheetProgram) => {
    setEditingId(program.id)
    setForm({
      title: program.title,
      description: program.description,
      duration: program.duration,
      level: program.level,
      topics: program.topics ?? '',
      image: program.image,
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

    try {
      if (editingId) {
        const res = await fetch(`/api/staff/programs/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        const body = await res.json().catch(() => null)
        if (!res.ok) throw new Error(body?.error ?? 'Failed to update the program.')
        setPrograms((prev) => prev.map((p) => (p.id === editingId ? { ...p, ...form, id: editingId } : p)))
        toast.success('Program updated')
      } else {
        const res = await fetch('/api/staff/programs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        const body = await res.json().catch(() => null)
        if (!res.ok) throw new Error(body?.error ?? 'Failed to save the program.')
        if (body?.program) setPrograms((prev) => [...prev, body.program as SheetProgram])
        toast.success('Program added')
      }
      cancelEdit()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      setError(message)
      toast.error(message)
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
      const res = await fetch(`/api/staff/programs/${id}`, { method: 'DELETE' })
      const body = await res.json().catch(() => null)
      if (!res.ok) throw new Error(body?.error ?? 'Failed to delete the program.')
      setPrograms((prev) => prev.filter((p) => p.id !== id))
      if (editingId === id) cancelEdit()
      toast.success('Program deleted')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete the program.'
      setError(message)
      toast.error(message)
    }
  }

  return (
    <div className="space-y-8">
      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-foreground">{editingId ? 'Edit program' : 'Add a program'}</h2>
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
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Duration</label>
              <input
                required
                placeholder="8 weeks"
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Level</label>
              <Select value={form.level} onValueChange={(value) => setForm({ ...form, level: value as SheetProgram['level'] })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectPopup>
                  {LEVELS.map((l) => (
                    <SelectItem key={l} value={l}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectPopup>
              </Select>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Topics (comma-separated)</label>
            <input
              placeholder="Swift, SwiftUI, Xcode"
              value={form.topics}
              onChange={(e) => setForm({ ...form, topics: e.target.value })}
              className={inputClass}
            />
          </div>
          <ImageUploadField required value={form.image} onChange={(url) => setForm({ ...form, image: url })} />

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
            {submitting ? 'Saving…' : editingId ? 'Save changes' : 'Add program'}
          </MotionButton>
        </form>
      </Card>

      <div className="space-y-3">
        {programs.length === 0 && <p className="text-sm text-muted-foreground">No programs added yet.</p>}
        {programs.map((program) => (
          <Card key={program.id} className="flex items-start justify-between gap-4 p-4">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-foreground">{program.title}</p>
                <Badge variant="secondary" className="text-xs capitalize">
                  {program.level}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{program.duration}</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <MotionButton variant="outline" size="icon-sm" className="size-11" onClick={() => startEdit(program)} aria-label="Edit">
                <Pencil className="h-3.5 w-3.5" />
              </MotionButton>
              <MotionButton variant="outline" size="icon-sm" className="size-11" onClick={() => setPendingDeleteId(program.id)} aria-label="Delete">
                <Trash2 className="h-3.5 w-3.5" />
              </MotionButton>
            </div>
          </Card>
        ))}
      </div>

      <ConfirmDialog
        open={pendingDeleteId !== null}
        title="Delete this program?"
        description="This can't be undone."
        onConfirm={confirmDelete}
        onCancel={() => setPendingDeleteId(null)}
      />
    </div>
  )
}
