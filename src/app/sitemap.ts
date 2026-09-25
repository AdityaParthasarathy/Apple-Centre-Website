import type { MetadataRoute } from 'next'
import { getAllProjects } from '@/lib/merge-projects'
import { getAllEvents } from '@/lib/merge-events'
import { getAllAlbums } from '@/lib/merge-albums'

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://apple-centre-website.vercel.app'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = ['', '/programs', '/projects', '/achievements', '/events', '/faculty', '/gallery', '/apply'].map(
    (route) => ({
      url: `${baseUrl}${route}`,
      lastModified: new Date(),
    })
  )

  const [projects, events, albums] = await Promise.all([getAllProjects(), getAllEvents(), getAllAlbums()])

  const projectRoutes = projects.map((project) => ({
    url: `${baseUrl}/projects/${project.id}`,
    lastModified: new Date(),
  }))

  const eventRoutes = events.map((event) => ({
    url: `${baseUrl}/events/${event.id}`,
    lastModified: event.date,
  }))

  const albumRoutes = albums.map((album) => ({
    url: `${baseUrl}/gallery/${album.slug}`,
    lastModified: new Date(),
  }))

  return [...staticRoutes, ...projectRoutes, ...eventRoutes, ...albumRoutes]
}
