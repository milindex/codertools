import { CircleAlert, CircleCheck, Info, TriangleAlert } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@/utils/cn';

type CalloutVariant = 'info' | 'success' | 'warning' | 'error';

const styles: Record<CalloutVariant, string> = {
  info: 'border-accent/40 bg-accent-subtle/40 text-fg',
  success: 'border-success/40 bg-success-subtle/50 text-fg',
  warning: 'border-attention/40 bg-attention-subtle/50 text-fg',
  error: 'border-danger/40 bg-danger-subtle/50 text-fg',
};

const icons: Record<CalloutVariant, ReactNode> = {
  info: <Info aria-hidden className="h-4 w-4 shrink-0 text-accent" />,
  success: (
    <CircleCheck aria-hidden className="h-4 w-4 shrink-0 text-success" />
  ),
  warning: (
    <TriangleAlert aria-hidden className="h-4 w-4 shrink-0 text-attention" />
  ),
  error: <CircleAlert aria-hidden className="h-4 w-4 shrink-0 text-danger" />,
};

type CalloutProps = {
  variant?: CalloutVariant;
  title?: ReactNode;
  children: ReactNode;
  className?: string;
};

export const Callout = ({
  variant = 'info',
  title,
  children,
  className,
}: CalloutProps) => (
  <div
    className={cn(
      'flex gap-3 rounded-md border px-3 py-2.5 text-sm leading-6',
      styles[variant],
      className
    )}
    role={variant === 'error' ? 'alert' : undefined}
  >
    <span className="mt-0.5">{icons[variant]}</span>
    <div className="min-w-0">
      {title && <p className="font-semibold">{title}</p>}
      <div className={cn('text-fg-muted', Boolean(title) && 'mt-0.5')}>
        {children}
      </div>
    </div>
  </div>
);
