import type { ReactNode } from 'react';

import { cn } from '@/utils/cn';

type PanelProps = {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
  children?: ReactNode;
  className?: string;
  bodyClassName?: string;
};

export const Panel = ({
  title,
  description,
  actions,
  footer,
  children,
  className,
  bodyClassName,
}: PanelProps) => (
  <section
    className={cn(
      'overflow-hidden rounded-lg border border-border bg-surface',
      className
    )}
  >
    {(title || description || actions) && (
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border bg-canvas-subtle/60 px-4 py-3">
        <div className="min-w-0">
          {title && <h2 className="text-sm font-semibold text-fg">{title}</h2>}
          {description && (
            <p className="mt-1 text-xs leading-5 text-fg-muted">
              {description}
            </p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </header>
    )}
    {children && <div className={cn('p-4', bodyClassName)}>{children}</div>}
    {footer && (
      <footer className="border-t border-border bg-canvas-subtle/60 px-4 py-3">
        {footer}
      </footer>
    )}
  </section>
);
