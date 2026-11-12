'use client';

import { useState } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { Field } from '@/components/ui/Field';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { Textarea } from '@/components/ui/Textarea';
import { ToolLayout } from '@/components/ui/ToolLayout';

import { minifyHtml } from './html-utils';

const SAMPLE = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>Minify me</title>
    <!-- This comment will be removed -->
  </head>
  <body>
    <div class="card" id="card-1">
      <h1>  Hello,   world!  </h1>
      <p>
        This paragraph has plenty of unnecessary whitespace.
      </p>
      <pre>
        This whitespace is preserved.
      </pre>
    </div>
  </body>
</html>`;

const byteLength = (value: string) => new TextEncoder().encode(value).length;

type Options = {
  removeComments: boolean;
  collapseWhitespace: boolean;
  removeAttributeQuotes: boolean;
};

const OPTION_LABELS: Array<{ key: keyof Options; label: string }> = [
  { key: 'removeComments', label: 'Remove comments' },
  { key: 'collapseWhitespace', label: 'Collapse whitespace' },
  { key: 'removeAttributeQuotes', label: 'Remove safe attribute quotes' },
];

export default function HtmlMinifier() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [options, setOptions] = useState<Options>({
    removeComments: true,
    collapseWhitespace: true,
    removeAttributeQuotes: false,
  });

  const minify = () => {
    if (!input.trim()) {
      setOutput('');
      setError('Paste some HTML to minify.');
      return;
    }
    setError(null);
    try {
      const result = minifyHtml(input, options);
      if (!result.trim()) {
        throw new Error('Empty output');
      }
      setOutput(result);
    } catch {
      setOutput('');
      setError('The HTML could not be minified.');
    }
  };

  const before = byteLength(input);
  const after = byteLength(output);
  const saved = before > 0 && after > 0 ? Math.max(0, before - after) : 0;
  const savedPercent = before > 0 ? Math.round((saved / before) * 100) : 0;

  return (
    <ToolLayout>
      <Panel title="Input">
        <Field
          hint={`${input.length.toLocaleString()} characters`}
          htmlFor="html-minifier-input"
          label="HTML source"
        >
          <Textarea
            id="html-minifier-input"
            onChange={(event) => {
              setInput(event.target.value);
              setOutput('');
              setError(null);
            }}
            placeholder="<div>  Paste HTML here…  </div>"
            rows={16}
            value={input}
          />
        </Field>

        <fieldset className="mt-3">
          <legend className="text-xs font-semibold text-fg">Options</legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {OPTION_LABELS.map((option) => (
              <label
                className="flex cursor-pointer items-center gap-2 text-xs text-fg-muted"
                key={option.key}
              >
                <input
                  checked={options[option.key]}
                  className="h-4 w-4"
                  onChange={(event) =>
                    setOptions((current) => ({
                      ...current,
                      [option.key]: event.target.checked,
                    }))
                  }
                  type="checkbox"
                />
                {option.label}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="mt-3 flex flex-wrap gap-2">
          <Button onClick={minify} variant="primary">
            Minify HTML
          </Button>
          <Button
            onClick={() => {
              setInput(SAMPLE);
              setOutput('');
              setError(null);
            }}
            variant="default"
          >
            Load sample
          </Button>
          <Button
            onClick={() => {
              setInput('');
              setOutput('');
              setError(null);
            }}
            variant="ghost"
          >
            Clear
          </Button>
        </div>

        <Callout className="mt-3" variant="info">
          Content inside <code>&lt;pre&gt;</code>, <code>&lt;textarea&gt;</code>
          , <code>&lt;script&gt;</code> and <code>&lt;style&gt;</code> is kept
          intact. Attribute quotes are only removed when the value is safe.
        </Callout>

        {error && (
          <Callout className="mt-3" variant="error">
            {error}
          </Callout>
        )}
      </Panel>

      <ResultPanel
        emptyText="Minified HTML will appear here."
        error={error}
        filename="minified.html"
        label="Minified HTML"
        mime="text/html;charset=utf-8"
        value={output}
      >
        {output ? (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge variant="accent">{before.toLocaleString()} bytes in</Badge>
              <Badge variant="success">
                {after.toLocaleString()} bytes out
              </Badge>
              <Badge>
                {saved.toLocaleString()} bytes saved ({savedPercent}%)
              </Badge>
            </div>
            <pre className="max-h-[520px] overflow-auto whitespace-pre-wrap break-all rounded-md border border-border bg-canvas-inset p-3 font-mono text-[13px] leading-6 text-fg">
              {output}
            </pre>
          </div>
        ) : undefined}
      </ResultPanel>
    </ToolLayout>
  );
}
