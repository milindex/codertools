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

import { minifyCss } from './css-utils';

const SAMPLE = `/*! Keep this license comment */
:root {
  --brand: #0969da;
  --radius: 8px;
}

/* Card component */
.card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border: 1px solid #d0d7de;
  border-radius: var(--radius);
  background-color: #ffffff;
}

.card .card__title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--brand);
}

@media (min-width: 768px) {
  .card {
    flex-direction: row;
    align-items: center;
  }
}`;

const byteLength = (value: string) => new TextEncoder().encode(value).length;

export default function CssMinifier() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [keepImportantComments, setKeepImportantComments] = useState(true);

  const minify = () => {
    if (!input.trim()) {
      setOutput('');
      setError('Paste some CSS to minify.');
      return;
    }
    setError(null);
    try {
      const result = minifyCss(input, { keepImportantComments });
      if (!result.trim()) {
        throw new Error('Empty output');
      }
      setOutput(result);
    } catch {
      setOutput('');
      setError('The CSS could not be minified.');
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
          htmlFor="css-minifier-input"
          label="CSS source"
        >
          <Textarea
            id="css-minifier-input"
            onChange={(event) => {
              setInput(event.target.value);
              setOutput('');
              setError(null);
            }}
            placeholder=".card { display: flex; gap: 12px; }"
            rows={16}
            value={input}
          />
        </Field>

        <label className="mt-3 flex cursor-pointer items-center gap-2 text-xs text-fg-muted">
          <input
            checked={keepImportantComments}
            className="h-4 w-4"
            onChange={(event) => setKeepImportantComments(event.target.checked)}
            type="checkbox"
          />
          {'Keep important comments ('}
          <code>{'/*! … */'}</code>
          {')'}
        </label>

        <div className="mt-3 flex flex-wrap gap-2">
          <Button onClick={minify} variant="primary">
            Minify CSS
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
          Whitespace and comments are removed safely, including inside{' '}
          <code>calc()</code> values where required spacing is preserved.
          Strings and <code>url()</code> contents are not altered.
        </Callout>

        {error && (
          <Callout className="mt-3" variant="error">
            {error}
          </Callout>
        )}
      </Panel>

      <ResultPanel
        emptyText="Minified CSS will appear here."
        error={error}
        filename="styles.min.css"
        label="Minified CSS"
        mime="text/css;charset=utf-8"
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
