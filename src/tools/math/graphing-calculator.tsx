'use client';

import type { KeyboardEvent, PointerEvent as ReactPointerEvent } from 'react';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Panel } from '@/components/ui/Panel';
import { ToolLayout } from '@/components/ui/ToolLayout';

type View = {
  xmin: number;
  xmax: number;
  ymin: number;
  ymax: number;
};

type CompiledFunction = {
  index: number;
  label: string;
  color: string;
  evaluate: (x: number) => number;
};

const colors = ['#2f81f7', '#f85149', '#3fb950'];
const initialView: View = { xmin: -10, xmax: 10, ymin: -6, ymax: 6 };

const niceStep = (range: number, targetTicks: number): number => {
  if (!Number.isFinite(range) || range <= 0) {
    return 1;
  }

  const rough = range / Math.max(2, targetTicks);
  const power = 10 ** Math.floor(Math.log10(rough));
  const normalized = rough / power;
  const step =
    normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;

  return step * power;
};

const formatTick = (value: number, step: number): string => {
  if (Math.abs(value) < step / 1000) {
    return '0';
  }
  if (Math.abs(value) >= 1e6 || Math.abs(value) < 1e-4) {
    return value.toExponential(1);
  }

  const decimals = Math.max(0, 1 - Math.floor(Math.log10(step)));
  let text = value.toFixed(Math.min(decimals, 8));
  if (text.includes('.')) {
    text = text.replace(/0+$/, '').replace(/\.$/, '');
  }

  return text;
};

const RangeEditor = ({
  view,
  onApply,
}: {
  view: View;
  onApply: (view: View) => void;
}) => {
  const [draft, setDraft] = useState(() => ({
    xmin: String(view.xmin),
    xmax: String(view.xmax),
    ymin: String(view.ymin),
    ymax: String(view.ymax),
  }));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDraft({
      xmin: String(view.xmin),
      xmax: String(view.xmax),
      ymin: String(view.ymin),
      ymax: String(view.ymax),
    });
  }, [view.xmin, view.xmax, view.ymin, view.ymax]);

  const apply = () => {
    const xmin = Number(draft.xmin);
    const xmax = Number(draft.xmax);
    const ymin = Number(draft.ymin);
    const ymax = Number(draft.ymax);

    if (![xmin, xmax, ymin, ymax].every((value) => Number.isFinite(value))) {
      setError('All four range values must be numbers.');
      return;
    }
    if (xmin >= xmax) {
      setError('x minimum must be less than x maximum.');
      return;
    }
    if (ymin >= ymax) {
      setError('y minimum must be less than y maximum.');
      return;
    }

    setError(null);
    onApply({ xmin, xmax, ymin, ymax });
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      apply();
    }
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        {(
          [
            ['xmin', 'x min'],
            ['xmax', 'x max'],
            ['ymin', 'y min'],
            ['ymax', 'y max'],
          ] as const
        ).map(([key, label]) => (
          <Field key={key} label={label}>
            <Input
              aria-label={label}
              className="font-mono"
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  [key]: event.target.value,
                }))
              }
              onKeyDown={onKeyDown}
              spellCheck={false}
              value={draft[key]}
            />
          </Field>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={apply} size="sm" variant="default">
          Apply range
        </Button>
        <Button
          onClick={() => {
            setError(null);
            onApply(initialView);
          }}
          size="sm"
          variant="ghost"
        >
          Reset view
        </Button>
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
};

type MathJsModule = {
  compile: (expression: string) => {
    evaluate: (scope: { x: number }) => unknown;
  };
};

