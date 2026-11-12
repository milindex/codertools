'use client';

import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { Field } from '@/components/ui/Field';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { ToolLayout } from '@/components/ui/ToolLayout';

type TraceLanguage = 'js' | 'python' | 'java';
type LanguageMode = 'auto' | TraceLanguage;

type Frame = {
  raw: string;
  fn: string;
  file: string;
  line: string;
  column: string;
  library: boolean;
};

type TraceItem =
  { kind: 'frame'; frame: Frame } | { kind: 'text'; text: string };

type ParsedTrace = {
  language: TraceLanguage;
  items: TraceItem[];
  frames: number;
  appFrames: number;
  libraryFrames: number;
};

const detectLanguage = (text: string): TraceLanguage => {
  if (/^\s*File ".+", line \d+/m.test(text)) {
    return 'python';
  }
  if (
    /\([^()]*\.java:\d+\)/.test(text) ||
    /^\s*at\s+(?:java|javax|jdk|sun|com\.sun)\./m.test(text)
  ) {
    return 'java';
  }
  return 'js';
};

const normalizePath = (value: string) =>
  value.replace(/\\/g, '/').toLowerCase();

const isLibrary = (
  language: TraceLanguage,
  fn: string,
  file: string
): boolean => {
  const path = normalizePath(file);
  const name = fn.replace(/^[\w.]+\//, '');

  if (language === 'js') {
    return (
      path.includes('node_modules') ||
      path.includes('/dist/') ||
      path.includes('/vendor/') ||
      path.includes('webpack://') ||
      path.includes('node:internal') ||
      path.includes('/internal/') ||
      path.includes('/@react-') ||
      path === 'native' ||
      path.includes('<anonymous>')
    );
  }

  if (language === 'python') {
    return (
      path.includes('site-packages') ||
      path.includes('dist-packages') ||
      /\/lib\/python\d/.test(path) ||
      /python\d+\.\d+\//.test(path) ||
      path.startsWith('<frozen') ||
      path.startsWith('<string>')
    );
  }

  return (
    /^(java|javax|jdk|sun|com\.sun|kotlin|scala|groovy)\./.test(name) ||
    /^(org\.(springframework|apache|junit|slf4j|hibernate|mockito)|ch\.qos|io\.(netty|micrometer|grpc)|jakarta)\./.test(
      name
    )
  );
};

const parseTrace = (text: string, language: TraceLanguage): ParsedTrace => {
  const items: TraceItem[] = [];
  let frames = 0;
  let appFrames = 0;
  let libraryFrames = 0;

  for (const rawLine of text.split(/\r?\n/)) {
    if (!rawLine.trim()) {
      continue;
    }

    let frame: Frame | null = null;

    if (language === 'js') {
      const location = /^\s*at\s+(?:(.*?)\s+\()?(.+?):(\d+):(\d+)\)?\s*$/.exec(
        rawLine
      );
      if (location) {
        frame = {
          raw: rawLine,
          fn: (location[1] ?? '<anonymous>').trim(),
          file: (location[2] ?? '').trim().replace(/^async\s+/, ''),
          line: location[3] ?? '',
          column: location[4] ?? '',
          library: false,
        };
      } else {
        const native = /^\s*at\s+(.+?)\s+\((native)\)\s*$/.exec(rawLine);
        if (native) {
          frame = {
            raw: rawLine,
            fn: (native[1] ?? '<anonymous>').trim(),
            file: native[2] ?? 'native',
            line: '',
            column: '',
            library: false,
          };
        }
      }
    } else if (language === 'python') {
      const match = /^\s*File "(.+)", line (\d+)(?:, in (.+?))?\s*$/.exec(
        rawLine
      );
      if (match) {
        frame = {
          raw: rawLine,
          fn: (match[3] ?? '<module>').trim(),
          file: (match[1] ?? '').trim(),
          line: match[2] ?? '',
          column: '',
          library: false,
        };
      }
    } else {
      const match = /^\s*at\s+([^\s(]+)\(([^()]*)\)\s*$/.exec(rawLine);
      if (match) {
        const inside = match[2] ?? '';
        const location = /^(.*?)(?::(\d+))?$/.exec(inside);
        frame = {
          raw: rawLine,
          fn: (match[1] ?? '<unknown>').trim(),
          file: (location?.[1] ?? inside).trim(),
          line: location?.[2] ?? '',
          column: '',
          library: false,
        };
      }
    }

    if (frame) {
      const library = isLibrary(language, frame.fn, frame.file);
      frame.library = library;
      frames += 1;
      if (library) {
        libraryFrames += 1;
      } else {
        appFrames += 1;
      }
      items.push({ kind: 'frame', frame });
    } else {
      items.push({ kind: 'text', text: rawLine });
    }
  }

  return { language, items, frames, appFrames, libraryFrames };
};

const SAMPLE_JS = `TypeError: Cannot read properties of undefined (reading 'map')
    at renderList (src/components/List.tsx:42:18)
    at List (src/components/List.tsx:80:5)
    at renderWithHooks (node_modules/react-dom/cjs/react-dom.development.js:14985:18)
    at mountIndeterminateComponent (node_modules/react-dom/cjs/react-dom.development.js:17811:13)
    at beginWork (node_modules/react-dom/cjs/react-dom.development.js:19049:16)`;

export default function StackTrace() {
  const [text, setText] = useState('');
  const [mode, setMode] = useState<LanguageMode>('auto');
  const [hideLibrary, setHideLibrary] = useState(true);

  const parsed = useMemo(() => {
    const language = mode === 'auto' ? detectLanguage(text) : mode;
    return parseTrace(text, language);
  }, [text, mode]);

  const cleaned = useMemo(() => {
    const kept = parsed.items.filter(
      (item) => item.kind === 'text' || !hideLibrary || !item.frame.library
    );
    return text.trim()
      ? kept
          .map((item) =>
            item.kind === 'frame' ? item.frame.raw.trimEnd() : item.text
          )
          .filter(
            (line, index, all) =>
              line.length > 0 || (index > 0 && index < all.length - 1)
          )
          .join('\n')
      : '';
  }, [parsed, hideLibrary, text]);

  const visibleItems = parsed.items.filter(
    (item) => item.kind === 'text' || !hideLibrary || !item.frame.library
  );

  return (
    <div className="space-y-4">
      <ToolLayout>
        <Panel
          description="Paste a JavaScript, Python or Java stack trace. Frames from your own code are separated from library frames."
          title="Stack trace"
        >
          <Field
            hint="Language is detected automatically"
            htmlFor="trace-input"
            label="Trace text"
          >
            <Textarea
              className="min-h-[360px]"
              id="trace-input"
              onChange={(event) => setText(event.target.value)}
              placeholder={SAMPLE_JS}
              value={text}
            />
          </Field>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field htmlFor="trace-language" label="Language">
              <Select
                id="trace-language"
                onChange={(event) =>
                  setMode(event.target.value as LanguageMode)
                }
                value={mode}
              >
                <option value="auto">Auto-detect</option>
                <option value="js">JavaScript / Node.js</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
              </Select>
            </Field>
            <label className="flex cursor-pointer items-center gap-2 self-end pb-1 text-sm text-fg">
              <input
                checked={hideLibrary}
                className="accent-[var(--accent)]"
                onChange={(event) => setHideLibrary(event.target.checked)}
                type="checkbox"
              />
              Hide library frames in output
            </label>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <Button onClick={() => setText(SAMPLE_JS)} size="sm">
              Load example
            </Button>
            <Button onClick={() => setText('')} size="sm" variant="ghost">
              Clear
            </Button>
            <Badge variant="accent">{parsed.language}</Badge>
          </div>

          {text.trim() && parsed.frames === 0 && (
            <Callout className="mt-3" variant="warning">
              No stack frames were detected. Check the language selection, or
              paste the complete trace including the exception header.
            </Callout>
          )}

          {!text.trim() && (
            <Callout className="mt-3" variant="info">
              Frames containing paths such as <code>node_modules</code> or
              Python site-packages are marked as library code.
            </Callout>
          )}
        </Panel>

        <div className="space-y-4">
          <ResultPanel
            emptyText="Paste a stack trace to parse it."
            filename="cleaned-stack-trace.txt"
            label="Cleaned trace"
            value={cleaned}
          />

          <Panel
            description="App frames are highlighted. The cleaned output above respects the hide-library setting."
            title="Parsed frames"
          >
            {parsed.items.length === 0 ? (
              <p className="text-sm text-fg-muted">No trace content yet.</p>
            ) : (
              <>
                <div className="mb-3 flex flex-wrap gap-1.5">
                  <Badge variant="accent">{parsed.frames} frames</Badge>
                  <Badge variant="success">{parsed.appFrames} app</Badge>
                  <Badge>{parsed.libraryFrames} library</Badge>
                  <Badge>{parsed.language}</Badge>
                </div>
                <div className="max-h-[360px] divide-y divide-border/50 overflow-auto rounded-md border border-border bg-canvas-inset">
                  {visibleItems.map((item, index) =>
                    item.kind === 'frame' ? (
                      <div
                        className={`border-l-2 px-3 py-2 ${
                          item.frame.library
                            ? 'border-border bg-canvas-subtle/30'
                            : 'border-success bg-success-subtle/20'
                        }`}
                        key={index}
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                              item.frame.library
                                ? 'bg-neutral-subtle text-fg-muted'
                                : 'bg-success-subtle text-success'
                            }`}
                          >
                            {item.frame.library ? 'library' : 'app'}
                          </span>
                          <span className="break-all font-mono text-xs font-semibold text-fg">
                            {item.frame.fn}
                          </span>
                        </div>
                        <p className="mt-1 break-all font-mono text-[11px] text-fg-muted">
                          {item.frame.file}
                          {item.frame.line && `:${item.frame.line}`}
                          {item.frame.column && `:${item.frame.column}`}
                        </p>
                      </div>
                    ) : (
                      <p
                        className="whitespace-pre-wrap break-words px-3 py-1.5 font-mono text-[11px] text-fg-muted"
                        key={index}
                      >
                        {item.text}
                      </p>
                    )
                  )}
                </div>
              </>
            )}
          </Panel>
        </div>
      </ToolLayout>
    </div>
  );
}
