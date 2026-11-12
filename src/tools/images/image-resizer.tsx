'use client';

import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { DownloadButton } from '@/components/ui/DownloadButton';
import { Field } from '@/components/ui/Field';
import { FileDropzone } from '@/components/ui/FileDropzone';
import { Input } from '@/components/ui/Input';
import { Panel } from '@/components/ui/Panel';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Select } from '@/components/ui/Select';
import { ToolLayout } from '@/components/ui/ToolLayout';

import type { ImageFormat } from './shared';
import {
  canvasToBlob,
  coverRect,
  extensionFor,
  formatBytes,
  ImagePreview,
  loadImageFile,
  Stat,
  StatGrid,
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

type ResizeMode = 'contain' | 'cover' | 'stretch';

const baseName = (name: string) => name.replace(/\.[^.]+$/, '') || 'image';

export default function ImageResizer() {
  const [file, setFile] = useState<File | null>(null);
  const [source, setSource] = useState<Source | null>(null);
  const [width, setWidth] = useState('800');
  const [height, setHeight] = useState('600');
  const [lockAspect, setLockAspect] = useState(true);
  const [mode, setMode] = useState<ResizeMode>('contain');
  const [format, setFormat] = useState<ImageFormat>('image/png');
  const [quality, setQuality] = useState(90);
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sourceUrl = useObjectUrl(file);
  const previewUrl = useObjectUrl(result?.blob ?? null);

  const ratio = source ? source.width / source.height : 1;

  const onFiles = async (files: File[]) => {
    const next = files[0];
    if (!next) {
      return;
    }
    if (!next.type.startsWith('image/')) {
      setFile(null);
      setSource(null);
      setResult(null);
      setError('Choose an image file such as JPEG, PNG, WebP or AVIF.');
      return;
    }
    setError(null);
    setResult(null);
    setBusy(true);
    try {
      const image = await loadImageFile(next);
      const naturalWidth = image.naturalWidth || image.width;
      const naturalHeight = image.naturalHeight || image.height;
      setFile(next);
      setSource({ image, width: naturalWidth, height: naturalHeight });
      setWidth(String(naturalWidth));
      setHeight(String(naturalHeight));
    } catch {
      setFile(null);
      setSource(null);
      setError('This file could not be decoded as an image.');
    } finally {
      setBusy(false);
    }
  };

  const updateWidth = (value: string) => {
    setWidth(value);
    if (lockAspect) {
      const numeric = Number(value);
      if (numeric > 0) {
        setHeight(String(Math.max(1, Math.round(numeric / ratio))));
      }
    }
  };

  const updateHeight = (value: string) => {
    setHeight(value);
    if (lockAspect) {
      const numeric = Number(value);
      if (numeric > 0) {
        setWidth(String(Math.max(1, Math.round(numeric * ratio))));
      }
    }
  };

  useEffect(() => {
    if (!source) {
      return () => undefined;
    }

    let cancelled = false;
    const timer = setTimeout(() => {
      const run = async () => {
        setBusy(true);
        try {
          const targetWidth = Math.max(
            1,
            Math.min(8192, Math.round(Number(width) || source.width))
          );
          const targetHeight = Math.max(
            1,
            Math.min(8192, Math.round(Number(height) || source.height))
          );
          const canvas = document.createElement('canvas');
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          const context = canvas.getContext('2d');
          if (!context) {
            throw new Error('Canvas is not supported in this browser.');
          }
          if (format === 'image/jpeg') {
            context.fillStyle = '#ffffff';
            context.fillRect(0, 0, targetWidth, targetHeight);
          }
          context.imageSmoothingEnabled = true;
          context.imageSmoothingQuality = 'high';

          if (mode === 'cover') {
            const rect = coverRect(
              source.width,
              source.height,
              targetWidth,
              targetHeight
            );
            context.drawImage(
              source.image,
              rect.x,
              rect.y,
              rect.width,
              rect.height,
              0,
              0,
              targetWidth,
              targetHeight
            );
          } else if (mode === 'contain') {
            const scale = Math.min(
              targetWidth / source.width,
              targetHeight / source.height
            );
            const drawWidth = source.width * scale;
            const drawHeight = source.height * scale;
            context.drawImage(
              source.image,
              (targetWidth - drawWidth) / 2,
              (targetHeight - drawHeight) / 2,
              drawWidth,
              drawHeight
            );
          } else {
            context.drawImage(source.image, 0, 0, targetWidth, targetHeight);
          }

          const blob = await canvasToBlob(canvas, format, quality / 100);
          if (!cancelled) {
            setResult({ blob, width: targetWidth, height: targetHeight });
            setError(null);
          }
        } catch (cause) {
          if (!cancelled) {
            setResult(null);
            setError(
              cause instanceof Error
                ? cause.message
                : 'Could not resize this image.'
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
  }, [source, width, height, mode, format, quality]);

  const extension = extensionFor(format);

  return (
    <div className="space-y-4">
      <ToolLayout>
        <div className="space-y-4">
          <Panel title="Source image">
            <FileDropzone
              accept="image/*"
              hint="Runs locally — nothing is uploaded"
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

          <Panel title="Resize settings">
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field htmlFor="resize-width" label="Width (px)">
                  <Input
                    id="resize-width"
                    min={1}
                    onChange={(event) => updateWidth(event.target.value)}
                    type="number"
                    value={width}
                  />
                </Field>
                <Field htmlFor="resize-height" label="Height (px)">
                  <Input
                    id="resize-height"
                    min={1}
                    onChange={(event) => updateHeight(event.target.value)}
                    type="number"
                    value={height}
                  />
                </Field>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-fg">
                  <input
                    checked={lockAspect}
                    className="h-3.5 w-3.5 cursor-pointer accent-[var(--accent)]"
                    onChange={(event) => setLockAspect(event.target.checked)}
                    type="checkbox"
                  />
                  Lock aspect ratio
                </label>
                {source && (
                  <Button
                    onClick={() => {
                      setWidth(String(source.width));
                      setHeight(String(source.height));
                    }}
                    size="sm"
                    variant="ghost"
                  >
                    Reset to original
                  </Button>
                )}
              </div>

              <Field hint="How the image fills the output box" label="Fit mode">
                <SegmentedControl
                  ariaLabel="Fit mode"
                  onChange={(value) => setMode(value as ResizeMode)}
                  options={[
                    { value: 'contain', label: 'Contain' },
                    { value: 'cover', label: 'Cover' },
                    { value: 'stretch', label: 'Stretch' },
                  ]}
                  value={mode}
                />
              </Field>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field htmlFor="resize-format" label="Output format">
                  <Select
                    id="resize-format"
                    onChange={(event) =>
                      setFormat(event.target.value as ImageFormat)
                    }
                    value={format}
                  >
                    <option value="image/png">PNG</option>
                    <option value="image/jpeg">JPEG</option>
                    <option value="image/webp">WebP</option>
                  </Select>
                </Field>
                <Field
                  hint={
                    format === 'image/png'
                      ? 'PNG ignores quality'
                      : `${quality}%`
                  }
                  htmlFor="resize-quality"
                  label="Quality"
                >
                  <input
                    aria-label="Quality"
                    className="mt-2 h-2 w-full cursor-pointer accent-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={format === 'image/png'}
                    id="resize-quality"
                    max={100}
                    min={10}
                    onChange={(event) => setQuality(Number(event.target.value))}
                    type="range"
                    value={quality}
                  />
                </Field>
              </div>
            </div>
          </Panel>
        </div>

        <Panel
          actions={
            result && file && !busy ? (
              <DownloadButton
                filename={`resized-${baseName(file.name)}-${result.width}x${result.height}.${extension}`}
                label="Download"
                mime={format}
                value={result.blob}
              />
            ) : undefined
          }
          title="Resized image"
        >
          {result && previewUrl ? (
            <div className="space-y-3">
              <ImagePreview alt="Resized preview" src={previewUrl} />
              <StatGrid>
                <Stat
                  label="Output"
                  value={`${result.width}×${result.height}`}
                />
                <Stat label="File size" value={formatBytes(result.blob.size)} />
                <Stat label="Format" value={extension.toUpperCase()} />
                <Stat label="Fit" value={mode} />
              </StatGrid>
              <p className="text-xs text-fg-muted">
                {mode === 'cover'
                  ? 'The image was scaled to cover the box and center-cropped.'
                  : mode === 'contain'
                    ? 'The image was scaled to fit inside the box without distortion.'
                    : 'The image was stretched to the exact output dimensions.'}
              </p>
            </div>
          ) : (
            <div className="flex min-h-[260px] items-center justify-center rounded-md border border-dashed border-border bg-canvas-inset/50 p-4 text-center text-sm text-fg-muted">
              {busy
                ? 'Resizing…'
                : 'Choose an image to see the resized preview.'}
            </div>
          )}
        </Panel>
      </ToolLayout>
    </div>
  );
}
