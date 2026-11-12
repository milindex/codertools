import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@/utils/cn';

type EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) => (
  <div
    className={cn(
      'flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-canvas-subtle/30 px-6 py-14 text-center',
      className
    )}
  >
    {Icon && <Icon aria-hidden className="mb-3 h-8 w-8 text-fg-subtle" />}
    <h2 className="text-sm font-semibold text-fg">{title}</h2>
    {description && (
      <p className="mt-1 max-w-md text-sm text-fg-muted">{description}</p>
    )}
    {action && <div className="mt-4">{action}</div>}
  </div>
);
