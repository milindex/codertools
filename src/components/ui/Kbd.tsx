import type { ReactNode } from 'react';

import { cn } from '@/utils/cn';

export const Kbd = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => (
  <kbd
    className={cn(
      'rounded border border-border bg-neutral-subtle px-1.5 py-0.5 font-mono text-[10px] font-medium text-fg-muted',
      className
    )}
  >
    {children}
  </kbd>
);
