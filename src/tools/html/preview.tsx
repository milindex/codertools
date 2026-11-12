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

const SAMPLE = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <style>
      body {
        font-family: system-ui, sans-serif;
        margin: 0;
        padding: 24px;
        color: #1f2328;
        background: #ffffff;
      }
      h1 { color: #0969da; }
      .card {
        border: 1px solid #d0d7de;
        border-radius: 8px;
        padding: 16px;
      }
    </style>
  </head>
  <body>
    <h1>HTML preview</h1>
    <div class="card">
      <p>This markup is rendered inside a sandboxed iframe.</p>
      <button type="button">A button that does nothing</button>
    </div>
  </body>
</html>`;

const VIEWPORTS = [
  { value: 'full', label: 'Full width' },
  { value: '375', label: '375 px (mobile)' },
  { value: '768', label: '768 px (tablet)' },
  { value: '1024', label: '1024 px (desktop)' },
];

export default function HtmlPreview() {
  const [input, setInput] = useState('');
  const [viewport, setViewport] = useState('full');

  const hasScripts = useMemo(() => /<script\b/i.test(input), [input]);
  const hasInput = Boolean(input.trim());

  return (
    <ToolLayout>
      <Panel title="Input">
        <Field
          hint={`${input.length.toLocaleString()} characters`}
          htmlFor="html-preview-input"
          label="HTML source"
        >
          <Textarea
            id="html-preview-input"
            onChange={(event) => setInput(event.target.value)}
            placeholder="<h1>Hello, world!</h1>"
            rows={16}
            value={input}
          />
        </Field>

        <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <Field htmlFor="html-preview-viewport" label="Viewport width">
            <Select
              id="html-preview-viewport"
              onChange={(event) => setViewport(event.target.value)}
              value={viewport}
            >
              {VIEWPORTS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setInput(SAMPLE)} variant="primary">
              Load sample
            </Button>
            <Button onClick={() => setInput('')} variant="ghost">
              Clear
            </Button>
          </div>
        </div>

        <Callout className="mt-3" title="Scripts are disabled" variant="info">
          The preview uses an iframe with an empty <code>sandbox</code>{' '}
          attribute, so scripts cannot run and forms cannot submit. Styles and
          images still render, but remote images depend on the site&apos;s
          network access.
        </Callout>

        {hasScripts && (
          <Callout className="mt-3" variant="warning">
            This document contains a <code>&lt;script&gt;</code> element. It
            will not execute in the sandboxed preview.
          </Callout>
        )}
      </Panel>

      <ResultPanel
        emptyText="Enter HTML to see the rendered preview."
        filename="preview.html"
        label="Preview"
        mime="text/html;charset=utf-8"
        value={input}
      >
        {hasInput ? (
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="accent">sandboxed iframe</Badge>
              <Badge>
                {viewport === 'full' ? 'Full width' : `${viewport} px`}
              </Badge>
            </div>
            <div className="overflow-auto rounded-md border border-border bg-white">
              <iframe
                className="block h-[460px] border-0 bg-white"
                sandbox=""
                srcDoc={input}
                style={{
                  width: viewport === 'full' ? '100%' : `${viewport}px`,
                  maxWidth: '100%',
                }}
                title="Sandboxed HTML preview"
              />
            </div>
          </div>
        ) : undefined}
      </ResultPanel>
    </ToolLayout>
  );
}
