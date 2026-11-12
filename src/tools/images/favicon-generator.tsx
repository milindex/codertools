'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
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
  downloadBlob,
  formatBytes,
  ImagePreview,
  loadImageFile,
  Stat,
  StatGrid,
  useObjectUrl,
} from './shared';

const ICONS = [
  { size: 16, name: 'favicon-16x16.png' },
  { size: 32, name: 'favicon-32x32.png' },
  { size: 48, name: 'favicon-48x48.png' },
  { size: 180, name: 'apple-touch-icon.png' },
  { size: 192, name: 'android-chrome-192x192.png' },
  { size: 512, name: 'android-chrome-512x512.png' },
];

type IconFile = {
  size: number;
  name: string;
  blob: Blob;
  url: string;
};

export default function FaviconGenerator() {
  const [file, setFile] = useState<File | null>(null);
  const [icons, setIcons] = useState<IconFile[]>([]);
  const [siteName, setSiteName] = useState('My Site');
  const [themeColor, setThemeColor] = useState('#0d1117');
  const [busy, setBusy] = useState(false);
  const [zipping, setZipping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sourceUrl = useObjectUrl(file);
  const urlsRef = useRef<string[]>([]);
  const runRef = useRef(0);
  const mountedRef = useRef(true);

  const revokeIcons = () => {
    urlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    urlsRef.current = [];
  };

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      urlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      urlsRef.current = [];
    };
  }, []);

  const manifest = useMemo(
    () =>
      `${JSON.stringify(
        {
          name: siteName || 'My Site',
          short_name: siteName || 'My Site',
          icons: [
            {
              src: '/android-chrome-192x192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: '/android-chrome-512x512.png',
              sizes: '512x512',
              type: 'image/png',
            },
          ],
          theme_color: themeColor,
          background_color: themeColor,
          display: 'standalone',
        },
        null,
        2
      )}\n`,
    [siteName, themeColor]
  );

  const generate = async (next: File) => {
    const run = runRef.current + 1;
    runRef.current = run;
    setBusy(true);
    setError(null);
    revokeIcons();
    setIcons([]);

    try {
      const image = await loadImageFile(next);
      const sourceWidth = image.naturalWidth || image.width;
      const sourceHeight = image.naturalHeight || image.height;

      const results = await Promise.all(
        ICONS.map(async (icon) => {
          const canvas = document.createElement('canvas');
          canvas.width = icon.size;
          canvas.height = icon.size;
          const context = canvas.getContext('2d');
          if (!context) {
            throw new Error('Canvas is not supported in this browser.');
          }
          context.imageSmoothingEnabled = true;
          context.imageSmoothingQuality = 'high';
          const rect =
            sourceWidth >= sourceHeight
              ? {
                  x: (sourceWidth - sourceHeight) / 2,
                  y: 0,
                  width: sourceHeight,
                  height: sourceHeight,
                }
              : {
                  x: 0,
                  y: (sourceHeight - sourceWidth) / 2,
                  width: sourceWidth,
                  height: sourceWidth,
                };
          context.drawImage(
            image,
            rect.x,
            rect.y,
            rect.width,
            rect.height,
            0,
            0,
            icon.size,
            icon.size
          );
          const blob = await canvasToBlob(canvas, 'image/png');
          return {
            ...icon,
            blob,
            url: URL.createObjectURL(blob),
          };
        })
      );

      if (run !== runRef.current || !mountedRef.current) {
        results.forEach((result) => URL.revokeObjectURL(result.url));
        return;
      }

      urlsRef.current = results.map((result) => result.url);
      setIcons(results);
    } catch (cause) {
      if (run === runRef.current) {
        setError(
          cause instanceof Error
            ? cause.message
            : 'Could not generate favicons from this file.'
        );
      }
    } finally {
      if (run === runRef.current) {
        setBusy(false);
      }
    }
  };

  const onFiles = (files: File[]) => {
    const next = files[0];
    if (!next) {
      return;
    }
    if (!next.type.startsWith('image/')) {
      setError('Choose an image file such as PNG, JPEG or WebP.');
      setFile(null);
      return;
    }
    setFile(next);
    void generate(next);
  };

  const downloadZip = async () => {
    if (!icons.length) {
      return;
    }
    setZipping(true);
    setError(null);
    try {
      const module_ = await import('jszip');
      const JSZip =
        module_.default ?? (module_ as unknown as typeof module_.default);
      const zip = new JSZip();
      icons.forEach((icon) => zip.file(icon.name, icon.blob));
      zip.file('site.webmanifest', manifest);
      const blob = await zip.generateAsync({ type: 'blob' });
      downloadBlob(blob, 'favicons.zip');
    } catch {
      setError('The ZIP file could not be created.');
    } finally {
      setZipping(false);
    }
  };

  return (
    <div className="space-y-4">
      <ToolLayout>
        <div className="space-y-4">
          <Panel
            description="A square center crop is used for every size."
            title="Source image"
          >
            <FileDropzone
              accept="image/*"
              hint="PNG with transparency works best"
              label={
                file ? 'Drop a different image, or click to browse' : undefined
              }
              onFiles={onFiles}
            />
            {file && sourceUrl && (
              <div className="mt-3 space-y-3">
                <ImagePreview alt="Favicon source preview" src={sourceUrl} />
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

          <Panel title="Manifest settings">
            <div className="space-y-4">
              <Field htmlFor="favicon-site-name" label="Site name">
                <Input
                  id="favicon-site-name"
                  onChange={(event) => setSiteName(event.target.value)}
                  placeholder="My Site"
                  value={siteName}
                />
              </Field>
              <div className="flex items-end gap-3">
                <Field htmlFor="favicon-theme" label="Theme colour">
                  <input
                    aria-label="Theme colour"
                    className="h-8 w-16 cursor-pointer rounded-md border border-border bg-canvas-inset p-1"
                    id="favicon-theme"
                    onChange={(event) => setThemeColor(event.target.value)}
                    type="color"
                    value={themeColor}
                  />
                </Field>
                <span className="pb-1.5 font-mono text-xs text-fg-muted">
                  {themeColor}
                </span>
              </div>
              <p className="text-xs leading-5 text-fg-muted">
                The theme colour is written to <code>site.webmanifest</code>.
                Transparent icons may appear black on iOS home screens.
              </p>
            </div>
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel
            actions={
              icons.length > 0 ? (
                <Button
                  disabled={zipping}
                  onClick={() => void downloadZip()}
                  size="sm"
                  variant="primary"
                >
                  {zipping ? 'Packing…' : 'Download ZIP'}
                </Button>
              ) : undefined
            }
            title="Generated icons"
          >
            {busy && icons.length === 0 ? (
              <div className="flex min-h-[240px] items-center justify-center rounded-md border border-dashed border-border bg-canvas-inset/50 text-sm text-fg-muted">
                Generating icons…
              </div>
            ) : icons.length > 0 ? (
              <>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {icons.map((icon) => (
                    <div
                      className="flex flex-col items-center gap-2 rounded-md border border-border bg-canvas-subtle/40 p-3"
                      key={icon.name}
                    >
                      <div
                        className="flex h-24 w-full items-center justify-center overflow-hidden rounded border border-border"
                        style={{
                          backgroundColor: '#ffffff',
                          backgroundImage:
                            'linear-gradient(45deg, #e6edf3 25%, transparent 25%), linear-gradient(-45deg, #e6edf3 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e6edf3 75%), linear-gradient(-45deg, transparent 75%, #e6edf3 75%)',
                          backgroundSize: '12px 12px',
                          backgroundPosition: '0 0, 0 6px, 6px -6px, -6px 0',
                        }}
                      >
                        {}
                        <img
                          alt={`${icon.size}×${icon.size} favicon`}
                          className="h-16 w-16 object-contain"
                          src={icon.url}
                          style={{ imageRendering: 'pixelated' }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-fg">
                        {icon.size}×{icon.size}
                      </span>
                      <span className="max-w-full truncate font-mono text-[10px] text-fg-muted">
                        {icon.name}
                      </span>
                      <DownloadButton
                        filename={icon.name}
                        label="PNG"
                        mime="image/png"
                        value={icon.blob}
                      />
                    </div>
                  ))}
                </div>
                <StatGrid>
                  <Stat label="Files" value={icons.length} />
                  <Stat
                    label="Largest"
                    value={formatBytes(
                      Math.max(...icons.map((icon) => icon.blob.size))
                    )}
                  />
                </StatGrid>
              </>
            ) : (
              <div className="flex min-h-[240px] items-center justify-center rounded-md border border-dashed border-border bg-canvas-inset/50 p-4 text-center text-sm text-fg-muted">
                Choose an image to generate 16, 32, 48, 180, 192 and 512 px PNG
                favicons.
              </div>
            )}
          </Panel>

          <Panel title="site.webmanifest">
            <p className="mb-3 text-xs leading-5 text-fg-muted">
              Save this as <code>site.webmanifest</code> in your site root and
              link it with{' '}
              <code>{'<link rel="manifest" href="/site.webmanifest">'}</code>.
            </p>
            <CodeBlock
              code={manifest}
              filename="site.webmanifest"
              language="json"
            />
          </Panel>
        </div>
      </ToolLayout>
    </div>
  );
}
