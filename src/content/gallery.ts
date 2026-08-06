export interface GalleryImage {
  id: string
  title: string
  description: string
  image: string
  category: 'workshop' | 'event' | 'facility' | 'community'
  date: Date
}

// Formerly hardcoded here — migrated into the Gallery sheet (same ids,
// images re-hosted on Drive) so the faculty portal can manage them. Kept
// empty rather than deleted so the GalleryImage type stays defined in one
// place. The original files remain in public/gallery/ but are no longer
// referenced by any code path.
export const galleryImages: GalleryImage[] = []
