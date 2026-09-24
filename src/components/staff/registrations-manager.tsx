'use client'

import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Download, RefreshCw, Trash2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { MotionButton } from '@/components/patterns/motion-link'
import { Select, SelectTrigger, SelectValue, SelectPopup, SelectItem } from '@/components/ui/select'
import { ConfirmDialog } from '@/components/staff/confirm-dialog'
import type { SheetRegistration } from '@/lib/sheet-types'

const ALL = 'all'

// A cell starting with = + - or @ is run as a formula when the CSV is opened
// in Excel/Sheets — and these values are typed by strangers on a public
// form. Prefixing an apostrophe keeps them as plain text.
function csvCell(value: string) {
  const safe = /^[=+\-@]/.test(value) ? `'${value}` : value
  return `"${safe.replace(/"/g, '""')}"`
}

function toCsv(rows: SheetRegistration[]) {
  const header = ['Event', 'Event date', 'Name', 'Email', 'Phone', 'College', 'Year', 'Registered at']
  const lines = rows.map((r) =>
    [r.eventTitle, r.eventDate, r.name, r.email, r.phone, r.college, r.year, r.registeredAt].map(csvCell).join(',')
  )
  // BOM so Excel reads names with accents/Tamil script as UTF-8.
  return '\uFEFF' + [header.map(csvCell).join(','), ...lines].join('\r\n')
}

function download(filename: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function RegistrationsManager({ initialRegistrations }: { initialRegistrations: SheetRegistration[] }) {
  const [registrations, setRegistrations] = useState(initialRegistrations)
  const [eventFilter, setEventFilter] = useState(ALL)
  const [refreshing, setRefreshing] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  // One entry per event that has at least one registration, soonest first.
  const events = useMemo(() => {
    const byId = new Map<string, { id: string; title: string; date: string; count: number }>()
    for (const r of registrations) {
      const entry = byId.get(r.eventId) ?? { id: r.eventId, title: r.eventTitle, date: r.eventDate, count: 0 }
      entry.count += 1
      byId.set(r.eventId, entry)
    }
    return [...byId.values()].sort((a, b) => b.date.localeCompare(a.date))
  }, [registrations])

  // If the selected event's last registration is deleted, fall back to all.
  const activeFilter = eventFilter === ALL || events.some((e) => e.id === eventFilter) ? eventFilter : ALL
  const visible = registrations.filter((r) => activeFilter === ALL || r.eventId === activeFilter)
  const groups = events.filter((e) => activeFilter === ALL || e.id === activeFilter)

  // The trigger would otherwise show the raw value ("all" or an event id).
  const filterLabel = (value: string) => {
    if (value === ALL) return `All events (${registrations.length})`
    const event = events.find((e) => e.id === value)
    return event ? `${event.title} (${event.count})` : value
  }

  const refresh = async () => {
    setRefreshing(true)
    try {
      const res = await fetch('/api/staff/registrations')
      const body = await res.json().catch(() => null)
      if (!res.ok) throw new Error(body?.error ?? 'Failed to refresh registrations.')
      setRegistrations(body.items as SheetRegistration[])
      toast.success('Registrations refreshed')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to refresh registrations.')
    } finally {
      setRefreshing(false)
    }
  }

  const exportCsv = () => {
    if (visible.length === 0) return
    const active = events.find((e) => e.id === activeFilter)
    const slug = active ? active.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') : 'all-events'
    download(`registrations-${slug || 'event'}.csv`, toCsv(visible))
  }

  const confirmDelete = async () => {
    const id = pendingDeleteId
    setPendingDeleteId(null)
    if (!id) return
    try {
      const res = await fetch(`/api/staff/registrations/${id}`, { method: 'DELETE' })
      const body = await res.json().catch(() => null)
      if (!res.ok) throw new Error(body?.error ?? 'Failed to delete the registration.')
      setRegistrations((prev) => prev.filter((r) => r.id !== id))
      toast.success('Registration removed')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete the registration.')
    }
  }

  const pendingDelete = registrations.find((r) => r.id === pendingDeleteId)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="w-full sm:w-72">
          <label htmlFor="registrationEvent" className="mb-1.5 block text-sm font-medium text-foreground">
            Event
          </label>
          <Select value={activeFilter} onValueChange={(value) => setEventFilter(value as string)}>
            <SelectTrigger id="registrationEvent">
              <SelectValue>{(value: string) => filterLabel(value)}</SelectValue>
            </SelectTrigger>
            <SelectPopup>
              <SelectItem value={ALL}>All events ({registrations.length})</SelectItem>
              {events.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.title} ({e.count})
                </SelectItem>
              ))}
            </SelectPopup>
          </Select>
        </div>
        <div className="flex gap-2">
          <MotionButton variant="outline" onClick={refresh} disabled={refreshing} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </MotionButton>
          <MotionButton variant="outline" onClick={exportCsv} disabled={visible.length === 0} className="gap-2">
            <Download className="h-4 w-4" aria-hidden="true" />
            Download CSV
          </MotionButton>
        </div>
      </div>

      {registrations.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No registrations yet — they appear here as students sign up from an event&apos;s page.
        </p>
      )}

      {groups.map((group) => (
        <section key={group.id} aria-labelledby={`reg-${group.id}`} className="space-y-3">
          <h2 id={`reg-${group.id}`} className="text-base font-semibold text-foreground">
            {group.title}
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              {group.date} · {group.count} registered
            </span>
          </h2>
          {visible
            .filter((r) => r.eventId === group.id)
            .map((r) => (
              <Card key={r.id} className="flex items-start justify-between gap-4 p-4">
                <div className="min-w-0">
                  <p className="font-semibold text-foreground">{r.name}</p>
                  <p className="mt-0.5 break-all text-sm text-muted-foreground">
                    <a href={`mailto:${r.email}`} className="hover:text-foreground hover:underline">
                      {r.email}
                    </a>
                    {r.phone ? ` · ${r.phone}` : ''}
                  </p>
                  {(r.college || r.year) && (
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {[r.college, r.year].filter(Boolean).join(' · ')}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    Registered {new Date(r.registeredAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                </div>
                <MotionButton
                  variant="outline"
                  size="icon-sm"
                  className="size-11 shrink-0"
                  onClick={() => setPendingDeleteId(r.id)}
                  aria-label={`Remove ${r.name}'s registration`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </MotionButton>
              </Card>
            ))}
        </section>
      ))}

      <ConfirmDialog
        open={pendingDeleteId !== null}
        title="Remove this registration?"
        confirmLabel="Remove"
        description={
          pendingDelete
            ? `${pendingDelete.name} will lose their seat for ${pendingDelete.eventTitle}. This can't be undone.`
            : "This can't be undone."
        }
        onConfirm={confirmDelete}
        onCancel={() => setPendingDeleteId(null)}
      />
    </div>
  )
}
