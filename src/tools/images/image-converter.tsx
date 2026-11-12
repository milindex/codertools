'use client';

import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Callout } from '@/components/ui/Callout';
import { DownloadButton } from '@/components/ui/DownloadButton';
import { Field } from '@/components/ui/Field';
import { FileDropzone } from '@/components/ui/FileDropzone';
import { Panel } from '@/components/ui/Panel';
import { Select } from '@/components/ui/Select';
import { ToolLayout } from '@/components/ui/ToolLayout';

import type { ImageFormat } from './shared';
import {
  canvasToBlob,
  extensionFor,
  formatBytes,
  formatPercent,
  IMAGE_FORMATS,
  ImagePreview,
  loadImageFile,
  Stat,
  StatGrid,
  supportsImageType,
  useObjectUrl,
} from './shared';

type Source = {
  image: HTMLImageElement;
  width: number;
  height: number;
};

type Result = {
  blob: Blob;
  width: number;
  height: number;
};

const baseName = (name: string) => name.replace(/\.[^.]+$/, '') || 'image';

export default function ImageConverter() {
  const [file, setFile] = useState<File | null>(null);
  const [source, setSource] = useState<Source | null>(null);
  const [format, setFormat] = useState<ImageFormat>('image/png');
  const [quality, setQuality] = useState(90);
  const [support, setSupport] = useState<Record<string, boolean>>({});
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sourceUrl = useObjectUrl(file);
  const previewUrl = useObjectUrl(result?.blob ?? null);

  useEffect(() => {
    let active = true;
    void (async () => {
      const entries = await Promise.all(
        IMAGE_FORMATS.map(
          async (option) =>
            [option.value, await supportsImageType(option.value)] as const
        )
      );
      if (active) {
        setSupport(Object.fromEntries(entries));
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (support[format] === false) {
      setFormat('image/png');
    }
  }, [support, format]);

  const onFiles = async (files: File[]) => {
    const next = files[0];
    if (!next) {
      return;
    }
    if (!next.type.startsWith('image/')) {
      setFile(null);
      setSource(null);
      setResult(null);
      setError('Choose an image file such as PNG, JPEG, WebP or AVIF.');
      return;
    }
    setError(null);
    setResult(null);
    setBusy(true);
    try {
      const image = await loadImageFile(next);
      setFile(next);
      setSource({
        image,
        width: image.naturalWidth || image.width,
        height: image.naturalHeight || image.height,
      });
      const matching = IMAGE_FORMATS.find(
        (option) => option.value === next.type
      );
      if (matching && support[matching.value] !== false) {
        setFormat(matching.value);
      }
    } catch {
      setFile(null);
      setSource(null);
      setError('This file could not be decoded as an image.');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!source || support[format] === false) {
      return () => undefined;
    }

    let cancelled = false;
    const timer = setTimeout(() => {
      const run = async () => {
        setBusy(true);
        try {
          const canvas = document.createElement('canvas');
          canvas.width = source.width;
          canvas.height = source.height;
          const context = canvas.getContext('2d');
          if (!context) {
            throw new Error('Canvas is not supported in this browser.');
          }
          if (format === 'image/jpeg') {
            context.fillStyle = '#ffffff';
            context.fillRect(0, 0, source.width, source.height);
          }
          context.imageSmoothingEnabled = true;
          context.imageSmoothingQuality = 'high';
          context.drawImage(source.image, 0, 0, source.width, source.height);
          const blob = await canvasToBlob(canvas, format, quality / 100);
          if (!cancelled) {
            setResult({
              blob,
              width: source.width,
              height: source.height,
            });
            setError(null);
          }
        } catch (cause) {
          if (!cancelled) {
            setResult(null);
            setError(
              cause instanceof Error
                ? cause.message
                : 'Could not convert this image.'
            );
          }
        } finally {
          if (!cancelled) {
            setBusy(false);
          }
        }
      };
      void run();
    }, 160);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [source, format, quality, support]);

  const current = IMAGE_FORMATS.find((option) => option.value === format);
  const extension = extensionFor(format);
  const change =
    result && file ? ((result.blob.size - file.size) / file.size) * 100 : 0;

  return (
    <div className="space-y-4">
      <ToolLayout>
        <div className="space-y-4">
          <Panel title="Source image">
            <FileDropzone
              accept="image/*"
              hint="PNG, JPEG, WebP, AVIF, GIF and more"
              label={
                file ? 'Drop a different image, or click to browse' : undefined
              }
              onFiles={(files) => void onFiles(files)}
            />
            {file && source && sourceUrl && (
              <div className="mt-3 space-y-3">
                <ImagePreview alt="Original preview" src={sourceUrl} />
                <div className="flex flex-wrap items-center gap-2 text-xs text-fg-muted">
                  <Badge variant="accent">{file.type || 'image'}</Badge>
                  <span className="truncate font-medium text-fg">
                    {file.name}
                  </span>
                  <span>
                    {source.width}×{source.height} · {formatBytes(file.size)}
                  </span>
                </div>
              </div>
            )}
            {error && (
              <Callout className="mt-3" variant="error">
                {error}
              </Callout>
            )}
          </Panel>

          <Panel title="Conversion settings">
            <div className="space-y-4">
              <Field
                hint={
                  current && support[format] === false
                    ? 'Not supported in this browser'
                    : undefined
                }
                htmlFor="converter-format"
                label="Output format"
              >
                <Select
                  id="converter-format"
                  onChange={(event) =>
                    setFormat(event.target.value as ImageFormat)
                  }
                  value={format}
                >
                  {IMAGE_FORMATS.map((option) => (
                    <option
                      disabled={support[option.value] === false}
                      key={option.value}
                      value={option.value}
                    >
                      {option.label}
                      {support[option.value] === false
                        ? ' (not supported)'
                        : ''}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field
                hint={
                  format === 'image/png' ? 'PNG ignores quality' : `${quality}%`
                }
                htmlFor="converter-quality"
                label="Quality"
              >
                <input
                  aria-label="Quality"
                  className="h-2 w-full cursor-pointer accent-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={format === 'image/png'}
                  id="converter-quality"
                  max={100}
                  min={10}
                  onChange={(event) => setQuality(Number(event.target.value))}
                  type="range"
                  value={quality}
                />
              </Field>

              {format === 'image/jpeg' && (
                <Callout variant="info">
                  JPEG has no transparency. Transparent areas are filled with
                  white.
                </Callout>
              )}

              <p className="text-xs leading-5 text-fg-muted">
                Output support depends on your browser. The list above is
                checked with <code>canvas.toBlob</code>.
              </p>
            </div>
          </Panel>
        </div>

        <Panel
          actions={
            result && file && !busy ? (
              <DownloadButton
                filename={`${baseName(file.name)}-converted.${extension}`}
                label="Download"
                mime={format}
                value={result.blob}
              />
            ) : undefined
          }
          title="Converted image"
        >
          {result && previewUrl ? (
            <div className="space-y-3">
              <ImagePreview alt="Converted preview" src={previewUrl} />
              <StatGrid>
                <Stat label="Format" value={current?.label ?? extension} />
                <Stat label="File size" value={formatBytes(result.blob.size)} />
                <Stat
                  label="Change"
                  value={
                    <span
                      className={change > 0 ? 'text-attention' : 'text-success'}
                    >
                      {formatPercent(change)}
                    </span>
                  }
                />
                <Stat
                  label="Dimensions"
                  value={`${result.width}×${result.height}`}
                />
              </StatGrid>
              <p className="text-xs text-fg-muted">
                Original: {file ? formatBytes(file.size) : '—'} · Converted:{' '}
                {formatBytes(result.blob.size)}
              </p>
            </div>
          ) : (
            <div className="flex min-h-[260px] items-center justify-center rounded-md border border-dashed border-border bg-canvas-inset/50 p-4 text-center text-sm text-fg-muted">
              {busy
                ? 'Converting…'
                : 'Choose an image to convert it between formats.'}
            </div>
          )}
        </Panel>
      </ToolLayout>
    </div>
  );
}
