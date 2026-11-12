'use client';

import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Callout } from '@/components/ui/Callout';
import { DownloadButton } from '@/components/ui/DownloadButton';
import { Field } from '@/components/ui/Field';
import { FileDropzone } from '@/components/ui/FileDropzone';
import { Input } from '@/components/ui/Input';
import { Panel } from '@/components/ui/Panel';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { ToolLayout } from '@/components/ui/ToolLayout';

import type { ImageFormat } from './shared';
import {
  canvasToBlob,
  extensionFor,
  fitDimensions,
  formatBytes,
  formatPercent,
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

const baseName = (name: string) => name.replace(/\.[^.]+$/, '') || 'image';

export default function ImageCompressor() {
  const [file, setFile] = useState<File | null>(null);
  const [source, setSource] = useState<Source | null>(null);
  const [format, setFormat] = useState<ImageFormat>('image/jpeg');
  const [quality, setQuality] = useState(82);
  const [maxWidth, setMaxWidth] = useState('1920');
  const [maxHeight, setMaxHeight] = useState('1920');
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previewUrl = useObjectUrl(result?.blob ?? null);
  const sourceUrl = useObjectUrl(file);

  const onFiles = async (files: File[]) => {
    const next = files[0];
    if (!next) {
      return;
    }
    if (!next.type.startsWith('image/')) {
      setFile(null);
      setSource(null);
      setResult(null);
      setError('Choose a JPEG, PNG, WebP or AVIF image file.');
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
    } catch {
      setFile(null);
      setSource(null);
      setError('This file could not be decoded as an image.');
    } finally {
      setBusy(false);
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
          const limitWidth = Number(maxWidth) || 0;
          const limitHeight = Number(maxHeight) || 0;
          const size = fitDimensions(
            source.width,
            source.height,
            limitWidth,
            limitHeight
          );
          const canvas = document.createElement('canvas');
          canvas.width = size.width;
          canvas.height = size.height;
          const context = canvas.getContext('2d');
          if (!context) {
            throw new Error('Canvas is not supported in this browser.');
          }
          if (format === 'image/jpeg') {
            context.fillStyle = '#ffffff';
            context.fillRect(0, 0, size.width, size.height);
          }
          context.imageSmoothingEnabled = true;
          context.imageSmoothingQuality = 'high';
          context.drawImage(source.image, 0, 0, size.width, size.height);
          const blob = await canvasToBlob(canvas, format, quality / 100);
          if (!cancelled) {
            setResult({ blob, width: size.width, height: size.height });
            setError(null);
          }
        } catch (cause) {
          if (!cancelled) {
            setResult(null);
            setError(
              cause instanceof Error
                ? cause.message
                : 'Could not compress this image.'
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
  }, [source, format, quality, maxWidth, maxHeight]);

  const savedPercent =
    result && file ? ((file.size - result.blob.size) / file.size) * 100 : 0;
  const extension = extensionFor(format);

  return (
    <div className="space-y-4">
      <ToolLayout>
        <div className="space-y-4">
          <Panel title="Source image" description="Files stay in your browser.">
            <FileDropzone
              accept="image/*"
              hint="JPEG, PNG, WebP, AVIF or GIF (first frame)"
              label={
                file ? 'Drop a different image, or click to browse' : undefined
              }
              onFiles={(files) => void onFiles(files)}
            />
            {file && source && (
              <div className="mt-3 space-y-3">
                {sourceUrl && (
                  <ImagePreview alt="Original preview" src={sourceUrl} />
                )}
                <div className="flex flex-wrap items-center gap-2 text-xs text-fg-muted">
                  <Badge variant="accent">{file.type || 'image'}</Badge>
                  <span className="truncate font-medium text-fg">
                    {file.name}
                  </span>
                  <span>
                    {formatBytes(file.size)} · {source.width}×{source.height}
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

          <Panel title="Compression settings">
            <div className="space-y-4">
              <Field htmlFor="compressor-format" label="Output format">
                <SegmentedControl
                  ariaLabel="Output format"
                  onChange={(value) => setFormat(value as ImageFormat)}
                  options={[
                    { value: 'image/jpeg', label: 'JPEG' },
                    { value: 'image/png', label: 'PNG' },
                    { value: 'image/webp', label: 'WebP' },
                  ]}
                  value={format}
                />
              </Field>

              <Field
                hint={
                  format === 'image/png' ? 'PNG ignores quality' : `${quality}%`
                }
                htmlFor="compressor-quality"
                label="Quality"
              >
                <input
                  aria-label="Quality"
                  className="h-2 w-full cursor-pointer accent-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={format === 'image/png'}
                  id="compressor-quality"
                  max={100}
                  min={10}
                  onChange={(event) => setQuality(Number(event.target.value))}
                  step={1}
                  type="range"
                  value={quality}
                />
              </Field>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field
                  hint="0 = no limit"
                  htmlFor="compressor-max-width"
                  label="Max width"
                >
                  <Input
                    id="compressor-max-width"
                    min={0}
                    onChange={(event) => setMaxWidth(event.target.value)}
                    placeholder="1920"
                    type="number"
                    value={maxWidth}
                  />
                </Field>
                <Field
                  hint="0 = no limit"
                  htmlFor="compressor-max-height"
                  label="Max height"
                >
                  <Input
                    id="compressor-max-height"
                    min={0}
                    onChange={(event) => setMaxHeight(event.target.value)}
                    placeholder="1920"
                    type="number"
                    value={maxHeight}
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
                filename={`compressed-${baseName(file.name)}.${extension}`}
                label="Download"
                mime={format}
                value={result.blob}
              />
            ) : undefined
          }
          title="Compressed image"
        >
          {busy && !result ? (
            <div className="flex min-h-[260px] items-center justify-center rounded-md border border-dashed border-border bg-canvas-inset/50 text-sm text-fg-muted">
              Compressing…
            </div>
          ) : result && previewUrl && file ? (
            <div className="space-y-3">
              <ImagePreview alt="Compressed preview" src={previewUrl} />
              <StatGrid>
                <Stat label="Original" value={formatBytes(file.size)} />
                <Stat
                  label="Compressed"
                  value={formatBytes(result.blob.size)}
                />
                <Stat
                  label="Change"
                  value={
                    <span
                      className={
                        savedPercent >= 0 ? 'text-success' : 'text-attention'
                      }
                    >
                      {formatPercent(-savedPercent)}
                    </span>
                  }
                />
                <Stat
                  label="Dimensions"
                  value={`${result.width}×${result.height}`}
                />
              </StatGrid>
              <p className="text-xs text-fg-muted">
                {savedPercent >= 0
                  ? `Saved ${formatBytes(file.size - result.blob.size)} (${savedPercent.toFixed(1)}%).`
                  : `The new file is ${formatBytes(result.blob.size - file.size)} larger. Try lower quality or a different format.`}
              </p>
            </div>
          ) : (
            <div className="flex min-h-[260px] items-center justify-center rounded-md border border-dashed border-border bg-canvas-inset/50 p-4 text-center text-sm text-fg-muted">
              Choose an image to see a compressed preview and file size.
            </div>
          )}
          {busy && result && (
            <p className="mt-2 text-xs text-fg-muted">Updating preview…</p>
          )}
        </Panel>
      </ToolLayout>
    </div>
  );
}
