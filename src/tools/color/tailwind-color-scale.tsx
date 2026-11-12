'use client';

import { useMemo, useState } from 'react';

import { Callout } from '@/components/ui/Callout';
import { CodeBlock } from '@/components/ui/CodeBlock';
import { Input } from '@/components/ui/Input';
import { Panel } from '@/components/ui/Panel';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { ToolLayout } from '@/components/ui/ToolLayout';

import {
  clamp,
  ColorField,
  oklchHex,
  parseColor,
  Swatch,
  toOklch,
} from './shared';

const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

const LIGHTNESS_RAMP = [
  0.971, 0.936, 0.885, 0.808, 0.704, 0.606, 0.518, 0.443, 0.379, 0.325, 0.282,
];

const CHROMA_FACTORS = [
  0.18, 0.28, 0.45, 0.68, 0.88, 1, 0.97, 0.88, 0.75, 0.64, 0.55,
];

type OutputMode = 'css' | 'theme' | 'config';

export default function TailwindColorScale() {
  const [base, setBase] = useState('#3b82f6');
  const [name, setName] = useState('brand');
  const [outputMode, setOutputMode] = useState<OutputMode>('css');

  const parsed = useMemo(() => parseColor(base), [base]);
  const oklch = useMemo(() => (parsed ? toOklch(parsed) : null), [parsed]);

  const scale = useMemo(() => {
    if (!oklch) {
      return [];
    }

    const baseLightness = oklch.l;
    const delta = baseLightness - 0.606;
    const hue = oklch.h ?? 0;

    return STEPS.map((step, index) => {
      const target = LIGHTNESS_RAMP[index] ?? baseLightness;
      const influence = 1 - (Math.abs(index - 5) / 5) * 0.35;
      const lightness = clamp(target + delta * influence, 0.045, 0.985);
      const chroma = clamp(oklch.c * (CHROMA_FACTORS[index] ?? 1), 0, 0.37);
      const color = oklchHex(lightness, chroma, hue);

      return { step, color };
    });
  }, [oklch]);

  const slug =
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-_]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'brand';
  const safeSlug = /^[0-9]/.test(slug) ? `c-${slug}` : slug;

  const cssOutput =
    scale.length > 0
      ? `:root {\n${scale
          .map(
            (item) =>
              `  --${safeSlug}-${item.step}: ${item.color.toLowerCase()};`
          )
          .join('\n')}\n}`
      : '/* Enter a valid base color to generate a scale. */';

  const themeOutput =
    scale.length > 0
      ? `@theme {\n${scale
          .map(
            (item) =>
              `  --color-${safeSlug}-${item.step}: ${item.color.toLowerCase()};`
          )
          .join('\n')}\n}`
      : '/* Enter a valid base color to generate a scale. */';

  const configOutput =
    scale.length > 0
      ? `/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        '${safeSlug}': {
${scale
  .map((item) => `          ${item.step}: '${item.color.toLowerCase()}',`)
  .join('\n')}
        },
      },
    },
  },
};`
      : '// Enter a valid base color to generate a scale.';

  const code =
    outputMode === 'theme'
      ? themeOutput
      : outputMode === 'config'
        ? configOutput
        : cssOutput;

  const filename =
    outputMode === 'theme'
      ? 'theme.css'
      : outputMode === 'config'
        ? 'tailwind.config.js'
        : 'colors.css';

  return (
    <div className="space-y-6">
      <ToolLayout>
        <Panel
          description="Pick a brand color and a name. The scale is generated in OKLCH with a consistent lightness ramp."
          title="Scale settings"
        >
          <div className="space-y-4">
            <ColorField
              hint={parsed ? 'Valid' : 'Invalid'}
              label="Base color"
              onChange={setBase}
              value={base}
            />

            <div className="space-y-1.5">
              <label
                className="text-xs font-semibold text-fg"
                htmlFor="tailwind-color-name"
              >
                Color name
              </label>
              <Input
                id="tailwind-color-name"
                onChange={(event) => setName(event.target.value)}
                placeholder="brand"
                value={name}
              />
              <p className="text-[11px] text-fg-muted">
                Used as <code>{`--${safeSlug}-500`}</code>.
              </p>
            </div>

            <div>
              <p className="mb-1.5 text-xs font-semibold text-fg">Output</p>
              <SegmentedControl
                ariaLabel="Output format"
                onChange={(value) => setOutputMode(value as OutputMode)}
                options={[
                  { label: 'CSS vars', value: 'css' },
                  { label: 'Tailwind v4', value: 'theme' },
                  { label: 'Config', value: 'config' },
                ]}
                value={outputMode}
              />
            </div>

            {!parsed && (
              <Callout variant="error">
                Enter a valid CSS color to generate a Tailwind scale.
              </Callout>
            )}
          </div>
        </Panel>

        <Panel
          description="Every step from 50 to 950. Use the output below in CSS or Tailwind."
          title="Color scale"
        >
          {scale.length > 0 ? (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {scale.map((item) => (
                <Swatch
                  color={item.color}
                  key={item.step}
                  label={item.step}
                  sublabel={item.color.toUpperCase()}
                />
              ))}
            </div>
          ) : (
            <div className="flex min-h-[200px] items-center justify-center rounded-md border border-dashed border-border text-sm text-fg-muted">
              Enter a valid base color to see the scale.
            </div>
          )}
        </Panel>
      </ToolLayout>

      <CodeBlock
        code={code}
        filename={filename}
        language={outputMode === 'config' ? 'js' : 'css'}
      />
    </div>
  );
}
