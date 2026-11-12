'use client';

import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Callout } from '@/components/ui/Callout';
import { CopyButton } from '@/components/ui/CopyButton';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { ToolLayout } from '@/components/ui/ToolLayout';
import { bytesToBase64, bytesToHex, textEncoder } from '@/tools/crypto/_utils';

const ALGORITHMS = [
  { name: 'SHA-1', label: 'HMAC-SHA-1' },
  { name: 'SHA-256', label: 'HMAC-SHA-256' },
  { name: 'SHA-384', label: 'HMAC-SHA-384' },
  { name: 'SHA-512', label: 'HMAC-SHA-512' },
] as const;

type Algorithm = (typeof ALGORITHMS)[number]['name'];

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

export default function HmacTool() {
  const [secret, setSecret] = useState('');
  const [message, setMessage] = useState('');
  const [algorithm, setAlgorithm] = useState<Algorithm>('SHA-256');
  const [hex, setHex] = useState('');
  const [base64, setBase64] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    if (!secret) {
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
        const key = await globalThis.crypto.subtle.importKey(
          'raw',
          textEncoder.encode(secret),
          { name: 'HMAC', hash: algorithm },
          false,
          ['sign']
        );
        const signature = await globalThis.crypto.subtle.sign(
          'HMAC',
          key,
          textEncoder.encode(message)
        );
        if (!active) {
          return;
        }
        const bytes = new Uint8Array(signature);
        setHex(bytesToHex(bytes));
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
            : 'The HMAC signature could not be generated.'
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
  }, [secret, message, algorithm]);

  return (
    <div className="space-y-4">
      <ToolLayout>
        <Panel
          actions={busy ? <Badge variant="accent">Signing…</Badge> : undefined}
          description="HMAC combines a secret key with a message so both sides can verify integrity and authenticity."
          title="Key and message"
        >
          <div className="space-y-3">
            <Field hint="Encoded as UTF-8" label="Secret key">
              <Input
                aria-label="Secret key"
                autoComplete="off"
                onChange={(event) => setSecret(event.target.value)}
                placeholder="Enter the shared secret…"
                type="text"
                value={secret}
              />
            </Field>

            <Field label="Algorithm">
              <Select
                aria-label="HMAC algorithm"
                onChange={(event) =>
                  setAlgorithm(event.target.value as Algorithm)
                }
                value={algorithm}
              >
                {ALGORITHMS.map((item) => (
                  <option key={item.name} value={item.name}>
                    {item.label}
                  </option>
                ))}
              </Select>
            </Field>

            <Field
              hint={`${message.length.toLocaleString()} characters`}
              label="Message"
            >
              <Textarea
                aria-label="Message"
                className="min-h-[140px]"
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Enter the message to sign…"
                value={message}
              />
            </Field>
          </div>

          <Callout className="mt-4" variant="warning">
            Keep the secret key private. HMAC proves integrity only to parties
            that share the key.
          </Callout>
        </Panel>

        <ResultPanel
          emptyText="Enter a secret key to generate an HMAC signature."
          error={error}
          filename={`hmac-${algorithm.toLowerCase()}.txt`}
          label={`${algorithm} signature`}
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
