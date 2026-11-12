'use client';

import { Upload } from 'lucide-react';
import type { DragEvent, KeyboardEvent } from 'react';
import { useRef, useState } from 'react';

import { cn } from '@/utils/cn';

type FileDropzoneProps = {
  onFiles: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  label?: string;
  hint?: string;
  className?: string;
  disabled?: boolean;
};

export const FileDropzone = ({
  onFiles,
  accept,
  multiple = false,
  label = 'Drop a file here, or click to browse',
  hint,
  className,
  disabled = false,
}: FileDropzoneProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList?.length || disabled) {
      return;
    }
    const files = Array.from(fileList);
    onFiles(multiple ? files : files.slice(0, 1));
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    handleFiles(event.dataTransfer.files);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      inputRef.current?.click();
    }
  };

  return (
    <div
      aria-disabled={disabled}
      className={cn(
        'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-canvas-inset/60 px-6 py-10 text-center transition-colors hover:border-accent hover:bg-accent-subtle/10',
        dragging && 'border-accent bg-accent-subtle/20',
        disabled && 'pointer-events-none opacity-50',
        className
      )}
      onClick={() => inputRef.current?.click()}
      onDragEnter={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDragOver={(event) => event.preventDefault()}
      onDrop={onDrop}
      onKeyDown={onKeyDown}
      role="button"
      tabIndex={0}
    >
      <Upload aria-hidden className="h-6 w-6 text-fg-muted" />
      <p className="text-sm font-medium text-fg">{label}</p>
      {hint && <p className="text-xs text-fg-muted">{hint}</p>}
      <input
        accept={accept}
        className="hidden"
        multiple={multiple}
        onChange={(event) => {
          handleFiles(event.target.files);
          event.target.value = '';
        }}
        ref={inputRef}
        type="file"
      />
    </div>
  );
};
