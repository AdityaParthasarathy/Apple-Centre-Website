import type { Metadata } from 'next'
import { Container } from '@/components/ui/container'
import { GalleryBrowser } from '@/components/sections/gallery-browser'
import { PageHero } from '@/components/patterns/page-hero'
import { GalleryScrollRestore } from '@/components/patterns/gallery-scroll-restore'
import { FolderCard } from '@/components/sections/folder-card'
import { getAllAlbums } from '@/lib/merge-albums'
import { getAllGalleryImages } from '@/lib/merge-gallery'

export const metadata: Metadata = {
  title: 'Gallery | Centre for Apple Technologies',
  description: 'Moments from workshops, events, and life at the Centre.',
}

// Faculty-uploaded photos live in the sheet, not build-time content, so this
// route needs to periodically re-check for new ones.
export const revalidate = 60

export default async function GalleryPage() {
  const [images, albums] = await Promise.all([getAllGalleryImages(), getAllAlbums()])
  return (
    <>
      <PageHero
        title="Gallery"
        subtitle="Moments from workshops, events, and life at the Centre."
        image="/centre-space/lab-angle-2.jpg"
      />

      <section className="py-16 sm:py-24">
        <Container>
          {albums.length > 0 && (
            <>
              <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Folders</h2>
              <p className="mt-2 text-muted-foreground">Open a folder to see the photos from one event or occasion together.</p>
              <div className="mt-10 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
                {albums.map((album) => (
                  <FolderCard
                    key={album.id}
                    folder={{
                      slug: album.slug,
                      name: album.name,
                      description: album.description,
                      count: album.photos.length,
                      previews: [album.coverImage, ...album.photos.map((p) => p.image).filter((src) => src !== album.coverImage)].slice(0, 3),
                    }}
                  />
                ))}
              </div>
              <h2 className="mb-6 mt-24 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">All photos</h2>
            </>
          )}
          <GalleryBrowser images={images} />
        </Container>
        <GalleryScrollRestore />
      </section>
    </>
  )
}
