import { callAppsScript } from '@/lib/apps-script'
import { getAllGalleryImages } from '@/lib/merge-gallery'
import type { GalleryImage } from '@/content/gallery'
import type { SheetAlbum } from '@/lib/sheet-types'

/** A photo folder as the public site shows it. */
export interface Album {
  id: string
  name: string
  slug: string
  description: string
  createdAt: Date
  /** Newest first. */
  photos: GalleryImage[]
  /** The picture on the folder's front: the one staff chose, else its newest photo. */
  coverImage: string
}

/** Every folder that has at least one photo in it, newest first. A folder with
 *  no photos yet isn't shown to visitors, and a photo whose folder no longer
 *  exists is just an ordinary unfiled photo. */
export async function getAllAlbums(): Promise<Album[]> {
  let sheetAlbums: SheetAlbum[] = []
  try {
    sheetAlbums = (await callAppsScript<{ items: SheetAlbum[] }>('listAlbums')).items
  } catch {
    // Folders aren't set up (or Google is unreachable): the gallery just shows photos.
    return []
  }
  const photos = await getAllGalleryImages()

  return sheetAlbums
    .map((album): Album => {
      const inside = photos.filter((photo) => photo.album === album.id)
      const chosen = album.cover && inside.some((photo) => photo.image === album.cover) ? album.cover : ''
      return {
        id: album.id,
        name: album.name,
        slug: album.slug,
        description: album.description,
        createdAt: new Date(album.createdAt ?? 0),
        photos: inside,
        coverImage: chosen || inside[0]?.image || '',
      }
    })
    .filter((album) => album.photos.length > 0 && album.slug)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

export async function getAlbumBySlug(slug: string): Promise<Album | null> {
  return (await getAllAlbums()).find((album) => album.slug === slug) ?? null
}
