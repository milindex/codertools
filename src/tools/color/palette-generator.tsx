'use client';

import { useMemo, useState } from 'react';

import { Callout } from '@/components/ui/Callout';
import { CodeBlock } from '@/components/ui/CodeBlock';
import { Panel } from '@/components/ui/Panel';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { ToolLayout } from '@/components/ui/ToolLayout';

import {
  clamp,
  ColorField,
  oklchHex,
  parseColor,
  round,
  SliderField,
  Swatch,
  toOklch,
} from './shared';

type HarmonyMode =
  'analogous' | 'complementary' | 'triadic' | 'tetradic' | 'monochromatic';

type VariationMode = 'both' | 'shades' | 'tints';

const HARMONY_OFFSETS: Record<HarmonyMode, number[]> = {
  analogous: [-40, -20, 0, 20, 40],
  complementary: [0, 180],
  triadic: [0, 120, 240],
  tetradic: [0, 90, 180, 270],
  monochromatic: [0],
};

const getLevels = (
  baseLightness: number,
  steps: number,
  variation: VariationMode
): number[] => {
  if (steps <= 1) {
    return [baseLightness];
  }

  const span = 0.28;
  const levels: number[] = [];

  for (let index = 0; index < steps; index += 1) {
    const progress = index / (steps - 1);

    if (variation === 'shades') {
      levels.push(clamp(baseLightness - span + progress * span, 0.04, 0.99));
    } else if (variation === 'tints') {
      levels.push(clamp(baseLightness + progress * span, 0.04, 0.99));
    } else {
      levels.push(
        clamp(baseLightness - span + progress * span * 2, 0.04, 0.99)
      );
    }
  }

  return levels;
};

export default function PaletteGenerator() {
  const [base, setBase] = useState('#6366f1');
  const [harmony, setHarmony] = useState<HarmonyMode>('analogous');
  const [variation, setVariation] = useState<VariationMode>('both');
  const [steps, setSteps] = useState(3);

  const parsed = useMemo(() => parseColor(base), [base]);
  const oklch = useMemo(() => (parsed ? toOklch(parsed) : null), [parsed]);

  const palette = useMemo(() => {
    if (!oklch) {
      return [];
    }

    const levels = getLevels(oklch.l, steps, variation);
    const offsets = HARMONY_OFFSETS[harmony];
    const items: Array<{
      color: string;
      hue: number;
      lightness: number;
      chroma: number;
    }> = [];

    offsets.forEach((offset) => {
      const hue = ((oklch.h ?? 0) + offset + 360) % 360;

      levels.forEach((level) => {
        const chroma =
          oklch.c * (0.55 + 0.45 * (1 - Math.abs(level - oklch.l) / 0.28));
        const color = oklchHex(level, chroma, hue);

        items.push({
          color,
          hue: round(hue, 0),
          lightness: round(level * 100, 0),
          chroma: round(chroma, 3),
        });
      });
    });

    return items;
  }, [oklch, harmony, steps, variation]);

  const cssVariables =
    palette.length > 0
      ? `:root {\n${palette
          .map(
            (item, index) =>
              `  --palette-${index + 1}: ${item.color.toUpperCase()};`
          )
          .join('\n')}\n}`
      : '/* Enter a valid base color to generate a palette. */';

  return (
    <div className="space-y-6">
      <ToolLayout>
        <Panel
          description="Pick a base color, a harmony rule and how many tints or shades to derive from each hue."
          title="Palette settings"
        >
          <div className="space-y-4">
            <ColorField
              hint={parsed ? 'Valid' : 'Invalid'}
              label="Base color"
              onChange={setBase}
              value={base}
            />

            <div>
              <p className="mb-1.5 text-xs font-semibold text-fg">Harmony</p>
              <SegmentedControl
                ariaLabel="Harmony mode"
                onChange={(value) => setHarmony(value as HarmonyMode)}
                options={[
                  { label: 'Analogous', value: 'analogous' },
                  { label: 'Complementary', value: 'complementary' },
                  { label: 'Triadic', value: 'triadic' },
                  { label: 'Tetradic', value: 'tetradic' },
                  { label: 'Mono', value: 'monochromatic' },
                ]}
                value={harmony}
              />
            </div>

            <div>
              <p className="mb-1.5 text-xs font-semibold text-fg">Variations</p>
              <SegmentedControl
                ariaLabel="Variation mode"
                onChange={(value) => setVariation(value as VariationMode)}
                options={[
                  { label: 'Shades + tints', value: 'both' },
                  { label: 'Shades only', value: 'shades' },
                  { label: 'Tints only', value: 'tints' },
                ]}
                value={variation}
              />
            </div>

            <SliderField
              label="Steps per hue"
              max={7}
              min={1}
              onChange={(value) => setSteps(Math.round(value))}
              unit=" steps"
              value={steps}
            />

            {!parsed && (
              <Callout variant="error">
                Enter a valid CSS color to generate a palette.
              </Callout>
            )}

            <p className="text-xs leading-5 text-fg-muted">
              {palette.length} swatches generated from{' '}
              {harmony === 'monochromatic'
                ? 'one hue'
                : `${HARMONY_OFFSETS[harmony].length} harmony hues`}
              . Colors are mixed in OKLCH so lightness stays perceptually even.
            </p>
          </div>
        </Panel>

        <Panel
          description="The generated palette, ready to use in a design system."
          title="Swatches"
        >
          {palette.length > 0 ? (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {palette.map((item, index) => (
                <Swatch
                  color={item.color}
                  key={`${item.hue}-${item.lightness}-${index}`}
                  label={item.color.toUpperCase()}
                  sublabel={`H${item.hue} · L${item.lightness}`}
                />
              ))}
            </div>
          ) : (
            <div className="flex min-h-[200px] items-center justify-center rounded-md border border-dashed border-border text-sm text-fg-muted">
              Enter a valid base color to see swatches.
            </div>
          )}
        </Panel>
      </ToolLayout>

      <CodeBlock code={cssVariables} filename="palette.css" language="css" />
    </div>
  );
}
