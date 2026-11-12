'use client';

import { useMemo, useState } from 'react';

import { Callout } from '@/components/ui/Callout';
import { Input } from '@/components/ui/Input';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { ToolLayout } from '@/components/ui/ToolLayout';

import { ExampleChips, InfoGrid } from './_shared';

type ParsedUrl = {
  href: string;
  origin: string;
  protocol: string;
  username: string;
  password: string;
  host: string;
  hostname: string;
  port: string;
  pathname: string;
  search: string;
  hash: string;
  decodedPathname: string;
  decodedHash: string;
  params: { name: string; value: string }[];
};

const safeDecode = (value: string) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const parseInput = (raw: string): URL => {
  const trimmed = raw.trim();
  const hasScheme =
    /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ||
    /^(?:mailto|tel|file|data|javascript):/i.test(trimmed);
  const candidate = hasScheme
    ? trimmed
    : trimmed.startsWith('//')
      ? `https:${trimmed}`
      : `https://${trimmed}`;
  return new URL(candidate);
};

export default function UrlParserTool() {
  const [input, setInput] = useState(
    'https://example.com:8443/products/shoes?color=black&size=42&tag=sale#reviews'
  );

  const result = useMemo<{ data: ParsedUrl } | { error: string }>(() => {
    if (!input.trim()) {
      return { error: 'Enter a URL to inspect.' };
    }
    try {
      const url = parseInput(input);
      return {
        data: {
          href: url.href,
          origin: url.origin,
          protocol: url.protocol,
          username: safeDecode(url.username),
          password: safeDecode(url.password),
          host: url.host,
          hostname: url.hostname,
          port: url.port || '(default)',
          pathname: url.pathname,
          search: url.search,
          hash: url.hash,
          decodedPathname: safeDecode(url.pathname),
          decodedHash: safeDecode(url.hash),
          params: [...url.searchParams.entries()].map(([name, value]) => ({
            name,
            value,
          })),
        },
      };
    } catch {
      return {
        error:
          'That does not look like a valid URL. Include a host such as example.com, or a full scheme such as https://.',
      };
    }
  }, [input]);

  const data = 'data' in result ? result.data : null;

  const json = data
    ? JSON.stringify(
        {
          ...data,
          params: data.params.reduce<Record<string, string | string[]>>(
            (accumulator, item) => {
              const existing = accumulator[item.name];
              if (existing === undefined) {
                accumulator[item.name] = item.value;
              } else if (Array.isArray(existing)) {
                accumulator[item.name] = [...existing, item.value];
              } else {
                accumulator[item.name] = [existing, item.value];
              }
              return accumulator;
            },
            Object.create(null) as Record<string, string | string[]>
          ),
        },
        null,
        2
      )
    : '';

  return (
    <ToolLayout>
      <Panel
        description="Uses the browser's URL API, so parsing rules match your browser exactly."
        title="URL"
      >
        <div className="space-y-3">
          <Input
            aria-label="URL to parse"
            onChange={(event) => setInput(event.target.value)}
            placeholder="https://example.com/path?query=value#hash"
            spellCheck={false}
            type="url"
            value={input}
          />

          <ExampleChips
            examples={[
              {
                label: 'Basic URL',
                value:
                  'https://example.com/path/to/page?ref=newsletter#section-2',
              },
              {
                label: 'Port + query',
                value: 'http://localhost:3000/api/items?limit=20&sort=desc',
              },
              {
                label: 'IPv6 host',
                value: 'http://[2001:db8::1]:8080/status',
              },
              {
                label: 'Encoded path',
                value:
                  'https://example.com/caf%C3%A9/men%C3%BC?q=hello%20world',
              },
            ]}
            onPick={setInput}
          />

          {'error' in result && (
            <Callout variant="error" title="Could not parse URL">
              {result.error}
            </Callout>
          )}

          {data && (
            <div className="rounded-md border border-border bg-canvas-inset px-3 py-2 text-xs leading-5 text-fg-muted">
              Protocol-relative and scheme-less input is assumed to use HTTPS.
              Query parameters are decoded automatically, including repeated
              keys.
            </div>
          )}
        </div>
      </Panel>

      <ResultPanel
        error={'error' in result ? result.error : null}
        filename="url-parts.json"
        label="URL breakdown"
        mime="application/json"
        value={json}
      >
        {data ? (
          <div className="max-h-[520px] space-y-4 overflow-auto">
            <InfoGrid
              items={[
                { label: 'Full URL', value: data.href },
                { label: 'Origin', value: data.origin || '(none)' },
                { label: 'Protocol', value: data.protocol },
                { label: 'Username', value: data.username || '(none)' },
                { label: 'Password', value: data.password || '(none)' },
                { label: 'Host', value: data.host },
                { label: 'Hostname', value: data.hostname },
                { label: 'Port', value: data.port },
                { label: 'Path', value: data.pathname },
                { label: 'Decoded path', value: data.decodedPathname },
                { label: 'Query', value: data.search || '(none)' },
                { label: 'Hash', value: data.hash || '(none)' },
                { label: 'Decoded hash', value: data.decodedHash || '(none)' },
              ]}
            />

            <section>
              <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-fg-muted">
                Query parameters ({data.params.length})
              </h3>
              {data.params.length === 0 ? (
                <p className="rounded-md border border-dashed border-border bg-canvas-inset/50 px-3 py-4 text-center text-xs text-fg-muted">
                  This URL has no query parameters.
                </p>
              ) : (
                <div className="overflow-hidden rounded-md border border-border">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead className="bg-canvas-subtle/60 text-[11px] uppercase tracking-wide text-fg-muted">
                      <tr>
                        <th className="px-3 py-1.5 font-semibold">Name</th>
                        <th className="px-3 py-1.5 font-semibold">Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.params.map((param, index) => (
                        <tr
                          className="border-t border-border align-top"
                          key={`${param.name}-${index}`}
                        >
                          <td className="px-3 py-2 font-mono text-[12px] text-accent">
                            {param.name}
                          </td>
                          <td className="break-all px-3 py-2 font-mono text-[12px] text-fg">
                            {param.value || '(empty)'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        ) : (
          <div className="flex min-h-[230px] items-center justify-center rounded-md border border-dashed border-border bg-canvas-inset/50 p-4 text-center text-sm text-fg-muted">
            The protocol, host, port, path, query and fragment will appear here.
          </div>
        )}
      </ResultPanel>
    </ToolLayout>
  );
}
