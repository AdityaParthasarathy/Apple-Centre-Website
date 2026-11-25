'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Pencil, Trash2, UserCheck } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { MotionButton } from '@/components/patterns/motion-link'
import { ImageUploadField } from '@/components/staff/image-upload-field'
import { ConfirmDialog } from '@/components/staff/confirm-dialog'
import { usePersistentState } from '@/hooks/use-persistent-state'
import { tempId, useLatest, useOptimisticList } from '@/hooks/use-optimistic-list'
import { TagInput, parseTags, tagsToText } from '@/components/ui/tag-input'
import { Select, SelectTrigger, SelectValue, SelectPopup, SelectItem } from '@/components/ui/select'
import { SuggestInput } from '@/components/ui/suggest-input'
import { inputClass } from '@/lib/utils'
import { DEPARTMENTS } from '@/lib/departments'
import type { SheetProject } from '@/lib/sheet-types'
import type { MemberSession } from '@/lib/member-session'

const EMPTY_FORM = {
  title: '',
  description: '',
  team: '',
  technologies: '',
  image: '',
  link: '',
  githubLink: '',
  memberName: '',
  enrollment: '',
  department: '',
  studyYear: '',
  mentorName: '',
  mentorDepartment: '',
  mentorPosition: '',
  mentorEmail: '',
  mentorPhone: '',
}
type FormState = typeof EMPTY_FORM

const YEARS = [
  { value: '1', label: '1st year' },
  { value: '2', label: '2nd year' },
  { value: '3', label: '3rd year' },
  { value: '4', label: '4th year' },
]

const labelClass = 'mb-1.5 block text-sm font-medium text-foreground'

