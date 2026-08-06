import { galleryImages as staticGalleryImages, type GalleryImage } from '@/content/gallery'
import { callAppsScript } from '@/lib/apps-script'
import type { SheetGalleryImage } from '@/lib/sheet-types'

function sheetImageToGalleryImage(img: SheetGalleryImage): GalleryImage {
  return {
    id: img.id,
    title: img.title,
    description: img.description,
    image: img.image,
    category: img.category,
    date: new Date(img.date),
  }
}

/** Static seed photos plus anything faculty have uploaded via the portal,
 *  newest first — a gallery should surface what was just added. */
export async function getAllGalleryImages(): Promise<GalleryImage[]> {
  let sheetImages: GalleryImage[] = []
  try {
    const result = await callAppsScript<{ items: SheetGalleryImage[] }>('listGallery')
    sheetImages = result.items.map(sheetImageToGalleryImage)
  } catch {
    // Apps Script not configured yet, or temporarily unreachable — the site
    // still works with just the static seed set.
  }
  return [...sheetImages, ...staticGalleryImages].sort((a, b) => b.date.getTime() - a.date.getTime())
}
