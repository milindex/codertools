'use client';

import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Callout } from '@/components/ui/Callout';
import { CodeBlock } from '@/components/ui/CodeBlock';
import { DownloadButton } from '@/components/ui/DownloadButton';
import { Field } from '@/components/ui/Field';
import { FileDropzone } from '@/components/ui/FileDropzone';
import { Input } from '@/components/ui/Input';
import { Panel } from '@/components/ui/Panel';
import { ToolLayout } from '@/components/ui/ToolLayout';

import {
  canvasToBlob,
  formatBytes,
  ImagePreview,
  loadImageFile,
  Stat,
  StatGrid,
  useObjectUrl,
} from './shared';

type Metadata = Record<string, unknown>;

const baseName = (name: string) => name.replace(/\.[^.]+$/, '') || 'image';

const formatValue = (value: unknown): string => {
  if (value === null || value === undefined) {
    return '—';
  }
  if (value instanceof Date) {
    return `${value.toISOString()} · ${value.toLocaleString()}`;
  }
  if (value instanceof Uint8Array) {
    return `<${value.length.toLocaleString()} bytes>`;
  }
  if (Array.isArray(value)) {
    if (value.length > 32) {
      return `[${value
        .slice(0, 32)
        .map(formatValue)
        .join(', ')}, … ${value.length - 32} more]`;
    }
    return value.map(formatValue).join(', ');
  }
  if (typeof value === 'number') {
    if (Number.isInteger(value)) {
      return String(value);
    }
    return String(Math.round(value * 1e6) / 1e6);
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
};

export default function ExifViewer() {
  const [file, setFile] = useState<File | null>(null);
  const [meta, setMeta] = useState<Metadata | null>(null);
  const [stripped, setStripped] = useState<Blob | null>(null);
  const [strippedName, setStrippedName] = useState('clean-image.jpg');
  const [strippedType, setStrippedType] = useState('image/jpeg');
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [empty, setEmpty] = useState(false);

  const sourceUrl = useObjectUrl(file);
  const json = useMemo(
    () =>
      meta
        ? JSON.stringify(
            meta,
            (_key, value: unknown) =>
              value instanceof Uint8Array ? `<${value.length} bytes>` : value,
            2
          )
        : '',
    [meta]
  );

  const rows = useMemo(() => {
    if (!meta) {
      return [];
    }
    const needle = query.trim().toLowerCase();
    return Object.keys(meta)
      .sort((a, b) => a.localeCompare(b))
      .map((key) => ({ key, value: formatValue(meta[key]) }))
      .filter(
        (row) =>
          !needle ||
          row.key.toLowerCase().includes(needle) ||
          row.value.toLowerCase().includes(needle)
      );
  }, [meta, query]);

  const onFiles = async (files: File[]) => {
    const next = files[0];
    if (!next) {
      return;
    }
    if (!next.type.startsWith('image/')) {
      setError('Choose an image file such as JPEG, PNG, WebP or AVIF.');
      setFile(null);
      setMeta(null);
      setStripped(null);
      return;
    }

    setFile(next);
    setMeta(null);
    setStripped(null);
    setEmpty(false);
    setError(null);
    setQuery('');
    setBusy(true);

    try {
      const exifrModule = await import('exifr');
      const exifr = exifrModule.default ?? exifrModule;
      const parsed = (await exifr.parse(next, {
        tiff: true,
        exif: true,
        gps: true,
        interop: true,
        xmp: true,
        iptc: true,
        jfif: true,
        ihdr: true,
        userComment: true,
        mergeOutput: true,
        translateKeys: true,
        translateValues: true,
        reviveValues: true,
        sanitize: true,
      })) as Metadata | undefined;

      if (!parsed || Object.keys(parsed).length === 0) {
        setEmpty(true);
        setMeta(null);
      } else {
        setMeta(parsed);
      }
    } catch {
      setError(
        'The metadata could not be read. The file may be corrupt or use a format this browser cannot inspect.'
      );
    }

    try {
      const image = await loadImageFile(next);
      const usePng = next.type === 'image/png';
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth || image.width;
      canvas.height = image.naturalHeight || image.height;
      const context = canvas.getContext('2d');
      if (!context) {
        throw new Error('Canvas is not supported in this browser.');
      }
      if (!usePng) {
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
      }
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const type = usePng ? 'image/png' : 'image/jpeg';
      const blob = await canvasToBlob(canvas, type, 0.95);
      setStripped(blob);
      setStrippedType(type);
      setStrippedName(
        `stripped-${baseName(next.name)}.${usePng ? 'png' : 'jpg'}`
      );
    } catch {
      setStripped(null);
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
              hint="Metadata is parsed locally with exifr"
              label={
                file ? 'Drop a different image, or click to browse' : undefined
              }
              onFiles={(files) => void onFiles(files)}
            />
            {file && sourceUrl && (
              <div className="mt-3 space-y-3">
                <ImagePreview alt="Image preview" src={sourceUrl} />
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
            {empty && (
              <Callout className="mt-3" variant="info">
                No readable EXIF, XMP or IPTC metadata was found in this file.
              </Callout>
            )}
          </Panel>

          <Panel title="Privacy">
            <p className="text-sm leading-6 text-fg-muted">
              Photos often contain camera details, timestamps and GPS
              coordinates. A metadata-stripped copy is re-encoded through a
              canvas, so EXIF, XMP, IPTC and embedded thumbnails are removed.
            </p>
            {stripped && (
              <div className="mt-3 space-y-3">
                <StatGrid>
                  <Stat label="Original" value={formatBytes(file?.size ?? 0)} />
                  <Stat label="Stripped" value={formatBytes(stripped.size)} />
                  <Stat
                    label="Format"
                    value={strippedType.split('/')[1] ?? '—'}
                  />
                  <Stat label="Metadata" value="removed" />
                </StatGrid>
                <DownloadButton
                  filename={strippedName}
                  label="Download stripped copy"
                  mime={strippedType}
                  value={stripped}
                />
                <p className="text-xs text-fg-muted">
                  Re-encoding changes compression and may slightly reduce
                  quality. Transparency is kept for PNG inputs; other formats
                  are saved as JPEG with a white background.
                </p>
              </div>
            )}
            {file && !stripped && !busy && (
              <p className="mt-3 text-xs text-fg-muted">
                A stripped copy could not be created for this image in the
                current browser.
              </p>
            )}
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel
            actions={
              meta ? (
                <DownloadButton
                  filename={`${baseName(file?.name ?? 'image')}-metadata.json`}
                  label="Download JSON"
                  mime="application/json"
                  value={json}
                />
              ) : undefined
            }
            title="Metadata"
          >
            {busy ? (
              <div className="flex min-h-[240px] items-center justify-center rounded-md border border-dashed border-border bg-canvas-inset/50 text-sm text-fg-muted">
                Reading metadata…
              </div>
            ) : meta ? (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Badge variant="success">
                    {Object.keys(meta).length} fields
                  </Badge>
                  <div className="w-full sm:w-64">
                    <Field htmlFor="exif-filter" label="Filter">
                      <Input
                        id="exif-filter"
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Search keys or values"
                        value={query}
                      />
                    </Field>
                  </div>
                </div>
                <div className="max-h-[420px] overflow-auto rounded-md border border-border">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead className="sticky top-0 bg-canvas-subtle">
                      <tr>
                        <th className="border-b border-border px-3 py-2 font-semibold text-fg">
                          Field
                        </th>
                        <th className="border-b border-border px-3 py-2 font-semibold text-fg">
                          Value
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => (
                        <tr
                          className="border-b border-border-muted last:border-0"
                          key={row.key}
                        >
                          <td className="w-2/5 break-words px-3 py-1.5 align-top font-mono text-[11px] text-accent">
                            {row.key}
                          </td>
                          <td className="break-words px-3 py-1.5 align-top font-mono text-[11px] text-fg">
                            {row.value}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {rows.length === 0 && (
                    <p className="p-3 text-xs text-fg-muted">
                      No metadata fields match “{query}”.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex min-h-[240px] items-center justify-center rounded-md border border-dashed border-border bg-canvas-inset/50 p-4 text-center text-sm text-fg-muted">
                Choose a photo to inspect its EXIF, GPS and XMP metadata.
              </div>
            )}
          </Panel>

          {json && (
            <Panel title="Raw JSON">
              <CodeBlock code={json} filename="metadata.json" language="json" />
            </Panel>
          )}
        </div>
      </ToolLayout>
    </div>
  );
}
