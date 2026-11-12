'use client';

import { useMemo, useState } from 'react';

import { Callout } from '@/components/ui/Callout';
import { CodeBlock } from '@/components/ui/CodeBlock';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { Select } from '@/components/ui/Select';
import { ToolLayout } from '@/components/ui/ToolLayout';

const OG_TYPES = [
  'website',
  'article',
  'product',
  'profile',
  'video.other',
  'music.song',
];

const escapeAttribute = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const hostnameOf = (value: string) => {
  try {
    const url = new URL(value);
    return url.hostname.replace(/^www\./, '') || 'example.com';
  } catch {
    return 'example.com';
  }
};

export default function OpenGraphPreviewTool() {
  const [form, setForm] = useState({
    title: 'CoderTools — developer utilities',
    description:
      'A fast, private collection of developer tools that run entirely in your browser.',
    image: '',
    url: 'https://example.com/',
    siteName: 'CoderTools',
    type: 'website',
  });

  const update = (key: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  const tags = useMemo(() => {
    const title = form.title.trim();
    const description = form.description.trim();
    const image = form.image.trim();
    const url = form.url.trim();
    const siteName = form.siteName.trim();
    const lines: string[] = [];
    if (form.type)
      lines.push(
        `<meta property="og:type" content="${escapeAttribute(form.type)}">`
      );
    if (title)
      lines.push(
        `<meta property="og:title" content="${escapeAttribute(title)}">`
      );
    if (description) {
      lines.push(
        `<meta property="og:description" content="${escapeAttribute(description)}">`
      );
    }
    if (url)
      lines.push(`<meta property="og:url" content="${escapeAttribute(url)}">`);
    if (image)
      lines.push(
        `<meta property="og:image" content="${escapeAttribute(image)}">`
      );
    if (siteName) {
      lines.push(
        `<meta property="og:site_name" content="${escapeAttribute(siteName)}">`
      );
    }
    lines.push('<meta name="twitter:card" content="summary_large_image">');
    if (title)
      lines.push(
        `<meta name="twitter:title" content="${escapeAttribute(title)}">`
      );
    if (description) {
      lines.push(
        `<meta name="twitter:description" content="${escapeAttribute(description)}">`
      );
    }
    if (image)
      lines.push(
        `<meta name="twitter:image" content="${escapeAttribute(image)}">`
      );
    return lines.join('\n');
  }, [form]);

  const domain = hostnameOf(form.url);

  return (
    <ToolLayout>
      <Panel
        description="Enter the metadata you plan to ship. The preview is rendered locally — no page is fetched or scraped."
        title="Open Graph fields"
      >
        <div className="space-y-2.5">
          <Field label="Title">
            <Input
              onChange={(event) => update('title', event.target.value)}
              placeholder="Page title"
              value={form.title}
            />
          </Field>
          <Field
            hint={`${form.description.length} characters`}
            label="Description"
          >
            <Input
              onChange={(event) => update('description', event.target.value)}
              placeholder="Short description shown under the title"
              value={form.description}
            />
          </Field>
          <Field
            hint="Leave blank to show the placeholder card"
            label="Image URL"
          >
            <Input
              onChange={(event) => update('image', event.target.value)}
              placeholder="https://example.com/social-card.png"
              spellCheck={false}
              value={form.image}
            />
          </Field>
          <Field label="Page URL">
            <Input
              onChange={(event) => update('url', event.target.value)}
              placeholder="https://example.com/page/"
              spellCheck={false}
              value={form.url}
            />
          </Field>
          <div className="grid gap-2.5 sm:grid-cols-2">
            <Field label="Site name">
              <Input
                onChange={(event) => update('siteName', event.target.value)}
                placeholder="Site name"
                value={form.siteName}
              />
            </Field>
            <Field label="Type">
              <Select
                onChange={(event) => update('type', event.target.value)}
                value={form.type}
              >
                {OG_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <Callout variant="info">
            Most platforms fetch the image themselves. CORS and hotlink
            protection can prevent the image from appearing in this preview even
            when it works on the real network.
          </Callout>
        </div>
      </Panel>

      <ResultPanel
        filename="open-graph.html"
        label="Social card preview"
        mime="text/html;charset=utf-8"
        value={tags}
      >
        <div className="space-y-4">
          <div className="overflow-hidden rounded-lg border border-border bg-surface">
            <div className="relative aspect-[1.91/1] w-full overflow-hidden bg-canvas-inset">
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-gradient-to-br from-accent-subtle via-canvas-subtle to-neutral-subtle p-4 text-center">
                <span className="text-2xl font-black tracking-tight text-accent">
                  {domain.slice(0, 1).toUpperCase()}
                </span>
                <span className="text-[11px] font-medium uppercase tracking-wide text-fg-muted">
                  {domain}
                </span>
              </div>
              {form.image.trim() && (
                <img
                  alt="Open Graph preview"
                  className="absolute inset-0 h-full w-full object-cover"
                  key={form.image}
                  onError={(event) => {
                    event.currentTarget.style.display = 'none';
                  }}
                  src={form.image.trim()}
                />
              )}
            </div>
            <div className="space-y-1 border-t border-border p-3">
              <span className="block truncate text-[11px] uppercase tracking-wide text-fg-muted">
                {domain}
              </span>
              <h3 className="line-clamp-2 text-sm font-semibold leading-5 text-fg">
                {form.title.trim() || 'Page title'}
              </h3>
              <p className="line-clamp-2 text-xs leading-5 text-fg-muted">
                {form.description.trim() ||
                  'The description you enter will be shown here, wrapped to two lines.'}
              </p>
              {form.siteName.trim() && (
                <p className="pt-0.5 text-[11px] font-medium text-fg-subtle">
                  {form.siteName.trim()}
                </p>
              )}
            </div>
          </div>

          <CodeBlock code={tags} filename="open-graph.html" language="html" />

          <p className="text-[11px] leading-5 text-fg-muted">
            Card shape is an approximation of common link previews. Exact
            cropping and typography vary by platform.
          </p>
        </div>
      </ResultPanel>
    </ToolLayout>
  );
}
