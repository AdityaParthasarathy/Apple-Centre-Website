import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Container } from '@/components/ui/container'
import { GoBackButton } from '@/components/ui/go-back-button'
import { GalleryBrowser } from '@/components/sections/gallery-browser'
import { PageHero } from '@/components/patterns/page-hero'
import { getAlbumBySlug, getAllAlbums } from '@/lib/merge-albums'

// Folders are made in the staff portal, so a new one has no page built at
// deploy time: it is rendered the first time someone opens it (dynamicParams
// defaults to true) and re-checked every minute after that.
export const revalidate = 60

export async function generateStaticParams() {
  try {
    return (await getAllAlbums()).map((album) => ({ slug: album.slug }))
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const album = await getAlbumBySlug(slug)
  if (!album) return {}
  return {
    title: `${album.name} | Gallery | Centre for Apple Technologies`,
    description: album.description || `${album.photos.length} photos from ${album.name}.`,
  }
}

export default async function GalleryFolderPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const album = await getAlbumBySlug(slug)
  if (!album) notFound()

  const count = `${album.photos.length} ${album.photos.length === 1 ? 'photo' : 'photos'}`
  return (
    <>
      <PageHero
        title={album.name}
        subtitle={album.description ? `${album.description} · ${count}` : count}
        image="/centre-space/lab-angle-2.jpg"
      >
        <GoBackButton />
      </PageHero>

      <section className="py-16 sm:py-24">
        <Container>
          <GalleryBrowser images={album.photos} showFilters={false} />
        </Container>
      </section>
    </>
  )
}
