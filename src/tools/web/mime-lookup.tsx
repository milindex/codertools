'use client';

import mimeDb from 'mime-db/db.json';
import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { ToolLayout } from '@/components/ui/ToolLayout';

type MimeDbEntry = {
  source?: string;
  compressible?: boolean;
  charset?: string;
  extensions?: string[];
};

type MimeRow = {
  mime: string;
  extensions: string[];
  charset?: string;
  compressible: boolean;
  source?: string;
};

const MIME_ROWS: MimeRow[] = Object.entries(
  mimeDb as unknown as Record<string, MimeDbEntry>
)
  .map(([mime, entry]) => ({
    mime,
    extensions: [...(entry.extensions ?? [])].sort((a, b) =>
      a.localeCompare(b)
    ),
    charset: entry.charset,
    compressible: entry.compressible ?? false,
    source: entry.source,
  }))
  .sort((a, b) => a.mime.localeCompare(b.mime));

const BY_MIME = new Map(MIME_ROWS.map((row) => [row.mime, row]));

const EXTENSION_INDEX = new Map<string, MimeRow[]>();
for (const row of MIME_ROWS) {
  for (const extension of row.extensions) {
    const list = EXTENSION_INDEX.get(extension) ?? [];
    list.push(row);
    EXTENSION_INDEX.set(extension, list);
  }
}

const POPULAR_MIMES = [
  'text/html',
  'text/css',
  'text/javascript',
  'application/json',
  'application/xml',
  'text/plain',
  'text/csv',
  'text/markdown',
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/svg+xml',
  'image/webp',
  'image/avif',
  'application/pdf',
  'application/zip',
  'application/gzip',
  'application/wasm',
  'font/woff2',
  'audio/mpeg',
  'video/mp4',
  'application/octet-stream',
];

const POPULAR_ROWS = POPULAR_MIMES.map((mime) => BY_MIME.get(mime)).filter(
  (row): row is MimeRow => Boolean(row)
);

const COMMON_EXTENSIONS = [
  'html',
  'css',
  'js',
  'json',
  'png',
  'jpg',
  'svg',
  'pdf',
  'woff2',
  'mp4',
];

type Mode = 'extension' | 'mime' | 'all';

export default function MimeLookupTool() {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<Mode>('extension');

  const normalized = query.trim().toLowerCase().replace(/^\./, '');

  const results = useMemo(() => {
    if (!normalized) {
      return POPULAR_ROWS;
    }

    if (mode === 'extension') {
      return [...(EXTENSION_INDEX.get(normalized) ?? [])].sort((a, b) =>
        a.mime.localeCompare(b.mime)
      );
    }

    if (mode === 'mime') {
      return MIME_ROWS.filter((row) => row.mime.includes(normalized));
    }

    return MIME_ROWS.filter(
      (row) =>
        row.mime.includes(normalized) ||
        row.extensions.some((extension) => extension.includes(normalized))
    );
  }, [mode, normalized]);

  const limited = results.slice(0, 200);

  const text = limited
    .map(
      (row) =>
        `${row.mime}\t${row.extensions.length > 0 ? row.extensions.join(', ') : '—'}`
    )
    .join('\n');

  return (
    <ToolLayout>
      <Panel
        description="Look up media types from the bundled mime-db database. No network requests are made."
        title="MIME type lookup"
      >
        <div className="space-y-3">
          <Input
            aria-label="Search by extension or MIME type"
            onChange={(event) => setQuery(event.target.value)}
            placeholder={
              mode === 'mime'
                ? 'Search application/json…'
                : 'Search png, .html, json…'
            }
            type="search"
            value={query}
          />

          <SegmentedControl
            ariaLabel="Lookup mode"
            onChange={(value) => setMode(value as Mode)}
            options={[
              { value: 'extension', label: 'By extension' },
              { value: 'mime', label: 'By MIME type' },
              { value: 'all', label: 'All fields' },
            ]}
            value={mode}
          />

          <div>
            <p className="mb-1.5 text-xs font-medium text-fg-muted">
              Common extensions
            </p>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_EXTENSIONS.map((extension) => (
                <button
                  className={
                    normalized === extension && mode === 'extension'
                      ? 'cursor-pointer rounded-full border border-accent/50 bg-accent-subtle px-2 py-0.5 text-[11px] font-medium text-accent'
                      : 'cursor-pointer rounded-full border border-border bg-canvas-subtle px-2 py-0.5 text-[11px] font-medium text-fg-muted transition-colors hover:border-accent/50 hover:text-accent'
                  }
                  key={extension}
                  onClick={() => {
                    setMode('extension');
                    setQuery(extension);
                  }}
                  type="button"
                >
                  .{extension}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-md border border-border bg-canvas-inset px-3 py-2 text-xs leading-5 text-fg-muted">
            {MIME_ROWS.length.toLocaleString()} media types and{' '}
            {EXTENSION_INDEX.size.toLocaleString()} extensions indexed.
            {results.length > limited.length && (
              <>
                {' '}
                Showing the first {limited.length} matches — add more characters
                to narrow the search.
              </>
            )}
          </div>
        </div>
      </Panel>

      <ResultPanel
        label={
          normalized
            ? `${results.length} match${results.length === 1 ? '' : 'es'}`
            : 'Popular media types'
        }
        value={text}
      >
        {limited.length === 0 ? (
          <div className="flex min-h-[230px] items-center justify-center rounded-md border border-dashed border-border bg-canvas-inset/50 p-4 text-center text-sm text-fg-muted">
            No MIME types matched “{query.trim()}”. Try an extension such as
            “webp”, or search for “image/”.
          </div>
        ) : (
          <div className="max-h-[520px] overflow-auto rounded-md border border-border">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="sticky top-0 bg-canvas-subtle text-[11px] uppercase tracking-wide text-fg-muted">
                <tr>
                  <th className="px-3 py-1.5 font-semibold">MIME type</th>
                  <th className="px-3 py-1.5 font-semibold">Extensions</th>
                  <th className="px-3 py-1.5 font-semibold">Charset</th>
                  <th className="px-3 py-1.5 font-semibold">Flags</th>
                </tr>
              </thead>
              <tbody>
                {limited.map((row) => (
                  <tr
                    className="border-t border-border align-top"
                    key={row.mime}
                  >
                    <td className="px-3 py-2 font-mono text-[12px] font-medium text-accent">
                      {row.mime}
                    </td>
                    <td className="px-3 py-2">
                      <span className="flex flex-wrap gap-1">
                        {row.extensions.length > 0 ? (
                          row.extensions.map((extension) => (
                            <span
                              className="rounded border border-border bg-canvas-subtle px-1.5 py-0.5 font-mono text-[11px] text-fg-muted"
                              key={extension}
                            >
                              .{extension}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-fg-muted">—</span>
                        )}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs text-fg-muted">
                      {row.charset ?? '—'}
                    </td>
                    <td className="px-3 py-2">
                      <span className="flex flex-wrap gap-1">
                        {row.compressible && (
                          <Badge variant="accent">compressible</Badge>
                        )}
                        {row.source && <Badge>{row.source}</Badge>}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ResultPanel>
    </ToolLayout>
  );
}
