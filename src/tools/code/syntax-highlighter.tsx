'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { Field } from '@/components/ui/Field';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import { Textarea } from '@/components/ui/Textarea';
import { ToolLayout } from '@/components/ui/ToolLayout';

import { errorMessage } from './_shared';

const EXAMPLE = `type User = { id: string; name: string };

const formatUser = (user: User): string => {
  const label = \`\${user.name} (\${user.id})\`;
  return label.trim();
};

export async function fetchUser(id: string) {
  const response = await fetch(\`/api/users/\${id}\`);
  if (!response.ok) throw new Error("Request failed");
  return formatUser((await response.json()) as User);
}`;

const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'jsx', label: 'JSX' },
  { value: 'tsx', label: 'TSX' },
  { value: 'markup', label: 'HTML / XML' },
  { value: 'css', label: 'CSS' },
  { value: 'scss', label: 'SCSS' },
  { value: 'json', label: 'JSON' },
  { value: 'yaml', label: 'YAML' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'bash', label: 'Bash / Shell' },
  { value: 'python', label: 'Python' },
  { value: 'sql', label: 'SQL' },
  { value: 'graphql', label: 'GraphQL' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'java', label: 'Java' },
  { value: 'csharp', label: 'C#' },
  { value: 'cpp', label: 'C / C++' },
  { value: 'php', label: 'PHP' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'diff', label: 'Diff' },
  { value: 'http', label: 'HTTP' },
  { value: 'docker', label: 'Dockerfile' },
  { value: 'nginx', label: 'Nginx' },
  { value: 'ini', label: 'INI' },
  { value: 'toml', label: 'TOML' },
] as const;

type Language = (typeof LANGUAGES)[number]['value'];
type Theme = 'light' | 'dark';
type View = 'preview' | 'html';

type PrismApi = {
  languages: Record<string, unknown>;
  highlight: (code: string, grammar: unknown, language: string) => string;
  manual?: boolean;
};

const DEPENDENCIES: Record<string, string[]> = {
  typescript: ['javascript'],
  jsx: ['markup', 'javascript'],
  tsx: ['jsx', 'typescript'],
  scss: ['css'],
  markdown: ['markup'],
  csharp: ['clike'],
  cpp: ['c'],
  c: ['clike'],
  php: ['markup-templating'],
};

const LOADERS: Record<string, () => Promise<unknown>> = {
  typescript: () => import('prismjs/components/prism-typescript'),
  jsx: () => import('prismjs/components/prism-jsx'),
  tsx: () => import('prismjs/components/prism-tsx'),
  json: () => import('prismjs/components/prism-json'),
  yaml: () => import('prismjs/components/prism-yaml'),
  markdown: () => import('prismjs/components/prism-markdown'),
  bash: () => import('prismjs/components/prism-bash'),
  python: () => import('prismjs/components/prism-python'),
  sql: () => import('prismjs/components/prism-sql'),
  graphql: () => import('prismjs/components/prism-graphql'),
  go: () => import('prismjs/components/prism-go'),
  rust: () => import('prismjs/components/prism-rust'),
  java: () => import('prismjs/components/prism-java'),
  csharp: () => import('prismjs/components/prism-csharp'),
  cpp: () => import('prismjs/components/prism-cpp'),
  c: () => import('prismjs/components/prism-c'),
  scss: () => import('prismjs/components/prism-scss'),
  diff: () => import('prismjs/components/prism-diff'),
  http: () => import('prismjs/components/prism-http'),
  docker: () => import('prismjs/components/prism-docker'),
  nginx: () => import('prismjs/components/prism-nginx'),
  ini: () => import('prismjs/components/prism-ini'),
  toml: () => import('prismjs/components/prism-toml'),
  php: () => import('prismjs/components/prism-php'),
  ruby: () => import('prismjs/components/prism-ruby'),
  'markup-templating': () =>
    import('prismjs/components/prism-markup-templating'),
};

const CORE_LANGUAGES = new Set(['clike', 'javascript', 'markup', 'css']);
const loadedLanguages = new Set<string>();
let prismPromise: Promise<PrismApi> | null = null;

const loadPrism = () => {
  if (!prismPromise) {
    prismPromise = import('prismjs').then((module) => {
      const candidate = (module.default ?? module) as PrismApi;
      candidate.manual = true;
      return candidate;
    });
  }
  return prismPromise;
};

const ensureLanguage = async (language: string) => {
  const prism = await loadPrism();

  const visit = async (name: string): Promise<void> => {
    if (CORE_LANGUAGES.has(name) || loadedLanguages.has(name)) {
      return;
    }

    loadedLanguages.add(name);

    for (const dependency of DEPENDENCIES[name] ?? []) {
      await visit(dependency);
    }

    const loader = LOADERS[name];
    if (loader) {
      await loader();
    }
  };

  await visit(language);
  return prism;
};

const THEMES: Record<Theme, Record<string, string>> = {
  light: {
    background: '#f6f8fa',
    text: '#1f2328',
    comment: '#6e7781',
    punctuation: '#24292f',
    property: '#0550ae',
    string: '#0a3069',
    keyword: '#cf222e',
    function: '#8250df',
    number: '#0550ae',
    regex: '#953800',
    operator: '#cf222e',
    variable: '#953800',
    deleted: '#82071e',
    inserted: '#116329',
  },
  dark: {
    background: '#0d1117',
    text: '#e6edf3',
    comment: '#8b949e',
    punctuation: '#c9d1d9',
    property: '#79c0ff',
    string: '#a5d6ff',
    keyword: '#ff7b72',
    function: '#d2a8ff',
    number: '#79c0ff',
    regex: '#ffa657',
    operator: '#ff7b72',
    variable: '#ffa657',
    deleted: '#ffdcd7',
    inserted: '#aff5b4',
  },
};

