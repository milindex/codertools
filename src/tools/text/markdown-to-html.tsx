'use client';

import { marked } from 'marked';
import { useMemo, useState } from 'react';

import { Field } from '@/components/ui/Field';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { Textarea } from '@/components/ui/Textarea';
import { ToolLayout } from '@/components/ui/ToolLayout';

import { Checkbox } from './ui';

export default function MarkdownToHtml() {
  const [markdown, setMarkdown] = useState('');
  const [gfm, setGfm] = useState(true);
  const [breaks, setBreaks] = useState(false);

  const result = useMemo(() => {
    if (!markdown.trim()) {
      return { html: '', error: null as string | null };
    }

    try {
      return {
        html: marked.parse(markdown, {
          async: false,
          breaks,
          gfm,
        }),
        error: null as string | null,
      };
    } catch (error) {
      return {
        html: '',
        error:
          error instanceof Error
            ? error.message
            : 'Unable to convert Markdown.',
      };
    }
  }, [markdown, gfm, breaks]);

  return (
    <ToolLayout>
      <Panel title="Markdown">
        <Field
          hint={`${markdown.length.toLocaleString()} characters`}
          label="Source"
        >
          <Textarea
            className="min-h-[420px]"
            onChange={(event) => setMarkdown(event.target.value)}
            placeholder={'## Title\n\n- One\n- Two\n\n`code` and **bold**.'}
            value={markdown}
          />
        </Field>

        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
          <Checkbox
            checked={gfm}
            label="GitHub Flavored Markdown"
            onChange={setGfm}
          />
          <Checkbox
            checked={breaks}
            label="Convert single line breaks to <br>"
            onChange={setBreaks}
          />
        </div>

        <p className="mt-2 text-xs leading-5 text-fg-muted">
          Raw HTML in the Markdown source is passed through to the output. Use
          the Markdown preview tool to render a sanitized result.
        </p>
      </Panel>

      <ResultPanel
        emptyText="Enter Markdown to generate HTML."
        error={result.error}
        filename="converted.html"
        label="HTML"
        mime="text/html;charset=utf-8"
        value={result.html}
      >
        {result.html ? (
          <pre className="max-h-[470px] min-h-[230px] overflow-auto whitespace-pre-wrap break-words rounded-md border border-border bg-canvas-inset p-3 font-mono text-[13px] leading-6 text-fg">
            {result.html}
          </pre>
        ) : undefined}
      </ResultPanel>
    </ToolLayout>
  );
}
