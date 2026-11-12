import type { ReactNode } from 'react';

import { cn } from '@/utils/cn';

type BadgeVariant =
  'default' | 'accent' | 'success' | 'warning' | 'danger' | 'done';

const variants: Record<BadgeVariant, string> = {
  default: 'border-border bg-neutral-subtle text-fg-muted',
  accent: 'border-accent/40 bg-accent-subtle text-accent',
  success: 'border-success/40 bg-success-subtle text-success',
  warning: 'border-attention/40 bg-attention-subtle text-attention',
  danger: 'border-danger/40 bg-danger-subtle text-danger',
  done: 'border-done/40 bg-done-subtle text-done',
};

type BadgeProps = {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
};

export const Badge = ({
  children,
  variant = 'default',
  className,
}: BadgeProps) => (
  <span
    className={cn(
      'inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium leading-4',
      variants[variant],
      className
    )}
  >
    {children}
  </span>
);
