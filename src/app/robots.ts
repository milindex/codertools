import type { MetadataRoute } from 'next';

import { AppConfig } from '@/utils/AppConfig';

export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/analytics/', '/offline/'],
      },
    ],
    sitemap: `${AppConfig.url}/sitemap.xml`,
    host: AppConfig.url,
  };
}
