'use client'

import { useState } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import { Pencil, Trash2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MotionButton } from '@/components/patterns/motion-link'
import { ImageUploadField } from '@/components/staff/image-upload-field'
import { ConfirmDialog } from '@/components/staff/confirm-dialog'
import { inputClass, isExternalImage } from '@/lib/utils'
import type { SheetAchievement } from '@/lib/sheet-types'

const EMPTY_FORM = {
  title: '',
  placement: '',
  institution: '',
  description: '',
  image: '',
}
type FormState = typeof EMPTY_FORM

// Suggestions only — placement is free text, since organisers award things
// like "Sustainable Innovation Award" or "Best Design" as well as 1st/2nd/3rd.
const PLACEMENT_SUGGESTIONS = ['1st Prize', '2nd Prize', '3rd Prize', 'Special Award']

export function AchievementsManager({ initialAchievements }: { initialAchievements: SheetAchievement[] }) {
  const [achievements, setAchievements] = useState(initialAchievements)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const startEdit = (achievement: SheetAchievement) => {
    setEditingId(achievement.id)
    setForm({
      title: achievement.title,
      placement: achievement.placement,
      institution: achievement.institution ?? '',
      description: achievement.description ?? '',
      image: achievement.image ?? '',
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

    const payload = { ...form }

    try {
      if (editingId) {
        const res = await fetch(`/api/staff/achievements/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const body = await res.json().catch(() => null)
        if (!res.ok) throw new Error(body?.error ?? 'Failed to update the achievement.')
        setAchievements((prev) => prev.map((a) => (a.id === editingId ? { ...a, ...payload, id: editingId } : a)))
        toast.success('Achievement updated')
      } else {
        const res = await fetch('/api/staff/achievements', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const body = await res.json().catch(() => null)
        if (!res.ok) throw new Error(body?.error ?? 'Failed to save the achievement.')
        if (body?.achievement) setAchievements((prev) => [body.achievement as SheetAchievement, ...prev])
        toast.success('Achievement added')
      }
      cancelEdit()
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Couldn't save the achievement. Check your connection and try again."
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
      const res = await fetch(`/api/staff/achievements/${id}`, { method: 'DELETE' })
      const body = await res.json().catch(() => null)
      if (!res.ok) throw new Error(body?.error ?? 'Failed to delete the achievement.')
      setAchievements((prev) => prev.filter((a) => a.id !== id))
      if (editingId === id) cancelEdit()
      toast.success('Achievement deleted')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete the achievement.'
      setError(message)
      toast.error(message)
    }
  }

  return (
    <div className="space-y-8">
      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-foreground">{editingId ? 'Edit achievement' : 'Add an achievement'}</h2>
          {editingId && (
            <button type="button" onClick={cancelEdit} className="text-sm text-muted-foreground hover:text-foreground">
              Cancel edit
            </button>
          )}
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="achievementTitle" className="mb-1.5 block text-sm font-medium text-foreground">
                Hackathon / competition name
              </label>
              <input
                id="achievementTitle"
                required
                placeholder="TECHSPRINT'26 Hackathon"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="achievementPlacement" className="mb-1.5 block text-sm font-medium text-foreground">
                Placement / award
              </label>
              <input
                id="achievementPlacement"
                required
                list="achievementPlacementOptions"
                placeholder="1st Prize"
                value={form.placement}
                onChange={(e) => setForm({ ...form, placement: e.target.value })}
                className={inputClass}
              />
              <datalist id="achievementPlacementOptions">
                {PLACEMENT_SUGGESTIONS.map((option) => (
                  <option key={option} value={option} />
                ))}
              </datalist>
            </div>
          </div>
          <div>
            <label htmlFor="achievementInstitution" className="mb-1.5 block text-sm font-medium text-foreground">
              Hosted by (optional)
            </label>
            <input
              id="achievementInstitution"
              placeholder="College or organisation that ran the event"
              value={form.institution}
              onChange={(e) => setForm({ ...form, institution: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="achievementDescription" className="mb-1.5 block text-sm font-medium text-foreground">
              Description (optional)
            </label>
            <textarea
              id="achievementDescription"
              rows={4}
              placeholder="Who competed, what they built, and how it went."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className={inputClass}
            />
          </div>
          <ImageUploadField
            label="Photo (optional)"
            value={form.image}
            onChange={(url) => setForm({ ...form, image: url })}
          />

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
            {submitting ? 'Saving…' : editingId ? 'Save changes' : 'Add achievement'}
          </MotionButton>
        </form>
      </Card>

      <div className="space-y-3">
        {achievements.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No achievements added through the portal yet — the ones already on the website are built in. Add a new one
            using the form above.
          </p>
        )}
        {achievements.map((achievement) => (
          <Card key={achievement.id} className="flex items-start justify-between gap-4 p-4">
            <div className="flex min-w-0 items-start gap-3">
              {achievement.image && (
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-border">
                  <Image
                    src={achievement.image}
                    alt=""
                    fill
                    className="object-cover"
                    unoptimized={isExternalImage(achievement.image)}
                  />
                </div>
              )}
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-foreground">{achievement.title}</p>
                  <Badge variant="accent" className="text-xs">{achievement.placement}</Badge>
                </div>
                {achievement.institution && (
                  <p className="mt-0.5 text-sm text-muted-foreground">{achievement.institution}</p>
                )}
                {achievement.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{achievement.description}</p>
                )}
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <MotionButton
                variant="outline"
                size="icon-sm"
                className="size-11"
                onClick={() => startEdit(achievement)}
                aria-label={`Edit "${achievement.title}"`}
              >
                <Pencil className="h-3.5 w-3.5" />
              </MotionButton>
              <MotionButton
                variant="outline"
                size="icon-sm"
                className="size-11"
                onClick={() => setPendingDeleteId(achievement.id)}
                aria-label={`Delete "${achievement.title}"`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </MotionButton>
            </div>
          </Card>
        ))}
      </div>

      <ConfirmDialog
        open={pendingDeleteId !== null}
        title="Delete this achievement?"
        description="This can't be undone."
        onConfirm={confirmDelete}
        onCancel={() => setPendingDeleteId(null)}
      />
    </div>
  )
}
