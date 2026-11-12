'use client';

import { useMemo, useState } from 'react';

import { Callout } from '@/components/ui/Callout';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { Select } from '@/components/ui/Select';
import { ToolLayout } from '@/components/ui/ToolLayout';

const escapeAttribute = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const escapeText = escapeAttribute;

const ROBOTS_OPTIONS = [
  'index, follow',
  'noindex, follow',
  'index, nofollow',
  'noindex, nofollow',
  'noarchive',
  'nosnippet',
  'noimageindex',
];

const OG_TYPES = [
  'website',
  'article',
  'product',
  'profile',
  'video.other',
  'music.song',
];

const TWITTER_CARDS = ['summary_large_image', 'summary', 'app', 'player'];

type FormState = {
  title: string;
  description: string;
  canonical: string;
  robots: string;
  themeColor: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  ogUrl: string;
  ogSiteName: string;
  ogType: string;
  twitterCard: string;
  twitterSite: string;
};

const INITIAL: FormState = {
  title: 'CoderTools — developer utilities',
  description:
    'A fast, private collection of developer tools that run entirely in your browser.',
  canonical: 'https://example.com/',
  robots: 'index, follow',
  themeColor: '#0d1117',
  ogTitle: 'CoderTools — developer utilities',
  ogDescription:
    'A fast, private collection of developer tools that run entirely in your browser.',
  ogImage: 'https://example.com/social-card.png',
  ogUrl: 'https://example.com/',
  ogSiteName: 'CoderTools',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterSite: '@example',
};

