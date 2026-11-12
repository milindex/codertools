'use client';

import type { ButtonHTMLAttributes } from 'react';

import { cn } from '@/utils/cn';

type ButtonVariant = 'default' | 'primary' | 'danger' | 'ghost' | 'invisible';
type ButtonSize = 'sm' | 'md' | 'icon';

const variantClasses: Record<ButtonVariant, string> = {
  default:
    'border-border bg-canvas-subtle text-fg hover:border-fg-subtle hover:bg-surface-hover',
  primary:
    'border-[rgba(240,246,252,0.1)] bg-success-emphasis text-white hover:bg-success',
  danger:
    'border-danger/40 bg-danger-subtle text-danger hover:border-danger hover:bg-danger/10',
  ghost:
    'border-transparent bg-transparent text-fg-muted hover:bg-surface-hover hover:text-fg',
  invisible: 'border-transparent bg-transparent text-fg-muted hover:text-fg',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-7 px-2.5 text-xs',
  md: 'h-8 px-3 text-sm',
  icon: 'h-8 w-8',
};

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export const Button = ({
  className,
  variant = 'default',
  size = 'md',
  type = 'button',
  ...props
}: ButtonProps) => (
  <button
    className={cn(
      'inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-md border font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 disabled:active:translate-y-0',
      variantClasses[variant],
      sizeClasses[size],
      className
    )}
    type={type}
    {...props}
  />
);
