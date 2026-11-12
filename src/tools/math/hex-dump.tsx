'use client';

import { useMemo, useState } from 'react';

import { Callout } from '@/components/ui/Callout';
import { Field } from '@/components/ui/Field';
import { FileDropzone } from '@/components/ui/FileDropzone';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Textarea } from '@/components/ui/Textarea';
import { ToolLayout } from '@/components/ui/ToolLayout';

const MAX_FILE_BYTES = 512 * 1024;

const bytesPerRowOptions = [
  { value: '8', label: '8 bytes' },
  { value: '16', label: '16 bytes' },
  { value: '32', label: '32 bytes' },
];

const toHex = (value: number): string => value.toString(16).padStart(2, '0');

export default function HexDump() {
  const [mode, setMode] = useState('text');
  const [text, setText] = useState('Hello, world!\nCoderTools hex dump.');
  const [fileBytes, setFileBytes] = useState<Uint8Array | null>(null);
  const [fileName, setFileName] = useState('');
  const [fileError, setFileError] = useState<string | null>(null);
  const [bytesPerRow, setBytesPerRow] = useState('16');
  const [uppercase, setUppercase] = useState(false);

  const bytes = useMemo(() => {
    if (mode === 'file') {
      return fileBytes;
    }
    return new TextEncoder().encode(text);
  }, [fileBytes, mode, text]);

  const dump = useMemo(() => {
    if (!bytes || bytes.length === 0) {
      return '';
    }

    const width = Number(bytesPerRow);
    const hexWidth = width * 3 - 1;
    const offsetWidth = Math.max(
      8,
      Math.max(0, bytes.length - 1).toString(16).length
    );
    const lines: string[] = [];
    const limit = Math.min(bytes.length, MAX_FILE_BYTES);

    for (let offset = 0; offset < limit; offset += width) {
      const chunk = bytes.slice(offset, Math.min(offset + width, limit));
      const hex = Array.from(chunk)
        .map((byte) => {
          const value = toHex(byte);
          return uppercase ? value.toUpperCase() : value;
        })
        .join(' ');
      const ascii = Array.from(chunk)
        .map((byte) =>
          byte >= 32 && byte <= 126 ? String.fromCharCode(byte) : '.'
        )
        .join('');

      lines.push(
        `${offset
          .toString(16)
          .toUpperCase()
          .padStart(
            offsetWidth,
            '0'
          )}  ${hex.padEnd(hexWidth, ' ')}  |${ascii}|`
      );
    }

    if (bytes.length > limit) {
      lines.push(
        '',
        `… ${(bytes.length - limit).toLocaleString()} more bytes not shown (preview limited to ${(MAX_FILE_BYTES / 1024).toLocaleString()} KB).`
      );
    }

    return lines.join('\n');
  }, [bytes, bytesPerRow, uppercase]);

  const readFile = async (files: File[]) => {
    const file = files[0];
    if (!file) {
      return;
    }

    if (file.size > MAX_FILE_BYTES) {
      setFileError(
        `That file is ${(file.size / 1024).toFixed(0)} KB. The preview limit is ${MAX_FILE_BYTES / 1024} KB.`
      );
      setFileBytes(null);
      setFileName('');
      return;
    }

    try {
      const buffer = await file.arrayBuffer();
      setFileBytes(new Uint8Array(buffer));
      setFileName(`${file.name} (${file.size.toLocaleString()} bytes)`);
      setFileError(null);
      setMode('file');
    } catch {
      setFileError('The file could not be read.');
      setFileBytes(null);
      setFileName('');
    }
  };

  const lineCount = bytes ? Math.ceil(bytes.length / Number(bytesPerRow)) : 0;

  return (
    <ToolLayout>
      <Panel
        description="Inspect UTF-8 text or a dropped file as offset, hexadecimal bytes and printable ASCII."
        title="Source"
      >
        <div className="space-y-3">
          <Field label="Input mode">
            <SegmentedControl
              ariaLabel="Hex dump input mode"
              onChange={setMode}
              options={[
                { value: 'text', label: 'Text' },
                { value: 'file', label: 'File' },
              ]}
              value={mode}
            />
          </Field>

          {mode === 'text' ? (
            <Field hint={`${bytes?.length ?? 0} bytes as UTF-8`} label="Text">
              <Textarea
                aria-label="Text to dump"
                className="min-h-[180px]"
                onChange={(event) => {
                  setText(event.target.value);
                  setMode('text');
                }}
                placeholder="Paste text here…"
                value={text}
              />
            </Field>
          ) : (
            <div className="space-y-2">
              <FileDropzone
                accept="*/*"
                hint={`Files up to ${MAX_FILE_BYTES / 1024} KB stay in your browser.`}
                label="Drop a file here, or click to browse"
                onFiles={(files) => void readFile(files)}
              />
              {fileName && (
                <p className="break-all text-xs text-fg-muted">{fileName}</p>
              )}
              {fileError && <Callout variant="error">{fileError}</Callout>}
            </div>
          )}

          <Field label="Bytes per row">
            <SegmentedControl
              ariaLabel="Bytes per row"
              onChange={setBytesPerRow}
              options={bytesPerRowOptions}
              value={bytesPerRow}
            />
          </Field>

          <label className="flex w-fit cursor-pointer items-center gap-2 text-xs font-medium text-fg-muted">
            <input
              checked={uppercase}
              className="h-3.5 w-3.5 accent-[var(--accent)]"
              onChange={(event) => setUppercase(event.target.checked)}
              type="checkbox"
            />
            Uppercase hex
          </label>

          <div className="rounded-md border border-border bg-canvas-inset p-3 text-xs leading-6 text-fg-muted">
            <p>
              {bytes
                ? `${bytes.length.toLocaleString()} bytes · ${lineCount.toLocaleString()} rows`
                : 'No bytes to display yet.'}
            </p>
            <p className="mt-1">
              Non-printable bytes appear as <span className="font-mono">.</span>{' '}
              in the ASCII column.
            </p>
          </div>
        </div>
      </Panel>

      <ResultPanel
        emptyText="Enter text or drop a file to see the hex dump."
        filename="hex-dump.txt"
        label="Hex dump"
        value={dump}
      />
    </ToolLayout>
  );
}
