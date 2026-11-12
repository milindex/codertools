'use client';

import type { JsBarcodeOptions } from 'jsbarcode';
import { Download } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { DownloadButton } from '@/components/ui/DownloadButton';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Panel } from '@/components/ui/Panel';
import { Select } from '@/components/ui/Select';
import { ToolLayout } from '@/components/ui/ToolLayout';

import { canvasToBlob, downloadBlob, Stat, StatGrid } from './shared';

type BarcodeFormat = 'CODE128' | 'EAN13';
type Normalized = { value: string } | { error: string };

const eanCheckDigit = (firstTwelve: string) => {
  let sum = 0;
  for (let index = 0; index < 12; index += 1) {
    sum += Number(firstTwelve.charAt(index)) * (index % 2 === 0 ? 1 : 3);
  }
  return (10 - (sum % 10)) % 10;
};

const loadJsBarcode = async () => {
  const module_ = await import('jsbarcode');
  return module_.default ?? (module_ as unknown as typeof module_.default);
};

const normalize = (format: BarcodeFormat, raw: string): Normalized => {
  if (format === 'CODE128') {
    const value = raw.trim();
    if (!value) {
      return { error: 'Enter a value to encode.' };
    }
    if (!/^[\x20-\x7e]+$/.test(value)) {
      return { error: 'Code128 supports printable ASCII characters only.' };
    }
    if (value.length > 100) {
      return { error: 'Keep Code128 values under 100 characters.' };
    }
    return { value };
  }

  const digits = raw.replace(/[\s-]/g, '');
  if (!/^\d{12,13}$/.test(digits)) {
    return {
      error:
        'EAN-13 needs 12 digits (the check digit is added) or 13 digits with a valid check digit.',
    };
  }
  if (digits.length === 12) {
    return { value: `${digits}${eanCheckDigit(digits)}` };
  }
  const expected = eanCheckDigit(digits);
  if (Number(digits.charAt(12)) !== expected) {
    return {
      error: `The check digit is ${digits.charAt(
        12
      )} but this EAN-13 number requires ${expected}.`,
    };
  }
  return { value: digits };
};

