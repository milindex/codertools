'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { Field } from '@/components/ui/Field';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { ToolLayout } from '@/components/ui/ToolLayout';

import { formatCssFallback } from './css-utils';

const SAMPLE = `:root{--brand:#0969da;--radius:8px}
.card{display:flex;flex-direction:column;gap:12px;padding:16px;border-radius:var(--radius);background:#fff;border:1px solid #d0d7de}
.card__title{font-size:1.25rem;font-weight:600;color:var(--brand);margin:0}
.card__body{font-size:0.875rem;line-height:1.5;color:#57606a}
@media (min-width:768px){.card{flex-direction:row;align-items:center}}
.card:hover{border-color:var(--brand);box-shadow:0 4px 12px rgba(9,105,218,0.15)}`;

export default function CssFormatter() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [indent, setIndent] = useState('2');

  const resetResult = () => {
    setOutput('');
    setError(null);
    setNote(null);
  };

  const format = async () => {
    if (!input.trim()) {
      setOutput('');
      setNote(null);
      setError('Paste some CSS to format.');
      return;
    }

    setBusy(true);
    setError(null);
    setNote(null);
    const tabWidth = indent === '4' ? 4 : 2;
    const useTabs = indent === 'tab';

    try {
      const prettier = await import('prettier/standalone');
      const postcssPlugin = await import('prettier/plugins/postcss');
      const formatted = await prettier.format(input, {
        parser: 'css',
        plugins: [postcssPlugin],
        tabWidth,
        useTabs,
        printWidth: 100,
      });
      setOutput(formatted.replace(/\s+$/, ''));
    } catch {
      try {
        const fallback = formatCssFallback(input, tabWidth, useTabs);
        if (!fallback.trim()) {
          throw new Error('Nothing to format.');
        }
        setOutput(fallback);
        setNote(
          'Prettier could not parse this stylesheet, so a built-in fallback formatter was used.'
        );
      } catch {
        setOutput('');
        setError(
          'The CSS could not be formatted. Check for unbalanced braces or unterminated strings.'
        );
      }
    } finally {
      setBusy(false);
    }
  };

  const lineCount = output ? output.split('\n').length : 0;

  return (
    <ToolLayout>
      <Panel title="Input">
        <Field
          hint={`${input.length.toLocaleString()} characters`}
          htmlFor="css-formatter-input"
          label="CSS source"
        >
          <Textarea
            id="css-formatter-input"
            onChange={(event) => {
              setInput(event.target.value);
              resetResult();
            }}
            placeholder=".card{display:flex;gap:12px}"
            rows={16}
            value={input}
          />
        </Field>

        <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <Field htmlFor="css-formatter-indent" label="Indent">
            <Select
              id="css-formatter-indent"
              onChange={(event) => {
                setIndent(event.target.value);
                resetResult();
              }}
              value={indent}
            >
              <option value="2">2 spaces</option>
              <option value="4">4 spaces</option>
              <option value="tab">Tabs</option>
            </Select>
          </Field>
          <div className="flex flex-wrap gap-2">
            <Button disabled={busy} onClick={format} variant="primary">
              {busy ? 'Formatting…' : 'Format CSS'}
            </Button>
            <Button
              onClick={() => {
                setInput(SAMPLE);
                resetResult();
              }}
              variant="default"
            >
              Load sample
            </Button>
            <Button
              onClick={() => {
                setInput('');
                resetResult();
              }}
              variant="ghost"
            >
              Clear
            </Button>
          </div>
        </div>

        {note && (
          <Callout
            className="mt-3"
            title="Fallback formatter"
            variant="warning"
          >
            {note}
          </Callout>
        )}
        {error && (
          <Callout className="mt-3" variant="error">
            {error}
          </Callout>
        )}
      </Panel>

      <ResultPanel
        emptyText="Formatted CSS will appear here."
        error={error}
        filename="formatted.css"
        label="Formatted CSS"
        mime="text/css;charset=utf-8"
        value={output}
      >
        {output ? (
          <div className="space-y-2">
            <p className="text-xs text-fg-muted">
              {lineCount.toLocaleString()} lines ·{' '}
              {output.length.toLocaleString()} characters
            </p>
            <pre className="max-h-[520px] overflow-auto whitespace-pre-wrap break-words rounded-md border border-border bg-canvas-inset p-3 font-mono text-[13px] leading-6 text-fg">
              {output}
            </pre>
          </div>
        ) : undefined}
      </ResultPanel>
    </ToolLayout>
  );
}
