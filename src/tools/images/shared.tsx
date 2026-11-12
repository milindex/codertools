'use client';

import type { CSSProperties, ReactNode } from 'react';
import { useEffect, useState } from 'react';

export type ImageFormat =
  'image/jpeg' | 'image/png' | 'image/webp' | 'image/avif';

export type FormatOption = {
  value: ImageFormat;
  label: string;
  extension: string;
  mime: string;
};

export const IMAGE_FORMATS: FormatOption[] = [
  { value: 'image/jpeg', label: 'JPEG', extension: 'jpg', mime: 'image/jpeg' },
  { value: 'image/png', label: 'PNG', extension: 'png', mime: 'image/png' },
  { value: 'image/webp', label: 'WebP', extension: 'webp', mime: 'image/webp' },
  { value: 'image/avif', label: 'AVIF', extension: 'avif', mime: 'image/avif' },
];

export const extensionFor = (format: ImageFormat) =>
  IMAGE_FORMATS.find((option) => option.value === format)?.extension ?? 'png';

export const formatBytes = (bytes: number): string => {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return '—';
  }
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  const units = ['KB', 'MB', 'GB', 'TB'];
  let value = bytes / 1024;
  let index = 0;
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }
  const digits = value >= 100 ? 0 : value >= 10 ? 1 : 2;
  return `${value.toFixed(digits)} ${units[index] ?? 'TB'}`;
};

export const formatPercent = (value: number): string =>
  `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;

export const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => resolve(image);
    image.onerror = () =>
      reject(new Error('This file could not be decoded as an image.'));
    image.src = src;
  });

export const loadImageFile = async (file: File): Promise<HTMLImageElement> => {
  const url = URL.createObjectURL(file);
  try {
    return await loadImage(url);
  } finally {
    URL.revokeObjectURL(url);
  }
};

export const canvasToBlob = (
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number
): Promise<Blob> =>
  new Promise((resolve, reject) => {
    try {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('The browser could not encode this image.'));
          }
        },
        type,
        quality
      );
    } catch (error) {
      reject(error instanceof Error ? error : new Error(String(error)));
    }
  });

export const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
};

export const dataUrlToBlob = async (dataUrl: string): Promise<Blob> => {
  const response = await fetch(dataUrl);
  return response.blob();
};

export const supportsImageType = async (
  type: ImageFormat
): Promise<boolean> => {
  if (typeof document === 'undefined') {
    return false;
  }
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 2;
    canvas.height = 2;
    const context = canvas.getContext('2d');
    context?.fillRect(0, 0, 2, 2);
    const blob = await canvasToBlob(canvas, type, 0.8);
    return blob.type === type;
  } catch {
    return false;
  }
};

export const fitDimensions = (
  width: number,
  height: number,
  maxWidth: number,
  maxHeight: number
) => {
  if (width <= 0 || height <= 0) {
    return { width: 1, height: 1 };
  }
  const scale = Math.min(
    1,
    maxWidth > 0 ? maxWidth / width : 1,
    maxHeight > 0 ? maxHeight / height : 1
  );
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
};

export const coverRect = (
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number
) => {
  const sourceRatio = sourceWidth / sourceHeight;
  const targetRatio = targetWidth / targetHeight;
  if (sourceRatio > targetRatio) {
    const width = sourceHeight * targetRatio;
    return { x: (sourceWidth - width) / 2, y: 0, width, height: sourceHeight };
  }
  const height = sourceWidth / targetRatio;
  return { x: 0, y: (sourceHeight - height) / 2, width: sourceWidth, height };
};

export const useObjectUrl = (blob: Blob | null): string | null => {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!blob) {
      setUrl(null);
      return () => undefined;
    }
    const next = URL.createObjectURL(blob);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [blob]);

  return url;
};

export const checkerboardStyle: CSSProperties = {
  backgroundColor: '#ffffff',
  backgroundImage:
    'linear-gradient(45deg, #d8dee4 25%, transparent 25%), linear-gradient(-45deg, #d8dee4 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #d8dee4 75%), linear-gradient(-45deg, transparent 75%, #d8dee4 75%)',
  backgroundSize: '16px 16px',
  backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0',
};

export const ImagePreview = ({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) => (
  <div
    className={`flex items-center justify-center overflow-hidden rounded-md border border-border p-2 ${
      className ?? ''
    }`}
    style={checkerboardStyle}
  >
    {}
    <img
      alt={alt}
      className="max-h-[320px] w-auto max-w-full object-contain"
      src={src}
    />
  </div>
);

export const Stat = ({ label, value }: { label: string; value: ReactNode }) => (
  <div className="rounded-md border border-border bg-canvas-subtle/40 px-3 py-2">
    <dt className="text-[10px] font-medium uppercase tracking-wide text-fg-muted">
      {label}
    </dt>
    <dd className="mt-0.5 truncate text-sm font-semibold text-fg">{value}</dd>
  </div>
);

export const StatGrid = ({ children }: { children: React.ReactNode }) => (
  <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">{children}</dl>
);