export default function BarcodeGenerator() {
  const [format, setFormat] = useState<BarcodeFormat>('CODE128');
  const [value, setValue] = useState('123456789012');
  const [foreground, setForeground] = useState('#000000');
  const [background, setBackground] = useState('#ffffff');
  const [barWidth, setBarWidth] = useState('2');
  const [barHeight, setBarHeight] = useState('100');
  const [displayValue, setDisplayValue] = useState(true);
  const [svgMarkup, setSvgMarkup] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const svgRef = useRef<SVGSVGElement>(null);

  const options = useMemo<JsBarcodeOptions>(
    () => ({
      format,
      lineColor: foreground,
      background,
      width: Math.min(4, Math.max(1, Number(barWidth) || 2)),
      height: Math.min(240, Math.max(40, Number(barHeight) || 100)),
      displayValue,
      fontSize: 16,
      margin: 8,
    }),
    [format, foreground, background, barWidth, barHeight, displayValue]
  );

  const normalized = useMemo(() => normalize(format, value), [format, value]);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) {
      return () => undefined;
    }

    while (svg.firstChild) {
      svg.removeChild(svg.firstChild);
    }
    setSvgMarkup('');

    if ('error' in normalized) {
      setError(normalized.error);
      setBusy(false);
      return () => undefined;
    }

    setError(null);
    let cancelled = false;
    const timer = setTimeout(() => {
      const run = async () => {
        setBusy(true);
        try {
          const JsBarcode = await loadJsBarcode();
          if (cancelled) {
            return;
          }
          JsBarcode(svg, normalized.value, options);
          if (!cancelled) {
            setSvgMarkup(svg.outerHTML);
            setError(null);
          }
        } catch (cause) {
          if (!cancelled) {
            setSvgMarkup('');
            setError(
              cause instanceof Error && cause.message
                ? cause.message
                : 'This value cannot be encoded in the selected format.'
            );
          }
        } finally {
          if (!cancelled) {
            setBusy(false);
          }
        }
      };
      void run();
    }, 120);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [normalized, options]);

  const downloadPng = async () => {
    if ('error' in normalized) {
      return;
    }
    try {
      const JsBarcode = await loadJsBarcode();
      const canvas = document.createElement('canvas');
      JsBarcode(canvas, normalized.value, options);
      const blob = await canvasToBlob(canvas, 'image/png');
      downloadBlob(blob, `barcode-${format.toLowerCase()}.png`);
    } catch {
      setError('The PNG could not be created in this browser.');
    }
  };

  return (
    <div className="space-y-4">
      <ToolLayout>
        <Panel title="Barcode settings">
          <div className="space-y-4">
            <Field htmlFor="barcode-format" label="Format">
              <Select
                id="barcode-format"
                onChange={(event) =>
                  setFormat(event.target.value as BarcodeFormat)
                }
                value={format}
              >
                <option value="CODE128">Code 128</option>
                <option value="EAN13">EAN-13</option>
              </Select>
            </Field>

            <Field
              hint={
                format === 'EAN13'
                  ? '12 digits + auto check digit, or 13 digits'
                  : 'Printable ASCII, up to 100 characters'
              }
              htmlFor="barcode-value"
              label="Value"
            >
              <Input
                id="barcode-value"
                onChange={(event) => setValue(event.target.value)}
                placeholder={format === 'EAN13' ? '123456789012' : 'Hello 123'}
                value={value}
              />
            </Field>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                hint="1–4"
                htmlFor="barcode-bar-width"
                label="Module width"
              >
                <Input
                  id="barcode-bar-width"
                  max={4}
                  min={1}
                  onChange={(event) => setBarWidth(event.target.value)}
                  type="number"
                  value={barWidth}
                />
              </Field>
              <Field
                hint="40–240 px"
                htmlFor="barcode-height"
                label="Bar height"
              >
                <Input
                  id="barcode-height"
                  max={240}
                  min={40}
                  onChange={(event) => setBarHeight(event.target.value)}
                  type="number"
                  value={barHeight}
                />
              </Field>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field htmlFor="barcode-foreground" label="Bar colour">
                <div className="flex items-center gap-2">
                  <input
                    aria-label="Bar colour"
                    className="h-8 w-14 cursor-pointer rounded-md border border-border bg-canvas-inset p-1"
                    id="barcode-foreground"
                    onChange={(event) => setForeground(event.target.value)}
                    type="color"
                    value={foreground}
                  />
                  <span className="font-mono text-xs text-fg-muted">
                    {foreground}
                  </span>
                </div>
              </Field>
              <Field htmlFor="barcode-background" label="Background">
                <div className="flex items-center gap-2">
                  <input
                    aria-label="Background colour"
                    className="h-8 w-14 cursor-pointer rounded-md border border-border bg-canvas-inset p-1"
                    id="barcode-background"
                    onChange={(event) => setBackground(event.target.value)}
                    type="color"
                    value={background}
                  />
                  <span className="font-mono text-xs text-fg-muted">
                    {background}
                  </span>
                </div>
              </Field>
            </div>

            <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-fg">
              <input
                checked={displayValue}
                className="h-3.5 w-3.5 cursor-pointer accent-[var(--accent)]"
                onChange={(event) => setDisplayValue(event.target.checked)}
                type="checkbox"
              />
              Show value under the bars
            </label>

            {error && (
              <Callout variant="error" title="Cannot encode this value">
                {error}
              </Callout>
            )}

            {format === 'EAN13' && !('error' in normalized) && (
              <p className="text-xs leading-5 text-fg-muted">
                Encoded as{' '}
                <span className="font-mono font-semibold text-fg">
                  {normalized.value}
                </span>
                .
              </p>
            )}
          </div>
        </Panel>

        <Panel
          actions={
            svgMarkup ? (
              <>
                <DownloadButton
                  filename={`barcode-${format.toLowerCase()}.svg`}
                  label="SVG"
                  mime="image/svg+xml"
                  value={svgMarkup}
                />
                <Button
                  onClick={() => void downloadPng()}
                  size="sm"
                  variant="primary"
                >
                  <Download aria-hidden className="h-3.5 w-3.5" />
                  PNG
                </Button>
              </>
            ) : undefined
          }
          title="Preview"
        >
          <div className="flex min-h-[260px] flex-col items-center justify-center gap-3 rounded-md border border-border bg-white p-4">
            <svg
              aria-label="Barcode preview"
              className="h-auto w-auto max-w-full"
              ref={svgRef}
              role="img"
            />
            {!svgMarkup && (
              <p className="text-sm text-fg-muted">
                {busy
                  ? 'Rendering barcode…'
                  : error
                    ? 'Fix the value to render a barcode.'
                    : 'Enter a value to render a barcode.'}
              </p>
            )}
          </div>

          {svgMarkup && (
            <div className="mt-3 space-y-3">
              <StatGrid>
                <Stat
                  label="Format"
                  value={format === 'EAN13' ? 'EAN-13' : 'Code 128'}
                />
                <Stat
                  label="Encoded"
                  value={'error' in normalized ? '—' : normalized.value}
                />
                <Stat
                  label="Module width"
                  value={`${Math.min(4, Math.max(1, Number(barWidth) || 2))} px`}
                />
                <Stat
                  label="Bar height"
                  value={`${Math.min(240, Math.max(40, Number(barHeight) || 100))} px`}
                />
              </StatGrid>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={format === 'EAN13' ? 'accent' : 'success'}>
                  {format === 'EAN13' ? 'EAN-13' : 'Code 128'}
                </Badge>
                <span className="text-xs text-fg-muted">
                  Download the SVG for crisp printing or the PNG for quick
                  sharing.
                </span>
              </div>
            </div>
          )}
        </Panel>
      </ToolLayout>
    </div>
  );
}
