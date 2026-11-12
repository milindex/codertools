'use client';

import { useState } from 'react';

import { CodeBlock } from '@/components/ui/CodeBlock';
import { Panel } from '@/components/ui/Panel';
import { ToolLayout } from '@/components/ui/ToolLayout';

import { PreviewSurface, SliderField, ToggleField } from './shared';

type Corner = 'tl' | 'tr' | 'br' | 'bl';

type Corners = Record<Corner, number>;

const CORNER_LABELS: Array<{ key: Corner; label: string }> = [
  { key: 'tl', label: 'Top left' },
  { key: 'tr', label: 'Top right' },
  { key: 'br', label: 'Bottom right' },
  { key: 'bl', label: 'Bottom left' },
];

const uniform = (value: number): Corners => ({
  tl: value,
  tr: value,
  br: value,
  bl: value,
});

export default function BorderRadiusGenerator() {
  const [horizontal, setHorizontal] = useState<Corners>(uniform(24));
  const [vertical, setVertical] = useState<Corners>(uniform(24));
  const [linked, setLinked] = useState(true);
  const [elliptical, setElliptical] = useState(false);

  const updateHorizontal = (corner: Corner, value: number) => {
    setHorizontal((previous) =>
      linked ? uniform(value) : { ...previous, [corner]: value }
    );
  };

  const updateVertical = (corner: Corner, value: number) => {
    setVertical((previous) =>
      linked ? uniform(value) : { ...previous, [corner]: value }
    );
  };

  const horizontalText = `${horizontal.tl}px ${horizontal.tr}px ${horizontal.br}px ${horizontal.bl}px`;
  const verticalText = `${vertical.tl}px ${vertical.tr}px ${vertical.br}px ${vertical.bl}px`;
  const allHorizontalEqual =
    horizontal.tl === horizontal.tr &&
    horizontal.tr === horizontal.br &&
    horizontal.br === horizontal.bl;
  const allVerticalEqual =
    vertical.tl === vertical.tr &&
    vertical.tr === vertical.br &&
    vertical.br === vertical.bl;

  const radius = elliptical
    ? allHorizontalEqual && allVerticalEqual
      ? `${horizontal.tl}px / ${vertical.tl}px`
      : `${horizontalText} / ${verticalText}`
    : allHorizontalEqual
      ? `${horizontal.tl}px`
      : horizontalText;

  const css = `border-radius: ${radius};`;

  return (
    <div className="space-y-6">
      <ToolLayout>
        <Panel
          description="Use linked corners for a uniform radius, or unlink them for a custom shape."
          title="Radius controls"
        >
          <div className="space-y-4">
            <div className="grid gap-2 sm:grid-cols-2">
              <ToggleField
                checked={linked}
                label="Link all corners"
                onChange={setLinked}
              />
              <ToggleField
                checked={elliptical}
                hint="slashes"
                label="Elliptical corners"
                onChange={setElliptical}
              />
            </div>

            {linked ? (
              <div className="space-y-3">
                <SliderField
                  label="Horizontal radius"
                  max={150}
                  min={0}
                  onChange={(value) => updateHorizontal('tl', value)}
                  unit="px"
                  value={horizontal.tl}
                />
                {elliptical && (
                  <SliderField
                    label="Vertical radius"
                    max={150}
                    min={0}
                    onChange={(value) => updateVertical('tl', value)}
                    unit="px"
                    value={vertical.tl}
                  />
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  {CORNER_LABELS.map((corner) => (
                    <SliderField
                      key={corner.key}
                      label={corner.label}
                      max={150}
                      min={0}
                      onChange={(value) => updateHorizontal(corner.key, value)}
                      unit="px"
                      value={horizontal[corner.key]}
                    />
                  ))}
                </div>

                {elliptical && (
                  <div>
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-fg-muted">
                      Vertical radii
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {CORNER_LABELS.map((corner) => (
                        <SliderField
                          key={corner.key}
                          label={corner.label}
                          max={150}
                          min={0}
                          onChange={(value) =>
                            updateVertical(corner.key, value)
                          }
                          unit="px"
                          value={vertical[corner.key]}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <p className="text-xs leading-5 text-fg-muted">
              Elliptical corners use the <code>horizontal / vertical</code>{' '}
              syntax to create asymmetric curves.
            </p>
          </div>
        </Panel>

        <Panel title="Preview">
          <PreviewSurface className="min-h-[360px] bg-canvas-subtle">
            <div
              className="h-56 w-full max-w-xs border border-white/20"
              style={{
                backgroundImage:
                  'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)',
                borderRadius: radius,
              }}
            />
          </PreviewSurface>
        </Panel>
      </ToolLayout>

      <CodeBlock code={css} filename="border-radius.css" language="css" />
    </div>
  );
}
