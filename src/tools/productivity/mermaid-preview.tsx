'use client';

import { useEffect, useRef, useState } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { DownloadButton } from '@/components/ui/DownloadButton';
import { Field } from '@/components/ui/Field';
import { Panel } from '@/components/ui/Panel';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Spinner } from '@/components/ui/Spinner';
import { Textarea } from '@/components/ui/Textarea';
import { ToolLayout } from '@/components/ui/ToolLayout';

type MermaidTheme = 'dark' | 'default' | 'forest' | 'neutral';

const SAMPLE = `flowchart TD
  A[Open the tool] --> B{Diagram valid?}
  B -->|Yes| C[Preview renders]
  B -->|No| D[Show error message]
  D --> E[Fix the syntax]
  E --> B
  C --> F[Download SVG]`;

const SEQUENCE_SAMPLE = `sequenceDiagram
  participant U as User
  participant A as App
  participant S as Server
  U->>A: Submit form
  A->>S: POST /api/save
  S-->>A: 201 Created
  A-->>U: Success message`;

export default function MermaidPreview() {
  const [code, setCode] = useState(SAMPLE);
  const [theme, setTheme] = useState<MermaidTheme>('dark');
  const [svg, setSvg] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const renderId = useRef(0);

  const diagramType = code
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line.length > 0 && !line.startsWith('%%'));

  useEffect(() => {
    let cancelled = false;
    const trimmed = code.trim();

    if (!trimmed) {
      setSvg('');
      setError(null);
      setLoading(false);
      return () => {
        cancelled = true;
      };
    }

    setLoading(true);
    const timer = setTimeout(() => {
      void (async () => {
        try {
          const mermaid = (await import('mermaid')).default;
          mermaid.initialize({
            startOnLoad: false,
            theme,
            securityLevel: 'strict',
            fontFamily:
              'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
          });
          renderId.current += 1;
          const result = await mermaid.render(
            `codertools-mermaid-${renderId.current}`,
            trimmed
          );
          if (!cancelled) {
            setSvg(result.svg);
            setError(null);
          }
        } catch (caught) {
          if (!cancelled) {
            setSvg('');
            setError(
              caught instanceof Error
                ? caught.message
                : 'The diagram could not be rendered.'
            );
          }
        } finally {
          if (!cancelled) {
            setLoading(false);
          }
        }
      })();
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [code, theme]);

  return (
    <div className="space-y-4">
      <ToolLayout>
        <Panel
          description="Write Mermaid syntax and see the diagram render live. Rendering happens entirely in your browser."
          title="Diagram source"
        >
          <Field
            hint="flowchart, sequenceDiagram, classDiagram, gantt…"
            htmlFor="mermaid-source"
            label="Mermaid code"
          >
            <Textarea
              className="min-h-[420px]"
              id="mermaid-source"
              onChange={(event) => setCode(event.target.value)}
              placeholder={'flowchart LR\n  A --> B'}
              value={code}
            />
          </Field>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <SegmentedControl
              ariaLabel="Mermaid theme"
              onChange={(value) => {
                if (
                  value === 'dark' ||
                  value === 'default' ||
                  value === 'forest' ||
                  value === 'neutral'
                ) {
                  setTheme(value);
                }
              }}
              options={[
                { value: 'dark', label: 'Dark' },
                { value: 'default', label: 'Light' },
                { value: 'forest', label: 'Forest' },
                { value: 'neutral', label: 'Neutral' },
              ]}
              value={theme}
            />
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => setCode(SAMPLE)} size="sm" variant="ghost">
                Flowchart sample
              </Button>
              <Button
                onClick={() => setCode(SEQUENCE_SAMPLE)}
                size="sm"
                variant="ghost"
              >
                Sequence sample
              </Button>
              <Button onClick={() => setCode('')} size="sm" variant="ghost">
                Clear
              </Button>
            </div>
          </div>

          <Callout className="mt-3" variant="info">
            Mermaid is loaded on demand. Invalid syntax is reported below the
            preview instead of breaking the page.
          </Callout>
        </Panel>

        <Panel
          actions={
            <div className="flex items-center gap-1">
              {loading && <Spinner />}
              {diagramType && (
                <Badge variant="accent">{diagramType.split(' ')[0]}</Badge>
              )}
              {svg && (
                <DownloadButton
                  filename="diagram.svg"
                  label="SVG"
                  mime="image/svg+xml"
                  value={svg}
                />
              )}
            </div>
          }
          description="The SVG updates as you type. Use the SVG button to save the rendered diagram."
          title="Preview"
        >
          {error ? (
            <Callout title="Invalid Mermaid syntax" variant="error">
              <span className="whitespace-pre-wrap break-words">{error}</span>
            </Callout>
          ) : svg ? (
            <div className="max-h-[560px] overflow-auto rounded-md border border-border bg-canvas-inset p-4">
              <div
                className="flex min-h-[240px] items-center justify-center [&_svg]:h-auto [&_svg]:max-h-[520px] [&_svg]:max-w-full"
                // Mermaid returns trusted SVG generated from the local parser.
                dangerouslySetInnerHTML={{ __html: svg }}
              />
            </div>
          ) : loading ? (
            <div className="flex min-h-[280px] items-center justify-center gap-2 rounded-md border border-dashed border-border bg-canvas-inset/50 text-sm text-fg-muted">
              <Spinner />
              Rendering diagram…
            </div>
          ) : (
            <div className="flex min-h-[280px] items-center justify-center rounded-md border border-dashed border-border bg-canvas-inset/50 p-4 text-center text-sm text-fg-muted">
              Enter Mermaid code to render a diagram.
            </div>
          )}

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs text-fg-muted">
              {code.split(/\r?\n/).length} lines
            </span>
            <span className="text-xs text-fg-muted">
              Theme: {theme === 'default' ? 'light' : theme}
            </span>
          </div>
        </Panel>
      </ToolLayout>
    </div>
  );
}
