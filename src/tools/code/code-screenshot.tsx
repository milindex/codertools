'use client';

import { Download } from 'lucide-react';
import { useRef, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Panel } from '@/components/ui/Panel';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import { Textarea } from '@/components/ui/Textarea';
import { ToolLayout } from '@/components/ui/ToolLayout';

import { errorMessage } from './_shared';

const EXAMPLE = `export async function loadUser(id: string) {
  const response = await fetch(\`/api/users/\${id}\`);

  if (!response.ok) {
    throw new Error("Unable to load user");
  }

  const user = await response.json();
  console.log("loaded", user);
  return user;
}`;

type ThemeName = 'github-dark' | 'midnight' | 'paper';

type ShotTheme = {
  bg: string;
  panel: string;
  text: string;
  muted: string;
  border: string;
  accent: string;
  dots: string[];
};

const THEMES: Record<ThemeName, ShotTheme> = {
  'github-dark': {
    bg: '#0d1117',
    panel: '#161b22',
    text: '#e6edf3',
    muted: '#8b949e',
    border: '#30363d',
    accent: '#58a6ff',
    dots: ['#ff5f56', '#ffbd2e', '#27c93f'],
  },
  midnight: {
    bg: '#1e1e2e',
    panel: '#252537',
    text: '#cdd6f4',
    muted: '#7f849c',
    border: '#3b3b52',
    accent: '#89b4fa',
    dots: ['#f38ba8', '#f9e2af', '#a6e3a1'],
  },
  paper: {
    bg: '#eef2f7',
    panel: '#ffffff',
    text: '#1f2328',
    muted: '#6e7781',
    border: '#d0d7de',
    accent: '#0969da',
    dots: ['#ff5f56', '#ffbd2e', '#27c93f'],
  },
};

