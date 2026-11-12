'use client';

import type { Plugin } from 'prettier';
import { useState } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { Field } from '@/components/ui/Field';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Spinner } from '@/components/ui/Spinner';
import { Textarea } from '@/components/ui/Textarea';
import { ToolLayout } from '@/components/ui/ToolLayout';

import { byteLength, countLines, formatBytes, toErrorMessage } from './utils';

type FormatResult = {
  output: string;
  warning: string | null;
};

const countBrackets = (
  line: string,
  blockComment: boolean
): { opens: number; closes: number; blockComment: boolean } => {
  let opens = 0;
  let closes = 0;
  let index = 0;
  let quote: string | null = null;
  let inBlockComment = blockComment;

  while (index < line.length) {
    const character = line[index]!;
    const next = line[index + 1];

    if (inBlockComment) {
      if (character === '*' && next === '/') {
        inBlockComment = false;
        index += 2;
      } else {
        index += 1;
      }
      continue;
    }

    if (quote) {
      if (character === '\\') {
        index += 2;
        continue;
      }
      if (character === quote) {
        quote = null;
      }
      index += 1;
      continue;
    }

    if (character === '/' && next === '/') {
      break;
    }
    if (character === '/' && next === '*') {
      inBlockComment = true;
      index += 2;
      continue;
    }
    if (character === '"' || character === "'" || character === '`') {
      quote = character;
      index += 1;
      continue;
    }
    if (character === '{' || character === '(' || character === '[') {
      opens += 1;
    } else if (character === '}' || character === ')' || character === ']') {
      closes += 1;
    }
    index += 1;
  }

  return { opens, closes, blockComment: inBlockComment };
};

const fallbackIndent = (source: string, size: number): string => {
  const lines = source.replace(/\r\n?/g, '\n').split('\n');
  const output: string[] = [];
  let depth = 0;
  let blockComment = false;

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();

    if (!trimmed) {
      output.push('');
      continue;
    }

    const leadingClosers = /^[})\]]+/.exec(trimmed)?.[0].length ?? 0;
    const displayDepth = Math.max(0, depth - leadingClosers);
    output.push(`${' '.repeat(displayDepth * size)}${trimmed}`);

    const scan = countBrackets(trimmed, blockComment);
    blockComment = scan.blockComment;
    depth = Math.max(0, depth + scan.opens - scan.closes);
  }

  return output.join('\n');
};

export default function JsFormatter() {
  const [source, setSource] = useState('');
  const [indentSize, setIndentSize] = useState('2');
  const [quoteStyle, setQuoteStyle] = useState('single');
  const [semicolons, setSemicolons] = useState(true);
  const [result, setResult] = useState<FormatResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setResult(null);
    setError(null);
  };

  const format = async () => {
    if (!source.trim()) {
      setResult(null);
      setError('Enter some JavaScript to format.');
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const [prettier, babelPlugin, estreePlugin] = await Promise.all([
        import('prettier/standalone'),
        import('prettier/plugins/babel'),
        import('prettier/plugins/estree'),
      ]);

      const output = await prettier.format(source, {
        parser: 'babel',
        plugins: [
          babelPlugin as unknown as Plugin,
          estreePlugin as unknown as Plugin,
        ],
        tabWidth: Number(indentSize),
        useTabs: false,
        printWidth: 80,
        semi: semicolons,
        singleQuote: quoteStyle === 'single',
        trailingComma: 'all',
      });

      setResult({ output, warning: null });
    } catch (formatError) {
      const output = fallbackIndent(source, Number(indentSize));
      const reason =
        toErrorMessage(formatError).split('\n')[0]?.trim() ||
        'Unknown parser error.';
      setResult({
        output,
        warning: `Prettier could not parse this input (${reason}). A basic indentation pass was used instead, so the result may not be fully formatted.`,
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <ToolLayout>
        <Panel title="JavaScript">
          <Field
            hint={`${source.length.toLocaleString('en-US')} characters · ${countLines(
              source
            ).toLocaleString('en-US')} lines`}
            label="Source code"
          >
            <Textarea
              aria-label="JavaScript source code"
              onChange={(event) => {
                setSource(event.target.value);
                reset();
              }}
              placeholder={'const greeting = "hello";\nconsole.log(greeting);'}
              spellCheck={false}
              value={source}
            />
          </Field>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="Indentation">
              <SegmentedControl
                ariaLabel="Indentation size"
                onChange={(value) => {
                  setIndentSize(value);
                  reset();
                }}
                options={[
                  { label: '2 spaces', value: '2' },
                  { label: '4 spaces', value: '4' },
                ]}
                value={indentSize}
              />
            </Field>
            <Field label="Quotes">
              <SegmentedControl
                ariaLabel="Quote style"
                onChange={(value) => {
                  setQuoteStyle(value);
                  reset();
                }}
                options={[
                  { label: 'Single', value: 'single' },
                  { label: 'Double', value: 'double' },
                ]}
                value={quoteStyle}
              />
            </Field>
          </div>

          <label className="mt-3 flex w-fit cursor-pointer items-center gap-2 text-xs font-medium text-fg-muted">
            <input
              checked={semicolons}
              className="h-3.5 w-3.5 accent-[var(--accent)]"
              onChange={(event) => {
                setSemicolons(event.target.checked);
                reset();
              }}
              type="checkbox"
            />
            Print semicolons
          </label>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              disabled={busy}
              onClick={format}
              size="md"
              variant="primary"
            >
              {busy && <Spinner className="text-white" />}
              {busy ? 'Formatting…' : 'Format JavaScript'}
            </Button>
            <Button
              disabled={!source && !result && !error}
              onClick={() => {
                setSource('');
                reset();
              }}
              variant="default"
            >
              Clear
            </Button>
          </div>

          {error && (
            <Callout className="mt-3" variant="warning">
              {error}
            </Callout>
          )}

          {result?.warning && (
            <Callout className="mt-3" variant="warning">
              {result.warning}
            </Callout>
          )}

          {result && (
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge>
                {countLines(source).toLocaleString('en-US')} →{' '}
                {countLines(result.output).toLocaleString('en-US')} lines
              </Badge>
              <Badge>
                {formatBytes(byteLength(source))} →{' '}
                {formatBytes(byteLength(result.output))}
              </Badge>
            </div>
          )}
        </Panel>

        <ResultPanel
          emptyText="Formatted JavaScript will appear here."
          filename="formatted.js"
          label="Formatted JavaScript"
          mime="text/javascript;charset=utf-8"
          value={result?.output ?? ''}
        />
      </ToolLayout>
    </div>
  );
}
