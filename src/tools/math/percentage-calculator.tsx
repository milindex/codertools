'use client';

import { useMemo, useState } from 'react';

import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { ToolLayout } from '@/components/ui/ToolLayout';
import { formatNumber } from '@/tools/math/shared';

type Mode =
  'percent-of' | 'what-percent' | 'change' | 'increase-decrease' | 'difference';

const modes: Array<{ value: Mode; label: string }> = [
  { value: 'percent-of', label: 'X% of Y' },
  { value: 'what-percent', label: 'X is what % of Y' },
  { value: 'change', label: '% change' },
  { value: 'increase-decrease', label: 'Increase / decrease' },
  { value: 'difference', label: 'Difference' },
];

const parse = (value: string): number | null => {
  const text = value.trim();
  if (!text) {
    return null;
  }
  const numeric = Number(text.replace(/,/g, ''));
  return Number.isFinite(numeric) ? numeric : null;
};

export default function PercentageCalculator() {
  const [mode, setMode] = useState<Mode>('percent-of');
  const [first, setFirst] = useState('15');
  const [second, setSecond] = useState('200');
  const [direction, setDirection] = useState('increase');

  const calculation = useMemo(() => {
    const a = parse(first);
    const b = parse(second);

    if (a === null || b === null) {
      return { error: null, value: '' };
    }

    let result: number;
    let formula: string;
    let summary: string;

    switch (mode) {
      case 'percent-of': {
        result = (a / 100) * b;
        formula = `(${formatNumber(a)} / 100) × ${formatNumber(b)}`;
        summary = `${formatNumber(a)}% of ${formatNumber(b)} is ${formatNumber(result)}`;
        break;
      }
      case 'what-percent': {
        if (b === 0) {
          return { error: 'The total cannot be zero.', value: '' };
        }
        result = (a / b) * 100;
        formula = `(${formatNumber(a)} / ${formatNumber(b)}) × 100`;
        summary = `${formatNumber(a)} is ${formatNumber(result)}% of ${formatNumber(b)}`;
        break;
      }
      case 'change': {
        if (a === 0) {
          return {
            error:
              'Percentage change is undefined when the starting value is zero.',
            value: '',
          };
        }
        result = ((b - a) / Math.abs(a)) * 100;
        formula = `((${formatNumber(b)} − ${formatNumber(a)}) / |${formatNumber(a)}|) × 100`;
        summary =
          result === 0
            ? 'There is no change.'
            : `${result > 0 ? 'Increase' : 'Decrease'} of ${formatNumber(Math.abs(result))}%`;
        break;
      }
      case 'increase-decrease': {
        const factor = direction === 'increase' ? 1 + a / 100 : 1 - a / 100;
        result = b * factor;
        formula =
          direction === 'increase'
            ? `${formatNumber(b)} × (1 + ${formatNumber(a)} / 100)`
            : `${formatNumber(b)} × (1 − ${formatNumber(a)} / 100)`;
        summary = `${formatNumber(b)} ${direction === 'increase' ? 'increased' : 'decreased'} by ${formatNumber(a)}% is ${formatNumber(result)}`;
        break;
      }
      case 'difference': {
        const denominator = (Math.abs(a) + Math.abs(b)) / 2;
        if (denominator === 0) {
          return { error: 'Both values cannot be zero.', value: '' };
        }
        result = (Math.abs(a - b) / denominator) * 100;
        formula = `(|${formatNumber(a)} − ${formatNumber(b)}| / ((|${formatNumber(a)}| + |${formatNumber(b)}|) / 2)) × 100`;
        summary = `The percentage difference is ${formatNumber(result)}%`;
        break;
      }
      default: {
        result = 0;
        formula = '';
        summary = '';
      }
    }

    const suffix =
      mode === 'what-percent' || mode === 'change' || mode === 'difference'
        ? '%'
        : '';
    const lines = [
      `Result: ${formatNumber(result)}${suffix}`,
      '',
      summary,
      '',
      `Formula: ${formula}`,
      `Mode: ${modes.find((item) => item.value === mode)?.label ?? mode}`,
    ];

    return { error: null, value: lines.join('\n') };
  }, [direction, first, mode, second]);

  const labels = (() => {
    switch (mode) {
      case 'percent-of':
        return { first: 'Percentage (%)', second: 'Of value' };
      case 'what-percent':
        return { first: 'Value', second: 'Total' };
      case 'change':
        return { first: 'Starting value', second: 'Ending value' };
      case 'increase-decrease':
        return { first: 'Percentage change (%)', second: 'Original value' };
      case 'difference':
        return { first: 'Value A', second: 'Value B' };
      default:
        return { first: 'Value A', second: 'Value B' };
    }
  })();

  return (
    <ToolLayout>
      <Panel
        description="Pick a calculation, enter two values and get the result with the formula used."
        title="Percentage calculator"
      >
        <div className="space-y-3">
          <Field label="Calculation">
            <SegmentedControl
              ariaLabel="Percentage calculation"
              onChange={(next) => setMode(next as Mode)}
              options={modes}
              value={mode}
            />
          </Field>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={labels.first}>
              <Input
                aria-label={labels.first}
                inputMode="decimal"
                onChange={(event) => setFirst(event.target.value)}
                spellCheck={false}
                value={first}
              />
            </Field>
            <Field label={labels.second}>
              <Input
                aria-label={labels.second}
                inputMode="decimal"
                onChange={(event) => setSecond(event.target.value)}
                spellCheck={false}
                value={second}
              />
            </Field>
          </div>

          {mode === 'increase-decrease' && (
            <Field label="Direction">
              <SegmentedControl
                ariaLabel="Increase or decrease"
                onChange={setDirection}
                options={[
                  { value: 'increase', label: 'Increase' },
                  { value: 'decrease', label: 'Decrease' },
                ]}
                value={direction}
              />
            </Field>
          )}

          <div className="rounded-md border border-border bg-canvas-inset p-3 text-xs leading-6 text-fg-muted">
            {mode === 'difference' ? (
              <p>
                Percentage difference compares two values symmetrically, using
                their average as the denominator.
              </p>
            ) : (
              <p>
                Example: <span className="font-mono">15% of 200 = 30</span>.
                Negative values are supported.
              </p>
            )}
          </div>
        </div>
      </Panel>

      <ResultPanel
        error={calculation.error}
        filename="percentage-result.txt"
        label="Result"
        value={calculation.value}
      />
    </ToolLayout>
  );
}