export function MemberProjectsManager({
  initialProjects,
  member,
}: {
  initialProjects: SheetProject[]
  member: MemberSession
}) {
  const list = useOptimisticList<SheetProject>(initialProjects, {
    endpoint: '/api/members/projects',
    itemKey: 'project',
    noun: 'project',
    addAt: 'end',
  })
  const projects = list.items
  const [form, setForm] = usePersistentState<FormState>('members-draft:projects', EMPTY_FORM)
  const [editingId, setEditingId] = usePersistentState<string | null>('members-draft:projects:editing', null)
  const [error, setError] = useState<string | null>(null)
  const formRef = useLatest(form)

  const startEdit = (project: SheetProject) => {
    setEditingId(project.id)
    setForm({
      title: project.title,
      description: project.description,
      team: project.team ?? '',
      technologies: project.technologies ?? '',
      image: project.image ?? '',
      link: project.link ?? '',
      githubLink: project.githubLink ?? '',
      memberName: project.memberName ?? '',
      enrollment: project.enrollment ?? '',
      department: project.department ?? '',
      studyYear: project.studyYear ?? '',
      mentorName: project.mentorName ?? '',
      mentorDepartment: project.mentorDepartment ?? '',
      mentorPosition: project.mentorPosition ?? '',
      mentorEmail: project.mentorEmail ?? '',
      mentorPhone: project.mentorPhone ?? '',
    })
    setError(null)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setError(null)
  }

  const autofill = () => {
    setForm({ ...form, memberName: member.name, enrollment: member.enrollment, department: member.department })
    toast.success('Filled in your name, enrollment number and department')
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
    // The year is picked from a custom list, which the browser can't check as "required".
    if (!form.studyYear) {
      setError('Choose your year of study.')
      document.getElementById('projectStudyYear')?.focus()
      return
    }
    const payload = { ...form }
    const snapshot = form
    const editing = editingId
    // The form clears and the list changes at once; the save finishes behind it.
    cancelEdit()

    if (editing) {
      const previous = projects.find((x) => x.id === editing)
      const result = await list.update(editing, payload, { ...previous, ...payload, id: editing } as SheetProject)
      if (result.ok) toast.success('Project updated')
      else restoreForm(snapshot, editing, result.message)
    } else {
      const result = await list.add(payload, { ...payload, id: tempId(), createdAt: new Date().toISOString() } as SheetProject)
      if (result.ok) toast.success('Project added')
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
      toast.success('Project deleted')
    } else {
      setError(result.message)
      toast.error(result.message)
    }
  }

  return (
    <div className="space-y-8">
      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-foreground">{editingId ? 'Edit project' : 'Add a project'}</h2>
          {editingId && (
            <button type="button" onClick={cancelEdit} className="text-sm text-muted-foreground hover:text-foreground">
              Cancel edit
            </button>
          )}
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="projectTitle" className={labelClass}>
              Title
            </label>
            <input
              id="projectTitle"
              required
              maxLength={120}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="projectDescription" className={labelClass}>
              Description
            </label>
            <textarea
              id="projectDescription"
              required
              rows={3}
              maxLength={2000}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className={inputClass}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="projectTeam" className={labelClass}>
                Team (comma-separated)
              </label>
              <input
                id="projectTeam"
                maxLength={300}
                placeholder="Ada Lovelace, Alan Turing"
                value={form.team}
                onChange={(e) => setForm({ ...form, team: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="projectTechnologies" className={labelClass}>
                Technologies
              </label>
              <TagInput
                id="projectTechnologies"
                placeholder="Type a technology and press Enter (e.g. Swift)"
                value={parseTags(form.technologies)}
                onValueChange={(tags) => setForm({ ...form, technologies: tagsToText(tags) })}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <ImageUploadField
              required
              endpoint="/api/members/upload"
              value={form.image}
              onChange={(url) => setForm({ ...form, image: url })}
            />
            <div className="space-y-4">
              <div>
                <label htmlFor="projectLink" className={labelClass}>
                  Link
                </label>
                <input
                  id="projectLink"
                  type="url"
                  required
                  maxLength={500}
                  placeholder="https://…"
                  value={form.link}
                  onChange={(e) => setForm({ ...form, link: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="projectGithubLink" className={labelClass}>
                  GitHub repository link
                </label>
                <input
                  id="projectGithubLink"
                  type="url"
                  required
                  maxLength={300}
                  placeholder="https://github.com/owner/repo"
                  pattern={String.raw`https:\/\/(www\.)?github\.com\/[^\/\s]+\/[^\/\s]+.*`}
                  title="A GitHub repository address, like https://github.com/owner/repo"
                  value={form.githubLink}
                  onChange={(e) => setForm({ ...form, githubLink: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          <fieldset className="rounded-lg border border-border p-4">
            <legend className="px-2 text-sm font-semibold text-foreground">About you</legend>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">All fields are required.</p>
              <MotionButton type="button" variant="outline" size="sm" onClick={autofill}>
                <UserCheck className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                Autofill my details
              </MotionButton>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="projectMemberName" className={labelClass}>
                  Name
                </label>
                <input
                  id="projectMemberName"
                  required
                  maxLength={80}
                  autoComplete="off"
                  value={form.memberName}
                  onChange={(e) => setForm({ ...form, memberName: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="projectEnrollment" className={labelClass}>
                  Enrollment number
                </label>
                <input
                  id="projectEnrollment"
                  required
                  maxLength={20}
                  autoComplete="off"
                  pattern={String.raw`\s*[A-Za-z0-9][A-Za-z0-9\-\/]{3,19}\s*`}
                  title="Letters and digits only, 4 to 20 characters"
                  value={form.enrollment}
                  onChange={(e) => setForm({ ...form, enrollment: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="projectDepartment" className={labelClass}>
                  Department
                </label>
                <SuggestInput
                  id="projectDepartment"
                  required
                  maxLength={80}
                  options={DEPARTMENTS}
                  value={form.department}
                  onValueChange={(department) => setForm({ ...form, department })}
                />
              </div>
              <div>
                <label htmlFor="projectStudyYear" className={labelClass}>
                  Year of study
                </label>
                <Select
                  items={YEARS}
                  value={form.studyYear || null}
                  onValueChange={(value) => setForm({ ...form, studyYear: value ?? '' })}
                >
                  <SelectTrigger id="projectStudyYear" aria-required="true">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectPopup>
                    {YEARS.map((year) => (
                      <SelectItem key={year.value} value={year.value}>
                        {year.label}
                      </SelectItem>
                    ))}
                  </SelectPopup>
                </Select>
              </div>
            </div>
          </fieldset>

          <fieldset className="rounded-lg border border-border p-4">
            <legend className="px-2 text-sm font-semibold text-foreground">Mentor</legend>
            <p className="mb-4 text-xs text-muted-foreground">
              Every project needs a mentor. All fields are required. Only the Centre&apos;s staff can see the mentor&apos;s
              contact details.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="projectMentorName" className={labelClass}>
                  Mentor&apos;s name
                </label>
                <input
                  id="projectMentorName"
                  required
                  maxLength={80}
                  autoComplete="off"
                  value={form.mentorName}
                  onChange={(e) => setForm({ ...form, mentorName: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="projectMentorDepartment" className={labelClass}>
                  Mentor&apos;s department
                </label>
                <SuggestInput
                  id="projectMentorDepartment"
                  required
                  maxLength={80}
                  options={DEPARTMENTS}
                  value={form.mentorDepartment}
                  onValueChange={(mentorDepartment) => setForm({ ...form, mentorDepartment })}
                />
              </div>
              <div>
                <label htmlFor="projectMentorPosition" className={labelClass}>
                  Mentor&apos;s position
                </label>
                <input
                  id="projectMentorPosition"
                  required
                  maxLength={80}
                  placeholder="Assistant Professor"
                  autoComplete="off"
                  value={form.mentorPosition}
                  onChange={(e) => setForm({ ...form, mentorPosition: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="projectMentorEmail" className={labelClass}>
                  Mentor&apos;s email ID
                </label>
                <input
                  id="projectMentorEmail"
                  type="email"
                  required
                  maxLength={120}
                  autoComplete="off"
                  value={form.mentorEmail}
                  onChange={(e) => setForm({ ...form, mentorEmail: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="projectMentorPhone" className={labelClass}>
                  Mentor&apos;s phone number
                </label>
                <input
                  id="projectMentorPhone"
                  type="tel"
                  required
                  maxLength={20}
                  autoComplete="off"
                  pattern={String.raw`\+?[0-9][0-9 \(\)\-]{6,19}`}
                  title="A phone number of 7 to 15 digits"
                  value={form.mentorPhone}
                  onChange={(e) => setForm({ ...form, mentorPhone: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>
          </fieldset>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <MotionButton type="submit" size="lg">
            {editingId ? 'Save changes' : 'Add project'}
          </MotionButton>
        </form>
      </Card>

      <div className="space-y-3">
        {projects.length === 0 && (
          <p className="text-sm text-muted-foreground">You haven&apos;t added any projects yet — add one using the form above.</p>
        )}
        {projects.map((project) => {
          const saving = list.pending.has(project.id)
          return (
            <Card key={project.id} className={`flex items-start justify-between gap-4 p-4 ${saving ? 'opacity-70' : ''}`} aria-busy={saving}>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-foreground">{project.title}</p>
                  {saving && <span className="text-xs text-muted-foreground">Saving…</span>}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {[
                    project.studyYear ? `Year ${project.studyYear}` : '',
                    project.mentorName ? `Mentor: ${project.mentorName}` : '',
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{project.description}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <MotionButton
                  variant="outline"
                  size="icon-sm"
                  className="size-11"
                  onClick={() => startEdit(project)}
                  disabled={saving}
                  aria-label={`Edit "${project.title}"`}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </MotionButton>
                <MotionButton
                  variant="outline"
                  size="icon-sm"
                  className="size-11"
                  onClick={() => setPendingDeleteId(project.id)}
                  disabled={saving}
                  aria-label={`Delete "${project.title}"`}
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
        title="Delete this project?"
        description="This can't be undone."
        onConfirm={confirmDelete}
        onCancel={() => setPendingDeleteId(null)}
      />
    </div>
  )
}
