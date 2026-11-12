'use client';

import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/Badge';
import { CopyButton } from '@/components/ui/CopyButton';
import { Field } from '@/components/ui/Field';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { ToolLayout } from '@/components/ui/ToolLayout';
import { bytesToBase64, bytesToHex, textEncoder } from '@/tools/crypto/_utils';

const ALGORITHMS = [
  { value: 'SHA-1', label: 'SHA-1 (160-bit)' },
  { value: 'SHA-256', label: 'SHA-256 (256-bit)' },
  { value: 'SHA-384', label: 'SHA-384 (384-bit)' },
  { value: 'SHA-512', label: 'SHA-512 (512-bit)' },
] as const;

type Algorithm = (typeof ALGORITHMS)[number]['value'];

const OutputBlock = ({ label, value }: { label: string; value: string }) => (
  <div className="overflow-hidden rounded-md border border-border bg-canvas-inset">
    <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-fg-muted">
        {label}
      </span>
      <CopyButton value={value} />
    </div>
    <pre className="max-h-[220px] overflow-auto whitespace-pre-wrap break-all p-3 font-mono text-[13px] leading-6 text-fg">
      {value}
    </pre>
  </div>
);

export default function ShaTool() {
  const [input, setInput] = useState('');
  const [algorithm, setAlgorithm] = useState<Algorithm>('SHA-256');
  const [uppercase, setUppercase] = useState(false);
  const [hex, setHex] = useState('');
  const [base64, setBase64] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    if (!input) {
      setHex('');
      setBase64('');
      setError(null);
      setBusy(false);
      return () => {
        active = false;
      };
    }

    setBusy(true);
    (async () => {
      try {
        if (!globalThis.crypto?.subtle) {
          throw new Error(
            'Web Crypto is not available. Use a modern browser over HTTPS.'
          );
        }
        const digest = await globalThis.crypto.subtle.digest(
          algorithm,
          textEncoder.encode(input)
        );
        const bytes = new Uint8Array(digest);
        const nextHex = bytesToHex(bytes);
        if (!active) {
          return;
        }
        setHex(uppercase ? nextHex.toUpperCase() : nextHex);
        setBase64(bytesToBase64(bytes));
        setError(null);
      } catch (cause) {
        if (!active) {
          return;
        }
        setHex('');
        setBase64('');
        setError(
          cause instanceof Error
            ? cause.message
            : 'The hash could not be computed.'
        );
      } finally {
        if (active) {
          setBusy(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [input, algorithm, uppercase]);

  return (
    <div className="space-y-4">
      <ToolLayout>
        <Panel
          actions={busy ? <Badge variant="accent">Hashing…</Badge> : undefined}
          description="Hashes are computed locally with the Web Crypto API."
          title="Input"
        >
          <Field
            hint={`${input.length.toLocaleString()} characters`}
            label="Text to hash"
          >
            <Textarea
              aria-label="Text to hash"
              onChange={(event) => setInput(event.target.value)}
              placeholder="Type or paste text…"
              value={input}
            />
          </Field>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Field label="Algorithm">
              <Select
                aria-label="Hash algorithm"
                onChange={(event) =>
                  setAlgorithm(event.target.value as Algorithm)
                }
                value={algorithm}
              >
                {ALGORITHMS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Hex case">
              <SegmentedControl
                ariaLabel="Hex case"
                onChange={(value) => setUppercase(value === 'upper')}
                options={[
                  { value: 'lower', label: 'lowercase' },
                  { value: 'upper', label: 'UPPERCASE' },
                ]}
                value={uppercase ? 'upper' : 'lower'}
              />
            </Field>
          </div>

          <p className="mt-3 text-xs leading-5 text-fg-muted">
            SHA-1 is considered weak for signatures. Prefer SHA-256 or stronger
            for new work.
          </p>
        </Panel>

        <ResultPanel
          emptyText="Enter text to generate a SHA hash."
          error={error}
          filename={`sha-${algorithm.toLowerCase()}.txt`}
          label={`${algorithm} digest`}
          value={hex}
        >
          {hex ? (
            <div className="space-y-3">
              <OutputBlock label="Hexadecimal" value={hex} />
              <OutputBlock label="Base64" value={base64} />
            </div>
          ) : undefined}
        </ResultPanel>
      </ToolLayout>
    </div>
  );
}
