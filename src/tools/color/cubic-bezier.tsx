'use client';

import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { CodeBlock } from '@/components/ui/CodeBlock';
import { Panel } from '@/components/ui/Panel';
import { Select } from '@/components/ui/Select';
import { ToolLayout } from '@/components/ui/ToolLayout';

import { PreviewSurface, round, SliderField } from './shared';

type BezierPoints = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

const PRESETS: Record<string, BezierPoints> = {
  linear: { x1: 0, y1: 0, x2: 1, y2: 1 },
  ease: { x1: 0.25, y1: 0.1, x2: 0.25, y2: 1 },
  'ease-in': { x1: 0.42, y1: 0, x2: 1, y2: 1 },
  'ease-out': { x1: 0, y1: 0, x2: 0.58, y2: 1 },
  'ease-in-out': { x1: 0.42, y1: 0, x2: 0.58, y2: 1 },
  'back-out': { x1: 0.34, y1: 1.56, x2: 0.64, y2: 1 },
  'back-in': { x1: 0.36, y1: 0, x2: 0.66, y2: -0.56 },
  smooth: { x1: 0.4, y1: 0, x2: 0.2, y2: 1 },
};

export default function CubicBezier() {
  const [points, setPoints] = useState<BezierPoints>(
    PRESETS.ease ?? {
      x1: 0.25,
      y1: 0.1,
      x2: 0.25,
      y2: 1,
    }
  );
  const [preset, setPreset] = useState('ease');

  const customTrack = useRef<HTMLDivElement | null>(null);
  const customBall = useRef<HTMLDivElement | null>(null);
  const linearTrack = useRef<HTMLDivElement | null>(null);
  const linearBall = useRef<HTMLDivElement | null>(null);
  const animations = useRef<Animation[]>([]);

  useEffect(
    () => () => {
      animations.current.forEach((animation) => animation.cancel());
    },
    []
  );

  const update = (patch: Partial<BezierPoints>) => {
    setPoints((previous) => ({ ...previous, ...patch }));
    setPreset('custom');
  };

  const applyPreset = (name: string) => {
    const next = PRESETS[name];

    if (!next) {
      return;
    }

    setPoints(next);
    setPreset(name);
  };

  const easing = `cubic-bezier(${points.x1}, ${points.y1}, ${points.x2}, ${points.y2})`;

  const play = () => {
    animations.current.forEach((animation) => animation.cancel());
    animations.current = [];

    const track = customTrack.current;
    const ball = customBall.current;
    const linear = linearTrack.current;
    const linearDot = linearBall.current;

    if (track && ball) {
      const distance = Math.max(0, track.clientWidth - ball.clientWidth - 8);
      animations.current.push(
        ball.animate(
          [
            { transform: 'translateX(0px)' },
            { transform: `translateX(${distance}px)` },
          ],
          { duration: 1400, easing, fill: 'both' }
        )
      );
    }

    if (linear && linearDot) {
      const distance = Math.max(
        0,
        linear.clientWidth - linearDot.clientWidth - 8
      );
      animations.current.push(
        linearDot.animate(
          [
            { transform: 'translateX(0px)' },
            { transform: `translateX(${distance}px)` },
          ],
          { duration: 1400, easing: 'linear', fill: 'both' }
        )
      );
    }
  };

  const cp1x = points.x1 * 100;
  const cp1y = 100 - points.y1 * 100;
  const cp2x = points.x2 * 100;
  const cp2y = 100 - points.y2 * 100;

  const css = `.eased {
  transition-timing-function: ${easing};
  animation-timing-function: ${easing};
}`;

  return (
    <div className="space-y-6">
      <ToolLayout>
        <Panel
          description="Tune the two control points. X values must stay between 0 and 1; Y values can overshoot."
          title="Bezier controls"
        >
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label
                className="text-xs font-semibold text-fg"
                htmlFor="bezier-preset"
              >
                Preset
              </label>
              <Select
                id="bezier-preset"
                onChange={(event) => applyPreset(event.target.value)}
                value={preset}
              >
                <option value="custom">Custom</option>
                {Object.keys(PRESETS).map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <SliderField
                label="P1 X"
                max={1}
                min={0}
                onChange={(value) => update({ x1: value })}
                step={0.01}
                value={points.x1}
              />
              <SliderField
                label="P1 Y"
                max={2}
                min={-1}
                onChange={(value) => update({ y1: value })}
                step={0.01}
                value={points.y1}
              />
              <SliderField
                label="P2 X"
                max={1}
                min={0}
                onChange={(value) => update({ x2: value })}
                step={0.01}
                value={points.x2}
              />
              <SliderField
                label="P2 Y"
                max={2}
                min={-1}
                onChange={(value) => update({ y2: value })}
                step={0.01}
                value={points.y2}
              />
            </div>

            <div className="rounded-md border border-border bg-canvas-inset px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-fg-muted">
                Easing
              </p>
              <p className="break-all font-mono text-xs text-fg">{easing}</p>
              <p className="mt-1 text-[11px] text-fg-muted">
                Progress {round(points.y1, 2)} → {round(points.y2, 2)} at the
                control points.
              </p>
            </div>
          </div>
        </Panel>

        <Panel
          actions={
            <Button onClick={play} size="sm" variant="primary">
              Play animation
            </Button>
          }
          title="Preview"
        >
          <PreviewSurface className="min-h-[360px] items-stretch bg-canvas-subtle">
            <div className="flex w-full flex-col justify-center gap-5 px-2">
              <svg
                aria-label="Cubic bezier curve"
                className="h-52 w-full"
                preserveAspectRatio="none"
                role="img"
                viewBox="0 -110 100 320"
              >
                {[0, 25, 50, 75, 100].map((x) => (
                  <line
                    className="text-border"
                    key={`x-${x}`}
                    stroke="currentColor"
                    strokeWidth="0.4"
                    x1={x}
                    x2={x}
                    y1={-110}
                    y2={210}
                  />
                ))}
                {[-1, 0, 1, 2].map((y) => (
                  <line
                    className="text-border"
                    key={`y-${y}`}
                    stroke="currentColor"
                    strokeWidth="0.4"
                    x1={0}
                    x2={100}
                    y1={100 - y * 100}
                    y2={100 - y * 100}
                  />
                ))}
                <line
                  className="text-fg-subtle"
                  stroke="currentColor"
                  strokeDasharray="2 2"
                  strokeWidth="0.6"
                  x1={0}
                  x2={cp1x}
                  y1={100}
                  y2={cp1y}
                />
                <line
                  className="text-fg-subtle"
                  stroke="currentColor"
                  strokeDasharray="2 2"
                  strokeWidth="0.6"
                  x1={100}
                  x2={cp2x}
                  y1={0}
                  y2={cp2y}
                />
                <path
                  className="text-accent"
                  d={`M 0 100 C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, 100 0`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                />
                <circle
                  className="text-done"
                  cx={cp1x}
                  cy={cp1y}
                  fill="currentColor"
                  r="3"
                />
                <circle
                  className="text-done"
                  cx={cp2x}
                  cy={cp2y}
                  fill="currentColor"
                  r="3"
                />
              </svg>

              <div>
                <div className="mb-1.5 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wide text-fg-muted">
                  <span>Custom easing</span>
                  <span className="font-mono normal-case">{easing}</span>
                </div>
                <div
                  className="relative h-9 overflow-hidden rounded-full border border-border bg-canvas-inset"
                  ref={customTrack}
                >
                  <div
                    className="absolute left-1 top-1 h-7 w-7 rounded-full bg-accent shadow"
                    ref={customBall}
                  />
                </div>
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wide text-fg-muted">
                  <span>Linear reference</span>
                  <span className="font-mono normal-case">linear</span>
                </div>
                <div
                  className="relative h-9 overflow-hidden rounded-full border border-border bg-canvas-inset"
                  ref={linearTrack}
                >
                  <div
                    className="absolute left-1 top-1 h-7 w-7 rounded-full bg-fg-subtle shadow"
                    ref={linearBall}
                  />
                </div>
              </div>
            </div>
          </PreviewSurface>
        </Panel>
      </ToolLayout>

      <CodeBlock code={css} filename="easing.css" language="css" />
    </div>
  );
}
