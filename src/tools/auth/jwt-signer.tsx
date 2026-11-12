'use client';

import type { JWTPayload } from 'jose';
import { useState } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Textarea } from '@/components/ui/Textarea';
import { ToolLayout } from '@/components/ui/ToolLayout';

type Algorithm = 'HS256' | 'HS512';

const DEFAULT_HEADER = `{
  "alg": "HS256",
  "typ": "JWT"
}`;

const DEFAULT_CLAIMS = `{
  "sub": "1234567890",
  "name": "John Doe",
  "admin": true
}`;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isRecordSafe = (value: string): boolean => {
  try {
    return isRecord(JSON.parse(value));
  } catch {
    return false;
  }
};

export default function JwtSignerTool() {
  const [algorithm, setAlgorithm] = useState<Algorithm>('HS256');
  const [headerText, setHeaderText] = useState(DEFAULT_HEADER);
  const [claimsText, setClaimsText] = useState(DEFAULT_CLAIMS);
  const [secret, setSecret] = useState('');
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const changeAlgorithm = (next: Algorithm) => {
    setAlgorithm(next);
    setToken('');
    setError(null);
    try {
      const parsed: unknown = JSON.parse(headerText);
      if (isRecord(parsed)) {
        setHeaderText(JSON.stringify({ ...parsed, alg: next }, null, 2));
      }
    } catch {
      // Keep invalid JSON untouched so the user can fix it.
    }
  };

  const addTimestamp = (claim: 'iat' | 'exp') => {
    setError(null);
    try {
      const parsed: unknown = JSON.parse(claimsText);
      if (!isRecord(parsed)) {
        setError('Claims must be a JSON object.');
        return;
      }
      const now = Math.floor(Date.now() / 1000);
      setClaimsText(
        JSON.stringify(
          {
            ...parsed,
            [claim]: claim === 'exp' ? now + 3600 : now,
          },
          null,
          2
        )
      );
      setToken('');
    } catch {
      setError('Fix the claims JSON before adding a timestamp.');
    }
  };

  const sign = async () => {
    if (!secret) {
      setError('Enter a signing secret.');
      return;
    }

    setBusy(true);
    setToken('');
    setError(null);

    try {
      let parsedHeader: unknown;
      let parsedClaims: unknown;
      try {
        parsedHeader = JSON.parse(headerText);
      } catch {
        throw new Error('The JWT header is not valid JSON.');
      }
      try {
        parsedClaims = JSON.parse(claimsText);
      } catch {
        throw new Error('The JWT claims are not valid JSON.');
      }

      if (!isRecord(parsedHeader)) {
        throw new Error('The JWT header must be a JSON object.');
      }
      if (!isRecord(parsedClaims)) {
        throw new Error('The JWT claims must be a JSON object.');
      }

      const { SignJWT } = await import('jose');
      const signed = await new SignJWT(parsedClaims as JWTPayload)
        .setProtectedHeader({ ...parsedHeader, alg: algorithm })
        .sign(new TextEncoder().encode(secret));

      setToken(signed);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'The JWT could not be signed.'
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <ToolLayout>
        <Panel
          actions={busy ? <Badge variant="accent">Signing…</Badge> : undefined}
          description="Edit the protected header and claims, then sign with a shared secret."
          title="JWT contents"
        >
          <div className="space-y-3">
            <Field label="Signing algorithm">
              <SegmentedControl
                ariaLabel="JWT signing algorithm"
                onChange={(value) => changeAlgorithm(value as Algorithm)}
                options={[
                  { value: 'HS256', label: 'HS256' },
                  { value: 'HS512', label: 'HS512' },
                ]}
                value={algorithm}
              />
            </Field>

            <Field
              hint="Protected header JSON"
              label="Header"
              error={
                headerText.trim() && !isRecordSafe(headerText)
                  ? 'Header is not a valid JSON object.'
                  : undefined
              }
            >
              <Textarea
                aria-label="JWT header JSON"
                className="min-h-[110px]"
                onChange={(event) => {
                  setHeaderText(event.target.value);
                  setToken('');
                  setError(null);
                }}
                value={headerText}
              />
            </Field>

            <Field
              hint="Payload claims JSON"
              label="Claims"
              error={
                claimsText.trim() && !isRecordSafe(claimsText)
                  ? 'Claims are not a valid JSON object.'
                  : undefined
              }
            >
              <Textarea
                aria-label="JWT claims JSON"
                className="min-h-[170px]"
                onChange={(event) => {
                  setClaimsText(event.target.value);
                  setToken('');
                  setError(null);
                }}
                value={claimsText}
              />
            </Field>

            <div className="flex flex-wrap gap-2">
              <Button onClick={() => addTimestamp('iat')} size="sm">
                Add iat
              </Button>
              <Button onClick={() => addTimestamp('exp')} size="sm">
                Add exp (+1 hour)
              </Button>
            </div>

            <Field label="Secret">
              <Input
                aria-label="JWT signing secret"
                autoComplete="off"
                onChange={(event) => {
                  setSecret(event.target.value);
                  setToken('');
                  setError(null);
                }}
                placeholder="Enter the HMAC secret…"
                type="password"
                value={secret}
              />
            </Field>
          </div>

          <div className="mt-3">
            <Button
              disabled={busy}
              onClick={() => void sign()}
              variant="primary"
            >
              {busy ? 'Signing…' : 'Sign JWT'}
            </Button>
          </div>

          <Callout className="mt-4" variant="info">
            The algorithm selector overrides <code>header.alg</code> when
            signing. Use a long, random secret for HMAC.
          </Callout>
        </Panel>

        <ResultPanel
          emptyText="The signed JWT will appear here."
          error={error}
          filename="token.jwt"
          label="Signed JWT"
          value={token}
        />
      </ToolLayout>
    </div>
  );
}
