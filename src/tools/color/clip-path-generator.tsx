'use client';

import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { CodeBlock } from '@/components/ui/CodeBlock';
import { Panel } from '@/components/ui/Panel';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Select } from '@/components/ui/Select';
import { ToolLayout } from '@/components/ui/ToolLayout';

import { PreviewSurface, SliderField } from './shared';

type ClipMode = 'polygon' | 'circle' | 'ellipse' | 'inset';

type Point = {
  id: number;
  x: number;
  y: number;
};

const PRESET_POINTS: Record<string, Array<[number, number]>> = {
  triangle: [
    [50, 0],
    [100, 100],
    [0, 100],
  ],
  diamond: [
    [50, 0],
    [100, 50],
    [50, 100],
    [0, 50],
  ],
  hexagon: [
    [25, 0],
    [75, 0],
    [100, 50],
    [75, 100],
    [25, 100],
    [0, 50],
  ],
  star: [
    [50, 0],
    [61, 35],
    [98, 35],
    [68, 57],
    [79, 91],
    [50, 70],
    [21, 91],
    [32, 57],
    [2, 35],
    [39, 35],
  ],
  arrow: [
    [0, 20],
    [60, 20],
    [60, 0],
    [100, 50],
    [60, 100],
    [60, 80],
    [0, 80],
  ],
};

const pointsFromPreset = (name: string, seed: number): Point[] | null => {
  const preset = PRESET_POINTS[name];

  if (!preset) {
    return null;
  }

  return preset.map((pair, index) => ({
    id: seed + index,
    x: pair[0] ?? 0,
    y: pair[1] ?? 0,
  }));
};

