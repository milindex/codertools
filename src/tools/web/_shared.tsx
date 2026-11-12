'use client';

import type { ReactNode } from 'react';

import { cn } from '@/utils/cn';

export type InfoItem = {
  label: ReactNode;
  value: ReactNode;
  mono?: boolean;
};

export const InfoGrid = ({
  items,
  className,
}: {
  items: InfoItem[];
  className?: string;
}) => (
  <dl
    className={cn(
      'divide-y divide-border overflow-hidden rounded-md border border-border',
      className
    )}
  >
    {items.map((item, index) => (
      <div
        className="grid gap-0.5 px-3 py-2 sm:grid-cols-[10rem_1fr] sm:gap-3"
        key={index}
      >
        <dt className="text-xs font-medium text-fg-muted">{item.label}</dt>
        <dd
          className={cn(
            'break-words text-sm text-fg',
            item.mono && 'font-mono text-[12px] leading-5'
          )}
        >
          {item.value}
        </dd>
      </div>
    ))}
  </dl>
);

export const Toggle = ({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: ReactNode;
  hint?: ReactNode;
}) => (
  <label className="flex cursor-pointer items-start gap-2.5 rounded-md border border-border bg-canvas-inset px-3 py-2 transition-colors hover:border-fg-subtle">
    <input
      checked={checked}
      className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer"
      onChange={(event) => onChange(event.target.checked)}
      type="checkbox"
    />
    <span className="min-w-0">
      <span className="block text-xs font-semibold text-fg">{label}</span>
      {hint && (
        <span className="mt-0.5 block text-[11px] leading-4 text-fg-muted">
          {hint}
        </span>
      )}
    </span>
  </label>
);

export const ExampleChips = ({
  examples,
  onPick,
}: {
  examples: { label: string; value: string }[];
  onPick: (value: string) => void;
}) => (
  <div className="flex flex-wrap gap-1.5">
    {examples.map((example) => (
      <button
        className="cursor-pointer rounded-full border border-border bg-canvas-subtle px-2 py-0.5 text-[11px] font-medium text-fg-muted transition-colors hover:border-accent/50 hover:text-accent"
        key={example.label}
        onClick={() => onPick(example.value)}
        type="button"
      >
        {example.label}
      </button>
    ))}
  </div>
);
