'use client';

import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { ToolLayout } from '@/components/ui/ToolLayout';
import { formatNumber, gcdNumber, trimDimension } from '@/tools/math/shared';

const presets: Array<{ label: string; width: number; height: number }> = [
  { label: '16:9', width: 16, height: 9 },
  { label: '4:3', width: 4, height: 3 },
  { label: '3:2', width: 3, height: 2 },
  { label: '1:1', width: 1, height: 1 },
  { label: '21:9', width: 21, height: 9 },
  { label: '9:16', width: 9, height: 16 },
  { label: '2:3', width: 2, height: 3 },
  { label: '5:4', width: 5, height: 4 },
];

const parseDimension = (value: string): number | null => {
  const numeric = Number(value.trim().replace(/,/g, ''));
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
};

export default function AspectRatio() {
  const [width, setWidth] = useState('1920');
  const [height, setHeight] = useState('1080');
  const [target, setTarget] = useState('1280');
  const [mode, setMode] = useState('width');

  const calculation = useMemo(() => {
    const originalWidth = parseDimension(width);
    const originalHeight = parseDimension(height);
    const targetValue = parseDimension(target);

    if (originalWidth === null || originalHeight === null) {
      return { error: null, value: '' };
    }
    if (targetValue === null) {
      return { error: 'Enter a positive target dimension.', value: '' };
    }

    const ratio = originalWidth / originalHeight;
    const integerRatio =
      Number.isInteger(originalWidth) && Number.isInteger(originalHeight);
    const divisor = integerRatio ? gcdNumber(originalWidth, originalHeight) : 1;
    const ratioLabel = integerRatio
      ? `${originalWidth / divisor}:${originalHeight / divisor}`
      : `${formatNumber(originalWidth)}:${formatNumber(originalHeight)}`;

    const newWidth = mode === 'width' ? targetValue : targetValue * ratio;
    const newHeight = mode === 'width' ? targetValue / ratio : targetValue;

    const lines = [
      `Original: ${trimDimension(originalWidth)} × ${trimDimension(originalHeight)}`,
      `Aspect ratio: ${ratioLabel} (${formatNumber(ratio, 10)}:1)`,
      `Width ÷ height: ${formatNumber(ratio, 10)}`,
      '',
      mode === 'width'
        ? `New size at width ${trimDimension(targetValue)}: ${trimDimension(newWidth)} × ${trimDimension(newHeight)}`
        : `New size at height ${trimDimension(targetValue)}: ${trimDimension(newWidth)} × ${trimDimension(newHeight)}`,
      '',
      `Rounded to whole pixels: ${Math.round(newWidth)} × ${Math.round(newHeight)}`,
      `Width per 1 height: ${formatNumber(ratio, 10)}`,
      `Height per 1 width: ${formatNumber(1 / ratio, 10)}`,
    ];

    return { error: null, value: lines.join('\n') };
  }, [height, mode, target, width]);

  return (
    <ToolLayout>
      <Panel
        description="Find the simplified ratio, then scale an image or container to a new width or height without distorting it."
        title="Aspect ratio"
      >
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Original width">
              <Input
                aria-label="Original width"
                inputMode="decimal"
                onChange={(event) => setWidth(event.target.value)}
                spellCheck={false}
                value={width}
              />
            </Field>
            <Field label="Original height">
              <Input
                aria-label="Original height"
                inputMode="decimal"
                onChange={(event) => setHeight(event.target.value)}
                spellCheck={false}
                value={height}
              />
            </Field>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold text-fg">Common presets</p>
            <div className="flex flex-wrap gap-1.5">
              {presets.map((preset) => (
                <Button
                  key={preset.label}
                  onClick={() => {
                    setWidth(String(preset.width));
                    setHeight(String(preset.height));
                  }}
                  size="sm"
                  variant="default"
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>

          <Field label="Scale by">
            <SegmentedControl
              ariaLabel="Scale by width or height"
              onChange={setMode}
              options={[
                { value: 'width', label: 'Fit to width' },
                { value: 'height', label: 'Fit to height' },
              ]}
              value={mode}
            />
          </Field>

          <Field
            hint={
              mode === 'width' ? 'New width in pixels' : 'New height in pixels'
            }
            label={mode === 'width' ? 'Target width' : 'Target height'}
          >
            <Input
              aria-label={mode === 'width' ? 'Target width' : 'Target height'}
              inputMode="decimal"
              onChange={(event) => setTarget(event.target.value)}
              spellCheck={false}
              value={target}
            />
          </Field>

          <div className="rounded-md border border-border bg-canvas-inset p-3 text-xs leading-6 text-fg-muted">
            <p>
              The ratio is width:height. A 1920 × 1080 image is 16:9, so fitting
              it to 1280 px wide gives 1280 × 720.
            </p>
          </div>
        </div>
      </Panel>

      <ResultPanel
        error={calculation.error}
        filename="aspect-ratio.txt"
        label="Dimensions"
        value={calculation.value}
      />
    </ToolLayout>
  );
}
