'use client'

import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { MotionButton } from '@/components/patterns/motion-link'
import { ImageUploadField } from '@/components/staff/image-upload-field'
import { ConfirmDialog } from '@/components/staff/confirm-dialog'
import { inputClass } from '@/lib/utils'
import type { SheetTeamMember } from '@/lib/sheet-types'

const EMPTY_FORM = { name: '', role: '', bio: '', image: '', expertise: '', contact: '' }
type FormState = typeof EMPTY_FORM

export function TeamManager({ initialMembers }: { initialMembers: SheetTeamMember[] }) {
  const [members, setMembers] = useState(initialMembers)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      if (editingId) {
        const res = await fetch(`/api/staff/team/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        const body = await res.json().catch(() => null)
        if (!res.ok) throw new Error(body?.error ?? 'Failed to update the team member.')
        setMembers((prev) => prev.map((m) => (m.id === editingId ? { ...m, ...form, id: editingId } : m)))
      } else {
        const res = await fetch('/api/staff/team', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        const body = await res.json().catch(() => null)
        if (!res.ok) throw new Error(body?.error ?? 'Failed to save the team member.')
        if (body?.member) setMembers((prev) => [...prev, body.member as SheetTeamMember])
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
      const res = await fetch(`/api/staff/team/${id}`, { method: 'DELETE' })
      const body = await res.json().catch(() => null)
      if (!res.ok) throw new Error(body?.error ?? 'Failed to remove the team member.')
      setMembers((prev) => prev.filter((m) => m.id !== id))
      if (editingId === id) cancelEdit()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove the team member.')
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
              <label className="mb-1.5 block text-sm font-medium text-foreground">Name</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Role</label>
              <input
                required
                placeholder="Faculty Coordinator, Apple Centre"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Bio</label>
            <textarea required rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} className={inputClass} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <ImageUploadField label="Photo (optional)" value={form.image} onChange={(url) => setForm({ ...form, image: url })} />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Contact (optional)</label>
              <input
                placeholder="email or link"
                value={form.contact}
                onChange={(e) => setForm({ ...form, contact: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Expertise (comma-separated, optional)</label>
            <input
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

          <MotionButton
            type="submit"
            size="lg"
            disabled={submitting}
            className="disabled:pointer-events-none disabled:opacity-80"
          >
            {submitting ? 'Saving…' : editingId ? 'Save changes' : 'Add team member'}
          </MotionButton>
        </form>
      </Card>

      <div className="space-y-3">
        {members.length === 0 && <p className="text-sm text-muted-foreground">No team members added yet.</p>}
        {members.map((member) => (
          <Card key={member.id} className="flex items-start justify-between gap-4 p-4">
            <div>
              <p className="font-semibold text-foreground">{member.name}</p>
              <p className="text-sm text-muted-foreground">{member.role}</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <MotionButton variant="outline" size="icon-sm" className="size-11" onClick={() => startEdit(member)} aria-label="Edit">
                <Pencil className="h-3.5 w-3.5" />
              </MotionButton>
              <MotionButton variant="outline" size="icon-sm" className="size-11" onClick={() => setPendingDeleteId(member.id)} aria-label="Delete">
                <Trash2 className="h-3.5 w-3.5" />
              </MotionButton>
            </div>
          </Card>
        ))}
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
