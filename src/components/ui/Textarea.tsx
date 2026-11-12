import type { TextareaHTMLAttributes } from 'react';

import { cn } from '@/utils/cn';

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = ({ className, ...props }: TextareaProps) => (
  <textarea
    className={cn(
      'min-h-[180px] w-full resize-y rounded-md border border-border bg-canvas-inset p-3 font-mono text-[13px] leading-6 text-fg outline-none transition-colors placeholder:text-fg-subtle focus:border-accent focus:ring-1 focus:ring-accent disabled:cursor-not-allowed disabled:opacity-50',
      className
    )}
    spellCheck={false}
    {...props}
  />
);
