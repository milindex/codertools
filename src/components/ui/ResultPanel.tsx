import type { ReactNode } from 'react';

import { Callout } from '@/components/ui/Callout';
import { CopyButton } from '@/components/ui/CopyButton';
import { DownloadButton } from '@/components/ui/DownloadButton';
import { cn } from '@/utils/cn';

type ResultPanelProps = {
  value?: string;
  label?: string;
  error?: string | null;
  filename?: string;
  mime?: string;
  emptyText?: string;
  className?: string;
  children?: ReactNode;
  monospace?: boolean;
};

export const ResultPanel = ({
  value = '',
  label = 'Result',
  error,
  filename = 'codertools-result.txt',
  mime,
  emptyText = 'The result will appear here.',
  className,
  children,
  monospace = true,
}: ResultPanelProps) => (
  <section
    className={cn(
      'flex min-h-[280px] flex-col overflow-hidden rounded-lg border border-border bg-surface',
      className
    )}
  >
    <header className="flex items-center justify-between gap-2 border-b border-border bg-canvas-subtle/60 px-4 py-2.5">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-fg-muted">
        {label}
      </h2>
      <div className="flex items-center gap-1">
        <CopyButton value={value} />
        <DownloadButton filename={filename} mime={mime} value={value} />
      </div>
    </header>

    <div className="flex-1 p-3">
      {error ? (
        <Callout variant="error" title="Something went wrong">
          {error}
        </Callout>
      ) : children ? (
        children
      ) : value ? (
        <pre
          aria-live="polite"
          className={cn(
            'max-h-[520px] min-h-[230px] overflow-auto whitespace-pre-wrap break-words rounded-md border border-border bg-canvas-inset p-3 text-[13px] leading-6 text-fg',
            monospace && 'font-mono'
          )}
        >
          {value}
        </pre>
      ) : (
        <div className="flex min-h-[230px] items-center justify-center rounded-md border border-dashed border-border bg-canvas-inset/50 p-4 text-center text-sm text-fg-muted">
          {emptyText}
        </div>
      )}
    </div>
  </section>
);
