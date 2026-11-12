'use client';

import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Field } from '@/components/ui/Field';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { Textarea } from '@/components/ui/Textarea';
import { ToolLayout } from '@/components/ui/ToolLayout';

const OutputRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border py-2 last:border-b-0">
    <span className="text-xs font-semibold text-fg-muted">{label}</span>
    <code className="break-all font-mono text-[13px] text-fg">{value}</code>
  </div>
);

export default function Crc32Tool() {
  const [input, setInput] = useState('');
  const [checksum, setChecksum] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    if (!input) {
      setChecksum('');
      setError(null);
      setBusy(false);
      return () => {
        active = false;
      };
    }

    setBusy(true);
    (async () => {
      try {
        const { crc32 } = await import('hash-wasm');
        const value = await crc32(input);
        if (!active) {
          return;
        }
        setChecksum(value.toLowerCase());
        setError(null);
      } catch (cause) {
        if (!active) {
          return;
        }
        setChecksum('');
        setError(
          cause instanceof Error
            ? cause.message
            : 'The CRC32 checksum could not be computed.'
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
  }, [input]);

  const decimal = checksum ? String(Number.parseInt(checksum, 16)) : '';

  return (
    <div className="space-y-4">
      <ToolLayout>
        <Panel
          actions={
            busy ? <Badge variant="accent">Computing…</Badge> : undefined
          }
          description="CRC-32 (IEEE 802.3) is a checksum for detecting accidental corruption, not tampering."
          title="Input"
        >
          <Field
            hint={`${input.length.toLocaleString()} characters`}
            label="Text"
          >
            <Textarea
              aria-label="Text to checksum"
              onChange={(event) => setInput(event.target.value)}
              placeholder="Type or paste text…"
              value={input}
            />
          </Field>
          <p className="mt-3 text-xs leading-5 text-fg-muted">
            The input is encoded as UTF-8 before the checksum is calculated.
          </p>
        </Panel>

        <ResultPanel
          emptyText="Enter text to calculate its CRC32 checksum."
          error={error}
          filename="crc32.txt"
          label="CRC32 checksum"
          value={checksum}
        >
          {checksum ? (
            <div className="rounded-md border border-border bg-canvas-inset px-3 py-1">
              <OutputRow label="Hexadecimal" value={checksum} />
              <OutputRow label="Hexadecimal (0x)" value={`0x${checksum}`} />
              <OutputRow label="Decimal" value={decimal} />
              <OutputRow label="Uppercase" value={checksum.toUpperCase()} />
            </div>
          ) : undefined}
        </ResultPanel>
      </ToolLayout>
    </div>
  );
}
