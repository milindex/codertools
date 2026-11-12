'use client';

import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Callout } from '@/components/ui/Callout';
import { CodeBlock } from '@/components/ui/CodeBlock';
import { CopyButton } from '@/components/ui/CopyButton';
import { Field } from '@/components/ui/Field';
import { FileDropzone } from '@/components/ui/FileDropzone';
import { Panel } from '@/components/ui/Panel';
import { ToolLayout } from '@/components/ui/ToolLayout';

import {
  formatBytes,
  ImagePreview,
  loadImageFile,
  Stat,
  StatGrid,
  useObjectUrl,
} from './shared';

type Sample = {
  data: Uint8ClampedArray;
  width: number;
  height: number;
};

type Swatch = {
  hex: string;
  red: number;
  green: number;
  blue: number;
  count: number;
};

const toHex = (red: number, green: number, blue: number) =>
  `#${[red, green, blue]
    .map((channel) => channel.toString(16).padStart(2, '0'))
    .join('')}`;

const distance = (a: Swatch, b: Omit<Swatch, 'hex' | 'count'>) =>
  Math.abs(a.red - b.red) +
  Math.abs(a.green - b.green) +
  Math.abs(a.blue - b.blue);

const extractPalette = (sample: Sample, maxColors: number) => {
  const buckets = new Map<
    number,
    { red: number; green: number; blue: number; count: number }
  >();
  let total = 0;

  for (let index = 0; index < sample.data.length; index += 4) {
    const alpha = sample.data[index + 3] ?? 0;
    if (alpha < 125) {
      continue;
    }
    const red = sample.data[index] ?? 0;
    const green = sample.data[index + 1] ?? 0;
    const blue = sample.data[index + 2] ?? 0;
    const key = ((red >> 4) << 8) | ((green >> 4) << 4) | (blue >> 4);
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.red += red;
      bucket.green += green;
      bucket.blue += blue;
      bucket.count += 1;
    } else {
      buckets.set(key, { red, green, blue, count: 1 });
    }
    total += 1;
  }

  const sorted = [...buckets.values()].sort((a, b) => b.count - a.count);
  const palette: Swatch[] = [];

  for (const bucket of sorted) {
    const red = Math.round(bucket.red / bucket.count);
    const green = Math.round(bucket.green / bucket.count);
    const blue = Math.round(bucket.blue / bucket.count);
    const candidate = {
      red,
      green,
      blue,
      hex: toHex(red, green, blue),
      count: bucket.count,
    };
    if (palette.some((entry) => distance(entry, candidate) < 36)) {
      continue;
    }
    palette.push(candidate);
    if (palette.length >= maxColors) {
      break;
    }
  }

  return { palette, total };
};

