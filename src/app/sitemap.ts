import type { MetadataRoute } from 'next';

import { allTools, catalog } from '@/data/catalog';
import { AppConfig } from '@/utils/AppConfig';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const base = AppConfig.url;

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${base}/`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${base}/tools/`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${base}/about/`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${base}/privacy/`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${base}/terms/`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${base}/cookies/`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];

  const categoryPages: MetadataRoute.Sitemap = catalog.map((category) => ({
    url: `${base}/tools/${category.id}/`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const toolPages: MetadataRoute.Sitemap = allTools.map((tool) => ({
    url: `${base}/tools/${tool.categoryId}/${tool.slug}/`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: tool.priority === 1 ? 0.8 : 0.6,
  }));

  return [...staticPages, ...categoryPages, ...toolPages];
}