export default function MetaTagGeneratorTool() {
  const [form, setForm] = useState<FormState>(INITIAL);

  const update = <Key extends keyof FormState>(
    key: Key,
    value: FormState[Key]
  ) => setForm((current) => ({ ...current, [key]: value }));

  const html = useMemo(() => {
    const title = form.title.trim();
    const description = form.description.trim();
    const canonical = form.canonical.trim();
    const ogTitle = form.ogTitle.trim() || title;
    const ogDescription = form.ogDescription.trim() || description;
    const ogUrl = form.ogUrl.trim() || canonical;
    const ogImage = form.ogImage.trim();
    const themeColor = form.themeColor.trim();

    const lines: string[] = [
      '<meta charset="UTF-8">',
      '<meta name="viewport" content="width=device-width, initial-scale=1">',
    ];

    if (title) {
      lines.push(`<title>${escapeText(title)}</title>`);
    }
    if (description) {
      lines.push(
        `<meta name="description" content="${escapeAttribute(description)}">`
      );
    }
    if (canonical) {
      lines.push(`<link rel="canonical" href="${escapeAttribute(canonical)}">`);
    }
    if (form.robots) {
      lines.push(
        `<meta name="robots" content="${escapeAttribute(form.robots)}">`
      );
    }
    if (themeColor) {
      lines.push(
        `<meta name="theme-color" content="${escapeAttribute(themeColor)}">`
      );
    }

    if (ogTitle) {
      lines.push(
        `<meta property="og:title" content="${escapeAttribute(ogTitle)}">`
      );
    }
    if (ogDescription) {
      lines.push(
        `<meta property="og:description" content="${escapeAttribute(ogDescription)}">`
      );
    }
    if (ogUrl) {
      lines.push(
        `<meta property="og:url" content="${escapeAttribute(ogUrl)}">`
      );
    }
    if (ogImage) {
      lines.push(
        `<meta property="og:image" content="${escapeAttribute(ogImage)}">`
      );
    }
    if (form.ogType) {
      lines.push(
        `<meta property="og:type" content="${escapeAttribute(form.ogType)}">`
      );
    }
    if (form.ogSiteName.trim()) {
      lines.push(
        `<meta property="og:site_name" content="${escapeAttribute(form.ogSiteName.trim())}">`
      );
    }

    if (form.twitterCard) {
      lines.push(
        `<meta name="twitter:card" content="${escapeAttribute(form.twitterCard)}">`
      );
    }
    if (form.twitterSite.trim()) {
      lines.push(
        `<meta name="twitter:site" content="${escapeAttribute(form.twitterSite.trim())}">`
      );
    }
    if (ogTitle) {
      lines.push(
        `<meta name="twitter:title" content="${escapeAttribute(ogTitle)}">`
      );
    }
    if (ogDescription) {
      lines.push(
        `<meta name="twitter:description" content="${escapeAttribute(ogDescription)}">`
      );
    }
    if (ogImage) {
      lines.push(
        `<meta name="twitter:image" content="${escapeAttribute(ogImage)}">`
      );
    }

    return lines.join('\n');
  }, [form]);

  const count = html.split('\n').length;

  return (
    <ToolLayout>
      <Panel
        description="Fill in the basics and social metadata. Empty Open Graph fields fall back to the page title and description."
        title="Metadata"
      >
        <div className="space-y-4">
          <section className="space-y-2.5">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-fg-muted">
              Basics
            </h3>
            <Field label="Page title">
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
                placeholder="A concise page description"
                value={form.description}
              />
            </Field>
            <Field label="Canonical URL">
              <Input
                onChange={(event) => update('canonical', event.target.value)}
                placeholder="https://example.com/page/"
                spellCheck={false}
                value={form.canonical}
              />
            </Field>
            <div className="grid gap-2.5 sm:grid-cols-2">
              <Field label="Robots">
                <Select
                  onChange={(event) => update('robots', event.target.value)}
                  value={form.robots}
                >
                  {ROBOTS_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Theme color">
                <Input
                  onChange={(event) => update('themeColor', event.target.value)}
                  placeholder="#0d1117"
                  value={form.themeColor}
                />
              </Field>
            </div>
          </section>

          <section className="space-y-2.5 border-t border-border pt-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-fg-muted">
              Open Graph
            </h3>
            <Field label="og:title">
              <Input
                onChange={(event) => update('ogTitle', event.target.value)}
                placeholder="Defaults to the page title"
                value={form.ogTitle}
              />
            </Field>
            <Field label="og:description">
              <Input
                onChange={(event) =>
                  update('ogDescription', event.target.value)
                }
                placeholder="Defaults to the description"
                value={form.ogDescription}
              />
            </Field>
            <Field label="og:image">
              <Input
                onChange={(event) => update('ogImage', event.target.value)}
                placeholder="https://example.com/social-card.png"
                spellCheck={false}
                value={form.ogImage}
              />
            </Field>
            <div className="grid gap-2.5 sm:grid-cols-2">
              <Field label="og:url">
                <Input
                  onChange={(event) => update('ogUrl', event.target.value)}
                  placeholder="Defaults to canonical URL"
                  spellCheck={false}
                  value={form.ogUrl}
                />
              </Field>
              <Field label="og:site_name">
                <Input
                  onChange={(event) => update('ogSiteName', event.target.value)}
                  placeholder="Site name"
                  value={form.ogSiteName}
                />
              </Field>
            </div>
            <Field label="og:type">
              <Select
                onChange={(event) => update('ogType', event.target.value)}
                value={form.ogType}
              >
                {OG_TYPES.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Select>
            </Field>
          </section>

          <section className="space-y-2.5 border-t border-border pt-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-fg-muted">
              Twitter / X
            </h3>
            <div className="grid gap-2.5 sm:grid-cols-2">
              <Field label="Card type">
                <Select
                  onChange={(event) =>
                    update('twitterCard', event.target.value)
                  }
                  value={form.twitterCard}
                >
                  {TWITTER_CARDS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="@site">
                <Input
                  onChange={(event) =>
                    update('twitterSite', event.target.value)
                  }
                  placeholder="@example"
                  value={form.twitterSite}
                />
              </Field>
            </div>
            <p className="text-[11px] leading-5 text-fg-muted">
              Twitter title, description and image reuse the Open Graph values.
            </p>
          </section>

          {!form.title.trim() && !form.description.trim() && (
            <Callout variant="warning">
              Add at least a title or description so the output is useful.
            </Callout>
          )}
        </div>
      </Panel>

      <ResultPanel
        filename="meta-tags.html"
        label={`HTML tags (${count})`}
        mime="text/html;charset=utf-8"
        value={html}
      />
    </ToolLayout>
  );
}
