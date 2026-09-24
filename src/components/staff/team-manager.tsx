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
import type { SheetTeamMember } from '@/lib/sheet-types'

const EMPTY_FORM = { name: '', role: '', bio: '', image: '', expertise: '', contact: '' }
type FormState = typeof EMPTY_FORM

export function TeamManager({ initialMembers }: { initialMembers: SheetTeamMember[] }) {
  const list = useOptimisticList<SheetTeamMember>(initialMembers, {
    endpoint: '/api/staff/team',
    itemKey: 'member',
    noun: 'team member',
    addAt: 'end',
  })
  const members = list.items
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const formRef = useLatest(form)

  const startEdit = (member: SheetTeamMember) => {
    setEditingId(member.id)
    setForm({
      name: member.name,
      role: member.role,
      bio: member.bio,
      image: member.image ?? '',
      expertise: member.expertise ?? '',
      contact: member.contact ?? '',
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
      const previous = members.find((x) => x.id === editing)
      const result = await list.update(editing, payload, { ...previous, ...payload, id: editing } as SheetTeamMember)
      if (result.ok) toast.success('Team member updated')
      else restoreForm(snapshot, editing, result.message)
    } else {
      const result = await list.add(payload, { ...payload, id: tempId(), createdAt: new Date().toISOString() } as SheetTeamMember)
      if (result.ok) toast.success('Team member added')
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
      toast.success('Team member removed')
    } else {
      setError(result.message)
      toast.error(result.message)
    }
  }

  return (
    <div className="space-y-8">
      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-foreground">{editingId ? 'Edit team member' : 'Add a team member'}</h2>
          {editingId && (
            <button type="button" onClick={cancelEdit} className="text-sm text-muted-foreground hover:text-foreground">
              Cancel edit
            </button>
          )}
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="teamName" className="mb-1.5 block text-sm font-medium text-foreground">
                Name
              </label>
              <input
                id="teamName"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="teamRole" className="mb-1.5 block text-sm font-medium text-foreground">
                Role
              </label>
              <input
                id="teamRole"
                required
                placeholder="Faculty Coordinator, Apple Centre"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label htmlFor="teamBio" className="mb-1.5 block text-sm font-medium text-foreground">
              Bio
            </label>
            <textarea
              id="teamBio"
              required
              rows={3}
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              className={inputClass}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <ImageUploadField required value={form.image} onChange={(url) => setForm({ ...form, image: url })} />
            <div>
              <label htmlFor="teamContact" className="mb-1.5 block text-sm font-medium text-foreground">
                Contact (optional)
              </label>
              <input
                id="teamContact"
                placeholder="email or link"
                value={form.contact}
                onChange={(e) => setForm({ ...form, contact: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label htmlFor="teamExpertise" className="mb-1.5 block text-sm font-medium text-foreground">
              Expertise (comma-separated, optional)
            </label>
            <input
              id="teamExpertise"
              placeholder="iOS, ARKit, Mentoring"
              value={form.expertise}
              onChange={(e) => setForm({ ...form, expertise: e.target.value })}
              className={inputClass}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <MotionButton type="submit" size="lg">
            {editingId ? 'Save changes' : 'Add team member'}
          </MotionButton>
        </form>
      </Card>

      <div className="space-y-3">
        {members.length === 0 && (
          <p className="text-sm text-muted-foreground">No team members added yet — add one using the form above.</p>
        )}
        {members.map((member) => {
          const saving = list.pending.has(member.id)
          return (
          <Card key={member.id} className={`flex items-start justify-between gap-4 p-4 ${saving ? 'opacity-70' : ''}`} aria-busy={saving}>
            <div>
              <p className="font-semibold text-foreground">{member.name}</p>
              {saving && <span className="text-xs text-muted-foreground">Saving…</span>}
              <p className="text-sm text-muted-foreground">{member.role}</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <MotionButton
                variant="outline"
                size="icon-sm"
                className="size-11"
                onClick={() => startEdit(member)}
                disabled={saving}
                aria-label={`Edit "${member.name}"`}
              >
                <Pencil className="h-3.5 w-3.5" />
              </MotionButton>
              <MotionButton
                variant="outline"
                size="icon-sm"
                className="size-11"
                onClick={() => setPendingDeleteId(member.id)}
                disabled={saving}
                aria-label={`Delete "${member.name}"`}
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
        title="Remove this team member?"
        description="This can't be undone."
        onConfirm={confirmDelete}
        onCancel={() => setPendingDeleteId(null)}
      />
    </div>
  )
}
