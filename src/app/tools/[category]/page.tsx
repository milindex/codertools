import { ArrowRight } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { CategoryIcon } from '@/components/CategoryIcon';
import { JsonLd } from '@/components/seo/JsonLd';
import { ToolCard } from '@/components/ToolCard';
import { Badge } from '@/components/ui/Badge';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Container } from '@/components/ui/Container';
import { Reveal } from '@/components/ui/Reveal';
import { catalog, getCategory } from '@/data/catalog';
import { AppConfig } from '@/utils/AppConfig';
import {
  breadcrumbJsonLd,
  categoryJsonLd,
  categoryMetadata,
} from '@/utils/seo';

type CategoryPageProps = {
  params: Promise<{ category: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return catalog.map((category) => ({ category: category.id }));
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { category: categoryId } = await params;
  const category = getCategory(categoryId);

  if (!category) {
    return {};
  }

  return categoryMetadata(category);
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category: categoryId } = await params;
  const category = getCategory(categoryId);

  if (!category) {
    notFound();
  }

  const relatedCategories = catalog.filter((item) => item.id !== category.id);

  return (
    <>
      <JsonLd data={categoryJsonLd(category)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', url: `${AppConfig.url}/` },
          { name: 'Tools', url: `${AppConfig.url}/tools/` },
          {
            name: category.name,
            url: `${AppConfig.url}/tools/${category.id}/`,
          },
        ])}
      />
      <Container className="py-8">
        <Breadcrumbs
          items={[
            { label: 'Tools', href: '/tools/' },
            { label: category.name },
          ]}
        />

        <div className="mt-5 flex flex-wrap items-start justify-between gap-4 border-b border-border pb-6">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-accent">
              <CategoryIcon className="h-6 w-6" name={category.icon} />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-fg">
                  {category.name}
                </h1>
                <Badge>{category.tools.length} tools</Badge>
              </div>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-fg-muted">
                {category.description}
              </p>
            </div>
          </div>

          <Link
            className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:no-underline"
            href="/tools/"
          >
            All tools
            <ArrowRight aria-hidden className="h-4 w-4" />
          </Link>
        </div>

        <Reveal className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {category.tools.map((tool) => (
            <ToolCard
              key={tool.slug}
              tool={{
                ...tool,
                categoryId: category.id,
                categoryName: category.name,
                categoryIcon: category.icon,
              }}
            />
          ))}
        </Reveal>

        <div className="mt-12 border-t border-border pt-6">
          <h2 className="text-sm font-semibold text-fg">Other categories</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {relatedCategories.map((item) => (
              <Link
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 text-xs text-fg-muted hover:border-accent/40 hover:text-accent hover:no-underline"
                href={`/tools/${item.id}/`}
                key={item.id}
              >
                <CategoryIcon className="h-3 w-3" name={item.icon} />
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      </Container>
    </>
  );
}
