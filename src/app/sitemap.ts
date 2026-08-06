import type { MetadataRoute } from 'next'
import { getAllProjects } from '@/lib/merge-projects'
import { getAllEvents } from '@/lib/merge-events'

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://apple-centre-website.vercel.app'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = ['', '/programs', '/projects', '/events', '/faculty', '/gallery', '/apply'].map(
    (route) => ({
      url: `${baseUrl}${route}`,
      lastModified: new Date(),
    })
  )

  const [projects, events] = await Promise.all([getAllProjects(), getAllEvents()])

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
