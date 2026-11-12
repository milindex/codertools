import { Lock, Terminal, WifiOff, Zap } from 'lucide-react';
import type { Metadata } from 'next';

import { JsonLd } from '@/components/seo/JsonLd';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Container } from '@/components/ui/Container';
import { Panel } from '@/components/ui/Panel';
import { totalToolCount } from '@/data/catalog';
import { AppConfig } from '@/utils/AppConfig';
import { breadcrumbJsonLd } from '@/utils/seo';

export const metadata: Metadata = {
  title: 'About',
  description:
    'CoderTools is a collection of browser-based developer tools. No uploads, no accounts and no server-side processing.',
  keywords: [
    'about CoderTools',
    'private developer tools',
    'browser-based tools',
    'client-side tools',
  ],
  alternates: {
    canonical: '/about/',
  },
  openGraph: {
    type: 'website',
    title: `About · ${AppConfig.siteName}`,
    description:
      'A privacy-first collection of browser-based developer tools from CoderTools.',
    url: '/about/',
    siteName: AppConfig.siteName,
    locale: AppConfig.locale,
  },
  twitter: {
    card: 'summary_large_image',
    title: `About · ${AppConfig.siteName}`,
    description:
      'A privacy-first collection of browser-based developer tools from CoderTools.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

const aboutJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'AboutPage',
  name: `About ${AppConfig.siteName}`,
  url: `${AppConfig.url}/about/`,
  description:
    'CoderTools is a privacy-first collection of browser-based developer tools.',
  isPartOf: {
    '@type': 'WebSite',
    name: AppConfig.siteName,
    url: AppConfig.url,
  },
  publisher: {
    '@type': 'Organization',
    name: AppConfig.siteName,
    url: AppConfig.url,
    logo: `${AppConfig.url}/logo.svg`,
  },
};

const principles = [
  {
    icon: Lock,
    title: 'Private by default',
    description:
      'Your input never leaves the browser. There is no backend that receives code, files or secrets.',
  },
  {
    icon: Zap,
    title: 'Fast and focused',
    description:
      'Every tool is a small client-side page. Heavy libraries are loaded only when a tool needs them.',
  },
  {
    icon: WifiOff,
    title: 'Works offline',
    description:
      'Once a tool page is loaded, the browser APIs it uses keep working without a network connection.',
  },
];

export default function AboutPage() {
  return (
    <>
      <JsonLd data={aboutJsonLd} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', url: `${AppConfig.url}/` },
          { name: 'About', url: `${AppConfig.url}/about/` },
        ])}
      />
      <Container className="py-8">
        <Breadcrumbs items={[{ label: 'About' }]} />

        <div className="mt-5 max-w-3xl">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-lg border border-border bg-surface text-accent">
              <Terminal aria-hidden className="h-6 w-6" />
            </span>
            <h1 className="text-3xl font-bold tracking-tight text-fg">
              About {AppConfig.siteName}
            </h1>
          </div>
          <p className="mt-4 text-base leading-7 text-fg-muted">
            {AppConfig.siteName} is a collection of {totalToolCount}+ developer
            tools for formatting, converting, validating, hashing and inspecting
            code and data. Everything runs locally in your browser, so pasted
            code, files and secrets are never uploaded.
          </p>
          <p className="mt-3 text-base leading-7 text-fg-muted">
            The site is a static export deployed at{' '}
            <a className="text-accent" href={AppConfig.url}>
              codertools.milinds.dev
            </a>
            . It does not require an account, a database or a server runtime.
          </p>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {principles.map((principle) => (
            <Panel key={principle.title}>
              <span className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-canvas-subtle text-accent">
                <principle.icon aria-hidden className="h-4 w-4" />
              </span>
              <h2 className="mt-3 text-sm font-semibold text-fg">
                {principle.title}
              </h2>
              <p className="mt-1 text-xs leading-5 text-fg-muted">
                {principle.description}
              </p>
            </Panel>
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <Panel title="Built with">
            <ul className="space-y-2 text-sm text-fg-muted">
              <li>Next.js 16 App Router with static export</li>
              <li>React 19 and TypeScript</li>
              <li>Tailwind CSS 4</li>
              <li>
                Web Crypto, Canvas, File API and WebAssembly for client-side
                processing
              </li>
            </ul>
          </Panel>

          <Panel title="Author">
            <p className="text-sm leading-6 text-fg-muted">
              Built by{' '}
              <a className="text-accent" href="https://milinds.dev">
                Milind
              </a>
              . The project is a focused alternative to ad-heavy online
              utilities: open a tool, get the result, and move on.
            </p>
            <p className="mt-3 text-sm text-fg-muted">
              Found a bug or want a new tool? The catalog is designed to keep
              growing.
            </p>
          </Panel>
        </div>
      </Container>
    </>
  );
}
