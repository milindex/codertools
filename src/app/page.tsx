import { ArrowRight, Lock, Search, Sparkles, WifiOff, Zap } from 'lucide-react';
import Link from 'next/link';

import { CategoryCard } from '@/components/CategoryCard';
import { JsonLd } from '@/components/seo/JsonLd';
import { ToolCard } from '@/components/ToolCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { LinkButton } from '@/components/ui/LinkButton';
import { Reveal } from '@/components/ui/Reveal';
import { catalog, popularTools, totalToolCount } from '@/data/catalog';
import { AppConfig } from '@/utils/AppConfig';

const features = [
  {
    icon: Lock,
    title: 'Private by default',
    description:
      'Every tool runs in your browser. Your code, files and secrets are never uploaded.',
  },
  {
    icon: Zap,
    title: 'No setup or sign-up',
    description:
      'Open a tool and use it. No accounts, installs or build steps required.',
  },
  {
    icon: WifiOff,
    title: 'Works offline',
    description:
      'Once the page is loaded, tools keep working even without a network connection.',
  },
];

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${AppConfig.url}/#website`,
  name: AppConfig.siteName,
  url: AppConfig.url,
  description: AppConfig.description,
  inLanguage: AppConfig.locale,
  publisher: {
    '@id': `${AppConfig.url}/#organization`,
  },
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${AppConfig.url}/tools/?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
};

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': `${AppConfig.url}/#organization`,
  name: AppConfig.siteName,
  url: AppConfig.url,
  logo: {
    '@type': 'ImageObject',
    url: `${AppConfig.url}/logo.svg`,
  },
  description: AppConfig.description,
  sameAs: ['https://milinds.dev'],
};

const categoriesJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'CoderTools categories',
  numberOfItems: catalog.length,
  itemListElement: catalog.map((category, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: category.name,
    url: `${AppConfig.url}/tools/${category.id}/`,
  })),
};

export default function HomePage() {
  return (
    <>
      <JsonLd data={websiteJsonLd} />
      <JsonLd data={organizationJsonLd} />
      <JsonLd data={categoriesJsonLd} />
      <section className="relative overflow-hidden border-b border-border">
        <div aria-hidden className="ct-grid-bg absolute inset-0 opacity-40" />
        <div
          aria-hidden
          className="absolute left-1/2 top-0 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-accent/10 blur-3xl"
        />
        <Container className="relative py-16 sm:py-24">
          <div className="ct-fade-up mx-auto max-w-3xl text-center">
            <Badge className="mb-5" variant="accent">
              <Sparkles aria-hidden className="mr-1 h-3 w-3" />
              {totalToolCount}+ tools · 100% client-side
            </Badge>

            <h1 className="text-balance text-4xl font-bold tracking-tight text-fg sm:text-5xl lg:text-6xl">
              Developer tools that run in your browser
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-pretty text-base leading-7 text-fg-muted sm:text-lg">
              {AppConfig.description}
            </p>

            <form
              action="/tools"
              className="mx-auto mt-8 flex max-w-xl items-center gap-2"
              method="get"
            >
              <label className="sr-only" htmlFor="hero-search">
                Search tools
              </label>
              <div className="relative min-w-0 flex-1">
                <Search
                  aria-hidden
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle"
                />
                <input
                  autoComplete="off"
                  className="h-11 w-full rounded-md border border-border bg-canvas-inset pl-10 pr-3 text-sm text-fg outline-none transition-colors placeholder:text-fg-subtle focus:border-accent focus:ring-1 focus:ring-accent"
                  id="hero-search"
                  name="q"
                  placeholder="Search 190+ tools…"
                  type="search"
                />
              </div>
              <Button className="h-11" type="submit" variant="primary">
                Search
              </Button>
            </form>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs text-fg-muted">
              <span>Popular:</span>
              {[
                'hash generator',
                'json formatter',
                'regex tester',
                'uuid',
                'qr code',
              ].map((term) => (
                <Link
                  className="rounded-full border border-border bg-surface px-2.5 py-1 text-fg-muted hover:border-accent/40 hover:text-accent hover:no-underline"
                  href={`/tools?q=${encodeURIComponent(term)}`}
                  key={term}
                >
                  {term}
                </Link>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <LinkButton className="h-9 px-3" href="/tools" variant="primary">
                Browse all tools
              </LinkButton>
              <LinkButton className="h-9 px-3" href="#popular">
                Popular tools
              </LinkButton>
            </div>
          </div>
        </Container>
      </section>

      <Reveal>
        <Container className="py-12">
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { value: `${totalToolCount}+`, label: 'Browser-based tools' },
              { value: `${catalog.length}`, label: 'Categories' },
              { value: '0', label: 'Files uploaded' },
            ].map((stat) => (
              <div
                className="rounded-lg border border-border bg-surface p-4 text-center transition-colors hover:border-fg-subtle"
                key={stat.label}
              >
                <p className="text-2xl font-bold text-fg">{stat.value}</p>
                <p className="mt-1 text-xs text-fg-muted">{stat.label}</p>
              </div>
            ))}
          </div>
        </Container>
      </Reveal>

      <Reveal delay={60}>
        <Container className="pb-12" id="popular">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-fg">Popular tools</h2>
              <p className="mt-1 text-sm text-fg-muted">
                The tools developers reach for most often.
              </p>
            </div>
            <Link
              className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:no-underline"
              href="/tools?sort=popular"
            >
              View all
              <ArrowRight aria-hidden className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {popularTools.slice(0, 12).map((tool) => (
              <ToolCard key={`${tool.categoryId}/${tool.slug}`} tool={tool} />
            ))}
          </div>
        </Container>
      </Reveal>

      <Reveal delay={90}>
        <Container className="pb-12">
          <div className="mb-5">
            <h2 className="text-xl font-semibold text-fg">
              Browse by category
            </h2>
            <p className="mt-1 text-sm text-fg-muted">
              From formatting and conversion to cryptography and image tools.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {catalog.map((category) => (
              <CategoryCard category={category} key={category.id} />
            ))}
          </div>
        </Container>
      </Reveal>

      <Reveal delay={120}>
        <Container className="pb-16">
          <div className="rounded-lg border border-border bg-surface p-6 transition-colors hover:border-fg-subtle sm:p-8">
            <div className="grid gap-8 md:grid-cols-[1.2fr_2fr]">
              <div>
                <h2 className="text-xl font-semibold text-fg">
                  Built for developers who value privacy
                </h2>
                <p className="mt-2 text-sm leading-6 text-fg-muted">
                  No servers, no uploads, no tracking of your input. Open a
                  tool, get your result and move on.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                {features.map((feature) => (
                  <div key={feature.title}>
                    <span className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-canvas-subtle text-accent transition-colors">
                      <feature.icon aria-hidden className="h-4 w-4" />
                    </span>
                    <h3 className="mt-3 text-sm font-semibold text-fg">
                      {feature.title}
                    </h3>
                    <p className="mt-1 text-xs leading-5 text-fg-muted">
                      {feature.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </Reveal>
    </>
  );
}
