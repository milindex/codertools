'use client';

import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Callout } from '@/components/ui/Callout';
import { FileDropzone } from '@/components/ui/FileDropzone';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { ToolLayout } from '@/components/ui/ToolLayout';

import { formatBytes, textToBytes } from './codec';

type LoadedFile = {
  name: string;
  type: string;
  size: number;
  dataUri: string;
};

export default function Base64FileToDataUriTool() {
  const [file, setFile] = useState<LoadedFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const stats = useMemo(() => {
    if (!file) {
      return null;
    }
    const comma = file.dataUri.indexOf(',');
    const payload = comma === -1 ? '' : file.dataUri.slice(comma + 1);
    return {
      payloadLength: payload.length,
      uriBytes: textToBytes(file.dataUri).length,
    };
  }, [file]);

  const handleFiles = (files: File[]) => {
    const selected = files[0];
    if (!selected) {
      return;
    }

    setError(null);
    setLoading(true);
    setFile(null);

    const reader = new FileReader();
    reader.onload = () => {
      const dataUri = typeof reader.result === 'string' ? reader.result : '';
      if (!dataUri.startsWith('data:')) {
        setError('This file could not be read as a data URI.');
        setLoading(false);
        return;
      }
      setFile({
        name: selected.name || 'file',
        type: selected.type || 'application/octet-stream',
        size: selected.size,
        dataUri,
      });
      setLoading(false);
    };
    reader.onerror = () => {
      setError('The file could not be read. It may have moved or be locked.');
      setLoading(false);
    };
    try {
      reader.readAsDataURL(selected);
    } catch {
      setError('The file could not be read.');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <ToolLayout>
        <Panel
          description="The file never leaves your browser. Everything is read with the FileReader API."
          title="Choose a file"
        >
          <FileDropzone
            hint="Any file type — images, fonts, PDFs, audio and more"
            label={
              loading ? 'Reading file…' : 'Drop a file here, or click to browse'
            }
            onFiles={handleFiles}
          />

          {file && stats ? (
            <div className="mt-4 space-y-3">
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-xs">
                <dt className="text-fg-muted">Name</dt>
                <dd className="truncate font-mono text-fg" title={file.name}>
                  {file.name}
                </dd>
                <dt className="text-fg-muted">MIME type</dt>
                <dd className="font-mono text-fg">{file.type}</dd>
                <dt className="text-fg-muted">Size</dt>
                <dd className="text-fg">
                  {formatBytes(file.size)}{' '}
                  <span className="text-fg-muted">
                    ({file.size.toLocaleString()} bytes)
                  </span>
                </dd>
                <dt className="text-fg-muted">Data URI</dt>
                <dd className="text-fg">
                  {formatBytes(stats.uriBytes)}{' '}
                  <span className="text-fg-muted">
                    ({stats.payloadLength.toLocaleString()} Base64 characters)
                  </span>
                </dd>
              </dl>

              <div className="flex flex-wrap gap-2">
                <Badge variant="accent">Base64 data URI</Badge>
                <Badge>Offline</Badge>
              </div>
            </div>
          ) : (
            <Callout className="mt-4" variant="info">
              The result is a <code>data:&lt;mime&gt;;base64,…</code> URI that
              you can paste into HTML, CSS or JavaScript.
            </Callout>
          )}
        </Panel>

        <ResultPanel
          emptyText="Drop a file to generate its Base64 data URI."
          error={error}
          filename={
            file
              ? `${file.name.replace(/[\\/:*?"<>|]/g, '_')}.data-uri.txt`
              : 'data-uri.txt'
          }
          label="Data URI"
          value={file?.dataUri ?? ''}
        />
      </ToolLayout>
    </div>
  );
}
