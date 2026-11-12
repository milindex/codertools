'use client';

import { useMemo, useState } from 'react';
import { UAParser } from 'ua-parser-js';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { CodeBlock } from '@/components/ui/CodeBlock';
import { Field } from '@/components/ui/Field';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { Textarea } from '@/components/ui/Textarea';
import { ToolLayout } from '@/components/ui/ToolLayout';

const SAMPLE_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

const part = (value: string | undefined, version: string | undefined) => {
  const name = value?.trim() || 'Unknown';
  return version?.trim() ? `${name} ${version}` : name;
};

export default function UserAgentParserTool() {
  const [ua, setUa] = useState(SAMPLE_UA);

  const parsed = useMemo(() => {
    const trimmed = ua.trim();
    if (!trimmed) {
      return null;
    }
    try {
      const result = new UAParser(trimmed).getResult();
      return {
        ua: result.ua ?? trimmed,
        browser: {
          name: result.browser.name ?? null,
          version: result.browser.version ?? null,
          major: result.browser.major ?? null,
        },
        engine: {
          name: result.engine.name ?? null,
          version: result.engine.version ?? null,
        },
        os: {
          name: result.os.name ?? null,
          version: result.os.version ?? null,
        },
        device: {
          type: result.device.type ?? null,
          vendor: result.device.vendor ?? null,
          model: result.device.model ?? null,
        },
        cpu: {
          architecture: result.cpu.architecture ?? null,
        },
      };
    } catch {
      return null;
    }
  }, [ua]);

  const json = parsed ? JSON.stringify(parsed, null, 2) : '';

  return (
    <ToolLayout>
      <Panel
        description="Everything is parsed locally with ua-parser-js. Paste any user agent string to inspect it."
        title="User agent string"
      >
        <div className="space-y-3">
          <Field
            hint={`${ua.length.toLocaleString()} characters`}
            label="User-Agent"
          >
            <Textarea
              aria-label="User agent string"
              onChange={(event) => setUa(event.target.value)}
              placeholder="Paste a User-Agent header value…"
              value={ua}
            />
          </Field>

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => {
                if (typeof navigator !== 'undefined') {
                  setUa(navigator.userAgent);
                }
              }}
              size="sm"
              variant="primary"
            >
              Use my browser
            </Button>
            <Button onClick={() => setUa(SAMPLE_UA)} size="sm">
              Reset sample
            </Button>
            <Button onClick={() => setUa('')} size="sm" variant="ghost">
              Clear
            </Button>
          </div>

          {!ua.trim() && (
            <Callout variant="warning">
              Enter a user agent string to see the parsed result.
            </Callout>
          )}

          {parsed && (
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="accent">
                {part(
                  parsed.browser.name ?? undefined,
                  parsed.browser.version ?? undefined
                )}
              </Badge>
              <Badge>
                {part(
                  parsed.os.name ?? undefined,
                  parsed.os.version ?? undefined
                )}
              </Badge>
              <Badge>
                {part(
                  parsed.engine.name ?? undefined,
                  parsed.engine.version ?? undefined
                )}
              </Badge>
              {parsed.device.type && (
                <Badge variant="success">{parsed.device.type}</Badge>
              )}
            </div>
          )}
        </div>
      </Panel>

      <ResultPanel
        error={
          !ua.trim()
            ? null
            : parsed
              ? null
              : 'The user agent could not be parsed.'
        }
        filename="user-agent.json"
        label="Parsed result"
        mime="application/json"
        value={json}
      >
        {parsed ? (
          <div className="space-y-3">
            <CodeBlock code={json} filename="user-agent.json" language="json" />
            <div className="rounded-md border border-border bg-canvas-subtle/40 px-3 py-2 text-xs leading-5 text-fg-muted">
              Bot, app and client-hint detection is limited to the patterns
              included in ua-parser-js. Unknown fields are shown as{' '}
              <code className="font-mono">null</code>.
            </div>
          </div>
        ) : (
          <div className="flex min-h-[230px] items-center justify-center rounded-md border border-dashed border-border bg-canvas-inset/50 p-4 text-center text-sm text-fg-muted">
            The parsed browser, engine, OS, device and CPU fields will appear
            here.
          </div>
        )}
      </ResultPanel>
    </ToolLayout>
  );
}
