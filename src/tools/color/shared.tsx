'use client';

import type { Color } from 'culori';
import { clampRgb, converter, formatHex, parse } from 'culori';
import type { CSSProperties, ReactNode } from 'react';
import { useId } from 'react';

import { CopyButton } from '@/components/ui/CopyButton';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { cn } from '@/utils/cn';

export const round = (value: number, digits = 2) => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const parseColor = (value: string): Color | null => {
  if (!value.trim()) {
    return null;
  }

  try {
    return parse(value.trim()) ?? null;
  } catch {
    return null;
  }
};

export const safeHex = (
  value: string | Color | undefined | null,
  fallback = '#000000'
): string => {
  if (!value) {
    return fallback;
  }

  try {
    return formatHex(value) ?? fallback;
  } catch {
    return fallback;
  }
};

export const toColorInputValue = (value: string): string => {
  const parsed = parseColor(value);
  return parsed ? safeHex(parsed, '#000000') : '#000000';
};

export const isValidColor = (value: string) => parseColor(value) !== null;

export const toRgb = (value: string | Color) => {
  try {
    return converter('rgb')(value);
  } catch {
    return null;
  }
};

export const toOklch = (value: string | Color) => {
  try {
    return converter('oklch')(value);
  } catch {
    return null;
  }
};

export const rgba = (value: string | Color, alpha = 1): string => {
  const rgb = toRgb(value);

  if (!rgb) {
    return `rgba(0, 0, 0, ${round(clamp(alpha, 0, 1), 3)})`;
  }

  return `rgba(${Math.round(rgb.r * 255)}, ${Math.round(rgb.g * 255)}, ${Math.round(
    rgb.b * 255
  )}, ${round(clamp(alpha, 0, 1), 3)})`;
};

export const hexWithAlpha = (value: string, alpha: number): string => {
  if (alpha >= 0.999) {
    return safeHex(value);
  }

  return rgba(value, alpha);
};

export const oklchHex = (
  lightness: number,
  chroma: number,
  hue: number
): string =>
  safeHex(
    clampRgb({
      mode: 'oklch',
      l: clamp(lightness, 0.02, 1),
      c: Math.max(0, chroma),
      h: hue,
    })
  );

export const withLightness = (value: string, lightness: number): string => {
  const oklch = toOklch(value);

  if (!oklch) {
    return safeHex(value);
  }

  return oklchHex(lightness, oklch.c, oklch.h ?? 0);
};

export const hueShift = (value: string, degrees: number): string => {
  const oklch = toOklch(value);

  if (!oklch) {
    return safeHex(value);
  }

  return oklchHex(oklch.l, oklch.c, ((oklch.h ?? 0) + degrees + 360) % 360);
};

export const visibleColor = (value: string, fallback = '#000000') =>
  isValidColor(value) ? safeHex(value, fallback) : fallback;

export const checkerboard: CSSProperties = {
  backgroundColor: '#8b8b8b',
  backgroundImage:
    'linear-gradient(45deg, #b3b3b3 25%, transparent 25%), linear-gradient(-45deg, #b3b3b3 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #b3b3b3 75%), linear-gradient(-45deg, transparent 75%, #b3b3b3 75%)',
  backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0',
  backgroundSize: '16px 16px',
};

type SliderFieldProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  hint?: ReactNode;
  onChange: (value: number) => void;
  className?: string;
};

export const SliderField = ({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  hint,
  onChange,
  className,
}: SliderFieldProps) => {
  const id = useId();

  return (
    <Field
      className={className}
      hint={hint ?? `${round(value, 2)}${unit}`}
      htmlFor={id}
      label={label}
    >
      <div className="flex items-center gap-2">
        <input
          aria-label={`${label} slider`}
          className="h-2 w-full min-w-0 cursor-pointer accent-accent"
          id={id}
          max={max}
          min={min}
          onChange={(event) => onChange(Number(event.target.value))}
          step={step}
          type="range"
          value={clamp(value, min, max)}
        />
        <Input
          aria-label={`${label} value`}
          className="w-20 shrink-0 text-center font-mono text-xs"
          max={max}
          min={min}
          onChange={(event) => {
            const next = event.target.valueAsNumber;
            if (Number.isFinite(next)) {
              onChange(clamp(next, min, max));
            }
          }}
          step={step}
          type="number"
          value={round(value, 2)}
        />
      </div>
    </Field>
  );
};

type ColorFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: ReactNode;
  className?: string;
};

export const ColorField = ({
  label,
  value,
  onChange,
  hint,
  className,
}: ColorFieldProps) => {
  const id = useId();
  const swatch = toColorInputValue(value);

  return (
    <Field className={className} hint={hint} htmlFor={id} label={label}>
      <div className="flex items-center gap-2">
        <input
          aria-label={`${label} color picker`}
          className="h-8 w-10 shrink-0 cursor-pointer rounded-md border border-border bg-canvas-inset p-0.5"
          onChange={(event) => onChange(event.target.value)}
          type="color"
          value={swatch}
        />
        <Input
          aria-label={`${label} value`}
          className="font-mono text-xs"
          id={id}
          onChange={(event) => onChange(event.target.value)}
          spellCheck={false}
          value={value}
        />
      </div>
    </Field>
  );
};

type ToggleFieldProps = {
  label: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  hint?: ReactNode;
  className?: string;
};

export const ToggleField = ({
  label,
  checked,
  onChange,
  hint,
  className,
}: ToggleFieldProps) => (
  <label
    className={cn(
      'flex cursor-pointer items-center gap-2 rounded-md border border-border bg-canvas-subtle px-3 py-2 text-xs font-medium text-fg',
      className
    )}
  >
    <input
      checked={checked}
      className="h-3.5 w-3.5 cursor-pointer accent-accent"
      onChange={(event) => onChange(event.target.checked)}
      type="checkbox"
    />
    <span className="min-w-0">{label}</span>
    {hint && (
      <span className="ml-auto shrink-0 text-[11px] font-normal text-fg-muted">
        {hint}
      </span>
    )}
  </label>
);

type ValueRowProps = {
  label: string;
  value: string;
  note?: string;
};

export const ValueRow = ({ label, value, note }: ValueRowProps) => (
  <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-canvas-inset px-3 py-2">
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-fg-muted">
        {label}
      </p>
      <p className="truncate font-mono text-xs text-fg">{value}</p>
      {note && <p className="text-[10px] text-fg-subtle">{note}</p>}
    </div>
    <CopyButton value={value} />
  </div>
);

type PreviewSurfaceProps = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
};

export const PreviewSurface = ({
  children,
  className,
  style,
}: PreviewSurfaceProps) => (
  <div
    className={cn(
      'relative flex min-h-[260px] items-center justify-center overflow-hidden rounded-md border border-border bg-canvas-inset p-6',
      className
    )}
    style={style}
  >
    {children}
  </div>
);

type SwatchProps = {
  color: string;
  label?: ReactNode;
  sublabel?: ReactNode;
  className?: string;
};

export const Swatch = ({ color, label, sublabel, className }: SwatchProps) => (
  <div
    className={cn(
      'overflow-hidden rounded-md border border-border bg-surface',
      className
    )}
  >
    <div
      className="h-16 w-full border-b border-black/10"
      style={{ backgroundColor: color }}
    />
    {(label || sublabel) && (
      <div className="space-y-0.5 px-2 py-1.5">
        {label && (
          <div className="truncate text-[11px] font-semibold text-fg">
            {label}
          </div>
        )}
        {sublabel && (
          <div className="truncate font-mono text-[10px] text-fg-muted">
            {sublabel}
          </div>
        )}
      </div>
    )}
  </div>
);
