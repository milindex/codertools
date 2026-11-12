import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';

import { cn } from '@/utils/cn';

type LinkButtonVariant = 'default' | 'primary' | 'ghost';

const variants: Record<LinkButtonVariant, string> = {
  default:
    'border-border bg-canvas-subtle text-fg hover:border-fg-subtle hover:bg-surface-hover',
  primary:
    'border-[rgba(240,246,252,0.1)] bg-success-emphasis text-white hover:bg-success',
  ghost:
    'border-transparent bg-transparent text-fg-muted hover:bg-surface-hover hover:text-fg',
};

type LinkButtonProps = ComponentProps<typeof Link> & {
  children: ReactNode;
  variant?: LinkButtonVariant;
  className?: string;
};

export const LinkButton = ({
  children,
  variant = 'default',
  className,
  ...props
}: LinkButtonProps) => (
  <Link
    className={cn(
      'inline-flex h-8 items-center justify-center gap-1.5 rounded-md border px-3 text-sm font-semibold transition-all duration-150 hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas active:translate-y-px',
      variants[variant],
      className
    )}
    {...props}
  >
    {children}
  </Link>
);
