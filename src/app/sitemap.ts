import type { MetadataRoute } from 'next'
import { projects } from '@/content/projects'
import { events } from '@/content/events'

// Placeholder — swap for the real production domain once deployed.
const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://applecentre.rit.edu'

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ['', '/programs', '/projects', '/events', '/faculty', '/gallery', '/apply'].map(
    (route) => ({
      url: `${baseUrl}${route}`,
      lastModified: new Date(),
    })
  )

  const projectRoutes = projects.map((project) => ({
    url: `${baseUrl}/projects/${project.id}`,
    lastModified: new Date(),
  }))

  const eventRoutes = events.map((event) => ({
    url: `${baseUrl}/events/${event.id}`,
    lastModified: event.date,
  }))

  return [...staticRoutes, ...projectRoutes, ...eventRoutes]
}
