'use client';

import { useMemo, useState } from 'react';

import { Callout } from '@/components/ui/Callout';
import { CodeBlock } from '@/components/ui/CodeBlock';
import { Panel } from '@/components/ui/Panel';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Select } from '@/components/ui/Select';
import { ToolLayout } from '@/components/ui/ToolLayout';

import {
  ColorField,
  isValidColor,
  PreviewSurface,
  SliderField,
  ToggleField,
  visibleColor,
} from './shared';

type GradientType = 'linear' | 'radial' | 'conic';

const POSITIONS = [
  'center',
  'top',
  'right',
  'bottom',
  'left',
  'top left',
  'top right',
  'bottom right',
  'bottom left',
];

export default function GradientGenerator() {
  const [type, setType] = useState<GradientType>('linear');
  const [angle, setAngle] = useState(135);
  const [shape, setShape] = useState('circle');
  const [position, setPosition] = useState('center');
  const [startColor, setStartColor] = useState('#6366f1');
  const [endColor, setEndColor] = useState('#ec4899');
  const [middleEnabled, setMiddleEnabled] = useState(false);
  const [middleColor, setMiddleColor] = useState('#a855f7');
  const [startPos, setStartPos] = useState(0);
  const [middlePos, setMiddlePos] = useState(50);
  const [endPos, setEndPos] = useState(100);

  const invalid =
    !isValidColor(startColor) ||
    !isValidColor(endColor) ||
    (middleEnabled && !isValidColor(middleColor));

  const gradient = useMemo(() => {
    const stops: Array<{ color: string; position: number }> = [
      { color: visibleColor(startColor, '#6366f1'), position: startPos },
      { color: visibleColor(endColor, '#ec4899'), position: endPos },
    ];

    if (middleEnabled) {
      stops.push({
        color: visibleColor(middleColor, '#a855f7'),
        position: middlePos,
      });
    }

    const stopText = stops
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((stop) => `${stop.color} ${stop.position}%`)
      .join(', ');

    if (type === 'radial') {
      return `radial-gradient(${shape} at ${position}, ${stopText})`;
    }

    if (type === 'conic') {
      return `conic-gradient(from ${angle}deg at ${position}, ${stopText})`;
    }

    return `linear-gradient(${angle}deg, ${stopText})`;
  }, [
    angle,
    endColor,
    endPos,
    middleColor,
    middleEnabled,
    middlePos,
    position,
    shape,
    startColor,
    startPos,
    type,
  ]);

  const css = `background-image: ${gradient};`;

  return (
    <div className="space-y-6">
      <ToolLayout>
        <Panel
          description="Choose a gradient type, colors and stop positions."
          title="Gradient controls"
        >
          <div className="space-y-4">
            <SegmentedControl
              ariaLabel="Gradient type"
              onChange={(value) => setType(value as GradientType)}
              options={[
                { label: 'Linear', value: 'linear' },
                { label: 'Radial', value: 'radial' },
                { label: 'Conic', value: 'conic' },
              ]}
              value={type}
            />

            {type !== 'radial' && (
              <SliderField
                label="Angle"
                max={360}
                min={0}
                onChange={setAngle}
                unit="deg"
                value={angle}
              />
            )}

            {type === 'radial' && (
              <div className="space-y-1.5">
                <label
                  className="text-xs font-semibold text-fg"
                  htmlFor="gradient-shape"
                >
                  Shape
                </label>
                <Select
                  id="gradient-shape"
                  onChange={(event) => setShape(event.target.value)}
                  value={shape}
                >
                  <option value="circle">Circle</option>
                  <option value="ellipse">Ellipse</option>
                </Select>
              </div>
            )}

            {type !== 'linear' && (
              <div className="space-y-1.5">
                <label
                  className="text-xs font-semibold text-fg"
                  htmlFor="gradient-position"
                >
                  Center position
                </label>
                <Select
                  id="gradient-position"
                  onChange={(event) => setPosition(event.target.value)}
                  value={position}
                >
                  {POSITIONS.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </Select>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <ColorField
                hint={`${startPos}%`}
                label="Start color"
                onChange={setStartColor}
                value={startColor}
              />
              <ColorField
                hint={`${endPos}%`}
                label="End color"
                onChange={setEndColor}
                value={endColor}
              />
            </div>

            <SliderField
              label="Start position"
              max={100}
              min={0}
              onChange={setStartPos}
              unit="%"
              value={startPos}
            />

            <ToggleField
              checked={middleEnabled}
              hint={middleEnabled ? `${middlePos}%` : undefined}
              label="Add a middle color stop"
              onChange={setMiddleEnabled}
            />

            {middleEnabled && (
              <div className="grid gap-3 rounded-md border border-border bg-canvas-subtle p-3 sm:grid-cols-2">
                <ColorField
                  label="Middle color"
                  onChange={setMiddleColor}
                  value={middleColor}
                />
                <SliderField
                  label="Middle position"
                  max={100}
                  min={0}
                  onChange={setMiddlePos}
                  unit="%"
                  value={middlePos}
                />
              </div>
            )}

            <SliderField
              label="End position"
              max={100}
              min={0}
              onChange={setEndPos}
              unit="%"
              value={endPos}
            />

            {invalid && (
              <Callout variant="error">
                One or more colors are invalid. The preview is using a fallback
                color.
              </Callout>
            )}
          </div>
        </Panel>

        <Panel title="Preview">
          <PreviewSurface
            className="min-h-[360px]"
            style={{ backgroundImage: gradient }}
          >
            <span className="rounded-md border border-white/30 bg-black/30 px-3 py-1.5 font-mono text-xs text-white backdrop-blur-sm">
              {type} gradient
            </span>
          </PreviewSurface>
        </Panel>
      </ToolLayout>

      <CodeBlock code={css} filename="gradient.css" language="css" />
    </div>
  );
}
