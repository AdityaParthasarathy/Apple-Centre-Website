import type { MetadataRoute } from 'next'

// Placeholder — swap for the real production domain once deployed.
const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://applecentre.rit.edu'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/staff', '/members'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
