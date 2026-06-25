import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/build/', '/legal/'],
        disallow: ['/dashboard', '/onboarding', '/settings', '/roadmap/', '/api/', '/beta/'],
      },
    ],
    sitemap: 'https://splynt.app/sitemap.xml',
  }
}
