'use client';

import { useEffect, useMemo, useState } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { ToolLayout } from '@/components/ui/ToolLayout';

import { Toggle } from './_shared';

const CHANGEFREQ = [
  'always',
  'hourly',
  'daily',
  'weekly',
  'monthly',
  'yearly',
  'never',
];

const SAMPLE = `https://example.com/
https://example.com/about
https://example.com/blog/hello-world`;

const escapeXml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

export default function SitemapGeneratorTool() {
  const [urls, setUrls] = useState(SAMPLE);
  const [changefreq, setChangefreq] = useState('weekly');
  const [priority, setPriority] = useState('0.8');
  const [lastmod, setLastmod] = useState('');
  const [includeLastmod, setIncludeLastmod] = useState(true);

  useEffect(() => {
    setLastmod(new Date().toISOString().slice(0, 10));
  }, []);

  const parsed = useMemo(() => {
    const lines = urls
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    const seen = new Set<string>();
    const valid: string[] = [];
    const invalid: string[] = [];

    for (const line of lines) {
      try {
        const url = new URL(line);
        if (url.protocol !== 'http:' && url.protocol !== 'https:') {
          invalid.push(line);
          continue;
        }
        if (seen.has(url.href)) {
          continue;
        }
        seen.add(url.href);
        valid.push(url.href);
      } catch {
        invalid.push(line);
      }
    }

    return { valid, invalid };
  }, [urls]);

  const priorityNumber = Number(priority);
  const priorityValid =
    priority.trim() !== '' &&
    Number.isFinite(priorityNumber) &&
    priorityNumber >= 0 &&
    priorityNumber <= 1;

  const lastmodValid = /^\d{4}-\d{2}-\d{2}$/.test(lastmod);

  const xml = useMemo(() => {
    if (parsed.valid.length === 0 || !priorityValid) {
      return '';
    }
    const lines = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ];
    for (const url of parsed.valid) {
      lines.push('  <url>');
      lines.push(`    <loc>${escapeXml(url)}</loc>`);
      if (includeLastmod && lastmodValid) {
        lines.push(`    <lastmod>${lastmod}</lastmod>`);
      }
      if (changefreq) {
        lines.push(`    <changefreq>${changefreq}</changefreq>`);
      }
      lines.push(`    <priority>${priorityNumber}</priority>`);
      lines.push('  </url>');
    }
    lines.push('</urlset>');
    return lines.join('\n');
  }, [
    changefreq,
    includeLastmod,
    lastmod,
    lastmodValid,
    parsed.valid,
    priorityNumber,
    priorityValid,
  ]);

  const error = !priorityValid
    ? 'Priority must be a number between 0.0 and 1.0.'
    : parsed.valid.length === 0
      ? 'Add at least one valid http:// or https:// URL.'
      : null;

  return (
    <ToolLayout>
      <Panel
        description="Enter one URL per line. The same change frequency, priority and last-modified date are applied to every entry."
        title="URLs"
      >
        <div className="space-y-3">
          <Field hint="One absolute URL per line" label="Page URLs">
            <Textarea
              aria-label="Sitemap URLs"
              onChange={(event) => setUrls(event.target.value)}
              placeholder="https://example.com/"
              style={{ minHeight: 220 }}
              value={urls}
            />
          </Field>

          <div className="grid gap-2.5 sm:grid-cols-2">
            <Field label="Change frequency">
              <Select
                onChange={(event) => setChangefreq(event.target.value)}
                value={changefreq}
              >
                {CHANGEFREQ.map((frequency) => (
                  <option key={frequency} value={frequency}>
                    {frequency}
                  </option>
                ))}
              </Select>
            </Field>
            <Field hint="0.0 to 1.0" label="Priority">
              <Input
                max={1}
                min={0}
                onChange={(event) => setPriority(event.target.value)}
                step={0.1}
                type="number"
                value={priority}
              />
            </Field>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2">
            <Toggle
              checked={includeLastmod}
              hint="Add a <lastmod> element to every URL."
              label="Include lastmod"
              onChange={setIncludeLastmod}
            />
            <Field label="Last modified">
              <Input
                disabled={!includeLastmod}
                onChange={(event) => setLastmod(event.target.value)}
                type="date"
                value={lastmod}
              />
            </Field>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setUrls(SAMPLE)} size="sm" variant="primary">
              Load example
            </Button>
            <Button onClick={() => setUrls('')} size="sm" variant="ghost">
              Clear
            </Button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <Badge variant="accent">{parsed.valid.length} valid</Badge>
            {parsed.invalid.length > 0 && (
              <Badge variant="danger">{parsed.invalid.length} invalid</Badge>
            )}
            <Badge>{changefreq}</Badge>
            <Badge>{priorityValid ? priorityNumber : '—'}</Badge>
          </div>

          {parsed.invalid.length > 0 && (
            <Callout variant="warning" title="Some URLs were skipped">
              <span className="break-all">
                {parsed.invalid.slice(0, 5).join(', ')}
                {parsed.invalid.length > 5
                  ? ` and ${parsed.invalid.length - 5} more`
                  : ''}
              </span>
            </Callout>
          )}

          {!priorityValid && priority.trim() !== '' && (
            <Callout variant="error">
              Priority must be between 0.0 and 1.0.
            </Callout>
          )}

          <div className="rounded-md border border-border bg-canvas-inset px-3 py-2 text-xs leading-5 text-fg-muted">
            XML special characters in URLs are escaped. Duplicate URLs are
            removed. A sitemap may contain up to 50,000 URLs and 50 MB
            uncompressed.
          </div>
        </div>
      </Panel>

      <ResultPanel
        error={error}
        filename="sitemap.xml"
        label="sitemap.xml"
        mime="application/xml;charset=utf-8"
        value={xml}
      />
    </ToolLayout>
  );
}
