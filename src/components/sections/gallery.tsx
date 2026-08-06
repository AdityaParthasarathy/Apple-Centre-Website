import { getAllGalleryImages } from '@/lib/merge-gallery'
import { GallerySectionClient } from '@/components/sections/gallery-client'

// Server Component so the Apps Script call (server-only secret) stays off
// the client — merges the static seed photos with anything faculty have
// uploaded, then hands the result to the client component for the motion
// and lightbox bits.
export async function GallerySection() {
  const images = await getAllGalleryImages()
  return <GallerySectionClient images={images} />
}
