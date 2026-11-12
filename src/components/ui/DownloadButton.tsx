'use client';

import { Download } from 'lucide-react';

import { Button } from '@/components/ui/Button';

type DownloadButtonProps = {
  value: string | Blob;
  filename: string;
  mime?: string;
  label?: string;
  className?: string;
};

export const DownloadButton = ({
  value,
  filename,
  mime = 'text/plain;charset=utf-8',
  label = 'Download',
  className,
}: DownloadButtonProps) => {
  const download = () => {
    const blob =
      typeof value === 'string' ? new Blob([value], { type: mime }) : value;
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  return (
    <Button className={className} onClick={download} size="sm" variant="ghost">
      <Download aria-hidden className="h-3.5 w-3.5" />
      {label}
    </Button>
  );
};
