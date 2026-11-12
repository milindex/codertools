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

import { formatHtmlFallback } from './html-utils';

const SAMPLE = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Example page</title>
</head>
<body>
  <header class="site-header">
    <h1>Hello, world!</h1>
    <nav><a href="/">Home</a><a href="/about">About</a></nav>
  </header>
  <main>
    <p>This is a short example document used to demonstrate the formatter.</p>
    <ul><li>One</li><li>Two</li><li>Three</li></ul>
  </main>
</body>
</html>`;

export default function HtmlFormatter() {
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
      setError('Paste some HTML to format.');
      return;
    }

    setBusy(true);
    setError(null);
    setNote(null);
    const tabWidth = indent === '4' ? 4 : 2;
    const useTabs = indent === 'tab';

    try {
      const prettier = await import('prettier/standalone');
      const htmlPlugin = await import('prettier/plugins/html');
      const formatted = await prettier.format(input, {
        parser: 'html',
        plugins: [htmlPlugin],
        tabWidth,
        useTabs,
        printWidth: 100,
      });
      setOutput(formatted.replace(/\s+$/, ''));
    } catch {
      try {
        const fallback = formatHtmlFallback(input, tabWidth, useTabs);
        if (!fallback.trim()) {
          throw new Error('Nothing to format.');
        }
        setOutput(fallback);
        setNote(
          'Prettier could not parse this document, so a built-in fallback formatter was used. Check the markup for mismatched tags.'
        );
      } catch {
        setOutput('');
        setError(
          'The HTML could not be formatted. Check for malformed tags or unterminated comments.'
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
          htmlFor="html-formatter-input"
          label="HTML source"
        >
          <Textarea
            id="html-formatter-input"
            onChange={(event) => {
              setInput(event.target.value);
              resetResult();
            }}
            placeholder="<div><p>Paste HTML here…</p></div>"
            rows={16}
            value={input}
          />
        </Field>

        <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <Field htmlFor="html-formatter-indent" label="Indent">
            <Select
              id="html-formatter-indent"
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
              {busy ? 'Formatting…' : 'Format HTML'}
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
        emptyText="Formatted HTML will appear here."
        error={error}
        filename="formatted.html"
        label="Formatted HTML"
        mime="text/html;charset=utf-8"
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
