'use client';

import { converter, formatHex, formatHex8 } from 'culori';
import { useMemo, useState } from 'react';

import { Callout } from '@/components/ui/Callout';
import { CodeBlock } from '@/components/ui/CodeBlock';
import { Panel } from '@/components/ui/Panel';
import { ToolLayout } from '@/components/ui/ToolLayout';

import {
  ColorField,
  parseColor,
  PreviewSurface,
  rgba,
  round,
  SliderField,
  ValueRow,
} from './shared';

type Formats = {
  hex: string;
  rgb: string;
  hsl: string;
  hwb: string;
  lch: string;
  oklch: string;
};

export default function ColorConverter() {
  const [input, setInput] = useState('#3b82f6');
  const [alphaPercent, setAlphaPercent] = useState(100);

  const parsed = useMemo(() => parseColor(input), [input]);
  const alpha = alphaPercent / 100;

  const formats = useMemo<Formats | null>(() => {
    if (!parsed) {
      return null;
    }

    try {
      const rgb = converter('rgb')(parsed);
      const hsl = converter('hsl')(parsed);
      const hwb = converter('hwb')(parsed);
      const lch = converter('lch')(parsed);
      const oklch = converter('oklch')(parsed);

      const r = Math.round(rgb.r * 255);
      const g = Math.round(rgb.g * 255);
      const b = Math.round(rgb.b * 255);
      const h = round(hsl.h ?? 0, 1);
      const s = round(hsl.s * 100, 1);
      const l = round(hsl.l * 100, 1);
      const hwbH = round(hwb.h ?? 0, 1);
      const w = round(hwb.w * 100, 1);
      const bl = round(hwb.b * 100, 1);
      const alphaText = round(alpha, 3);

      const rgbValue =
        alpha < 1
          ? `rgba(${r}, ${g}, ${b}, ${alphaText})`
          : `rgb(${r}, ${g}, ${b})`;
      const hslValue =
        alpha < 1
          ? `hsla(${h}, ${s}%, ${l}%, ${alphaText})`
          : `hsl(${h}, ${s}%, ${l}%)`;
      const hwbValue = `hwb(${hwbH} ${w}% ${bl}%${
        alpha < 1 ? ` / ${alphaText}` : ''
      })`;
      const lchValue = `lch(${round(lch.l, 1)}% ${round(lch.c, 1)} ${round(
        lch.h ?? 0,
        1
      )}${alpha < 1 ? ` / ${alphaText}` : ''})`;
      const oklchValue = `oklch(${round(oklch.l * 100, 1)}% ${round(
        oklch.c,
        3
      )} ${round(oklch.h ?? 0, 1)}${alpha < 1 ? ` / ${alphaText}` : ''})`;

      const hexSource =
        alpha < 1
          ? formatHex8({
              mode: 'rgb',
              r: rgb.r,
              g: rgb.g,
              b: rgb.b,
              alpha,
            })
          : formatHex(parsed);

      return {
        hex: (hexSource ?? '#000000').toUpperCase(),
        rgb: rgbValue,
        hsl: hslValue,
        hwb: hwbValue,
        lch: lchValue,
        oklch: oklchValue,
      };
    } catch {
      return null;
    }
  }, [parsed, alpha]);

  const cssVariables = formats
    ? `:root {
  --color-hex: ${formats.hex};
  --color-rgb: ${formats.rgb};
  --color-hsl: ${formats.hsl};
  --color-hwb: ${formats.hwb};
  --color-lch: ${formats.lch};
  --color-oklch: ${formats.oklch};
}`
    : '';

  return (
    <div className="space-y-6">
      <ToolLayout>
        <Panel
          description="Type any CSS color, or use the picker. Values update as you type."
          title="Color"
        >
          <div className="space-y-4">
            <ColorField
              hint={parsed ? 'Valid color' : 'Invalid color'}
              label="Input color"
              onChange={setInput}
              value={input}
            />

            <SliderField
              label="Opacity"
              max={100}
              min={0}
              onChange={setAlphaPercent}
              unit="%"
              value={alphaPercent}
            />

            <PreviewSurface className="min-h-[160px]">
              <div
                className="flex h-32 w-full items-center justify-center rounded-md border border-black/10 font-mono text-sm font-semibold text-white shadow-inner"
                style={{
                  backgroundColor:
                    parsed && formats ? rgba(parsed, alpha) : 'transparent',
                  textShadow: '0 1px 3px rgba(0, 0, 0, 0.55)',
                }}
              >
                {formats?.hex ?? 'Invalid color'}
              </div>
            </PreviewSurface>

            {!parsed && (
              <Callout variant="error">
                Could not parse that color. Try a HEX, RGB, HSL, HWB, LCH,
                OKLCH, or CSS named color.
              </Callout>
            )}
          </div>
        </Panel>

        <Panel
          description="Each format can be copied independently."
          title="Equivalent values"
        >
          <div className="space-y-2">
            <ValueRow label="HEX" value={formats?.hex ?? '—'} />
            <ValueRow label="RGB" value={formats?.rgb ?? '—'} />
            <ValueRow label="HSL" value={formats?.hsl ?? '—'} />
            <ValueRow label="HWB" value={formats?.hwb ?? '—'} />
            <ValueRow label="LCH" value={formats?.lch ?? '—'} />
            <ValueRow label="OKLCH" value={formats?.oklch ?? '—'} />
          </div>
        </Panel>
      </ToolLayout>

      <CodeBlock
        code={
          cssVariables || '/* Enter a valid color to generate CSS variables. */'
        }
        filename="color-values.css"
        language="css"
      />
    </div>
  );
}
