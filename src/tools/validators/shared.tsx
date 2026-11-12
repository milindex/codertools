'use client';

import type { ReactNode } from 'react';

import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { cn } from '@/utils/cn';

export type Detail = {
  label: string;
  value: ReactNode;
  mono?: boolean;
  wide?: boolean;
  breakAll?: boolean;
};

type CalloutVariant = 'info' | 'success' | 'warning' | 'error';

export const Verdict = ({
  valid,
  title,
  children,
  variant,
}: {
  valid: boolean;
  title?: string;
  children: ReactNode;
  variant?: CalloutVariant;
}) => (
  <Callout
    title={title ?? (valid ? 'Valid' : 'Invalid')}
    variant={variant ?? (valid ? 'success' : 'error')}
  >
    {children}
  </Callout>
);

export const DetailList = ({
  details,
  className,
}: {
  details: Detail[];
  className?: string;
}) => (
  <dl className={cn('grid gap-2 sm:grid-cols-2', className)}>
    {details.map((detail) => (
      <div
        className={cn(
          'min-w-0 rounded-md border border-border bg-canvas-inset/60 px-3 py-2',
          detail.wide && 'sm:col-span-2'
        )}
        key={detail.label}
      >
        <dt className="text-[11px] font-semibold uppercase tracking-wide text-fg-muted">
          {detail.label}
        </dt>
        <dd
          className={cn(
            'mt-0.5 break-words text-sm leading-5 text-fg',
            detail.mono && 'font-mono text-[13px]',
            detail.breakAll && 'break-all'
          )}
        >
          {detail.value}
        </dd>
      </div>
    ))}
  </dl>
);

export const ReasonList = ({ items }: { items: string[] }) => (
  <ul className="list-disc space-y-1 pl-5">
    {items.map((item, index) => (
      <li key={`${index}-${item}`}>{item}</li>
    ))}
  </ul>
);

export const Examples = ({
  items,
  onPick,
}: {
  items: string[];
  onPick: (value: string) => void;
}) => (
  <div className="mt-3 flex flex-wrap items-center gap-1">
    <span className="mr-1 text-xs text-fg-muted">Examples:</span>
    {items.map((item) => (
      <Button
        className="font-mono text-[11px] font-normal"
        key={item}
        onClick={() => onPick(item)}
        size="sm"
        variant="ghost"
      >
        {item}
      </Button>
    ))}
  </div>
);
