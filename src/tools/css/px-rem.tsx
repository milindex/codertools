'use client';

import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { ToolLayout } from '@/components/ui/ToolLayout';

const PX_SAMPLE =
  'padding: 24px; margin: 0 16px; font-size: 18px; border-width: 2px; width: 320px;';

const REM_SAMPLE =
  '.card { padding: 1.5rem; gap: 0.5rem; border-radius: 0.5rem; font-size: 1.125rem; }';

const COMMON_VALUES = [
  1, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 24, 32, 40, 48, 64,
];

const formatNumber = (value: number, precision: number): string => {
  const fixed = value.toFixed(precision);
  const trimmed = fixed.replace(/\.?0+$/, '');
  return trimmed === '-0' || trimmed === '' ? '0' : trimmed;
};

const getUnitPattern = (unit: 'px' | 'rem') =>
  new RegExp(`(-?\\d*\\.?\\d+)\\s*${unit}\\b`, 'gi');

export default function PxRemConverter() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [direction, setDirection] = useState<'px-to-rem' | 'rem-to-px'>(
    'px-to-rem'
  );
  const [rootSize, setRootSize] = useState('16');
  const [precision, setPrecision] = useState('4');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const root = Number.parseFloat(rootSize);
  const rootValid = Number.isFinite(root) && root > 0;
  const decimals = Number.parseInt(precision, 10);

  const reset = () => {
    setOutput('');
    setError(null);
    setNotice(null);
  };

  const convert = () => {
    if (!input.trim()) {
      reset();
      setError('Enter at least one value to convert.');
      return;
    }
    if (!rootValid) {
      reset();
      setError('Root font size must be a number greater than zero.');
      return;
    }

    const sourceUnit = direction === 'px-to-rem' ? 'px' : 'rem';
    const targetUnit = direction === 'px-to-rem' ? 'rem' : 'px';
    const pattern = getUnitPattern(sourceUnit);
    let count = 0;

    const result = input.replace(pattern, (_match, rawNumber: string) => {
      const number = Number.parseFloat(rawNumber);
      if (!Number.isFinite(number)) {
        return _match;
      }
      count += 1;
      const converted =
        direction === 'px-to-rem' ? number / root : number * root;
      return `${formatNumber(converted, decimals)}${targetUnit}`;
    });

    setOutput(result);
    setError(null);
    setNotice(
      count === 0 ? `No ${sourceUnit} values were found in the input.` : null
    );
  };

  const commonRows = useMemo(
    () =>
      COMMON_VALUES.map((pixels) => ({
        px: `${pixels}px`,
        rem: `${formatNumber(pixels / (rootValid ? root : 16), 4)}rem`,
      })),
    [root, rootValid]
  );

  return (
    <div className="space-y-4">
      <ToolLayout>
        <Panel title="Input">
          <div className="mb-3">
            <SegmentedControl
              ariaLabel="Conversion direction"
              onChange={(value) => {
                setDirection(value as 'px-to-rem' | 'rem-to-px');
                reset();
              }}
              options={[
                { value: 'px-to-rem', label: 'px → rem' },
                { value: 'rem-to-px', label: 'rem → px' },
              ]}
              value={direction}
            />
          </div>

          <Field
            hint={`${input.length.toLocaleString()} characters`}
            htmlFor="px-rem-input"
            label={
              direction === 'px-to-rem'
                ? 'CSS or values in px'
                : 'CSS or values in rem'
            }
          >
            <Textarea
              id="px-rem-input"
              onChange={(event) => {
                setInput(event.target.value);
                reset();
              }}
              placeholder={
                direction === 'px-to-rem'
                  ? 'padding: 16px; font-size: 18px;'
                  : 'padding: 1rem; font-size: 1.125rem;'
              }
              rows={14}
              value={input}
            />
          </Field>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Field
              hint={
                rootValid ? 'Used as the rem base' : 'Must be greater than 0'
              }
              htmlFor="px-rem-root"
              label="Root font size (px)"
            >
              <Input
                id="px-rem-root"
                inputMode="decimal"
                max={200}
                min={1}
                onChange={(event) => {
                  setRootSize(event.target.value);
                  reset();
                }}
                step={0.5}
                type="number"
                value={rootSize}
              />
            </Field>

            <Field htmlFor="px-rem-precision" label="Decimal places">
              <Select
                id="px-rem-precision"
                onChange={(event) => {
                  setPrecision(event.target.value);
                  reset();
                }}
                value={precision}
              >
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="6">6</option>
              </Select>
            </Field>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <Button onClick={convert} variant="primary">
              Convert values
            </Button>
            <Button
              onClick={() => {
                setInput(direction === 'px-to-rem' ? PX_SAMPLE : REM_SAMPLE);
                reset();
              }}
              variant="default"
            >
              Load sample
            </Button>
            <Button
              onClick={() => {
                setInput('');
                reset();
              }}
              variant="ghost"
            >
              Clear
            </Button>
          </div>

          <Callout className="mt-3" variant="info">
            The converter replaces every number followed by{' '}
            <code>{direction === 'px-to-rem' ? 'px' : 'rem'}</code>, so it works
            on plain values and on full CSS declarations. Other text is left
            unchanged.
          </Callout>

          {notice && (
            <Callout className="mt-3" variant="warning">
              {notice}
            </Callout>
          )}
          {error && (
            <Callout className="mt-3" variant="error">
              {error}
            </Callout>
          )}
        </Panel>

        <ResultPanel
          emptyText="Converted values will appear here."
          error={error}
          filename={
            direction === 'px-to-rem' ? 'rem-values.css' : 'px-values.css'
          }
          label="Converted output"
          mime="text/css;charset=utf-8"
          value={output}
        >
          {output ? (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Badge variant="accent">
                  {direction === 'px-to-rem' ? 'px → rem' : 'rem → px'}
                </Badge>
                <Badge>root {rootValid ? formatNumber(root, 4) : '16'}px</Badge>
                <Badge>{decimals} decimals</Badge>
              </div>
              <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap break-words rounded-md border border-border bg-canvas-inset p-3 font-mono text-[13px] leading-6 text-fg">
                {output}
              </pre>
            </div>
          ) : undefined}
        </ResultPanel>
      </ToolLayout>

      <Panel
        description={`Common pixel values converted at a ${rootValid ? formatNumber(root, 4) : '16'}px root font size.`}
        title="Common conversions"
      >
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {commonRows.map((row) => (
            <div
              className="flex items-center justify-between gap-3 rounded-md border border-border bg-canvas-inset px-3 py-2"
              key={row.px}
            >
              <code className="text-xs text-fg">{row.px}</code>
              <span className="text-fg-subtle">→</span>
              <code className="text-xs text-fg-muted">{row.rem}</code>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
