import { Lock, ShieldCheck } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { CategoryIcon } from '@/components/CategoryIcon';
import { JsonLd } from '@/components/seo/JsonLd';
import { ToolCard } from '@/components/ToolCard';
import { ToolRenderer } from '@/components/tools/ToolRenderer';
import { Badge } from '@/components/ui/Badge';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Container } from '@/components/ui/Container';
import { Panel } from '@/components/ui/Panel';
import { allTools, getCategory, getTool } from '@/data/catalog';
import { AppConfig } from '@/utils/AppConfig';
import { breadcrumbJsonLd, toolJsonLd, toolMetadata } from '@/utils/seo';

type ToolPageProps = {
  params: Promise<{ category: string; tool: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return allTools.map((tool) => ({
    category: tool.categoryId,
    tool: tool.slug,
  }));
}

export async function generateMetadata({
  params,
}: ToolPageProps): Promise<Metadata> {
  const { category: categoryId, tool: toolSlug } = await params;
  const category = getCategory(categoryId);
  const tool = getTool(categoryId, toolSlug);

  if (!category || !tool) {
    return {};
  }

  return toolMetadata(tool, category);
}

export default async function ToolPage({ params }: ToolPageProps) {
  const { category: categoryId, tool: toolSlug } = await params;
  const category = getCategory(categoryId);
  const tool = getTool(categoryId, toolSlug);

  if (!category || !tool) {
    notFound();
  }

  const relatedTools = category.tools
    .filter((item) => item.slug !== tool.slug)
    .slice(0, 4)
    .map((item) => ({
      ...item,
      categoryId: category.id,
      categoryName: category.name,
      categoryIcon: category.icon,
    }));

  return (
    <>
      <JsonLd data={toolJsonLd(tool, category)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', url: `${AppConfig.url}/` },
          { name: 'Tools', url: `${AppConfig.url}/tools/` },
          {
            name: category.name,
            url: `${AppConfig.url}/tools/${category.id}/`,
          },
          {
            name: tool.name,
            url: `${AppConfig.url}/tools/${category.id}/${tool.slug}/`,
          },
        ])}
      />
      <Container className="py-8">
        <Breadcrumbs
          items={[
            { label: 'Tools', href: '/tools/' },
            { label: category.name, href: `/tools/${category.id}/` },
            { label: tool.name },
          ]}
        />

        <div className="mt-5 border-b border-border pb-6">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-accent">
              <CategoryIcon className="h-6 w-6" name={category.icon} />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">
                  {tool.name}
                </h1>
                <Badge variant="accent">{category.name}</Badge>
                <Badge variant="success">
                  <ShieldCheck aria-hidden className="mr-1 h-3 w-3" />
                  Client-side
                </Badge>
              </div>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-fg-muted">
                {tool.description}
              </p>
            </div>
          </div>
        </div>

        <div
          className="ct-fade-in mt-6 min-w-0 overflow-x-auto"
          data-tool-root
          data-tool-slug={`${category.id}/${tool.slug}`}
        >
          <ToolRenderer category={category.id} tool={tool.slug} />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <Panel title="About this tool">
            <p className="text-sm leading-6 text-fg-muted">
              {tool.description} This tool runs entirely in your browser using
              client-side APIs. Nothing you paste or upload is sent to a server.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge>
                <Lock aria-hidden className="mr-1 h-3 w-3" />
                No uploads
              </Badge>
              <Badge>No account</Badge>
              <Link
                className="inline-flex items-center rounded-full border border-accent/40 bg-accent-subtle/40 px-2 py-0.5 text-[11px] font-medium text-accent hover:no-underline"
                href={`/tools/${category.id}/`}
              >
                More {category.name} tools
              </Link>
            </div>
          </Panel>

          <Panel title="Related tools" bodyClassName="p-3">
            {relatedTools.length > 0 ? (
              <div className="grid gap-2">
                {relatedTools.map((related) => (
                  <Link
                    className="flex items-center justify-between gap-3 rounded-md border border-border bg-canvas-subtle/40 px-3 py-2 hover:border-accent/40 hover:no-underline"
                    href={`/tools/${related.categoryId}/${related.slug}/`}
                    key={related.slug}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-semibold text-fg">
                        {related.name}
                      </span>
                      <span className="mt-0.5 block truncate text-[11px] text-fg-muted">
                        {related.description}
                      </span>
                    </span>
                    <CategoryIcon
                      className="h-3.5 w-3.5 shrink-0 text-fg-subtle"
                      name={category.icon}
                    />
                  </Link>
                ))}
              </div>
            ) : (
              <p className="p-2 text-sm text-fg-muted">
                No related tools in this category yet.
              </p>
            )}
          </Panel>
        </div>

        {relatedTools.length > 0 && (
          <div className="mt-10">
            <h2 className="text-sm font-semibold text-fg">
              More in {category.name}
            </h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {relatedTools.map((related) => (
                <ToolCard key={related.slug} tool={related} />
              ))}
            </div>
          </div>
        )}
      </Container>
    </>
  );
}
