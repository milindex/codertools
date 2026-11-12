'use client';

import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { DownloadButton } from '@/components/ui/DownloadButton';
import { Field } from '@/components/ui/Field';
import { FileDropzone } from '@/components/ui/FileDropzone';
import { Input } from '@/components/ui/Input';
import { Panel } from '@/components/ui/Panel';
import { Textarea } from '@/components/ui/Textarea';
import { ToolLayout } from '@/components/ui/ToolLayout';

import {
  canvasToBlob,
  formatBytes,
  ImagePreview,
  loadImage,
  Stat,
  StatGrid,
  useObjectUrl,
} from './shared';

const SAMPLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160" width="240" height="160">
  <rect width="240" height="160" rx="16" fill="#0d1117"/>
  <circle cx="78" cy="80" r="42" fill="#2f81f7"/>
  <path d="M130 122 L164 46 L198 122 Z" fill="#3fb950"/>
</svg>`;

type Result = {
  blob: Blob;
  width: number;
  height: number;
};

const parseLength = (value: string | null) => {
  if (!value) {
    return 0;
  }
  const trimmed = value.trim();
  if (trimmed.endsWith('%')) {
    return 0;
  }
  const parsed = Number.parseFloat(trimmed);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

const parseSvg = (source: string) => {
  const document_ = new DOMParser().parseFromString(source, 'image/svg+xml');
  if (document_.querySelector('parsererror')) {
    throw new Error('The SVG markup could not be parsed.');
  }
  const root = document_.documentElement;
  if (!root || root.nodeName.toLowerCase() !== 'svg') {
    throw new Error('The input does not look like an SVG document.');
  }

  let baseWidth = 0;
  let baseHeight = 0;
  const viewBox = root.getAttribute('viewBox');
  if (viewBox) {
    const parts = viewBox
      .trim()
      .split(/[\s,]+/)
      .map(Number);
    if (parts.length === 4) {
      const parsedWidth = parts[2] ?? 0;
      const parsedHeight = parts[3] ?? 0;
      if (
        Number.isFinite(parsedWidth) &&
        Number.isFinite(parsedHeight) &&
        parsedWidth > 0 &&
        parsedHeight > 0
      ) {
        baseWidth = parsedWidth;
        baseHeight = parsedHeight;
      }
    }
  }
  if (!baseWidth) {
    baseWidth = parseLength(root.getAttribute('width')) || 300;
  }
  if (!baseHeight) {
    baseHeight = parseLength(root.getAttribute('height')) || 150;
  }

  root.setAttribute('width', String(baseWidth));
  root.setAttribute('height', String(baseHeight));
  if (!root.hasAttribute('xmlns')) {
    root.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  }

  return {
    width: baseWidth,
    height: baseHeight,
    markup: new XMLSerializer().serializeToString(document_),
  };
};

export default function SvgToPng() {
  const [svg, setSvg] = useState(SAMPLE_SVG);
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [scale, setScale] = useState('1');
  const [transparent, setTransparent] = useState(true);
  const [background, setBackground] = useState('#ffffff');
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previewUrl = useObjectUrl(result?.blob ?? null);

  const onFiles = async (files: File[]) => {
    const next = files[0];
    if (!next) {
      return;
    }
    if (
      !next.name.toLowerCase().endsWith('.svg') &&
      next.type !== 'image/svg+xml'
    ) {
      setError('Choose an .svg file or paste SVG markup.');
      return;
    }
    try {
      setSvg(await next.text());
      setError(null);
    } catch {
      setError('The SVG file could not be read.');
    }
  };

  useEffect(() => {
    if (!svg.trim()) {
      setResult(null);
      setError(null);
      return () => undefined;
    }

    let cancelled = false;
    const timer = setTimeout(() => {
      const run = async () => {
        setBusy(true);
        try {
          const parsed = parseSvg(svg);
          const scaleValue = Number(scale) > 0 ? Number(scale) : 1;
          const baseWidth = parsed.width * scaleValue;
          const baseHeight = parsed.height * scaleValue;
          const explicitWidth = Number(width) || 0;
          const explicitHeight = Number(height) || 0;

          let targetWidth = baseWidth;
          let targetHeight = baseHeight;
          if (explicitWidth > 0 && explicitHeight > 0) {
            targetWidth = explicitWidth;
            targetHeight = explicitHeight;
          } else if (explicitWidth > 0) {
            targetWidth = explicitWidth;
            targetHeight = explicitWidth * (baseHeight / baseWidth);
          } else if (explicitHeight > 0) {
            targetHeight = explicitHeight;
            targetWidth = explicitHeight * (baseWidth / baseHeight);
          }

          const outputWidth = Math.max(
            1,
            Math.min(8192, Math.round(targetWidth))
          );
          const outputHeight = Math.max(
            1,
            Math.min(8192, Math.round(targetHeight))
          );

          const svgBlob = new Blob([parsed.markup], {
            type: 'image/svg+xml;charset=utf-8',
          });
          const url = URL.createObjectURL(svgBlob);
          try {
            const image = await loadImage(url);
            if (cancelled) {
              return;
            }
            const canvas = document.createElement('canvas');
            canvas.width = outputWidth;
            canvas.height = outputHeight;
            const context = canvas.getContext('2d');
            if (!context) {
              throw new Error('Canvas is not supported in this browser.');
            }
            if (!transparent) {
              context.fillStyle = background;
              context.fillRect(0, 0, outputWidth, outputHeight);
            }
            context.imageSmoothingEnabled = true;
            context.imageSmoothingQuality = 'high';
            context.drawImage(image, 0, 0, outputWidth, outputHeight);
            const blob = await canvasToBlob(canvas, 'image/png');
            if (!cancelled) {
              setResult({ blob, width: outputWidth, height: outputHeight });
              setError(null);
            }
          } finally {
            URL.revokeObjectURL(url);
          }
        } catch (cause) {
          if (!cancelled) {
            setResult(null);
            setError(
              cause instanceof Error
                ? cause.message
                : 'Could not render this SVG.'
            );
          }
        } finally {
          if (!cancelled) {
            setBusy(false);
          }
        }
      };
      void run();
    }, 200);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [svg, width, height, scale, transparent, background]);

  return (
    <div className="space-y-4">
      <ToolLayout>
        <Panel
          actions={
            <Button
              onClick={() => {
                setSvg(SAMPLE_SVG);
                setWidth('');
                setHeight('');
                setScale('1');
              }}
              size="sm"
              variant="ghost"
            >
              Load sample
            </Button>
          }
          description="Paste markup or load an .svg file. External images and web fonts may not be embedded."
          title="SVG source"
        >
          <FileDropzone
            accept=".svg,image/svg+xml"
            hint="The file is read locally as text"
            label="Drop an SVG file here, or click to browse"
            onFiles={(files) => void onFiles(files)}
          />
          <div className="mt-3">
            <Field
              hint={`${svg.length.toLocaleString()} characters`}
              htmlFor="svg-source"
              label="SVG markup"
            >
              <Textarea
                id="svg-source"
                onChange={(event) => setSvg(event.target.value)}
                placeholder={'<svg xmlns="…">…</svg>'}
                spellCheck={false}
                value={svg}
              />
            </Field>
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel title="Output settings">
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <Field hint="auto" htmlFor="svg-width" label="Width (px)">
                  <Input
                    id="svg-width"
                    min={1}
                    onChange={(event) => setWidth(event.target.value)}
                    placeholder="auto"
                    type="number"
                    value={width}
                  />
                </Field>
                <Field hint="auto" htmlFor="svg-height" label="Height (px)">
                  <Input
                    id="svg-height"
                    min={1}
                    onChange={(event) => setHeight(event.target.value)}
                    placeholder="auto"
                    type="number"
                    value={height}
                  />
                </Field>
                <Field htmlFor="svg-scale" label="Scale">
                  <Input
                    id="svg-scale"
                    min={0.1}
                    onChange={(event) => setScale(event.target.value)}
                    step={0.1}
                    type="number"
                    value={scale}
                  />
                </Field>
              </div>

              <div className="flex flex-wrap items-end gap-4">
                <label className="flex items-center gap-2 text-xs font-medium text-fg">
                  <input
                    checked={transparent}
                    className="h-3.5 w-3.5 cursor-pointer accent-[var(--accent)]"
                    onChange={(event) => setTransparent(event.target.checked)}
                    type="checkbox"
                  />
                  Transparent background
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-fg">
                    Background
                  </span>
                  <input
                    aria-label="Background colour"
                    className="h-8 w-14 cursor-pointer rounded-md border border-border bg-canvas-inset p-1 disabled:opacity-50"
                    disabled={transparent}
                    onChange={(event) => setBackground(event.target.value)}
                    type="color"
                    value={background}
                  />
                  <span className="font-mono text-xs text-fg-muted">
                    {background}
                  </span>
                </div>
              </div>

              <p className="text-xs leading-5 text-fg-muted">
                Leave width and height empty to keep the SVG viewBox aspect
                ratio. The largest output is 8192 px per side.
              </p>
            </div>
          </Panel>

          <Panel
            actions={
              result && !busy ? (
                <DownloadButton
                  filename="converted-svg.png"
                  label="Download PNG"
                  mime="image/png"
                  value={result.blob}
                />
              ) : undefined
            }
            title="PNG result"
          >
            {result && previewUrl ? (
              <div className="space-y-3">
                <ImagePreview alt="Converted PNG preview" src={previewUrl} />
                <StatGrid>
                  <Stat
                    label="Dimensions"
                    value={`${result.width}×${result.height}`}
                  />
                  <Stat
                    label="File size"
                    value={formatBytes(result.blob.size)}
                  />
                  <Stat label="Format" value="PNG" />
                  <Stat
                    label="Background"
                    value={transparent ? 'transparent' : background}
                  />
                </StatGrid>
              </div>
            ) : error ? (
              <Callout title="Could not render SVG" variant="error">
                {error}
              </Callout>
            ) : (
              <div className="flex min-h-[240px] items-center justify-center rounded-md border border-dashed border-border bg-canvas-inset/50 p-4 text-center text-sm text-fg-muted">
                {busy ? 'Rendering PNG…' : 'Paste SVG markup to render a PNG.'}
              </div>
            )}
            {error && result && (
              <Callout className="mt-3" variant="error">
                {error}
              </Callout>
            )}
          </Panel>
        </div>
      </ToolLayout>
    </div>
  );
}
