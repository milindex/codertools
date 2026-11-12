'use client';

import {
  filterDeficiencyDeuter,
  filterDeficiencyProt,
  filterDeficiencyTrit,
  filterGrayscale,
} from 'culori';
import { useMemo, useState } from 'react';

import { Callout } from '@/components/ui/Callout';
import { CodeBlock } from '@/components/ui/CodeBlock';
import { Panel } from '@/components/ui/Panel';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Textarea } from '@/components/ui/Textarea';
import { ToolLayout } from '@/components/ui/ToolLayout';

import {
  ColorField,
  parseColor,
  safeHex,
  SliderField,
  ValueRow,
} from './shared';

type Deficiency =
  'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia';

type Mode = 'single' | 'palette';

const DEFICIENCIES: Array<{ label: string; value: Deficiency }> = [
  { label: 'Protanopia', value: 'protanopia' },
  { label: 'Deuteranopia', value: 'deuteranopia' },
  { label: 'Tritanopia', value: 'tritanopia' },
  { label: 'Achromatopsia', value: 'achromatopsia' },
];

const simulate = (
  value: string,
  deficiency: Deficiency,
  severity: number
): string | null => {
  const parsed = parseColor(value);

  if (!parsed) {
    return null;
  }

  try {
    const filter =
      deficiency === 'protanopia'
        ? filterDeficiencyProt(severity)
        : deficiency === 'deuteranopia'
          ? filterDeficiencyDeuter(severity)
          : deficiency === 'tritanopia'
            ? filterDeficiencyTrit(severity)
            : filterGrayscale(severity);
    const result = filter(parsed);

    return result ? safeHex(result).toUpperCase() : null;
  } catch {
    return null;
  }
};

const DEFAULT_PALETTE = `#ef4444
#f97316
#eab308
#22c55e
#3b82f6
#8b5cf6`;

