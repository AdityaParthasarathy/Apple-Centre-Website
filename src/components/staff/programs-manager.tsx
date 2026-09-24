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
  const list = useOptimisticList<SheetProgram>(initialPrograms, {
    endpoint: '/api/staff/programs',
    itemKey: 'program',
    noun: 'program',
    addAt: 'end',
  })
  const programs = list.items
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const formRef = useLatest(form)

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
      const previous = programs.find((x) => x.id === editing)
      const result = await list.update(editing, payload, { ...previous, ...payload, id: editing } as SheetProgram)
      if (result.ok) toast.success('Program updated')
      else restoreForm(snapshot, editing, result.message)
    } else {
      const result = await list.add(payload, { ...payload, id: tempId(), createdAt: new Date().toISOString() } as SheetProgram)
      if (result.ok) toast.success('Program added')
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
      toast.success('Program deleted')
    } else {
      setError(result.message)
      toast.error(result.message)
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
            <label htmlFor="programTitle" className="mb-1.5 block text-sm font-medium text-foreground">
              Title
            </label>
            <input
              id="programTitle"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="programDescription" className="mb-1.5 block text-sm font-medium text-foreground">
              Description
            </label>
            <textarea
              id="programDescription"
              required
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className={inputClass}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="programDuration" className="mb-1.5 block text-sm font-medium text-foreground">
                Duration
              </label>
              <input
                id="programDuration"
                required
                placeholder="8 weeks"
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="programLevel" className="mb-1.5 block text-sm font-medium text-foreground">
                Level
              </label>
              <Select value={form.level} onValueChange={(value) => setForm({ ...form, level: value as SheetProgram['level'] })}>
                <SelectTrigger id="programLevel" className="capitalize">
                  <SelectValue />
                </SelectTrigger>
                <SelectPopup>
                  {LEVELS.map((l) => (
                    <SelectItem key={l} value={l} className="capitalize">
                      {l}
                    </SelectItem>
                  ))}
                </SelectPopup>
              </Select>
            </div>
          </div>
          <div>
            <label htmlFor="programTopics" className="mb-1.5 block text-sm font-medium text-foreground">
              Topics (comma-separated)
            </label>
            <input
              id="programTopics"
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

          <MotionButton type="submit" size="lg">
            {editingId ? 'Save changes' : 'Add program'}
          </MotionButton>
        </form>
      </Card>

      <div className="space-y-3">
        {programs.length === 0 && (
          <p className="text-sm text-muted-foreground">No programs added yet — add one using the form above.</p>
        )}
        {programs.map((program) => {
          const saving = list.pending.has(program.id)
          return (
          <Card key={program.id} className={`flex items-start justify-between gap-4 p-4 ${saving ? 'opacity-70' : ''}`} aria-busy={saving}>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-foreground">{program.title}</p>
                {saving && <span className="text-xs text-muted-foreground">Saving…</span>}
                <Badge variant="secondary" className="text-xs capitalize">
                  {program.level}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{program.duration}</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <MotionButton
                variant="outline"
                size="icon-sm"
                className="size-11"
                onClick={() => startEdit(program)}
                disabled={saving}
                aria-label={`Edit "${program.title}"`}
              >
                <Pencil className="h-3.5 w-3.5" />
              </MotionButton>
              <MotionButton
                variant="outline"
                size="icon-sm"
                className="size-11"
                onClick={() => setPendingDeleteId(program.id)}
                disabled={saving}
                aria-label={`Delete "${program.title}"`}
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
        title="Delete this program?"
        description="This can't be undone."
        onConfirm={confirmDelete}
        onCancel={() => setPendingDeleteId(null)}
      />
    </div>
  )
}
