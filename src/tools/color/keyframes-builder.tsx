'use client';

import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { CodeBlock } from '@/components/ui/CodeBlock';
import { Input } from '@/components/ui/Input';
import { Panel } from '@/components/ui/Panel';
import { Select } from '@/components/ui/Select';
import { ToolLayout } from '@/components/ui/ToolLayout';

import { PreviewSurface, SliderField } from './shared';

type Step = {
  id: number;
  offset: number;
  translateX: number;
  translateY: number;
  scale: number;
  rotate: number;
  opacity: number;
};

type Direction = 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';
type FillModeOption = 'none' | 'forwards' | 'backwards' | 'both';

const createStep = (id: number, offset: number): Step => ({
  id,
  offset,
  translateX: 0,
  translateY: 0,
  scale: 1,
  rotate: 0,
  opacity: 100,
});

const transformFor = (step: Step) =>
  `translateX(${step.translateX}px) translateY(${step.translateY}px) scale(${step.scale}) rotate(${step.rotate}deg)`;

export default function KeyframesBuilder() {
  const [name, setName] = useState('float');
  const [duration, setDuration] = useState(1200);
  const [delay, setDelay] = useState(0);
  const [timing, setTiming] = useState('ease-in-out');
  const [iterations, setIterations] = useState('infinite');
  const [direction, setDirection] = useState<Direction>('normal');
  const [fill, setFill] = useState<FillModeOption>('both');

  const [steps, setSteps] = useState<Step[]>([
    { ...createStep(1, 0), translateY: 0 },
    { ...createStep(2, 100), translateY: -24, scale: 1.08 },
  ]);

  const previewRef = useRef<HTMLDivElement | null>(null);
  const animationRef = useRef<Animation | null>(null);

  useEffect(
    () => () => {
      animationRef.current?.cancel();
    },
    []
  );

  const safeName =
    name
      .trim()
      .replace(/[^a-zA-Z0-9-_]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'animation';

  const sortedSteps = steps.slice().sort((a, b) => a.offset - b.offset);

  const keyframesCss = sortedSteps
    .map(
      (step) => `  ${step.offset}% {
    transform: ${transformFor(step)};
    opacity: ${step.opacity / 100};
  }`
    )
    .join('\n');

  const css = `@keyframes ${safeName} {
${keyframesCss}
}

.animated-element {
  animation: ${safeName} ${duration}ms ${timing} ${delay}ms ${iterations} ${direction} ${fill};
}`;

  const updateStep = (id: number, patch: Partial<Step>) => {
    setSteps((previous) =>
      previous.map((step) => (step.id === id ? { ...step, ...patch } : step))
    );
  };

  const addStep = () => {
    setSteps((previous) => {
      const lastId = previous[previous.length - 1]?.id ?? 0;
      return [...previous, createStep(lastId + 1, 50)];
    });
  };

  const removeStep = (id: number) => {
    setSteps((previous) =>
      previous.length > 2 ? previous.filter((step) => step.id !== id) : previous
    );
  };

  const play = () => {
    const element = previewRef.current;

    if (!element) {
      return;
    }

    animationRef.current?.cancel();

    const frames: Keyframe[] = sortedSteps.map((step) => ({
      offset: step.offset / 100,
      transform: transformFor(step),
      opacity: step.opacity / 100,
    }));

    try {
      animationRef.current = element.animate(frames, {
        duration,
        delay,
        easing: timing,
        iterations: iterations === 'infinite' ? Infinity : Number(iterations),
        direction,
        fill,
      });
    } catch {
      animationRef.current = null;
    }
  };

  return (
    <div className="space-y-6">
      <ToolLayout>
        <div className="space-y-4">
          <Panel title="Animation settings">
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label
                  className="text-xs font-semibold text-fg"
                  htmlFor="keyframes-name"
                >
                  Animation name
                </label>
                <Input
                  id="keyframes-name"
                  onChange={(event) => setName(event.target.value)}
                  placeholder="float"
                  value={name}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <SliderField
                  label="Duration"
                  max={5000}
                  min={100}
                  onChange={setDuration}
                  step={50}
                  unit="ms"
                  value={duration}
                />
                <SliderField
                  label="Delay"
                  max={2000}
                  min={0}
                  onChange={setDelay}
                  step={50}
                  unit="ms"
                  value={delay}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label
                    className="text-xs font-semibold text-fg"
                    htmlFor="keyframes-timing"
                  >
                    Timing function
                  </label>
                  <Select
                    id="keyframes-timing"
                    onChange={(event) => setTiming(event.target.value)}
                    value={timing}
                  >
                    <option value="ease">ease</option>
                    <option value="linear">linear</option>
                    <option value="ease-in">ease-in</option>
                    <option value="ease-out">ease-out</option>
                    <option value="ease-in-out">ease-in-out</option>
                    <option value="step-start">step-start</option>
                    <option value="step-end">step-end</option>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label
                    className="text-xs font-semibold text-fg"
                    htmlFor="keyframes-iterations"
                  >
                    Iterations
                  </label>
                  <Select
                    id="keyframes-iterations"
                    onChange={(event) => setIterations(event.target.value)}
                    value={iterations}
                  >
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="5">5</option>
                    <option value="infinite">infinite</option>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label
                    className="text-xs font-semibold text-fg"
                    htmlFor="keyframes-direction"
                  >
                    Direction
                  </label>
                  <Select
                    id="keyframes-direction"
                    onChange={(event) =>
                      setDirection(event.target.value as Direction)
                    }
                    value={direction}
                  >
                    <option value="normal">normal</option>
                    <option value="reverse">reverse</option>
                    <option value="alternate">alternate</option>
                    <option value="alternate-reverse">alternate-reverse</option>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label
                    className="text-xs font-semibold text-fg"
                    htmlFor="keyframes-fill"
                  >
                    Fill mode
                  </label>
                  <Select
                    id="keyframes-fill"
                    onChange={(event) =>
                      setFill(event.target.value as FillModeOption)
                    }
                    value={fill}
                  >
                    <option value="none">none</option>
                    <option value="forwards">forwards</option>
                    <option value="backwards">backwards</option>
                    <option value="both">both</option>
                  </Select>
                </div>
              </div>
            </div>
          </Panel>

          <Panel
            actions={
              <Button onClick={addStep} size="sm" variant="default">
                Add step
              </Button>
            }
            description="Each step is written to the generated @keyframes in offset order."
            title="Timeline steps"
          >
            <div className="space-y-3">
              {sortedSteps.map((step, index) => (
                <div
                  className="rounded-md border border-border bg-canvas-subtle p-3"
                  key={step.id}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-fg">
                      Step {index + 1} · {step.offset}%
                    </span>
                    <Button
                      disabled={steps.length <= 2}
                      onClick={() => removeStep(step.id)}
                      size="sm"
                      variant="ghost"
                    >
                      Remove
                    </Button>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    <SliderField
                      label="Offset"
                      max={100}
                      min={0}
                      onChange={(value) =>
                        updateStep(step.id, { offset: value })
                      }
                      unit="%"
                      value={step.offset}
                    />
                    <SliderField
                      label="Opacity"
                      max={100}
                      min={0}
                      onChange={(value) =>
                        updateStep(step.id, { opacity: value })
                      }
                      unit="%"
                      value={step.opacity}
                    />
                    <SliderField
                      label="Translate X"
                      max={100}
                      min={-100}
                      onChange={(value) =>
                        updateStep(step.id, { translateX: value })
                      }
                      unit="px"
                      value={step.translateX}
                    />
                    <SliderField
                      label="Translate Y"
                      max={100}
                      min={-100}
                      onChange={(value) =>
                        updateStep(step.id, { translateY: value })
                      }
                      unit="px"
                      value={step.translateY}
                    />
                    <SliderField
                      label="Scale"
                      max={3}
                      min={0}
                      onChange={(value) =>
                        updateStep(step.id, { scale: value })
                      }
                      step={0.05}
                      value={step.scale}
                    />
                    <SliderField
                      label="Rotate"
                      max={360}
                      min={-360}
                      onChange={(value) =>
                        updateStep(step.id, { rotate: value })
                      }
                      unit="deg"
                      value={step.rotate}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <Panel
          actions={
            <Button onClick={play} size="sm" variant="primary">
              Play
            </Button>
          }
          description="Click Play to run the animation with the Web Animations API."
          title="Preview"
        >
          <PreviewSurface className="min-h-[360px] bg-canvas-subtle">
            <div
              className="h-24 w-24 rounded-2xl bg-gradient-to-br from-accent to-done shadow-lg"
              ref={previewRef}
            />
          </PreviewSurface>
        </Panel>
      </ToolLayout>

      <CodeBlock code={css} filename="keyframes.css" language="css" />
    </div>
  );
}