export default function GraphingCalculator() {
  const [expressions, setExpressions] = useState(['sin(x)', '', '']);
  const [view, setView] = useState<View>(initialView);
  const [compiled, setCompiled] = useState<CompiledFunction[]>([]);
  const [errors, setErrors] = useState<Record<number, string>>({});
  const [size, setSize] = useState({ width: 0, height: 420, dpr: 1 });
  const [dragging, setDragging] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef(view);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    view: View;
  } | null>(null);

  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  useEffect(() => {
    let cancelled = false;

    const compile = async () => {
      let math: MathJsModule;

      try {
        math = (await import('mathjs')) as unknown as MathJsModule;
      } catch {
        if (!cancelled) {
          setCompiled([]);
          setErrors({ 0: 'The math engine could not be loaded.' });
        }
        return;
      }

      if (cancelled) {
        return;
      }

      const next: CompiledFunction[] = [];
      const nextErrors: Record<number, string> = {};

      expressions.forEach((expression, index) => {
        const label = expression.trim();
        if (!label) {
          return;
        }

        try {
          const parsed = math.compile(label);
          next.push({
            index,
            label,
            color: colors[index] ?? '#2f81f7',
            evaluate: (x: number) => {
              const value = parsed.evaluate({ x }) as unknown;
              return typeof value === 'number' ? value : Number(value);
            },
          });
        } catch (caught) {
          nextErrors[index] =
            caught instanceof Error ? caught.message : 'Invalid expression.';
        }
      });

      if (!cancelled) {
        setCompiled(next);
        setErrors(nextErrors);
      }
    };

    void compile();

    return () => {
      cancelled = true;
    };
  }, [expressions]);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) {
      return undefined;
    }

    const resize = () => {
      const width = Math.max(280, wrap.clientWidth);
      const dpr = window.devicePixelRatio || 1;
      setSize({ width, height: 420, dpr });
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(wrap);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || size.width === 0) {
      return;
    }

    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }

    const { width, height, dpr } = size;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, width, height);

    const styles = getComputedStyle(canvas);
    const gridColor =
      styles.getPropertyValue('--border-muted').trim() || '#21262d';
    const axisColor = styles.getPropertyValue('--border').trim() || '#30363d';
    const labelColor =
      styles.getPropertyValue('--fg-muted').trim() || '#8b949e';

    const { xmin, xmax, ymin, ymax } = view;
    if (
      !Number.isFinite(xmin) ||
      !Number.isFinite(xmax) ||
      !Number.isFinite(ymin) ||
      !Number.isFinite(ymax) ||
      xmin >= xmax ||
      ymin >= ymax
    ) {
      return;
    }

    const xToPx = (x: number) => ((x - xmin) / (xmax - xmin)) * width;
    const yToPx = (y: number) => height - ((y - ymin) / (ymax - ymin)) * height;

    const xStep = niceStep(xmax - xmin, Math.max(4, Math.floor(width / 100)));
    const yStep = niceStep(ymax - ymin, Math.max(4, Math.floor(height / 55)));

    context.lineWidth = 1;
    context.strokeStyle = gridColor;
    context.beginPath();

    const xStart = Math.ceil(xmin / xStep) * xStep;
    const xCount = Math.floor((xmax - xStart) / xStep) + 1;
    for (let index = 0; index < Math.min(xCount, 500); index += 1) {
      const x = xStart + index * xStep;
      const px = Math.round(xToPx(x)) + 0.5;
      context.moveTo(px, 0);
      context.lineTo(px, height);
    }

    const yStart = Math.ceil(ymin / yStep) * yStep;
    const yCount = Math.floor((ymax - yStart) / yStep) + 1;
    for (let index = 0; index < Math.min(yCount, 500); index += 1) {
      const y = yStart + index * yStep;
      const py = Math.round(yToPx(y)) + 0.5;
      context.moveTo(0, py);
      context.lineTo(width, py);
    }

    context.stroke();

    // Axes.
    context.strokeStyle = axisColor;
    context.lineWidth = 1.5;
    context.beginPath();
    if (ymin <= 0 && ymax >= 0) {
      const py = Math.round(yToPx(0)) + 0.5;
      context.moveTo(0, py);
      context.lineTo(width, py);
    }
    if (xmin <= 0 && xmax >= 0) {
      const px = Math.round(xToPx(0)) + 0.5;
      context.moveTo(px, 0);
      context.lineTo(px, height);
    }
    context.stroke();

    // Functions.
    context.save();
    context.beginPath();
    context.rect(0, 0, width, height);
    context.clip();
    context.lineJoin = 'round';
    context.lineCap = 'round';
    context.lineWidth = 2;

    const sampleStep = Math.max(1, Math.floor(width / 900));

    for (const fn of compiled) {
      context.beginPath();
      context.strokeStyle = fn.color;
      let started = false;
      let previousPy = 0;

      for (let px = 0; px <= width; px += sampleStep) {
        const x = xmin + (px / width) * (xmax - xmin);
        let y: number;

        try {
          y = fn.evaluate(x);
        } catch {
          y = Number.NaN;
        }

        if (!Number.isFinite(y)) {
          started = false;
          continue;
        }

        const py = yToPx(y);
        if (py < -height * 8 || py > height * 9) {
          started = false;
          continue;
        }

        if (!started) {
          context.moveTo(px, py);
          started = true;
        } else if (Math.abs(py - previousPy) > height * 3) {
          context.moveTo(px, py);
        } else {
          context.lineTo(px, py);
        }
        previousPy = py;
      }

      context.stroke();
    }
    context.restore();

    // Tick labels.
    context.fillStyle = labelColor;
    context.font =
      '11px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

    context.textAlign = 'center';
    context.textBaseline = 'bottom';
    for (let index = 0; index < Math.min(xCount, 500); index += 1) {
      const x = xStart + index * xStep;
      const px = xToPx(x);
      if (px < 24 || px > width - 24) {
        continue;
      }
      context.fillText(formatTick(x, xStep), px, height - 4);
    }

    context.textAlign = 'left';
    context.textBaseline = 'middle';
    for (let index = 0; index < Math.min(yCount, 500); index += 1) {
      const y = yStart + index * yStep;
      const py = yToPx(y);
      if (py < 12 || py > height - 12) {
        continue;
      }
      context.fillText(formatTick(y, yStep), 6, py);
    }

    if (compiled.length === 0) {
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillStyle = labelColor;
      context.font = '13px ui-sans-serif, system-ui, sans-serif';
      context.fillText(
        'Enter a function above to plot it',
        width / 2,
        height / 2
      );
    }
  }, [compiled, size, view]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return undefined;
    }

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const current = viewRef.current;
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        return;
      }

      const fractionX = (event.clientX - rect.left) / rect.width;
      const fractionY = 1 - (event.clientY - rect.top) / rect.height;
      const anchorX = current.xmin + fractionX * (current.xmax - current.xmin);
      const anchorY = current.ymin + fractionY * (current.ymax - current.ymin);
      const factor = Math.min(
        5,
        Math.max(0.2, Math.exp(event.deltaY * 0.0015))
      );

      let nextXMin = anchorX - (anchorX - current.xmin) * factor;
      let nextXMax = anchorX + (current.xmax - anchorX) * factor;
      let nextYMin = anchorY - (anchorY - current.ymin) * factor;
      let nextYMax = anchorY + (current.ymax - anchorY) * factor;

      const xSpan = nextXMax - nextXMin;
      const ySpan = nextYMax - nextYMin;
      if (xSpan < 1e-9 || ySpan < 1e-9) {
        return;
      }
      if (
        Math.abs(nextXMin) > 1e15 ||
        Math.abs(nextXMax) > 1e15 ||
        Math.abs(nextYMin) > 1e15 ||
        Math.abs(nextYMax) > 1e15
      ) {
        return;
      }

      nextXMin = Number(nextXMin.toPrecision(12));
      nextXMax = Number(nextXMax.toPrecision(12));
      nextYMin = Number(nextYMin.toPrecision(12));
      nextYMax = Number(nextYMax.toPrecision(12));

      setView({
        xmin: nextXMin,
        xmax: nextXMax,
        ymin: nextYMin,
        ymax: nextYMax,
      });
    };

    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
  }, []);

  const onPointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (event.button !== 0) {
      return;
    }
    dragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      view,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const drag = dragRef.current;
    if (!drag) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      return;
    }

    const deltaX =
      ((event.clientX - drag.startX) / rect.width) *
      (drag.view.xmax - drag.view.xmin);
    const deltaY =
      ((event.clientY - drag.startY) / rect.height) *
      (drag.view.ymax - drag.view.ymin);

    setView({
      xmin: drag.view.xmin - deltaX,
      xmax: drag.view.xmax - deltaX,
      ymin: drag.view.ymin + deltaY,
      ymax: drag.view.ymax + deltaY,
    });
  };

  const endDrag = () => {
    dragRef.current = null;
    setDragging(false);
  };

  const zoomAtCenter = (factor: number) => {
    setView((current) => {
      const centerX = (current.xmin + current.xmax) / 2;
      const centerY = (current.ymin + current.ymax) / 2;
      return {
        xmin: centerX - (centerX - current.xmin) * factor,
        xmax: centerX + (current.xmax - centerX) * factor,
        ymin: centerY - (centerY - current.ymin) * factor,
        ymax: centerY + (current.ymax - centerY) * factor,
      };
    });
  };

  return (
    <div className="space-y-6">
      <ToolLayout>
        <Panel
          description="Plot up to three functions of x. Scroll to zoom and drag the plot to pan."
          title="Functions and view"
        >
          <div className="space-y-3">
            <Field label="Functions of x">
              <div className="space-y-2">
                {expressions.map((expression, index) => (
                  <div key={index}>
                    <div className="flex items-center gap-2">
                      <span
                        aria-hidden
                        className="h-3 w-3 shrink-0 rounded-full border border-border"
                        style={{ backgroundColor: colors[index] ?? '#2f81f7' }}
                      />
                      <span className="w-4 shrink-0 font-mono text-xs text-fg-muted">
                        y{index + 1}
                      </span>
                      <Input
                        aria-label={`Function ${index + 1}`}
                        autoComplete="off"
                        className="font-mono"
                        onChange={(event) => {
                          const value = event.target.value;
                          setExpressions((current) =>
                            current.map((item, itemIndex) =>
                              itemIndex === index ? value : item
                            )
                          );
                        }}
                        placeholder={index === 0 ? 'sin(x)' : 'e.g. x^2 / 4'}
                        spellCheck={false}
                        value={expression}
                      />
                    </div>
                    {errors[index] && (
                      <p className="mt-1 pl-9 text-xs text-danger">
                        {errors[index]}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </Field>

            <RangeEditor onApply={setView} view={view} />

            <div className="flex flex-wrap gap-2">
              <Button onClick={() => zoomAtCenter(0.8)} size="sm">
                Zoom in
              </Button>
              <Button onClick={() => zoomAtCenter(1.25)} size="sm">
                Zoom out
              </Button>
              <Button
                onClick={() => {
                  setExpressions(['', '', '']);
                  setErrors({});
                }}
                size="sm"
                variant="ghost"
              >
                Clear functions
              </Button>
            </div>

            {compiled.length > 0 && (
              <div className="flex flex-wrap gap-3 rounded-md border border-border bg-canvas-inset p-3">
                {compiled.map((fn) => (
                  <span
                    className="flex items-center gap-1.5 font-mono text-xs text-fg-muted"
                    key={fn.index}
                  >
                    <span
                      aria-hidden
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: fn.color }}
                    />
                    y = {fn.label}
                  </span>
                ))}
              </div>
            )}

            <Callout variant="info">
              Curves are sampled once per pixel. Jump discontinuities such as{' '}
              <span className="font-mono">tan(x)</span> are split instead of
              being connected with a vertical line.
            </Callout>
          </div>
        </Panel>

        <Panel
          actions={
            <Button
              onClick={() => setView(initialView)}
              size="sm"
              variant="ghost"
            >
              Reset
            </Button>
          }
          bodyClassName="p-2"
          title="Plot"
        >
          <div
            className="overflow-hidden rounded-md border border-border bg-canvas-inset"
            ref={wrapRef}
          >
            <canvas
              aria-label="Graph of the entered functions"
              className="block touch-none select-none"
              height={Math.max(1, Math.floor(size.height * size.dpr))}
              onPointerCancel={endDrag}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={endDrag}
              ref={canvasRef}
              role="img"
              style={{
                cursor: dragging ? 'grabbing' : 'grab',
                height: `${size.height}px`,
                width: '100%',
              }}
              width={Math.max(1, Math.floor(size.width * size.dpr))}
            />
          </div>
          <p className="mt-2 px-2 text-[11px] text-fg-subtle">
            x ∈ [{formatTick(view.xmin, 0.001)}, {formatTick(view.xmax, 0.001)}]
            · y ∈ [{formatTick(view.ymin, 0.001)},{' '}
            {formatTick(view.ymax, 0.001)}]
          </p>
        </Panel>
      </ToolLayout>
    </div>
  );
}