export default function ColorExtractor() {
  const [file, setFile] = useState<File | null>(null);
  const [sample, setSample] = useState<Sample | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [count, setCount] = useState(8);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sourceUrl = useObjectUrl(file);

  const extracted = useMemo(
    () => (sample ? extractPalette(sample, count) : null),
    [sample, count]
  );

  const css = useMemo(() => {
    if (!extracted) {
      return '';
    }
    const lines = extracted.palette.map(
      (swatch, index) => `  --color-${index + 1}: ${swatch.hex};`
    );
    return `:root {\n${lines.join('\n')}\n}\n`;
  }, [extracted]);

  const onFiles = async (files: File[]) => {
    const next = files[0];
    if (!next) {
      return;
    }
    if (!next.type.startsWith('image/')) {
      setError('Choose an image file such as PNG, JPEG or WebP.');
      setFile(null);
      setSample(null);
      return;
    }
    setError(null);
    setSample(null);
    setBusy(true);
    try {
      const image = await loadImageFile(next);
      const width = image.naturalWidth || image.width;
      const height = image.naturalHeight || image.height;
      const scale = Math.min(1, 240 / Math.max(width, height));
      const sampledWidth = Math.max(1, Math.round(width * scale));
      const sampledHeight = Math.max(1, Math.round(height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = sampledWidth;
      canvas.height = sampledHeight;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      if (!context) {
        throw new Error('Canvas is not supported in this browser.');
      }
      context.drawImage(image, 0, 0, sampledWidth, sampledHeight);
      const data = context.getImageData(0, 0, sampledWidth, sampledHeight).data;
      setFile(next);
      setDimensions({ width, height });
      setSample({ data, width: sampledWidth, height: sampledHeight });
    } catch (cause) {
      setFile(null);
      setSample(null);
      setError(
        cause instanceof Error
          ? cause.message
          : 'Could not read pixels from this image.'
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <ToolLayout>
        <div className="space-y-4">
          <Panel title="Image">
            <FileDropzone
              accept="image/*"
              hint="Pixels are sampled locally — nothing is uploaded"
              label={
                file ? 'Drop a different image, or click to browse' : undefined
              }
              onFiles={(files) => void onFiles(files)}
            />
            {file && sourceUrl && (
              <div className="mt-3 space-y-3">
                <ImagePreview alt="Palette source preview" src={sourceUrl} />
                <div className="flex flex-wrap items-center gap-2 text-xs text-fg-muted">
                  <Badge variant="accent">{file.type || 'image'}</Badge>
                  <span className="truncate font-medium text-fg">
                    {file.name}
                  </span>
                  <span>{formatBytes(file.size)}</span>
                </div>
              </div>
            )}
            {error && (
              <Callout className="mt-3" variant="error">
                {error}
              </Callout>
            )}
          </Panel>

          <Panel title="Palette settings">
            <Field
              hint={`${count} colours`}
              htmlFor="palette-count"
              label="Number of colours"
            >
              <input
                aria-label="Number of colours"
                className="h-2 w-full cursor-pointer accent-[var(--accent)]"
                id="palette-count"
                max={16}
                min={3}
                onChange={(event) => setCount(Number(event.target.value))}
                type="range"
                value={count}
              />
            </Field>
            <p className="mt-3 text-xs leading-5 text-fg-muted">
              Colours are grouped into 12-bit RGB buckets and averaged, so the
              result is stable across similar photos. Transparent pixels are
              ignored.
            </p>
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel title="Extracted palette">
            {busy ? (
              <div className="flex min-h-[240px] items-center justify-center rounded-md border border-dashed border-border bg-canvas-inset/50 text-sm text-fg-muted">
                Sampling pixels…
              </div>
            ) : extracted && extracted.palette.length > 0 ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {extracted.palette.map((swatch) => (
                    <div
                      className="overflow-hidden rounded-md border border-border bg-canvas-subtle/40"
                      key={swatch.hex}
                    >
                      <div
                        aria-hidden
                        className="h-16 w-full"
                        style={{ backgroundColor: swatch.hex }}
                      />
                      <div className="space-y-1 p-2">
                        <p className="font-mono text-[11px] font-semibold text-fg">
                          {swatch.hex}
                        </p>
                        <p className="text-[10px] text-fg-muted">
                          {((swatch.count / extracted.total) * 100).toFixed(1)}%
                        </p>
                        <CopyButton
                          className="px-1"
                          label="Copy"
                          value={swatch.hex}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <StatGrid>
                  <Stat
                    label="Image"
                    value={`${dimensions.width}×${dimensions.height}`}
                  />
                  <Stat
                    label="Sampled"
                    value={`${sample?.width ?? 0}×${sample?.height ?? 0}`}
                  />
                  <Stat
                    label="Opaque pixels"
                    value={extracted.total.toLocaleString()}
                  />
                  <Stat label="Colours" value={extracted.palette.length} />
                </StatGrid>
              </div>
            ) : sample ? (
              <Callout variant="warning">
                No opaque pixels were found. This image may be fully
                transparent.
              </Callout>
            ) : (
              <div className="flex min-h-[240px] items-center justify-center rounded-md border border-dashed border-border bg-canvas-inset/50 p-4 text-center text-sm text-fg-muted">
                Choose an image to extract its dominant colours.
              </div>
            )}
          </Panel>

          {css && (
            <Panel title="CSS variables">
              <CodeBlock code={css} filename="palette.css" language="css" />
            </Panel>
          )}
        </div>
      </ToolLayout>
    </div>
  );
}
