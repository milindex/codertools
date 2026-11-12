'use client';

import type { IHasher } from 'hash-wasm';
import { useRef, useState } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { CopyButton } from '@/components/ui/CopyButton';
import { Field } from '@/components/ui/Field';
import { FileDropzone } from '@/components/ui/FileDropzone';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { Select } from '@/components/ui/Select';
import { ToolLayout } from '@/components/ui/ToolLayout';
import { formatBytes } from '@/tools/crypto/_utils';

const ALGORITHMS = [
  'MD5',
  'SHA-1',
  'SHA-256',
  'SHA-384',
  'SHA-512',
  'CRC32',
] as const;

type Algorithm = (typeof ALGORITHMS)[number];

const createHasher = async (algorithm: Algorithm): Promise<IHasher> => {
  const wasm = await import('hash-wasm');
  switch (algorithm) {
    case 'MD5':
      return wasm.createMD5();
    case 'SHA-1':
      return wasm.createSHA1();
    case 'SHA-256':
      return wasm.createSHA256();
    case 'SHA-384':
      return wasm.createSHA384();
    case 'SHA-512':
      return wasm.createSHA512();
    case 'CRC32':
      return wasm.createCRC32();
    default:
      throw new Error(`Unsupported algorithm: ${algorithm}`);
  }
};

const CHUNK_SIZE = 4 * 1024 * 1024;

export default function FileHashTool() {
  const [file, setFile] = useState<File | null>(null);
  const [algorithm, setAlgorithm] = useState<Algorithm>('SHA-256');
  const [hash, setHash] = useState('');
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const runId = useRef(0);

  const hashFile = async (nextFile: File, nextAlgorithm: Algorithm) => {
    const currentRun = runId.current + 1;
    runId.current = currentRun;

    setFile(nextFile);
    setHash('');
    setError(null);
    setProgress(0);
    setBusy(true);

    try {
      const hasher = await createHasher(nextAlgorithm);
      hasher.init();

      for (let offset = 0; offset < nextFile.size; offset += CHUNK_SIZE) {
        if (runId.current !== currentRun) {
          return;
        }
        const buffer = await nextFile
          .slice(offset, offset + CHUNK_SIZE)
          .arrayBuffer();
        hasher.update(new Uint8Array(buffer));
        setProgress(
          Math.min(
            100,
            Math.round(
              ((offset + buffer.byteLength) / Math.max(nextFile.size, 1)) * 100
            )
          )
        );
        // Yield to the event loop so the progress bar can paint.
        await new Promise((resolve) => {
          setTimeout(resolve, 0);
        });
      }

      if (runId.current !== currentRun) {
        return;
      }

      setHash(hasher.digest().toLowerCase());
      setProgress(100);
    } catch (cause) {
      if (runId.current !== currentRun) {
        return;
      }
      setHash('');
      setError(
        cause instanceof Error ? cause.message : 'The file could not be hashed.'
      );
    } finally {
      if (runId.current === currentRun) {
        setBusy(false);
      }
    }
  };

  return (
    <div className="space-y-4">
      <ToolLayout>
        <Panel
          actions={
            busy ? (
              <Badge variant="accent">Hashing…</Badge>
            ) : hash ? (
              <Badge variant="success">Done</Badge>
            ) : undefined
          }
          description="The file is read in chunks in your browser. Nothing is uploaded."
          title="File"
        >
          <FileDropzone
            hint="Any file type — hashed locally with streaming reads"
            label="Drop a file here, or click to browse"
            onFiles={(files) => {
              const nextFile = files[0];
              if (nextFile) {
                void hashFile(nextFile, algorithm);
              }
            }}
          />

          <div className="mt-4 space-y-3">
            <Field label="Algorithm">
              <Select
                aria-label="Hash algorithm"
                disabled={busy}
                onChange={(event) => {
                  const nextAlgorithm = event.target.value as Algorithm;
                  setAlgorithm(nextAlgorithm);
                  if (file) {
                    void hashFile(file, nextAlgorithm);
                  }
                }}
                value={algorithm}
              >
                {ALGORITHMS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </Select>
            </Field>

            {file && (
              <div className="rounded-md border border-border bg-canvas-inset px-3 py-2 text-xs text-fg-muted">
                <p className="truncate font-medium text-fg">{file.name}</p>
                <p className="mt-0.5">
                  {formatBytes(file.size)} · {file.type || 'unknown type'}
                </p>
              </div>
            )}

            {busy && (
              <div>
                <div className="mb-1 flex items-center justify-between text-xs text-fg-muted">
                  <span>Reading file…</span>
                  <span>{progress}%</span>
                </div>
                <div
                  aria-label="Hashing progress"
                  aria-valuemax={100}
                  aria-valuemin={0}
                  aria-valuenow={progress}
                  className="h-1.5 overflow-hidden rounded-full bg-canvas-subtle"
                  role="progressbar"
                >
                  <div
                    className="h-full rounded-full bg-accent transition-[width]"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {file && !busy && (
              <Button
                onClick={() => {
                  void hashFile(file, algorithm);
                }}
                variant="primary"
              >
                Recompute hash
              </Button>
            )}
          </div>
        </Panel>

        <ResultPanel
          emptyText="Choose a file to calculate its hash."
          error={error}
          filename={`${algorithm.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.txt`}
          label={`${algorithm} checksum`}
          value={hash}
        >
          {hash ? (
            <div className="space-y-3">
              <div className="rounded-md border border-border bg-canvas-inset px-3 py-2 text-xs text-fg-muted">
                <p className="break-all font-medium text-fg">
                  {file?.name ?? 'File'}
                </p>
                <p className="mt-0.5">
                  {formatBytes(file?.size ?? 0)} · {algorithm} · lowercase hex
                </p>
              </div>
              <div className="overflow-hidden rounded-md border border-border bg-canvas-inset">
                <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-fg-muted">
                    Hash
                  </span>
                  <CopyButton value={hash} />
                </div>
                <pre className="max-h-[260px] overflow-auto whitespace-pre-wrap break-all p-3 font-mono text-[13px] leading-6 text-fg">
                  {hash}
                </pre>
              </div>
            </div>
          ) : undefined}
        </ResultPanel>
      </ToolLayout>
    </div>
  );
}
