'use client';

import { wcagContrast } from 'culori';
import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { CodeBlock } from '@/components/ui/CodeBlock';
import { Panel } from '@/components/ui/Panel';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { ToolLayout } from '@/components/ui/ToolLayout';

import {
  ColorField,
  oklchHex,
  parseColor,
  PreviewSurface,
  round,
  safeHex,
  toOklch,
} from './shared';

type Suggestion = {
  hex: string;
  ratio: number;
  passes: boolean;
};

const getSuggestion = (
  foreground: string,
  background: string,
  target: number
): Suggestion | null => {
  const oklch = toOklch(foreground);

  if (!oklch) {
    return null;
  }

  let bestPass: { hex: string; ratio: number; delta: number } | null = null;
  let bestOverall: { hex: string; ratio: number; delta: number } | null = null;

  for (let step = 0; step <= 100; step += 1) {
    const lightness = step / 100;
    const candidate = oklchHex(lightness, oklch.c, oklch.h ?? 0);
    const parsed = parseColor(candidate);

    if (!parsed) {
      continue;
    }

    const ratio = wcagContrast(parsed, background);
    const delta = Math.abs(lightness - oklch.l);
    const entry = { hex: candidate.toUpperCase(), ratio, delta };

    if (!bestOverall || ratio > bestOverall.ratio) {
      bestOverall = entry;
    }

    if (ratio >= target && (!bestPass || delta < bestPass.delta)) {
      bestPass = entry;
    }
  }

  const chosen = bestPass ?? bestOverall;

  if (!chosen) {
    return null;
  }

  return {
    hex: chosen.hex,
    ratio: chosen.ratio,
    passes: Boolean(bestPass),
  };
};

