'use client';

import DOMPurify from 'dompurify';
import { marked } from 'marked';
import { useMemo, useState } from 'react';

import { CopyButton } from '@/components/ui/CopyButton';
import { DownloadButton } from '@/components/ui/DownloadButton';
import { Field } from '@/components/ui/Field';
import { Panel } from '@/components/ui/Panel';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Textarea } from '@/components/ui/Textarea';
import { ToolLayout } from '@/components/ui/ToolLayout';

import { Checkbox } from './ui';

type View = 'preview' | 'html' | 'source';

const PREVIEW_CLASS = [
  'min-h-[280px] overflow-auto rounded-md border border-border bg-canvas-inset p-4 text-sm leading-6 text-fg',
  '[&_a]:text-accent [&_a]:underline',
  '[&_blockquote]:border-l-4 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:text-fg-muted',
  '[&_code]:rounded [&_code]:bg-canvas-subtle [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.85em]',
  '[&_h1]:mb-2 [&_h1]:mt-4 [&_h1]:border-b [&_h1]:border-border [&_h1]:pb-1.5 [&_h1]:text-2xl [&_h1]:font-bold',
  '[&_h2]:mb-2 [&_h2]:mt-4 [&_h2]:text-xl [&_h2]:font-bold',
  '[&_h3]:mb-1.5 [&_h3]:mt-3 [&_h3]:text-base [&_h3]:font-semibold',
  '[&_hr]:my-4 [&_hr]:border-border',
  '[&_img]:max-w-full [&_img]:rounded',
  '[&_li]:ml-5 [&_li]:list-disc',
  '[&_ol_li]:list-decimal',
  '[&_p]:my-2',
  '[&_pre]:my-3 [&_pre]:overflow-auto [&_pre]:rounded-md [&_pre]:border [&_pre]:border-border [&_pre]:bg-canvas-subtle [&_pre]:p-3',
  '[&_pre_code]:bg-transparent [&_pre_code]:p-0',
  '[&_table]:my-3 [&_table]:w-full [&_table]:border-collapse',
  '[&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1',
  '[&_th]:border [&_th]:border-border [&_th]:bg-canvas-subtle [&_th]:px-2 [&_th]:py-1 [&_th]:text-left',
].join(' ');

export default function MarkdownPreview() {
  const [markdown, setMarkdown] = useState('');
  const [view, setView] = useState<View>('preview');
  const [breaks, setBreaks] = useState(false);

  const result = useMemo(() => {
    if (!markdown.trim()) {
      return { html: '', error: null as string | null };
    }

    try {
      const raw = marked.parse(markdown, {
        async: false,
        breaks,
        gfm: true,
      });
      return {
        html: DOMPurify.sanitize(raw, { USE_PROFILES: { html: true } }),
        error: null as string | null,
      };
    } catch (error) {
      return {
        html: '',
        error:
          error instanceof Error ? error.message : 'Unable to render Markdown.',
      };
    }
  }, [markdown, breaks]);

  const value = view === 'source' ? markdown : result.html;

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
            placeholder={'# Hello\n\nWrite **Markdown** here…'}
            value={markdown}
          />
        </Field>

        <div className="mt-3">
          <Checkbox
            checked={breaks}
            label="Convert single line breaks to <br>"
            onChange={setBreaks}
          />
        </div>
      </Panel>

      <Panel
        actions={
          <div className="flex flex-wrap items-center gap-1">
            <SegmentedControl
              ariaLabel="Markdown output view"
              onChange={(next) => setView(next as View)}
              options={[
                { value: 'preview', label: 'Preview' },
                { value: 'html', label: 'HTML' },
                { value: 'source', label: 'Source' },
              ]}
              value={view}
            />
            <CopyButton value={value} />
            <DownloadButton
              filename={
                view === 'source' ? 'markdown-source.md' : 'markdown.html'
              }
              mime={
                view === 'source'
                  ? 'text/markdown;charset=utf-8'
                  : 'text/html;charset=utf-8'
              }
              value={value}
            />
          </div>
        }
        description="Rendered HTML is sanitized with DOMPurify."
        title="Output"
      >
        {!markdown.trim() ? (
          <div className="flex min-h-[280px] items-center justify-center rounded-md border border-dashed border-border bg-canvas-inset/50 p-4 text-center text-sm text-fg-muted">
            Rendered Markdown will appear here.
          </div>
        ) : result.error ? (
          <div className="rounded-md border border-danger/40 bg-danger-subtle/50 p-3 text-sm text-danger">
            {result.error}
          </div>
        ) : view === 'preview' ? (
          <div
            className={PREVIEW_CLASS}
            dangerouslySetInnerHTML={{ __html: result.html }}
          />
        ) : (
          <pre className="max-h-[520px] min-h-[280px] overflow-auto whitespace-pre-wrap break-words rounded-md border border-border bg-canvas-inset p-3 font-mono text-[13px] leading-6 text-fg">
            {view === 'source' ? markdown : result.html}
          </pre>
        )}
      </Panel>
    </ToolLayout>
  );
}
