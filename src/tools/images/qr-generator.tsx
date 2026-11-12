'use client';

import { Download } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Panel } from '@/components/ui/Panel';
import { Select } from '@/components/ui/Select';
import { ToolLayout } from '@/components/ui/ToolLayout';

import {
  dataUrlToBlob,
  downloadBlob,
  formatBytes,
  Stat,
  StatGrid,
} from './shared';

const ERROR_LEVELS = [
  { value: 'L', label: 'L — low (~7%)' },
  { value: 'M', label: 'M — medium (~15%)' },
  { value: 'Q', label: 'Q — quartile (~25%)' },
  { value: 'H', label: 'H — high (~30%)' },
];

export default function QrGenerator() {
  const [text, setText] = useState('https://example.com');
  const [size, setSize] = useState('320');
  const [margin, setMargin] = useState('2');
  const [level, setLevel] = useState('M');
  const [foreground, setForeground] = useState('#000000');
  const [background, setBackground] = useState('#ffffff');
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!text.trim()) {
      setDataUrl(null);
      setError(null);
      setBusy(false);
      return () => undefined;
    }

    let cancelled = false;
    const timer = setTimeout(() => {
      const run = async () => {
        setBusy(true);
        try {
          const qrcode = await import('qrcode');
          const outputSize = Math.min(
            2048,
            Math.max(64, Math.round(Number(size) || 320))
          );
          const outputMargin = Math.min(
            16,
            Math.max(0, Math.round(Number(margin) || 0))
          );
          const url = await qrcode.toDataURL(text, {
            width: outputSize,
            margin: outputMargin,
            errorCorrectionLevel: level as 'L' | 'M' | 'Q' | 'H',
            color: { dark: foreground, light: background },
            type: 'image/png',
          });
          if (!cancelled) {
            setDataUrl(url);
            setError(null);
          }
        } catch (cause) {
          if (!cancelled) {
            setDataUrl(null);
            setError(
              cause instanceof Error && cause.message
                ? cause.message
                : 'The QR code could not be generated. Try shorter text or a lower error correction level.'
            );
          }
        } finally {
          if (!cancelled) {
            setBusy(false);
          }
        }
      };
      void run();
    }, 180);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [text, size, margin, level, foreground, background]);

  const download = async () => {
    if (!dataUrl) {
      return;
    }
    try {
      const blob = await dataUrlToBlob(dataUrl);
      downloadBlob(blob, 'qr-code.png');
    } catch {
      setError('The PNG could not be downloaded.');
    }
  };

  const lowContrast = foreground.toLowerCase() === background.toLowerCase();
  const outputSize = Math.min(
    2048,
    Math.max(64, Math.round(Number(size) || 320))
  );
  const outputMargin = Math.min(
    16,
    Math.max(0, Math.round(Number(margin) || 0))
  );

  return (
    <div className="space-y-4">
      <ToolLayout>
        <Panel title="QR code settings">
          <div className="space-y-4">
            <Field
              hint={`${text.length} characters`}
              htmlFor="qr-text"
              label="Text or URL"
            >
              <Input
                id="qr-text"
                onChange={(event) => setText(event.target.value)}
                placeholder="https://example.com"
                value={text}
              />
            </Field>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field hint="64–2048 px" htmlFor="qr-size" label="Size (px)">
                <Input
                  id="qr-size"
                  max={2048}
                  min={64}
                  onChange={(event) => setSize(event.target.value)}
                  step={8}
                  type="number"
                  value={size}
                />
              </Field>
              <Field
                hint="quiet zone in modules"
                htmlFor="qr-margin"
                label="Margin"
              >
                <Input
                  id="qr-margin"
                  max={16}
                  min={0}
                  onChange={(event) => setMargin(event.target.value)}
                  type="number"
                  value={margin}
                />
              </Field>
            </div>

            <Field htmlFor="qr-level" label="Error correction">
              <Select
                id="qr-level"
                onChange={(event) => setLevel(event.target.value)}
                value={level}
              >
                {ERROR_LEVELS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </Field>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field htmlFor="qr-foreground" label="Foreground">
                <div className="flex items-center gap-2">
                  <input
                    aria-label="Foreground colour"
                    className="h-8 w-14 cursor-pointer rounded-md border border-border bg-canvas-inset p-1"
                    id="qr-foreground"
                    onChange={(event) => setForeground(event.target.value)}
                    type="color"
                    value={foreground}
                  />
                  <span className="font-mono text-xs text-fg-muted">
                    {foreground}
                  </span>
                </div>
              </Field>
              <Field htmlFor="qr-background" label="Background">
                <div className="flex items-center gap-2">
                  <input
                    aria-label="Background colour"
                    className="h-8 w-14 cursor-pointer rounded-md border border-border bg-canvas-inset p-1"
                    id="qr-background"
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

            {lowContrast && (
              <Callout variant="warning">
                Foreground and background are identical. The code will not be
                scannable.
              </Callout>
            )}
            {error && (
              <Callout variant="error" title="QR code error">
                {error}
              </Callout>
            )}
            <p className="text-xs leading-5 text-fg-muted">
              The PNG includes the quiet-zone margin. Use the highest error
              correction level that still fits your content.
            </p>
          </div>
        </Panel>

        <Panel
          actions={
            dataUrl ? (
              <Button
                onClick={() => void download()}
                size="sm"
                variant="primary"
              >
                <Download aria-hidden className="h-3.5 w-3.5" />
                Download PNG
              </Button>
            ) : undefined
          }
          title="Preview"
        >
          {dataUrl ? (
            <div className="space-y-3">
              <div className="flex items-center justify-center rounded-md border border-border bg-white p-4">
                {}
                <img
                  alt="Generated QR code"
                  className="h-auto max-h-[360px] w-auto max-w-full"
                  src={dataUrl}
                />
              </div>
              <StatGrid>
                <Stat label="Size" value={`${outputSize} px`} />
                <Stat label="Error correction" value={level} />
                <Stat
                  label="PNG (approx.)"
                  value={formatBytes(
                    Math.floor(((dataUrl.split(',')[1] ?? '').length * 3) / 4)
                  )}
                />
                <Stat label="Margin" value={`${outputMargin} modules`} />
              </StatGrid>
              <p className="text-xs text-fg-muted">
                Copy the image, or use the download button to save the PNG.
              </p>
            </div>
          ) : (
            <div className="flex min-h-[260px] items-center justify-center rounded-md border border-dashed border-border bg-canvas-inset/50 p-4 text-center text-sm text-fg-muted">
              {busy
                ? 'Generating QR code…'
                : 'Enter text or a URL to generate a QR code.'}
            </div>
          )}
        </Panel>
      </ToolLayout>
    </div>
  );
}
