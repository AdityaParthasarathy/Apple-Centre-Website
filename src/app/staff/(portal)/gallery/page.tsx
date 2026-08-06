import type { Metadata } from 'next'
import { callAppsScript } from '@/lib/apps-script'
import type { SheetGalleryImage } from '@/lib/sheet-types'
import { GalleryManager } from '@/components/staff/gallery-manager'

export const metadata: Metadata = {
  title: 'Gallery | Faculty Portal',
}

async function loadGallery(): Promise<{ images: SheetGalleryImage[]; error: string | null }> {
  try {
    const result = await callAppsScript<{ items: SheetGalleryImage[] }>('listGallery')
    return { images: result.items, error: null }
  } catch (error) {
    return {
      images: [],
      error: error instanceof Error ? error.message : 'Failed to load gallery photos.',
    }
  }
}

export default async function StaffGalleryPage() {
  const { images, error } = await loadGallery()

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Gallery</h1>
      <p className="mt-1 text-muted-foreground">
        Uploaded photos are stored in Drive and appear on the public gallery within a minute.
      </p>
      {error && (
        <p className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          Couldn&apos;t load gallery photos from the sheet: {error}
        </p>
      )}
      <div className="mt-8">
        <GalleryManager initialImages={images} />
      </div>
    </div>
  )
}
