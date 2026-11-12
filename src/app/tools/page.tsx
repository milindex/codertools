import type { Metadata } from 'next';

import { JsonLd } from '@/components/seo/JsonLd';
import { ToolsDirectory } from '@/components/ToolsDirectory';
import { Badge } from '@/components/ui/Badge';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Container } from '@/components/ui/Container';
import { catalog, totalToolCount } from '@/data/catalog';
import { AppConfig } from '@/utils/AppConfig';
import { breadcrumbJsonLd } from '@/utils/seo';

export const metadata: Metadata = {
  title: 'All tools',
  description:
    'Browse every CoderTools developer tool: formatters, converters, validators, generators, hash tools, image utilities and more. All 190+ tools run locally in your browser.',
  keywords: [
    'developer tools',
    'online developer tools',
    'formatters',
    'converters',
    'validators',
    'generators',
    'browser-based tools',
  ],
  alternates: {
    canonical: '/tools/',
  },
  openGraph: {
    type: 'website',
    title: `All tools · ${AppConfig.siteName}`,
    description:
      'Browse 190+ free developer tools that run entirely in your browser.',
    url: '/tools/',
    siteName: AppConfig.siteName,
    locale: AppConfig.locale,
  },
  twitter: {
    card: 'summary_large_image',
    title: `All tools · ${AppConfig.siteName}`,
    description:
      'Browse 190+ free developer tools that run entirely in your browser.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'All CoderTools developer tools',
  description:
    'A searchable directory of browser-based developer tools for code, data, color, images and more.',
  url: `${AppConfig.url}/tools/`,
  isPartOf: {
    '@type': 'WebSite',
    name: AppConfig.siteName,
    url: AppConfig.url,
  },
  mainEntity: {
    '@type': 'ItemList',
    numberOfItems: totalToolCount,
    itemListElement: catalog.map((category, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: `${category.name} tools`,
      url: `${AppConfig.url}/tools/${category.id}/`,
    })),
  },
};

export default function ToolsPage() {
  return (
    <>
      <JsonLd data={jsonLd} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', url: `${AppConfig.url}/` },
          { name: 'Tools', url: `${AppConfig.url}/tools/` },
        ])}
      />
      <Container className="ct-fade-in py-8">
        <Breadcrumbs items={[{ label: 'Tools' }]} />

        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-fg">
              All tools
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-fg-muted">
              Search {totalToolCount}+ browser-based developer tools by name,
              description or category. Everything runs locally.
            </p>
          </div>
          <Badge variant="accent">{totalToolCount} tools</Badge>
        </div>

        <div className="mt-8">
          <ToolsDirectory categories={catalog} />
        </div>
      </Container>
    </>
  );
}
