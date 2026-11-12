'use client';

import type { ReactNode } from 'react';

import { cn } from '@/utils/cn';

type CheckboxProps = {
  checked: boolean;
  id: string;
  label: ReactNode;
  onChange: (checked: boolean) => void;
  className?: string;
};

/** Native checkbox styled to match the shared GitHub-style controls. */
export const Checkbox = ({
  checked,
  id,
  label,
  onChange,
  className,
}: CheckboxProps) => (
  <label
    className={cn(
      'flex cursor-pointer select-none items-center gap-2 text-sm text-fg',
      className
    )}
    htmlFor={id}
  >
    <input
      checked={checked}
      className="h-4 w-4 cursor-pointer rounded border-border bg-canvas-inset accent-[var(--accent)]"
      id={id}
      onChange={(event) => onChange(event.target.checked)}
      type="checkbox"
    />
    <span>{label}</span>
  </label>
);