const buildThemeCss = (theme: Theme) => {
  const colors = THEMES[theme];
  return `
.ct-prism-${theme} .token.comment,
.ct-prism-${theme} .token.prolog,
.ct-prism-${theme} .token.doctype,
.ct-prism-${theme} .token.cdata { color: ${colors.comment}; font-style: italic; }
.ct-prism-${theme} .token.punctuation { color: ${colors.punctuation}; }
.ct-prism-${theme} .token.namespace { opacity: 0.7; }
.ct-prism-${theme} .token.property,
.ct-prism-${theme} .token.tag,
.ct-prism-${theme} .token.constant,
.ct-prism-${theme} .token.symbol,
.ct-prism-${theme} .token.deleted { color: ${colors.property}; }
.ct-prism-${theme} .token.boolean,
.ct-prism-${theme} .token.number { color: ${colors.number}; }
.ct-prism-${theme} .token.selector,
.ct-prism-${theme} .token.attr-name,
.ct-prism-${theme} .token.string,
.ct-prism-${theme} .token.char,
.ct-prism-${theme} .token.builtin,
.ct-prism-${theme} .token.inserted { color: ${colors.string}; }
.ct-prism-${theme} .token.operator,
.ct-prism-${theme} .token.entity,
.ct-prism-${theme} .token.url { color: ${colors.operator}; }
.ct-prism-${theme} .token.atrule,
.ct-prism-${theme} .token.attr-value,
.ct-prism-${theme} .token.keyword { color: ${colors.keyword}; }
.ct-prism-${theme} .token.function,
.ct-prism-${theme} .token.class-name { color: ${colors.function}; }
.ct-prism-${theme} .token.regex,
.ct-prism-${theme} .token.important,
.ct-prism-${theme} .token.variable { color: ${colors.variable}; }
.ct-prism-${theme} .token.important,
.ct-prism-${theme} .token.bold { font-weight: 600; }
.ct-prism-${theme} .token.italic { font-style: italic; }
.ct-prism-${theme} .token.entity { cursor: help; }
`;
};

export default function SyntaxHighlighterTool() {
  const [code, setCode] = useState(EXAMPLE);
  const [language, setLanguage] = useState<Language>('typescript');
  const [theme, setTheme] = useState<Theme>('dark');
  const [view, setView] = useState<View>('preview');
  const [highlighted, setHighlighted] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const highlight = async () => {
    if (!code.trim()) {
      setHighlighted('');
      setError('Paste some code to highlight.');
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const prism = await ensureLanguage(language);
      const grammar = prism.languages[language];
      if (!grammar) {
        throw new Error(`The ${language} grammar could not be loaded.`);
      }
      setHighlighted(prism.highlight(code, grammar, language));
    } catch (highlightError) {
      setHighlighted('');
      setError(errorMessage(highlightError));
    } finally {
      setBusy(false);
    }
  };

  const colors = THEMES[theme];

  return (
    <ToolLayout>
      <Panel
        description="Prism loads only the grammar you select. The output is escaped HTML that can be pasted into a page or copied as a code block."
        title="Code input"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Language">
            <Select
              aria-label="Code language"
              onChange={(event) => {
                setLanguage(event.target.value as Language);
                setHighlighted('');
                setError(null);
              }}
              value={language}
            >
              {LANGUAGES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Theme">
            <SegmentedControl
              ariaLabel="Highlight theme"
              className="mt-1"
              onChange={(value) => setTheme(value as Theme)}
              options={[
                { value: 'dark', label: 'Dark' },
                { value: 'light', label: 'Light' },
              ]}
              value={theme}
            />
          </Field>
        </div>

        <div className="mt-3">
          <Field
            hint={`${code.length.toLocaleString()} characters`}
            label="Code"
          >
            <Textarea
              aria-label="Code to highlight"
              className="min-h-[340px]"
              onChange={(event) => {
                setCode(event.target.value);
                setError(null);
              }}
              value={code}
            />
          </Field>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button disabled={busy} onClick={highlight} variant="primary">
            {busy && <Spinner className="h-3.5 w-3.5" />}
            Highlight code
          </Button>
          <Button onClick={() => setCode(EXAMPLE)}>Load example</Button>
          <Button
            onClick={() => {
              setCode('');
              setHighlighted('');
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
      </Panel>

      <ResultPanel
        emptyText="Highlighted HTML and a live preview will appear here."
        filename={`highlighted.${language === 'markup' ? 'html' : language}`}
        label="Highlighted output"
        value={highlighted}
      >
        {highlighted ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <SegmentedControl
                ariaLabel="Output view"
                onChange={(value) => setView(value as View)}
                options={[
                  { value: 'preview', label: 'Preview' },
                  { value: 'html', label: 'HTML' },
                ]}
                value={view}
              />
              <span className="text-xs text-fg-muted">
                {code.split('\n').length} lines
              </span>
            </div>

            <style>{buildThemeCss(theme)}</style>

            {view === 'preview' ? (
              <div
                className={`ct-prism-${theme} max-h-[520px] overflow-auto rounded-md border border-border`}
                style={{ background: colors.background }}
              >
                <pre
                  className="min-h-[230px] whitespace-pre-wrap break-words p-4 text-[13px] leading-6"
                  style={{ color: colors.text }}
                >
                  <code dangerouslySetInnerHTML={{ __html: highlighted }} />
                </pre>
              </div>
            ) : (
              <pre className="max-h-[520px] min-h-[230px] overflow-auto whitespace-pre-wrap break-words rounded-md border border-border bg-canvas-inset p-3 font-mono text-[13px] leading-6 text-fg">
                {highlighted}
              </pre>
            )}
          </div>
        ) : undefined}
      </ResultPanel>
    </ToolLayout>
  );
}
