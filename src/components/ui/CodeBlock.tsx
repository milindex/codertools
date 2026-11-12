import type { ReactNode } from 'react';

import { CopyButton } from '@/components/ui/CopyButton';

type CodeBlockProps = {
  code: string;
  language?: string;
  filename?: string;
  children?: ReactNode;
  className?: string;
};

export const CodeBlock = ({
  code,
  language,
  filename,
  children,
  className,
}: CodeBlockProps) => (
  <div
    className={
      className ??
      'overflow-hidden rounded-lg border border-border bg-canvas-inset'
    }
  >
    <div className="flex items-center justify-between gap-2 border-b border-border bg-canvas-subtle/60 px-3 py-1.5">
      <span className="text-[11px] font-medium text-fg-muted">
        {filename ?? language ?? 'Code'}
      </span>
      <CopyButton value={code} />
    </div>
    {children ?? (
      <pre className="max-h-[520px] overflow-auto p-3 text-[13px] leading-6 text-fg">
        <code>{code}</code>
      </pre>
    )}
  </div>
);