export default function ContrastChecker() {
  const [foreground, setForeground] = useState('#1f2937');
  const [background, setBackground] = useState('#ffffff');
  const [target, setTarget] = useState('4.5');

  const fgColor = useMemo(() => parseColor(foreground), [foreground]);
  const bgColor = useMemo(() => parseColor(background), [background]);

  const ratio = useMemo(() => {
    if (!fgColor || !bgColor) {
      return null;
    }

    try {
      return wcagContrast(fgColor, bgColor);
    } catch {
      return null;
    }
  }, [fgColor, bgColor]);

  const numericTarget = Number(target);

  const suggestion = useMemo(() => {
    if (!fgColor || !bgColor) {
      return null;
    }

    return getSuggestion(foreground, background, numericTarget);
  }, [fgColor, bgColor, foreground, background, numericTarget]);

  const checks = [
    { label: 'AA · normal text', required: 4.5 },
    { label: 'AA · large text', required: 3 },
    { label: 'AAA · normal text', required: 7 },
    { label: 'AAA · large text', required: 4.5 },
  ];

  const invalid = !fgColor || !bgColor;
  const ratioText = ratio === null ? '—' : `${round(ratio, 2)}:1`;
  const safeFg = safeHex(fgColor);
  const safeBg = safeHex(bgColor);

  return (
    <div className="space-y-6">
      <ToolLayout>
        <Panel
          description="Pick the text color and the background it sits on."
          title="Colors"
        >
          <div className="space-y-4">
            <ColorField
              hint={fgColor ? 'Valid' : 'Invalid'}
              label="Foreground (text)"
              onChange={setForeground}
              value={foreground}
            />
            <ColorField
              hint={bgColor ? 'Valid' : 'Invalid'}
              label="Background"
              onChange={setBackground}
              value={background}
            />

            <Button
              onClick={() => {
                setForeground(background);
                setBackground(foreground);
              }}
              size="sm"
              variant="default"
            >
              Swap colors
            </Button>

            <div className="rounded-md border border-border bg-canvas-inset p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-fg-muted">
                Contrast ratio
              </p>
              <p className="mt-1 font-mono text-3xl font-bold text-fg">
                {ratioText}
              </p>
              <div className="mt-3">
                <SegmentedControl
                  ariaLabel="Suggestion target"
                  onChange={setTarget}
                  options={[
                    { label: 'AA (4.5:1)', value: '4.5' },
                    { label: 'AAA (7:1)', value: '7' },
                  ]}
                  value={target}
                />
              </div>
            </div>

            {invalid && (
              <Callout variant="error">
                Enter valid CSS colors for both the foreground and the
                background.
              </Callout>
            )}
          </div>
        </Panel>

        <Panel
          description="The preview uses the selected colors and shows both WCAG text sizes."
          title="Preview"
        >
          <PreviewSurface
            className="min-h-[300px] items-stretch"
            style={{ backgroundColor: safeBg }}
          >
            <div
              className="flex w-full flex-col justify-center gap-5 px-2"
              style={{ color: safeFg }}
            >
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest opacity-60">
                  Normal text · 16px
                </p>
                <p className="mt-1 text-base leading-7">
                  The quick brown fox jumps over the lazy dog. Pack my box with
                  five dozen liquor jugs.
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest opacity-60">
                  Large text · 24px bold
                </p>
                <p className="mt-1 text-2xl font-bold leading-9">
                  Sphinx of black quartz, judge my vow.
                </p>
              </div>
            </div>
          </PreviewSurface>

          <div className="mt-4 space-y-2">
            {checks.map((check) => {
              const passes = ratio !== null && ratio >= check.required;

              return (
                <div
                  className="flex items-center justify-between gap-3 rounded-md border border-border bg-canvas-inset px-3 py-2"
                  key={check.label}
                >
                  <span className="text-xs text-fg">{check.label}</span>
                  <span className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-fg-muted">
                      ≥ {check.required}:1
                    </span>
                    <Badge variant={passes ? 'success' : 'danger'}>
                      {passes ? 'Pass' : 'Fail'}
                    </Badge>
                  </span>
                </div>
              );
            })}
          </div>
        </Panel>
      </ToolLayout>

      <Panel
        description="The nearest lightness change that reaches the selected target while keeping the original hue and chroma."
        title="Suggested fix"
      >
        {suggestion && fgColor ? (
          <div className="flex flex-wrap items-center gap-4">
            <span
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md border border-border font-mono text-[10px] font-semibold text-white"
              style={{
                backgroundColor: suggestion.hex,
                textShadow: '0 1px 3px rgba(0, 0, 0, 0.6)',
              }}
            >
              Aa
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-mono text-sm font-semibold text-fg">
                {suggestion.hex}
              </p>
              <p className="text-xs text-fg-muted">
                {suggestion.passes
                  ? `Reaches ${round(suggestion.ratio, 2)}:1 against the background.`
                  : `Best available contrast is ${round(
                      suggestion.ratio,
                      2
                    )}:1. No color can reach ${numericTarget}:1 against this background.`}
              </p>
            </div>
            <Button
              onClick={() => setForeground(suggestion.hex)}
              size="sm"
              variant="primary"
            >
              Apply suggestion
            </Button>
          </div>
        ) : (
          <p className="text-sm text-fg-muted">
            Enter valid colors to calculate a suggested fix.
          </p>
        )}
      </Panel>

      <CodeBlock
        code={`/* WCAG contrast report */
/* Foreground: ${safeFg} */
/* Background: ${safeBg} */
/* Ratio: ${ratioText} */
/* AA normal: ${ratio !== null && ratio >= 4.5 ? 'pass' : 'fail'} */
/* AA large:  ${ratio !== null && ratio >= 3 ? 'pass' : 'fail'} */
/* AAA normal: ${ratio !== null && ratio >= 7 ? 'pass' : 'fail'} */
/* AAA large:  ${ratio !== null && ratio >= 4.5 ? 'pass' : 'fail'} */

.accessible-text {
  color: ${suggestion?.hex.toLowerCase() ?? safeFg};
  background-color: ${safeBg};
}`}
        filename="contrast.css"
        language="css"
      />
    </div>
  );
}
