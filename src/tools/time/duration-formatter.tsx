'use client';

import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { CodeBlock } from '@/components/ui/CodeBlock';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { ToolLayout } from '@/components/ui/ToolLayout';

import {
  durationParts,
  formatClock,
  formatDurationCompact,
  formatDurationVerbose,
  formatIsoDuration,
  formatNumber,
  parseNumberInput,
} from './shared';

type Unit = 'ms' | 's' | 'min' | 'h';

const UNIT_FACTORS: Record<Unit, number> = {
  ms: 1,
  s: 1000,
  min: 60000,
  h: 3600000,
};

const UNIT_LABELS: Record<Unit, string> = {
  ms: 'Milliseconds',
  s: 'Seconds',
  min: 'Minutes',
  h: 'Hours',
};

const PRESETS: Array<{ label: string; value: string; unit: Unit }> = [
  { label: '1 s', value: '1', unit: 's' },
  { label: '90 s', value: '90', unit: 's' },
  { label: '2h 15m', value: '8100000', unit: 'ms' },
  { label: '1 day', value: '86400000', unit: 'ms' },
];

export default function DurationFormatter() {
  const [value, setValue] = useState('8100000');
  const [unit, setUnit] = useState<Unit>('ms');

  const parsed = useMemo(() => {
    const trimmed = value.trim();
    if (!trimmed) {
      return { ms: null, error: null };
    }

    const numeric = parseNumberInput(trimmed);
    if (numeric === null) {
      return {
        ms: null,
        error: 'Enter a number, for example 90000 or 2.5.',
      };
    }

    const ms = numeric * UNIT_FACTORS[unit];
    if (!Number.isFinite(ms) || Math.abs(ms) > Number.MAX_SAFE_INTEGER) {
      return {
        ms: null,
        error: 'That duration is too large to format accurately.',
      };
    }

    return { ms, error: null };
  }, [unit, value]);

  const summary = useMemo(() => {
    if (parsed.ms === null) {
      return null;
    }
    const ms = parsed.ms;
    return {
      compact: formatDurationCompact(ms),
      verbose: formatDurationVerbose(ms),
      iso: formatIsoDuration(ms),
      clock: formatClock(ms),
      signedSeconds: ms / 1000,
      signedMinutes: ms / 60000,
      signedHours: ms / 3600000,
      signedDays: ms / 86400000,
      signedWeeks: ms / 604800000,
      totalMs: Math.abs(Math.round(ms)),
      parts: durationParts(ms),
    };
  }, [parsed.ms]);

  const output = useMemo(() => {
    if (!summary) {
      return '';
    }
    return [
      `Compact: ${summary.compact}`,
      `Verbose: ${summary.verbose}`,
      `ISO 8601: ${summary.iso}`,
      `Clock: ${summary.clock}`,
      '',
      `Total milliseconds: ${formatNumber(summary.totalMs)}`,
      `Total seconds: ${formatNumber(summary.signedSeconds, 3)}`,
      `Total minutes: ${formatNumber(summary.signedMinutes, 3)}`,
      `Total hours: ${formatNumber(summary.signedHours, 3)}`,
      `Total days: ${formatNumber(summary.signedDays, 3)}`,
      `Total weeks: ${formatNumber(summary.signedWeeks, 3)}`,
      '',
      `Normalized: ${summary.parts.days}d ${summary.parts.hours}h ${summary.parts.minutes}m ${summary.parts.seconds}s ${summary.parts.milliseconds}ms`,
    ].join('\n');
  }, [summary]);

  const applyPreset = (preset: (typeof PRESETS)[number]) => {
    setUnit(preset.unit);
    setValue(preset.value);
  };

  return (
    <div className="space-y-4">
      <ToolLayout>
        <Panel
          description="Format an amount of time as a compact duration, ISO 8601 value or clock."
          title="Duration"
        >
          <div className="space-y-3">
            <Field
              hint="Decimals and negative values are supported."
              htmlFor="duration-value"
              label="Value"
            >
              <Input
                className="font-mono"
                id="duration-value"
                inputMode="decimal"
                onChange={(event) => setValue(event.target.value)}
                placeholder="9000000"
                spellCheck={false}
                value={value}
              />
            </Field>

            <Field htmlFor="duration-unit" label="Unit">
              <SegmentedControl
                ariaLabel="Duration unit"
                onChange={(next) => setUnit(next as Unit)}
                options={[
                  { value: 'ms', label: 'ms' },
                  { value: 's', label: 'seconds' },
                  { value: 'min', label: 'minutes' },
                  { value: 'h', label: 'hours' },
                ]}
                value={unit}
              />
            </Field>
            <p className="text-[11px] text-fg-muted">
              Input unit: {UNIT_LABELS[unit]}
            </p>

            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map((preset) => (
                <Button
                  key={preset.label}
                  onClick={() => applyPreset(preset)}
                  size="sm"
                  variant="ghost"
                >
                  {preset.label}
                </Button>
              ))}
              <Button onClick={() => setValue('')} size="sm" variant="ghost">
                Clear
              </Button>
            </div>

            {parsed.error && (
              <Callout title="Invalid duration" variant="error">
                {parsed.error}
              </Callout>
            )}
          </div>
        </Panel>

        <ResultPanel
          emptyText="Enter a duration to see it formatted in several ways."
          error={parsed.error}
          filename="duration.txt"
          label="Formatted duration"
          value={output}
        >
          {summary ? (
            <div className="space-y-3">
              <div className="rounded-md border border-accent/40 bg-accent-subtle/30 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-fg-muted">
                  Human readable
                </p>
                <p className="mt-1 font-mono text-2xl font-semibold text-fg">
                  {summary.compact}
                </p>
                <p className="mt-1 text-xs text-fg-muted">{summary.verbose}</p>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <CodeBlock code={summary.iso} filename="ISO 8601 duration" />
                <CodeBlock code={summary.clock} filename="Clock format" />
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {[
                  {
                    label: 'Total milliseconds',
                    value: formatNumber(summary.totalMs),
                  },
                  {
                    label: 'Total seconds',
                    value: formatNumber(summary.signedSeconds, 3),
                  },
                  {
                    label: 'Total minutes',
                    value: formatNumber(summary.signedMinutes, 3),
                  },
                  {
                    label: 'Total hours',
                    value: formatNumber(summary.signedHours, 3),
                  },
                  {
                    label: 'Total days',
                    value: formatNumber(summary.signedDays, 3),
                  },
                  {
                    label: 'Total weeks',
                    value: formatNumber(summary.signedWeeks, 3),
                  },
                ].map((item) => (
                  <div
                    className="rounded-md border border-border bg-canvas-inset p-3"
                    key={item.label}
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-fg-muted">
                      {item.label}
                    </p>
                    <p className="mt-1 font-mono text-sm text-fg">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              <p className="text-[11px] text-fg-muted">
                Normalized: {summary.parts.days} days, {summary.parts.hours}{' '}
                hours, {summary.parts.minutes} minutes, {summary.parts.seconds}{' '}
                seconds, {summary.parts.milliseconds} milliseconds.
              </p>
            </div>
          ) : undefined}
        </ResultPanel>
      </ToolLayout>
    </div>
  );
}
