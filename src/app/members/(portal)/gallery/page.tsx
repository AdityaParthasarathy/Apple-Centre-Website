import type { Metadata } from 'next'
import { callAppsScript } from '@/lib/apps-script'
import { getMemberSession } from '@/lib/member-session'
import { memberKey } from '@/lib/member-api'
import type { SheetGalleryImage } from '@/lib/sheet-types'
import { MemberGalleryManager } from '@/components/members/gallery-manager'

export const metadata: Metadata = {
  title: 'Gallery | Members Portal',
}

async function loadPhotos(owner: string): Promise<{ images: SheetGalleryImage[]; error: string | null }> {
  try {
    const result = await callAppsScript<{ items: SheetGalleryImage[] }>('listGallery')
    return { images: result.items.filter((item) => item.createdBy === owner), error: null }
  } catch (error) {
    return { images: [], error: error instanceof Error ? error.message : 'Failed to load your photos.' }
  }
}

export default async function MemberGalleryPage() {
  const member = await getMemberSession()
  if (!member) return null
  const { images, error } = await loadPhotos(memberKey(member))

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Gallery</h1>
      <p className="mt-1 text-muted-foreground">
        Photos you upload appear on the public gallery as soon as they are saved.
      </p>
      {error && (
        <p className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          Couldn&apos;t load your photos from the sheet: {error}
        </p>
      )}
      <div className="mt-8">
        <MemberGalleryManager initialImages={images} />
      </div>
    </div>
  )
}
