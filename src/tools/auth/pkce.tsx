'use client';

import { useCallback, useEffect, useState } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { CopyButton } from '@/components/ui/CopyButton';
import { Field } from '@/components/ui/Field';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Select } from '@/components/ui/Select';
import { ToolLayout } from '@/components/ui/ToolLayout';
import { base64UrlEncode, textEncoder } from '@/tools/auth/_utils';

type Method = 'S256' | 'plain';

const LENGTHS = [43, 64, 96, 128] as const;

const OutputBlock = ({ label, value }: { label: string; value: string }) => (
  <div className="overflow-hidden rounded-md border border-border bg-canvas-inset">
    <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-fg-muted">
        {label}
      </span>
      <CopyButton value={value} />
    </div>
    <pre className="max-h-[180px] overflow-auto whitespace-pre-wrap break-all p-3 font-mono text-[13px] leading-6 text-fg">
      {value}
    </pre>
  </div>
);

export default function PkceTool() {
  const [method, setMethod] = useState<Method>('S256');
  const [length, setLength] = useState<number>(43);
  const [verifier, setVerifier] = useState('');
  const [challenge, setChallenge] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const regenerate = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      if (!globalThis.crypto?.subtle || !globalThis.crypto?.getRandomValues) {
        throw new Error(
          'Web Crypto is not available. Use a modern browser over HTTPS.'
        );
      }
      const byteLength = Math.ceil((length * 3) / 4);
      const random = globalThis.crypto.getRandomValues(
        new Uint8Array(byteLength)
      );
      const nextVerifier = base64UrlEncode(random).slice(0, length);

      let nextChallenge = nextVerifier;
      if (method === 'S256') {
        const digest = await globalThis.crypto.subtle.digest(
          'SHA-256',
          textEncoder.encode(nextVerifier)
        );
        nextChallenge = base64UrlEncode(new Uint8Array(digest));
      }

      setVerifier(nextVerifier);
      setChallenge(nextChallenge);
    } catch (cause) {
      setVerifier('');
      setChallenge('');
      setError(
        cause instanceof Error
          ? cause.message
          : 'The PKCE values could not be generated.'
      );
    } finally {
      setBusy(false);
    }
  }, [length, method]);

  useEffect(() => {
    void regenerate();
  }, [regenerate]);

  return (
    <div className="space-y-4">
      <ToolLayout>
        <Panel
          actions={
            busy ? <Badge variant="accent">Generating…</Badge> : undefined
          }
          description="PKCE protects the OAuth authorization code flow for public clients."
          title="PKCE settings"
        >
          <div className="space-y-3">
            <Field
              hint="S256 hashes the verifier; plain sends it unchanged."
              label="Challenge method"
            >
              <SegmentedControl
                ariaLabel="PKCE challenge method"
                onChange={(value) => setMethod(value as Method)}
                options={[
                  { value: 'S256', label: 'S256 (recommended)' },
                  { value: 'plain', label: 'plain' },
                ]}
                value={method}
              />
            </Field>

            <Field
              hint="Length of the random code verifier"
              label="Verifier length"
            >
              <Select
                aria-label="PKCE verifier length"
                onChange={(event) => setLength(Number(event.target.value))}
                value={length}
              >
                {LENGTHS.map((item) => (
                  <option key={item} value={item}>
                    {item} characters
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="mt-3">
            <Button
              disabled={busy}
              onClick={() => void regenerate()}
              variant="primary"
            >
              {busy ? 'Generating…' : 'Regenerate'}
            </Button>
          </div>

          <Callout className="mt-4" variant="info">
            Send the <strong>code challenge</strong> and method with the
            authorization request. Send the unmodified{' '}
            <strong>code verifier</strong> with the token request.
          </Callout>
        </Panel>

        <ResultPanel
          emptyText="PKCE values will appear here."
          error={error}
          filename="pkce.txt"
          label="PKCE values"
          value={verifier}
        >
          {verifier ? (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Badge variant="accent">{method}</Badge>
                <Badge>{verifier.length} characters</Badge>
              </div>
              <OutputBlock label="Code verifier" value={verifier} />
              <OutputBlock label="Code challenge" value={challenge} />
            </div>
          ) : undefined}
        </ResultPanel>
      </ToolLayout>
    </div>
  );
}
