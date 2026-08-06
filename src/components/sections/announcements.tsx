import { Megaphone } from 'lucide-react'
import { Container } from '@/components/ui/container'
import { callAppsScript } from '@/lib/apps-script'
import type { SheetAnnouncement } from '@/lib/sheet-types'

async function loadPublishedAnnouncements(): Promise<SheetAnnouncement[]> {
  try {
    const result = await callAppsScript<{ items: SheetAnnouncement[] }>('listAnnouncements')
    return result.items
      .filter((a) => a.published)
      .sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
        return b.createdAt.localeCompare(a.createdAt)
      })
      .slice(0, 3)
  } catch {
    // Apps Script not configured yet, or the sheet is temporarily
    // unreachable — the homepage should never break because of this.
    return []
  }
}

export async function AnnouncementsSection() {
  const announcements = await loadPublishedAnnouncements()
  if (announcements.length === 0) return null

  return (
    <section className="border-b border-border bg-card py-6">
      <Container>
        <div className="space-y-3">
          {announcements.map((item) => (
            <div key={item.id} className="flex items-start gap-2.5">
              <Megaphone className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              <p className="text-sm text-foreground">
                <span className="font-semibold">{item.title}</span>
                <span className="text-muted-foreground"> — {item.body}</span>
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}
