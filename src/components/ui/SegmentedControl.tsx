'use client';

import { cn } from '@/utils/cn';

type SegmentedControlOption = {
  value: string;
  label: string;
};

type SegmentedControlProps = {
  options: SegmentedControlOption[];
  value: string;
  onChange: (value: string) => void;
  ariaLabel?: string;
  className?: string;
};

export const SegmentedControl = ({
  options,
  value,
  onChange,
  ariaLabel = 'Mode',
  className,
}: SegmentedControlProps) => (
  <div
    aria-label={ariaLabel}
    className={cn(
      'inline-flex flex-wrap gap-0.5 rounded-md border border-border bg-canvas-subtle p-0.5',
      className
    )}
    role="group"
  >
    {options.map((option) => (
      <button
        aria-pressed={value === option.value}
        className={cn(
          'cursor-pointer rounded px-2.5 py-1 text-xs font-medium transition-colors',
          value === option.value
            ? 'bg-surface text-fg shadow-sm'
            : 'text-fg-muted hover:text-fg'
        )}
        key={option.value}
        onClick={() => onChange(option.value)}
        type="button"
      >
        {option.label}
      </button>
    ))}
  </div>
);
