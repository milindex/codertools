'use client';

import { useMemo, useState } from 'react';

import { Field } from '@/components/ui/Field';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { Textarea } from '@/components/ui/Textarea';
import { ToolLayout } from '@/components/ui/ToolLayout';

import { Checkbox } from './ui';

const BLOCK_SELECTOR =
  'address,article,aside,blockquote,div,dl,dt,dd,figcaption,figure,footer,form,h1,h2,h3,h4,h5,h6,header,hr,li,main,nav,ol,p,pre,section,table,tbody,td,tfoot,th,thead,tr,ul';

const stripHtml = (html: string, keepLineBreaks: boolean): string => {
  if (!html.trim()) {
    return '';
  }

  const document = new DOMParser().parseFromString(html, 'text/html');
  document
    .querySelectorAll('script,style,noscript,template,svg,iframe')
    .forEach((element) => element.remove());

  if (keepLineBreaks) {
    document
      .querySelectorAll('br')
      .forEach((element) => element.replaceWith('\n'));
    document
      .querySelectorAll(BLOCK_SELECTOR)
      .forEach((element) => element.append('\n'));
  }

  let text = document.body.textContent ?? '';

  if (keepLineBreaks) {
    text = text
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  } else {
    text = text.replace(/\s+/g, ' ').trim();
  }

  return text;
};

export default function StripHtml() {
  const [input, setInput] = useState('');
  const [keepLineBreaks, setKeepLineBreaks] = useState(true);

  const output = useMemo(
    () => stripHtml(input, keepLineBreaks),
    [input, keepLineBreaks]
  );

  return (
    <ToolLayout>
      <Panel title="Input">
        <Field
          hint={`${input.length.toLocaleString()} characters`}
          label="HTML"
        >
          <Textarea
            className="min-h-[340px]"
            onChange={(event) => setInput(event.target.value)}
            placeholder={
              '<p>Hello <strong>world</strong>!</p>\n<p>Second paragraph.</p>'
            }
            value={input}
          />
        </Field>

        <div className="mt-3">
          <Checkbox
            checked={keepLineBreaks}
            label="Keep line breaks for block elements"
            onChange={setKeepLineBreaks}
          />
        </div>

        <p className="mt-2 text-xs leading-5 text-fg-muted">
          Scripts, styles, templates and embedded frames are removed. HTML
          entities are decoded as part of parsing.
        </p>
      </Panel>

      <ResultPanel
        emptyText="Paste HTML to extract its visible text."
        filename="stripped-text.txt"
        label="Text"
        value={output}
      >
        {input ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full border border-success/40 bg-success-subtle px-2 py-0.5 font-medium text-success">
                {(input.length - output.length).toLocaleString()} characters
                removed
              </span>
              <span className="text-fg-muted">
                {output.length.toLocaleString()} characters remain
              </span>
            </div>
            <pre className="max-h-[470px] min-h-[230px] overflow-auto whitespace-pre-wrap break-words rounded-md border border-border bg-canvas-inset p-3 font-mono text-[13px] leading-6 text-fg">
              {output}
            </pre>
          </div>
        ) : undefined}
      </ResultPanel>
    </ToolLayout>
  );
}
