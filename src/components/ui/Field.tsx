import type { ReactNode } from 'react';

import { cn } from '@/utils/cn';

type FieldProps = {
  label: ReactNode;
  htmlFor?: string;
  hint?: ReactNode;
  error?: ReactNode;
  children: ReactNode;
  className?: string;
};

export const Field = ({
  label,
  htmlFor,
  hint,
  error,
  children,
  className,
}: FieldProps) => (
  <div className={cn('space-y-1.5', className)}>
    <div className="flex flex-wrap items-baseline justify-between gap-2">
      <label className="text-xs font-semibold text-fg" htmlFor={htmlFor}>
        {label}
      </label>
      {hint && <span className="text-xs text-fg-muted">{hint}</span>}
    </div>
    {children}
    {error && <p className="text-xs text-danger">{error}</p>}
  </div>
);
