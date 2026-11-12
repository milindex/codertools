import type { Metadata } from 'next';

import type { CategoryDefinition, ToolDefinition } from '@/data/catalog';
import { AppConfig } from '@/utils/AppConfig';

export const buildToolDescription = (
  tool: ToolDefinition,
  category: CategoryDefinition
) =>
  `${tool.description} ${tool.name} is a free, browser-based ${category.name} tool from CoderTools. No uploads, no sign-up and no server-side processing.`;

export const buildCategoryDescription = (category: CategoryDefinition) =>
  `${category.description} Browse ${category.tools.length} free ${category.name} tools on CoderTools. Every tool runs locally in your browser with no uploads or sign-up.`;

export const toolMetadata = (
  tool: ToolDefinition,
  category: CategoryDefinition
): Metadata => {
  const description = buildToolDescription(tool, category);
  const url = `/tools/${category.id}/${tool.slug}/`;

  return {
    title: tool.name,
    description,
    keywords: [
      tool.name,
      category.name,
      ...(tool.keywords ?? []),
      'free developer tool',
      'online tool',
      'browser-based tool',
      'client-side tool',
      'no upload',
    ],
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: 'website',
      title: `${tool.name} · ${AppConfig.siteName}`,
      description,
      url,
      siteName: AppConfig.siteName,
      locale: AppConfig.locale,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${tool.name} · ${AppConfig.siteName}`,
      description,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
};

export const categoryMetadata = (category: CategoryDefinition): Metadata => {
  const description = buildCategoryDescription(category);
  const url = `/tools/${category.id}/`;

  return {
    title: `${category.name} tools`,
    description,
    keywords: [
      category.name,
      `${category.name} tools`,
      `free ${category.name} tools`,
      'developer tools',
      'browser-based tools',
      'client-side tools',
    ],
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: 'website',
      title: `${category.name} tools · ${AppConfig.siteName}`,
      description,
      url,
      siteName: AppConfig.siteName,
      locale: AppConfig.locale,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${category.name} tools · ${AppConfig.siteName}`,
      description,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
};

export const toolJsonLd = (
  tool: ToolDefinition,
  category: CategoryDefinition
) => ({
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: tool.name,
  description: buildToolDescription(tool, category),
  url: `${AppConfig.url}/tools/${category.id}/${tool.slug}/`,
  applicationCategory: 'DeveloperApplication',
  applicationSubCategory: category.name,
  operatingSystem: 'Any',
  browserRequirements: 'Requires JavaScript. Requires HTML5.',
  inLanguage: AppConfig.locale,
  isAccessibleForFree: true,
  image: `${AppConfig.url}/logo.svg`,
  keywords: [
    tool.name,
    category.name,
    ...(tool.keywords ?? []),
    'free developer tool',
    'browser-based tool',
    'client-side tool',
  ].join(', '),
  featureList: [
    'Runs entirely in your browser',
    'No uploads or server-side processing',
    'No account or sign-up required',
    `Part of the ${category.name} tool collection`,
  ],
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
    availability: 'https://schema.org/InStock',
  },
  isPartOf: {
    '@type': 'WebSite',
    name: AppConfig.siteName,
    url: AppConfig.url,
    description: AppConfig.description,
  },
  publisher: {
    '@type': 'Organization',
    name: AppConfig.siteName,
    url: AppConfig.url,
    logo: {
      '@type': 'ImageObject',
      url: `${AppConfig.url}/logo.svg`,
    },
  },
});

export const categoryJsonLd = (category: CategoryDefinition) => ({
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: `${category.name} tools`,
  description: buildCategoryDescription(category),
  url: `${AppConfig.url}/tools/${category.id}/`,
  inLanguage: AppConfig.locale,
  isPartOf: {
    '@type': 'WebSite',
    name: AppConfig.siteName,
    url: AppConfig.url,
    description: AppConfig.description,
  },
  mainEntity: {
    '@type': 'ItemList',
    name: `${category.name} developer tools`,
    numberOfItems: category.tools.length,
    itemListElement: category.tools.map((tool, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'SoftwareApplication',
        name: tool.name,
        description: tool.description,
        url: `${AppConfig.url}/tools/${category.id}/${tool.slug}/`,
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'Any',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
      },
    })),
  },
});

export const breadcrumbJsonLd = (
  items: Array<{ name: string; url: string }>
) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: item.url,
  })),
});
