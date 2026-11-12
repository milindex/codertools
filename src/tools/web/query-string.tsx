'use client';

import { useMemo, useRef, useState } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Textarea } from '@/components/ui/Textarea';
import { ToolLayout } from '@/components/ui/ToolLayout';

import { InfoGrid, Toggle } from './_shared';

type Row = { id: number; key: string; value: string };

const INITIAL_ROWS: Row[] = [
  { id: 1, key: 'tag', value: 'react' },
  { id: 2, key: 'tag', value: 'nextjs' },
  { id: 3, key: 'q', value: 'hello world' },
  { id: 4, key: 'page', value: '2' },
];

const SAMPLE_QUERY = '?tag=react&tag=nextjs&q=hello%20world&empty=&page=2';

export default function QueryStringTool() {
  const [mode, setMode] = useState<'parse' | 'build'>('parse');
  const [raw, setRaw] = useState(SAMPLE_QUERY);
  const [rows, setRows] = useState<Row[]>(INITIAL_ROWS);
  const [encode, setEncode] = useState(true);
  const [prefix, setPrefix] = useState(true);
  const nextId = useRef(5);

  const parsed = useMemo(() => {
    const source = raw.trim();
    if (!source) {
      return { error: 'Enter a query string to parse.' };
    }
    try {
      let query = source;
      if (query.includes('://')) {
        query = new URL(query).search;
      }
      if (query.startsWith('?')) {
        query = query.slice(1);
      }
      const hashIndex = query.indexOf('#');
      if (hashIndex >= 0) {
        query = query.slice(0, hashIndex);
      }

      const params = new URLSearchParams(query);
      const entries = [...params.entries()].map(([key, value]) => ({
        key,
        value,
      }));
      const grouped: Record<string, string | string[]> = Object.create(null);
      for (const entry of entries) {
        const existing = grouped[entry.key];
        if (existing === undefined) {
          grouped[entry.key] = entry.value;
        } else if (Array.isArray(existing)) {
          existing.push(entry.value);
        } else {
          grouped[entry.key] = [existing, entry.value];
        }
      }
      return {
        entries,
        grouped,
        normalized: `?${params.toString()}`,
        uniqueKeys: new Set(entries.map((entry) => entry.key)).size,
      };
    } catch {
      return {
        error:
          'The query string could not be parsed. Check for a malformed URL or invalid percent-encoding.',
      };
    }
  }, [raw]);

  const built = useMemo(() => {
    const pairs = rows
      .filter((row) => row.key.trim() !== '')
      .map((row) => {
        const key = encode ? encodeURIComponent(row.key) : row.key;
        const value = encode ? encodeURIComponent(row.value) : row.value;
        return `${key}=${value}`;
      });
    const query = pairs.join('&');
    return `${prefix && query ? '?' : ''}${query}`;
  }, [encode, prefix, rows]);

  const parsedJson = useMemo(() => {
    if ('error' in parsed) {
      return '';
    }
    return JSON.stringify(parsed.grouped, null, 2);
  }, [parsed]);

  const updateRow = (id: number, field: 'key' | 'value', value: string) => {
    setRows((current) =>
      current.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  return (
    <ToolLayout>
      <Panel
        description="Parse a query string into key/value pairs, or build one from editable rows."
        title="Query string"
      >
        <div className="space-y-3">
          <SegmentedControl
            ariaLabel="Query string mode"
            onChange={(value) => setMode(value as 'parse' | 'build')}
            options={[
              { value: 'parse', label: 'Parse' },
              { value: 'build', label: 'Build' },
            ]}
            value={mode}
          />

          {mode === 'parse' ? (
            <>
              <Field
                hint="Full URLs, leading ? and #fragments are accepted"
                label="Query string or URL"
              >
                <Textarea
                  aria-label="Query string to parse"
                  onChange={(event) => setRaw(event.target.value)}
                  placeholder="?tag=react&tag=nextjs&q=hello%20world"
                  value={raw}
                />
              </Field>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => setRaw(SAMPLE_QUERY)}
                  size="sm"
                  variant="primary"
                >
                  Load sample
                </Button>
                <Button onClick={() => setRaw('')} size="sm" variant="ghost">
                  Clear
                </Button>
              </div>
              {'error' in parsed && (
                <Callout variant="error" title="Could not parse query string">
                  {parsed.error}
                </Callout>
              )}
            </>
          ) : (
            <>
              <div className="space-y-2">
                {rows.map((row, index) => (
                  <div className="flex items-start gap-2" key={row.id}>
                    <Input
                      aria-label={`Parameter ${index + 1} name`}
                      className="flex-1"
                      onChange={(event) =>
                        updateRow(row.id, 'key', event.target.value)
                      }
                      placeholder="key"
                      spellCheck={false}
                      value={row.key}
                    />
                    <Input
                      aria-label={`Parameter ${index + 1} value`}
                      className="flex-1"
                      onChange={(event) =>
                        updateRow(row.id, 'value', event.target.value)
                      }
                      placeholder="value"
                      spellCheck={false}
                      value={row.value}
                    />
                    <Button
                      aria-label={`Remove parameter ${index + 1}`}
                      onClick={() =>
                        setRows((current) =>
                          current.filter((item) => item.id !== row.id)
                        )
                      }
                      size="icon"
                      variant="ghost"
                    >
                      ×
                    </Button>
                  </div>
                ))}
                {rows.length === 0 && (
                  <p className="rounded-md border border-dashed border-border bg-canvas-inset/50 px-3 py-4 text-center text-xs text-fg-muted">
                    No parameters yet. Add a row to start building.
                  </p>
                )}
              </div>

              <Button
                onClick={() =>
                  setRows((current) => [
                    ...current,
                    { id: nextId.current++, key: '', value: '' },
                  ])
                }
                size="sm"
                variant="primary"
              >
                Add parameter
              </Button>

              <div className="grid gap-2 sm:grid-cols-2">
                <Toggle
                  checked={encode}
                  hint="Use percent-encoding for reserved characters."
                  label="URL encode"
                  onChange={setEncode}
                />
                <Toggle
                  checked={prefix}
                  hint="Prepend the query with a question mark."
                  label="Leading ?"
                  onChange={setPrefix}
                />
              </div>

              {!encode && (
                <Callout variant="warning">
                  Encoding is off. Characters such as <code>&amp;</code>,{' '}
                  <code>=</code> and spaces are emitted literally, which can
                  make the query ambiguous.
                </Callout>
              )}
            </>
          )}
        </div>
      </Panel>

      <ResultPanel
        error={'error' in parsed && mode === 'parse' ? parsed.error : null}
        filename={mode === 'parse' ? 'query-params.json' : 'query-string.txt'}
        label={mode === 'parse' ? 'Parsed parameters' : 'Built query string'}
        value={mode === 'parse' ? parsedJson : built}
      >
        {mode === 'parse' ? (
          'error' in parsed ? (
            <div className="flex min-h-[230px] items-center justify-center rounded-md border border-dashed border-border bg-canvas-inset/50 p-4 text-center text-sm text-fg-muted">
              Parsed parameters will appear here.
            </div>
          ) : (
            <div className="max-h-[520px] space-y-4 overflow-auto">
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="accent">{parsed.entries.length} values</Badge>
                <Badge>{parsed.uniqueKeys} unique keys</Badge>
                <Badge variant="success">
                  {parsed.entries.length - parsed.uniqueKeys} repeated
                </Badge>
              </div>

              <InfoGrid
                items={[
                  { label: 'Normalized query', value: parsed.normalized },
                  {
                    label: 'JSON',
                    value: (
                      <pre className="overflow-auto whitespace-pre-wrap break-words font-mono text-[12px] leading-5">
                        {parsedJson}
                      </pre>
                    ),
                  },
                ]}
              />

              <section>
                <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-fg-muted">
                  Parameters
                </h3>
                {parsed.entries.length === 0 ? (
                  <p className="rounded-md border border-dashed border-border bg-canvas-inset/50 px-3 py-4 text-center text-xs text-fg-muted">
                    This query string is empty.
                  </p>
                ) : (
                  <div className="overflow-hidden rounded-md border border-border">
                    <table className="w-full border-collapse text-left text-sm">
                      <thead className="bg-canvas-subtle/60 text-[11px] uppercase tracking-wide text-fg-muted">
                        <tr>
                          <th className="w-10 px-3 py-1.5 font-semibold">#</th>
                          <th className="px-3 py-1.5 font-semibold">Name</th>
                          <th className="px-3 py-1.5 font-semibold">Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsed.entries.map((entry, index) => (
                          <tr
                            className="border-t border-border align-top"
                            key={`${entry.key}-${index}`}
                          >
                            <td className="px-3 py-2 font-mono text-[11px] text-fg-subtle">
                              {index + 1}
                            </td>
                            <td className="break-all px-3 py-2 font-mono text-[12px] text-accent">
                              {entry.key}
                            </td>
                            <td className="break-all px-3 py-2 font-mono text-[12px] text-fg">
                              {entry.value || '(empty)'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </div>
          )
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-fg-muted">
                {rows.filter((row) => row.key.trim() !== '').length} parameter
                {rows.filter((row) => row.key.trim() !== '').length === 1
                  ? ''
                  : 's'}
              </span>
              <Badge variant={encode ? 'success' : 'warning'}>
                {encode ? 'encoded' : 'raw'}
              </Badge>
            </div>
            <pre className="max-h-[520px] min-h-[230px] overflow-auto whitespace-pre-wrap break-words rounded-md border border-border bg-canvas-inset p-3 text-[13px] leading-6 text-fg">
              {built || '(empty query string)'}
            </pre>
            <p className="text-xs leading-5 text-fg-muted">
              Repeated keys are supported and keep their insertion order. Empty
              keys are skipped.
            </p>
          </div>
        )}
      </ResultPanel>
    </ToolLayout>
  );
}
