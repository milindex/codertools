import type { SelectHTMLAttributes } from 'react';

import { cn } from '@/utils/cn';

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export const Select = ({ className, children, ...props }: SelectProps) => (
  <select
    className={cn(
      'h-8 w-full cursor-pointer rounded-md border border-border bg-canvas-inset px-2 text-sm text-fg outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent disabled:cursor-not-allowed disabled:opacity-50',
      className
    )}
    {...props}
  >
    {children}
  </select>
);
