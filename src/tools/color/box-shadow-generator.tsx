'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { CodeBlock } from '@/components/ui/CodeBlock';
import { Panel } from '@/components/ui/Panel';
import { ToolLayout } from '@/components/ui/ToolLayout';

import {
  ColorField,
  hexWithAlpha,
  isValidColor,
  PreviewSurface,
  SliderField,
  ToggleField,
} from './shared';

type Shadow = {
  id: number;
  x: number;
  y: number;
  blur: number;
  spread: number;
  color: string;
  alpha: number;
  inset: boolean;
};

const createShadow = (id: number): Shadow => ({
  id,
  x: 0,
  y: 10,
  blur: 30,
  spread: 0,
  color: '#000000',
  alpha: 25,
  inset: false,
});

export default function BoxShadowGenerator() {
  const [shadows, setShadows] = useState<Shadow[]>([createShadow(1)]);

  const updateShadow = (id: number, patch: Partial<Shadow>) => {
    setShadows((previous) =>
      previous.map((shadow) =>
        shadow.id === id ? { ...shadow, ...patch } : shadow
      )
    );
  };

  const addShadow = () => {
    setShadows((previous) => {
      const lastId = previous[previous.length - 1]?.id ?? 0;
      return [...previous, createShadow(lastId + 1)];
    });
  };

  const removeShadow = (id: number) => {
    setShadows((previous) =>
      previous.length > 1
        ? previous.filter((shadow) => shadow.id !== id)
        : previous
    );
  };

  const shadowValues = shadows.map((shadow) => {
    const color = hexWithAlpha(shadow.color, shadow.alpha / 100);
    return `${shadow.inset ? 'inset ' : ''}${shadow.x}px ${shadow.y}px ${
      shadow.blur
    }px ${shadow.spread}px ${color}`;
  });

  const css = `box-shadow:\n  ${shadowValues.join(',\n  ')};`;
  const hasInvalidColor = shadows.some((shadow) => !isValidColor(shadow.color));

  return (
    <div className="space-y-6">
      <ToolLayout>
        <div className="space-y-4">
          {shadows.map((shadow, index) => (
            <Panel
              actions={
                shadows.length > 1 ? (
                  <Button
                    onClick={() => removeShadow(shadow.id)}
                    size="sm"
                    variant="danger"
                  >
                    Remove
                  </Button>
                ) : undefined
              }
              key={shadow.id}
              title={`Shadow ${index + 1}`}
            >
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <ColorField
                    label="Color"
                    onChange={(value) =>
                      updateShadow(shadow.id, { color: value })
                    }
                    value={shadow.color}
                  />
                  <SliderField
                    label="Opacity"
                    max={100}
                    min={0}
                    onChange={(value) =>
                      updateShadow(shadow.id, { alpha: value })
                    }
                    unit="%"
                    value={shadow.alpha}
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <SliderField
                    label="X offset"
                    max={100}
                    min={-100}
                    onChange={(value) => updateShadow(shadow.id, { x: value })}
                    unit="px"
                    value={shadow.x}
                  />
                  <SliderField
                    label="Y offset"
                    max={100}
                    min={-100}
                    onChange={(value) => updateShadow(shadow.id, { y: value })}
                    unit="px"
                    value={shadow.y}
                  />
                  <SliderField
                    label="Blur"
                    max={200}
                    min={0}
                    onChange={(value) =>
                      updateShadow(shadow.id, { blur: value })
                    }
                    unit="px"
                    value={shadow.blur}
                  />
                  <SliderField
                    label="Spread"
                    max={100}
                    min={-100}
                    onChange={(value) =>
                      updateShadow(shadow.id, { spread: value })
                    }
                    unit="px"
                    value={shadow.spread}
                  />
                </div>

                <ToggleField
                  checked={shadow.inset}
                  label="Inset shadow"
                  onChange={(checked) =>
                    updateShadow(shadow.id, { inset: checked })
                  }
                />
              </div>
            </Panel>
          ))}

          <Button onClick={addShadow} variant="primary">
            Add another shadow
          </Button>

          {hasInvalidColor && (
            <Callout variant="warning">
              One or more shadow colors are invalid. The preview falls back to
              black for those layers.
            </Callout>
          )}
        </div>

        <Panel
          description="Shadows are layered in list order. The first shadow is painted on top."
          title="Preview"
        >
          <PreviewSurface className="min-h-[360px] bg-canvas-subtle">
            <div
              className="flex h-48 w-full max-w-xs flex-col items-center justify-center rounded-xl bg-white px-6 text-center"
              style={{ boxShadow: shadowValues.join(', ') }}
            >
              <p className="text-sm font-semibold text-slate-900">
                Shadow preview
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Adjust the offsets, blur, spread and color to shape the shadow.
              </p>
            </div>
          </PreviewSurface>
        </Panel>
      </ToolLayout>

      <CodeBlock code={css} filename="box-shadow.css" language="css" />
    </div>
  );
}
