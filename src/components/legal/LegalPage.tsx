import type { ReactNode } from 'react';

import { JsonLd } from '@/components/seo/JsonLd';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Container } from '@/components/ui/Container';
import { AppConfig } from '@/utils/AppConfig';

type LegalPageProps = {
  title: string;
  description: string;
  path: string;
  updated?: string;
  children: ReactNode;
};

export const LegalPage = ({
  title,
  description,
  path,
  updated = 'November 12, 2026',
  children,
}: LegalPageProps) => {
  const url = `${AppConfig.url}${path}`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: title,
    description,
    url,
    inLanguage: AppConfig.locale,
    isPartOf: {
      '@type': 'WebSite',
      name: AppConfig.siteName,
      url: AppConfig.url,
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
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <Container className="ct-fade-up py-8">
        <Breadcrumbs items={[{ label: title }]} />

        <article className="mt-5 max-w-3xl">
          <h1 className="text-3xl font-bold tracking-tight text-fg">{title}</h1>
          <p className="mt-2 text-xs text-fg-muted">Last updated: {updated}</p>
          <div className="markdown-body mt-6 text-sm leading-6 text-fg-muted">
            {children}
          </div>
        </article>
      </Container>
    </>
  );
};