export default function ColorBlindnessSimulator() {
  const [mode, setMode] = useState<Mode>('single');
  const [color, setColor] = useState('#e11d48');
  const [palette, setPalette] = useState(DEFAULT_PALETTE);
  const [deficiency, setDeficiency] = useState<Deficiency>('protanopia');
  const [severityPercent, setSeverityPercent] = useState(100);

  const severity = severityPercent / 100;
  const parsed = useMemo(() => parseColor(color), [color]);
  const original = parsed ? safeHex(parsed).toUpperCase() : null;
  const simulated = useMemo(
    () => simulate(color, deficiency, severity),
    [color, deficiency, severity]
  );

  const allSimulations = useMemo(() => {
    if (!parsed) {
      return [];
    }

    return DEFICIENCIES.map((item) => ({
      ...item,
      color: simulate(color, item.value, severity),
    }));
  }, [parsed, color, severity]);

  const paletteResults = useMemo(() => {
    const values = palette
      .split(/[\n,]+/)
      .map((value) => value.trim())
      .filter(Boolean);

    return values.map((value) => ({
      value,
      original: parseColor(value) ? safeHex(value).toUpperCase() : null,
      simulated: simulate(value, deficiency, severity),
    }));
  }, [palette, deficiency, severity]);

  const invalidPaletteCount = paletteResults.filter(
    (item) => !item.original
  ).length;

  const activeLabel =
    DEFICIENCIES.find((item) => item.value === deficiency)?.label ?? deficiency;

  const report =
    mode === 'single'
      ? original
        ? `/* Original → ${activeLabel} (${severityPercent}%) */\n${original} → ${simulated ?? '—'}`
        : '/* Enter a valid color to see the simulation. */'
      : paletteResults.length > 0
        ? `/* Original → ${activeLabel} (${severityPercent}%) */\n${paletteResults
            .map(
              (item) =>
                `${item.original ?? 'invalid'} → ${item.simulated ?? '—'}`
            )
            .join('\n')}`
        : '/* Enter one or more colors to see the simulation. */';

  return (
    <div className="space-y-6">
      <ToolLayout>
        <Panel
          description="Simulate how colors appear with common color vision deficiencies."
          title="Simulation settings"
        >
          <div className="space-y-4">
            <SegmentedControl
              ariaLabel="Simulation input"
              onChange={(value) => setMode(value as Mode)}
              options={[
                { label: 'Single color', value: 'single' },
                { label: 'Palette', value: 'palette' },
              ]}
              value={mode}
            />

            {mode === 'single' ? (
              <ColorField
                hint={parsed ? 'Valid' : 'Invalid'}
                label="Color"
                onChange={setColor}
                value={color}
              />
            ) : (
              <div className="space-y-1.5">
                <label
                  className="text-xs font-semibold text-fg"
                  htmlFor="cvd-palette"
                >
                  Palette colors
                </label>
                <Textarea
                  id="cvd-palette"
                  onChange={(event) => setPalette(event.target.value)}
                  placeholder="One color per line, or comma separated"
                  rows={7}
                  value={palette}
                />
                <p className="text-[11px] text-fg-muted">
                  One color per line or comma separated.
                </p>
              </div>
            )}

            <div>
              <p className="mb-1.5 text-xs font-semibold text-fg">Deficiency</p>
              <SegmentedControl
                ariaLabel="Color vision deficiency"
                onChange={(value) => setDeficiency(value as Deficiency)}
                options={DEFICIENCIES.map((item) => ({
                  label: item.label,
                  value: item.value,
                }))}
                value={deficiency}
              />
            </div>

            <SliderField
              hint={`${severityPercent}%`}
              label="Severity"
              max={100}
              min={0}
              onChange={setSeverityPercent}
              unit="%"
              value={severityPercent}
            />

            {mode === 'single' && !parsed && (
              <Callout variant="error">
                Enter a valid CSS color to run the simulation.
              </Callout>
            )}

            {mode === 'palette' && invalidPaletteCount > 0 && (
              <Callout variant="warning">
                {invalidPaletteCount}{' '}
                {invalidPaletteCount === 1 ? 'value is' : 'values are'} not a
                valid CSS color and will be skipped in the preview.
              </Callout>
            )}
          </div>
        </Panel>

        <Panel
          description={
            mode === 'single'
              ? 'Compare the original color with the simulated result.'
              : 'Each row shows the original color and its simulated version.'
          }
          title="Preview"
        >
          {mode === 'single' ? (
            original ? (
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-fg-muted">
                      Original
                    </p>
                    <div
                      className="flex h-32 items-end rounded-md border border-border p-3 font-mono text-xs font-semibold text-white"
                      style={{
                        backgroundColor: original,
                        textShadow: '0 1px 3px rgba(0, 0, 0, 0.6)',
                      }}
                    >
                      {original}
                    </div>
                  </div>
                  <div>
                    <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-fg-muted">
                      {activeLabel}
                    </p>
                    <div
                      className="flex h-32 items-end rounded-md border border-border p-3 font-mono text-xs font-semibold text-white"
                      style={{
                        backgroundColor: simulated ?? original,
                        textShadow: '0 1px 3px rgba(0, 0, 0, 0.6)',
                      }}
                    >
                      {simulated ?? '—'}
                    </div>
                  </div>
                </div>

                <ValueRow
                  label={`Simulated · ${activeLabel}`}
                  value={simulated ?? '—'}
                />

                <div>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-fg-muted">
                    All deficiencies at {severityPercent}%
                  </p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {allSimulations.map((item) => (
                      <div
                        className="overflow-hidden rounded-md border border-border"
                        key={item.value}
                      >
                        <div
                          className="h-14 w-full"
                          style={{
                            backgroundColor: item.color ?? original,
                          }}
                        />
                        <div className="px-2 py-1.5">
                          <p className="truncate text-[10px] font-semibold text-fg">
                            {item.label}
                          </p>
                          <p className="truncate font-mono text-[9px] text-fg-muted">
                            {item.color ?? '—'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex min-h-[220px] items-center justify-center rounded-md border border-dashed border-border text-sm text-fg-muted">
                Enter a valid color to see the simulation.
              </div>
            )
          ) : paletteResults.length > 0 ? (
            <div className="space-y-2">
              {paletteResults.map((item, index) => (
                <div
                  className="flex items-center gap-2 rounded-md border border-border bg-canvas-inset p-1.5"
                  key={`${item.value}-${index}`}
                >
                  <div
                    className="h-10 w-14 shrink-0 rounded border border-black/10"
                    style={{ backgroundColor: item.original ?? 'transparent' }}
                    title={item.original ?? 'Invalid color'}
                  />
                  <span className="shrink-0 text-fg-subtle">→</span>
                  <div
                    className="h-10 w-14 shrink-0 rounded border border-black/10"
                    style={{ backgroundColor: item.simulated ?? 'transparent' }}
                    title={item.simulated ?? 'Invalid color'}
                  />
                  <div className="min-w-0 flex-1 pl-1">
                    <p className="truncate font-mono text-[11px] text-fg">
                      {item.original ?? 'Invalid'}
                    </p>
                    <p className="truncate font-mono text-[11px] text-fg-muted">
                      {item.simulated ?? '—'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex min-h-[220px] items-center justify-center rounded-md border border-dashed border-border text-sm text-fg-muted">
              Add colors to the palette to see the simulation.
            </div>
          )}
        </Panel>
      </ToolLayout>

      <CodeBlock code={report} filename="color-blindness.txt" language="text" />
    </div>
  );
}
