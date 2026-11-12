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
} from './shared';

type TextShadow = {
  id: number;
  x: number;
  y: number;
  blur: number;
  color: string;
  alpha: number;
};

const createShadow = (id: number): TextShadow => ({
  id,
  x: 0,
  y: 2,
  blur: 4,
  color: '#000000',
  alpha: 60,
});

export default function TextShadowGenerator() {
  const [shadows, setShadows] = useState<TextShadow[]>([createShadow(1)]);
  const [textColor, setTextColor] = useState('#f8fafc');
  const [backgroundColor, setBackgroundColor] = useState('#0f172a');
  const [fontSize, setFontSize] = useState(48);

  const updateShadow = (id: number, patch: Partial<TextShadow>) => {
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
    return `${shadow.x}px ${shadow.y}px ${shadow.blur}px ${color}`;
  });

  const css = `text-shadow:\n  ${shadowValues.join(',\n  ')};`;
  const hasInvalidColor =
    !isValidColor(textColor) ||
    shadows.some((shadow) => !isValidColor(shadow.color));

  return (
    <div className="space-y-6">
      <ToolLayout>
        <div className="space-y-4">
          <Panel title="Canvas">
            <div className="grid gap-3 sm:grid-cols-2">
              <ColorField
                label="Text color"
                onChange={setTextColor}
                value={textColor}
              />
              <ColorField
                label="Background"
                onChange={setBackgroundColor}
                value={backgroundColor}
              />
              <SliderField
                className="sm:col-span-2"
                label="Font size"
                max={96}
                min={16}
                onChange={setFontSize}
                unit="px"
                value={fontSize}
              />
            </div>
          </Panel>

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
              title={`Shadow layer ${index + 1}`}
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
                  <SliderField
                    label="X offset"
                    max={40}
                    min={-40}
                    onChange={(value) => updateShadow(shadow.id, { x: value })}
                    unit="px"
                    value={shadow.x}
                  />
                  <SliderField
                    label="Y offset"
                    max={40}
                    min={-40}
                    onChange={(value) => updateShadow(shadow.id, { y: value })}
                    unit="px"
                    value={shadow.y}
                  />
                  <SliderField
                    className="sm:col-span-2"
                    label="Blur"
                    max={80}
                    min={0}
                    onChange={(value) =>
                      updateShadow(shadow.id, { blur: value })
                    }
                    unit="px"
                    value={shadow.blur}
                  />
                </div>
              </div>
            </Panel>
          ))}

          <Button onClick={addShadow} variant="primary">
            Add another layer
          </Button>

          {hasInvalidColor && (
            <Callout variant="warning">
              One or more colors are invalid. The preview falls back to black
              for those values.
            </Callout>
          )}
        </div>

        <Panel title="Preview">
          <PreviewSurface className="min-h-[360px]" style={{ backgroundColor }}>
            <p
              className="max-w-full break-words px-4 text-center font-bold leading-tight"
              style={{
                color: textColor,
                fontSize: `${fontSize}px`,
                textShadow: shadowValues.join(', '),
              }}
            >
              Text shadow
            </p>
          </PreviewSurface>
        </Panel>
      </ToolLayout>

      <CodeBlock code={css} filename="text-shadow.css" language="css" />
    </div>
  );
}