export default function CodeScreenshotTool() {
  const [code, setCode] = useState(EXAMPLE);
  const [languageLabel, setLanguageLabel] = useState('typescript');
  const [themeName, setThemeName] = useState<ThemeName>('github-dark');
  const [padding, setPadding] = useState(32);
  const [fontSize, setFontSize] = useState(13);
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const theme = THEMES[themeName];
  const lines = code.split('\n');

  const exportPng = async () => {
    const node = previewRef.current;
    if (!node) {
      setError('The preview is not ready yet. Try again.');
      return;
    }
    if (!code.trim()) {
      setError('Enter some code before exporting an image.');
      return;
    }

    setExporting(true);
    setError(null);

    try {
      const imageModule = await import('html-to-image');
      const toPng =
        imageModule.toPng ??
        (
          imageModule as unknown as {
            default?: { toPng?: typeof imageModule.toPng };
          }
        ).default?.toPng;

      if (typeof toPng !== 'function') {
        throw new Error('The image exporter could not be loaded.');
      }

      const dataUrl = await toPng(node, {
        pixelRatio: 2,
        cacheBust: true,
        skipFonts: true,
        backgroundColor: theme.bg,
      });

      const safeLabel =
        (languageLabel.trim() || 'code')
          .toLowerCase()
          .replace(/[^a-z0-9-]+/g, '-')
          .replace(/^-+|-+$/g, '') || 'code';

      const anchor = document.createElement('a');
      anchor.download = `${safeLabel}-snippet.png`;
      anchor.href = dataUrl;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
    } catch (exportError) {
      setError(errorMessage(exportError));
    } finally {
      setExporting(false);
    }
  };

  return (
    <ToolLayout>
      <Panel
        description="Style a code snippet, preview it, then export a crisp 2× PNG entirely in your browser."
        title="Snippet settings"
      >
        <Field hint={`${lines.length.toLocaleString()} lines`} label="Code">
          <Textarea
            aria-label="Code for the screenshot"
            className="min-h-[260px]"
            onChange={(event) => {
              setCode(event.target.value);
              setError(null);
            }}
            value={code}
          />
        </Field>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="Language label">
            <Input
              aria-label="Language label"
              onChange={(event) => setLanguageLabel(event.target.value)}
              placeholder="typescript"
              value={languageLabel}
            />
          </Field>

          <Field label="Theme">
            <Select
              aria-label="Screenshot theme"
              onChange={(event) =>
                setThemeName(event.target.value as ThemeName)
              }
              value={themeName}
            >
              <option value="github-dark">GitHub Dark</option>
              <option value="midnight">Midnight</option>
              <option value="paper">Paper</option>
            </Select>
          </Field>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field hint={`${padding}px`} label="Padding">
            <input
              aria-label="Padding"
              className="h-8 w-full cursor-pointer"
              max={64}
              min={12}
              onChange={(event) => setPadding(Number(event.target.value))}
              step={4}
              style={{ accentColor: 'var(--accent)' }}
              type="range"
              value={padding}
            />
          </Field>

          <Field hint={`${fontSize}px`} label="Font size">
            <input
              aria-label="Font size"
              className="h-8 w-full cursor-pointer"
              max={20}
              min={11}
              onChange={(event) => setFontSize(Number(event.target.value))}
              step={1}
              style={{ accentColor: 'var(--accent)' }}
              type="range"
              value={fontSize}
            />
          </Field>
        </div>

        <label className="mt-3 flex w-fit cursor-pointer items-center gap-2 text-xs font-medium text-fg-muted">
          <input
            checked={showLineNumbers}
            className="h-3.5 w-3.5 cursor-pointer"
            onChange={(event) => setShowLineNumbers(event.target.checked)}
            style={{ accentColor: 'var(--accent)' }}
            type="checkbox"
          />
          Show line numbers
        </label>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button
            disabled={exporting || !code.trim()}
            onClick={exportPng}
            variant="primary"
          >
            {exporting ? (
              <Spinner className="h-3.5 w-3.5" />
            ) : (
              <Download aria-hidden className="h-3.5 w-3.5" />
            )}
            Export PNG
          </Button>
          <Button onClick={() => setCode(EXAMPLE)}>Load example</Button>
          <Button
            onClick={() => {
              setCode('');
              setError(null);
            }}
            variant="ghost"
          >
            Clear
          </Button>
        </div>

        {error && (
          <Callout className="mt-3" variant="error">
            {error}
          </Callout>
        )}

        <Callout className="mt-3" variant="info">
          The image is generated locally with <code>html-to-image</code>. No
          code or image is uploaded.
        </Callout>
      </Panel>

      <Panel
        actions={
          <Button
            disabled={exporting || !code.trim()}
            onClick={exportPng}
            size="sm"
          >
            {exporting ? (
              <Spinner className="h-3.5 w-3.5" />
            ) : (
              <Download aria-hidden className="h-3.5 w-3.5" />
            )}
            Download PNG
          </Button>
        }
        bodyClassName="flex min-h-[320px] items-center justify-center overflow-auto bg-canvas-subtle/40"
        description="The exported image matches this frame."
        title="Image preview"
      >
        <div
          className="w-[720px] max-w-full overflow-hidden rounded-xl shadow-2xl"
          ref={previewRef}
          style={{
            background: theme.panel,
            border: `1px solid ${theme.border}`,
            color: theme.text,
          }}
        >
          <div
            className="flex items-center gap-3 px-4 py-3"
            style={{
              background: theme.bg,
              borderBottom: `1px solid ${theme.border}`,
            }}
          >
            <span className="flex items-center gap-1.5">
              {theme.dots.map((dot) => (
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  key={dot}
                  style={{ background: dot }}
                />
              ))}
            </span>
            <span
              className="min-w-0 flex-1 truncate text-center text-[11px] font-medium"
              style={{ color: theme.muted }}
            >
              {languageLabel.trim() || 'code'}
            </span>
            <span className="w-8" />
          </div>

          <pre
            className="overflow-x-auto font-mono"
            style={{
              background: theme.panel,
              fontSize: `${fontSize}px`,
              lineHeight: 1.65,
              margin: 0,
              padding: `${padding}px`,
              whiteSpace: 'pre',
            }}
          >
            <code>
              {lines.map((line, index) => (
                <span className="flex" key={`${index}-${line}`}>
                  {showLineNumbers && (
                    <span
                      aria-hidden
                      className="mr-4 inline-block select-none text-right"
                      style={{
                        color: theme.muted,
                        minWidth: `${String(lines.length).length + 0.5}ch`,
                        opacity: 0.7,
                      }}
                    >
                      {index + 1}
                    </span>
                  )}
                  <span
                    className="whitespace-pre"
                    style={{ color: theme.text }}
                  >
                    {line || ' '}
                  </span>
                </span>
              ))}
            </code>
          </pre>
        </div>
      </Panel>
    </ToolLayout>
  );
}
