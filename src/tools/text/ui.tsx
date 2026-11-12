'use client';

import type { ReactNode } from 'react';

import { cn } from '@/utils/cn';

type CheckboxProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: ReactNode;
  className?: string;
};

export const Checkbox = ({
  checked,
  onChange,
  label,
  className,
}: CheckboxProps) => (
  <label
    className={cn(
      'flex cursor-pointer select-none items-center gap-2 text-xs text-fg',
      className
    )}
  >
    <input
      checked={checked}
      className="h-3.5 w-3.5 cursor-pointer rounded border-border accent-accent"
      onChange={(event) => onChange(event.target.checked)}
      type="checkbox"
    />
    <span>{label}</span>
  </label>
);

type StatCardProps = {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
};

export const StatCard = ({ label, value, hint }: StatCardProps) => (
  <div className="rounded-md border border-border bg-canvas-subtle/40 px-3 py-2.5">
    <p className="text-[11px] font-medium uppercase tracking-wide text-fg-muted">
      {label}
    </p>
    <p className="mt-0.5 text-lg font-semibold tabular-nums text-fg">{value}</p>
    {hint && <p className="mt-0.5 text-[11px] text-fg-subtle">{hint}</p>}
  </div>
);