export default function ClipPathGenerator() {
  const [mode, setMode] = useState<ClipMode>('polygon');
  const [points, setPoints] = useState<Point[]>(
    () => pointsFromPreset('hexagon', 1) ?? []
  );
  const [preset, setPreset] = useState('hexagon');

  const [circleRadius, setCircleRadius] = useState(40);
  const [circleX, setCircleX] = useState(50);
  const [circleY, setCircleY] = useState(50);

  const [ellipseRx, setEllipseRx] = useState(45);
  const [ellipseRy, setEllipseRy] = useState(30);
  const [ellipseX, setEllipseX] = useState(50);
  const [ellipseY, setEllipseY] = useState(50);

  const [insetTop, setInsetTop] = useState(8);
  const [insetRight, setInsetRight] = useState(8);
  const [insetBottom, setInsetBottom] = useState(8);
  const [insetLeft, setInsetLeft] = useState(8);
  const [insetRound, setInsetRound] = useState(16);

  const updatePoint = (id: number, patch: Partial<Point>) => {
    setPreset('custom');
    setPoints((previous) =>
      previous.map((point) =>
        point.id === id ? { ...point, ...patch } : point
      )
    );
  };

  const removePoint = (id: number) => {
    setPreset('custom');
    setPoints((previous) =>
      previous.length > 3
        ? previous.filter((point) => point.id !== id)
        : previous
    );
  };

  const addPoint = () => {
    setPreset('custom');
    setPoints((previous) => {
      const lastId = previous[previous.length - 1]?.id ?? 0;
      return [
        ...previous,
        {
          id: lastId + 1,
          x: 50,
          y: 50,
        },
      ];
    });
  };

  const applyPreset = (name: string) => {
    const next = pointsFromPreset(name, points.length + 1);

    if (next) {
      setPoints(next);
      setPreset(name);
    }
  };

  const clipPath = useMemo(() => {
    if (mode === 'circle') {
      return `circle(${circleRadius}% at ${circleX}% ${circleY}%)`;
    }

    if (mode === 'ellipse') {
      return `ellipse(${ellipseRx}% ${ellipseRy}% at ${ellipseX}% ${ellipseY}%)`;
    }

    if (mode === 'inset') {
      return `inset(${insetTop}% ${insetRight}% ${insetBottom}% ${insetLeft}% round ${insetRound}px)`;
    }

    return `polygon(${points
      .map((point) => `${point.x}% ${point.y}%`)
      .join(', ')})`;
  }, [
    circleRadius,
    circleX,
    circleY,
    ellipseRx,
    ellipseRy,
    ellipseX,
    ellipseY,
    insetBottom,
    insetLeft,
    insetRight,
    insetRound,
    insetTop,
    mode,
    points,
  ]);

  const css = `clip-path: ${clipPath};`;

  return (
    <div className="space-y-6">
      <ToolLayout>
        <Panel
          description="Build a simple CSS shape with polygon, circle, ellipse or inset clipping."
          title="Shape controls"
        >
          <div className="space-y-4">
            <SegmentedControl
              ariaLabel="Clip path shape"
              onChange={(value) => setMode(value as ClipMode)}
              options={[
                { label: 'Polygon', value: 'polygon' },
                { label: 'Circle', value: 'circle' },
                { label: 'Ellipse', value: 'ellipse' },
                { label: 'Inset', value: 'inset' },
              ]}
              value={mode}
            />

            {mode === 'polygon' && (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label
                    className="text-xs font-semibold text-fg"
                    htmlFor="clip-preset"
                  >
                    Preset
                  </label>
                  <Select
                    id="clip-preset"
                    onChange={(event) => applyPreset(event.target.value)}
                    value={preset}
                  >
                    <option value="custom">Custom</option>
                    <option value="triangle">Triangle</option>
                    <option value="diamond">Diamond</option>
                    <option value="hexagon">Hexagon</option>
                    <option value="star">Star</option>
                    <option value="arrow">Arrow</option>
                  </Select>
                </div>

                <div className="space-y-2">
                  {points.map((point, index) => (
                    <div
                      className="rounded-md border border-border bg-canvas-subtle p-3"
                      key={point.id}
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-fg">
                          Point {index + 1}
                        </span>
                        <Button
                          disabled={points.length <= 3}
                          onClick={() => removePoint(point.id)}
                          size="sm"
                          variant="ghost"
                        >
                          Remove
                        </Button>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <SliderField
                          label="X"
                          max={100}
                          min={0}
                          onChange={(value) =>
                            updatePoint(point.id, { x: value })
                          }
                          unit="%"
                          value={point.x}
                        />
                        <SliderField
                          label="Y"
                          max={100}
                          min={0}
                          onChange={(value) =>
                            updatePoint(point.id, { y: value })
                          }
                          unit="%"
                          value={point.y}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <Button onClick={addPoint} size="sm" variant="default">
                  Add point
                </Button>
              </div>
            )}

            {mode === 'circle' && (
              <div className="grid gap-3 sm:grid-cols-2">
                <SliderField
                  label="Radius"
                  max={100}
                  min={0}
                  onChange={setCircleRadius}
                  unit="%"
                  value={circleRadius}
                />
                <SliderField
                  label="Center X"
                  max={100}
                  min={0}
                  onChange={setCircleX}
                  unit="%"
                  value={circleX}
                />
                <SliderField
                  label="Center Y"
                  max={100}
                  min={0}
                  onChange={setCircleY}
                  unit="%"
                  value={circleY}
                />
              </div>
            )}

            {mode === 'ellipse' && (
              <div className="grid gap-3 sm:grid-cols-2">
                <SliderField
                  label="Radius X"
                  max={100}
                  min={0}
                  onChange={setEllipseRx}
                  unit="%"
                  value={ellipseRx}
                />
                <SliderField
                  label="Radius Y"
                  max={100}
                  min={0}
                  onChange={setEllipseRy}
                  unit="%"
                  value={ellipseRy}
                />
                <SliderField
                  label="Center X"
                  max={100}
                  min={0}
                  onChange={setEllipseX}
                  unit="%"
                  value={ellipseX}
                />
                <SliderField
                  label="Center Y"
                  max={100}
                  min={0}
                  onChange={setEllipseY}
                  unit="%"
                  value={ellipseY}
                />
              </div>
            )}

            {mode === 'inset' && (
              <div className="grid gap-3 sm:grid-cols-2">
                <SliderField
                  label="Top"
                  max={50}
                  min={0}
                  onChange={setInsetTop}
                  unit="%"
                  value={insetTop}
                />
                <SliderField
                  label="Right"
                  max={50}
                  min={0}
                  onChange={setInsetRight}
                  unit="%"
                  value={insetRight}
                />
                <SliderField
                  label="Bottom"
                  max={50}
                  min={0}
                  onChange={setInsetBottom}
                  unit="%"
                  value={insetBottom}
                />
                <SliderField
                  label="Left"
                  max={50}
                  min={0}
                  onChange={setInsetLeft}
                  unit="%"
                  value={insetLeft}
                />
                <SliderField
                  className="sm:col-span-2"
                  label="Rounded corners"
                  max={80}
                  min={0}
                  onChange={setInsetRound}
                  unit="px"
                  value={insetRound}
                />
              </div>
            )}
          </div>
        </Panel>

        <Panel title="Preview">
          <PreviewSurface className="min-h-[360px] bg-canvas-subtle">
            <div className="relative h-64 w-full max-w-sm">
              <div className="absolute inset-0 rounded-md border border-dashed border-fg-subtle/70" />
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage:
                    'linear-gradient(135deg, #22d3ee 0%, #6366f1 45%, #ec4899 100%)',
                  clipPath,
                }}
              />
            </div>
          </PreviewSurface>
        </Panel>
      </ToolLayout>

      <CodeBlock code={css} filename="clip-path.css" language="css" />
    </div>
  );
}
