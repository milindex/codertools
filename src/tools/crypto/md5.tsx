'use client';

import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Callout } from '@/components/ui/Callout';
import { Field } from '@/components/ui/Field';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Textarea } from '@/components/ui/Textarea';
import { ToolLayout } from '@/components/ui/ToolLayout';

export default function Md5Tool() {
  const [input, setInput] = useState('');
  const [uppercase, setUppercase] = useState(false);
  const [hash, setHash] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    if (!input) {
      setHash('');
      setError(null);
      setBusy(false);
      return () => {
        active = false;
      };
    }

    setBusy(true);
    (async () => {
      try {
        const { md5 } = await import('hash-wasm');
        const digest = await md5(input);
        if (!active) {
          return;
        }
        setHash(uppercase ? digest.toUpperCase() : digest);
        setError(null);
      } catch (cause) {
        if (!active) {
          return;
        }
        setHash('');
        setError(
          cause instanceof Error ? cause.message : 'The MD5 hash failed.'
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
  }, [input, uppercase]);

  return (
    <div className="space-y-4">
      <ToolLayout>
        <Panel
          actions={busy ? <Badge variant="accent">Hashing…</Badge> : undefined}
          description="MD5 is fast but not collision resistant. Use SHA-256 for anything security related."
          title="Text"
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

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <Field className="w-auto" label="Hex case">
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
            <Badge>{hash ? '128-bit digest' : 'MD5'}</Badge>
          </div>

          <Callout className="mt-4" variant="warning">
            MD5 is unsuitable for passwords or signatures. It is fine for
            checksums and legacy compatibility.
          </Callout>
        </Panel>

        <ResultPanel
          emptyText="Enter text to generate its MD5 hash."
          error={error}
          filename="md5.txt"
          label="MD5 hash"
          value={hash}
        />
      </ToolLayout>
    </div>
  );
}
