'use client';

import { useEffect, useMemo, useState } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { CopyButton } from '@/components/ui/CopyButton';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { Textarea } from '@/components/ui/Textarea';
import { ToolLayout } from '@/components/ui/ToolLayout';
import { base64UrlDecodeText } from '@/tools/auth/_utils';

type JsonRecord = Record<string, unknown>;

type Decoded = {
  header: JsonRecord;
  payload: JsonRecord;
  headerJson: string;
  payloadJson: string;
};

const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const formatDuration = (totalSeconds: number): string => {
  const seconds = Math.max(0, Math.round(totalSeconds));
  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor((seconds % 86_400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = seconds % 60;
  const parts: string[] = [];
  if (days) {
    parts.push(`${days}d`);
  }
  if (hours) {
    parts.push(`${hours}h`);
  }
  if (minutes) {
    parts.push(`${minutes}m`);
  }
  if (!days && !hours) {
    parts.push(`${rest}s`);
  }
  return parts.join(' ') || '0s';
};

const toEpochSeconds = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (
    typeof value === 'string' &&
    value.trim() !== '' &&
    Number.isFinite(Number(value))
  ) {
    return Number(value);
  }
  return null;
};

const formatTime = (epochSeconds: number): string => {
  const date = new Date(epochSeconds * 1000);
  if (Number.isNaN(date.getTime())) {
    return 'Invalid date';
  }
  return `${date.toLocaleString()} (${date.toISOString()})`;
};

const formatAudience = (value: unknown): string => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).join(', ');
  }
  return String(value);
};

export default function JwtInspectorTool() {
  const [token, setToken] = useState('');
  const [secret, setSecret] = useState('');
  const [verified, setVerified] = useState<boolean | null>(null);
  const [verifyMessage, setVerifyMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(0);

  useEffect(() => {
    const update = () => setNow(Date.now() / 1000);
    update();
    const id = setInterval(update, 30000);
    return () => clearInterval(id);
  }, []);

  const parsed = useMemo<{ data?: Decoded; error?: string }>(() => {
    if (!token.trim()) {
      return {};
    }
    const parts = token.trim().split('.');
    if (parts.length !== 3) {
      return {
        error:
          'A JWT must have three dot-separated parts: header.payload.signature.',
      };
    }
    try {
      const header: unknown = JSON.parse(base64UrlDecodeText(parts[0] ?? ''));
      const payload: unknown = JSON.parse(base64UrlDecodeText(parts[1] ?? ''));
      if (!isRecord(header) || !isRecord(payload)) {
        return { error: 'The JWT header and payload must be JSON objects.' };
      }
      return {
        data: {
          header,
          payload,
          headerJson: JSON.stringify(header, null, 2),
          payloadJson: JSON.stringify(payload, null, 2),
        },
      };
    } catch {
      return {
        error:
          'The token could not be decoded. Check that the header and payload are valid base64url JSON.',
      };
    }
  }, [token]);

  const data = parsed.data;
  const exp = data ? toEpochSeconds(data.payload.exp) : null;
  const nbf = data ? toEpochSeconds(data.payload.nbf) : null;
  const iat = data ? toEpochSeconds(data.payload.iat) : null;

  let status: {
    label: string;
    variant: 'success' | 'warning' | 'danger';
  } | null = null;
  if (data) {
    if (exp !== null && exp <= now) {
      status = { label: 'Expired', variant: 'danger' };
    } else if (nbf !== null && nbf > now) {
      status = { label: 'Not yet valid', variant: 'warning' };
    } else if (exp !== null) {
      status = { label: 'Not expired', variant: 'success' };
    } else {
      status = { label: 'No expiry', variant: 'warning' };
    }
  }

  const claimRows: { label: string; value: string }[] = [];
  if (data) {
    const { payload } = data;
    if (payload.iss !== undefined) {
      claimRows.push({ label: 'Issuer (iss)', value: String(payload.iss) });
    }
    if (payload.sub !== undefined) {
      claimRows.push({ label: 'Subject (sub)', value: String(payload.sub) });
    }
    if (payload.aud !== undefined) {
      claimRows.push({
        label: 'Audience (aud)',
        value: formatAudience(payload.aud),
      });
    }
    if (payload.jti !== undefined) {
      claimRows.push({ label: 'JWT ID (jti)', value: String(payload.jti) });
    }
    if (iat !== null) {
      claimRows.push({
        label: 'Issued at (iat)',
        value: `${formatTime(iat)} · ${formatDuration(now - iat)} ago`,
      });
    }
    if (nbf !== null) {
      claimRows.push({
        label: 'Not before (nbf)',
        value:
          nbf > now
            ? `${formatTime(nbf)} · in ${formatDuration(nbf - now)}`
            : formatTime(nbf),
      });
    }
    if (exp !== null) {
      claimRows.push({
        label: 'Expires (exp)',
        value:
          exp > now
            ? `${formatTime(exp)} · in ${formatDuration(exp - now)}`
            : `${formatTime(exp)} · ${formatDuration(now - exp)} ago`,
      });
    }
  }

  const verify = async () => {
    if (!token.trim()) {
      setVerified(null);
      setVerifyMessage('Paste a JWT first.');
      return;
    }
    if (!secret) {
      setVerified(null);
      setVerifyMessage('Enter the HMAC secret used to sign the token.');
      return;
    }

    setBusy(true);
    setVerified(null);
    setVerifyMessage('');
    try {
      const { compactVerify } = await import('jose');
      await compactVerify(token.trim(), new TextEncoder().encode(secret));
      setVerified(true);
      setVerifyMessage(
        'The signature is valid for this secret. Claims were not validated.'
      );
    } catch (cause) {
      setVerified(false);
      setVerifyMessage(
        cause instanceof Error
          ? `Signature verification failed: ${cause.message}`
          : 'Signature verification failed.'
      );
    } finally {
      setBusy(false);
    }
  };

  const combined = data
    ? `Header\n${data.headerJson}\n\nPayload\n${data.payloadJson}`
    : '';

  return (
    <div className="space-y-4">
      <ToolLayout>
        <Panel
          description="Decoding happens locally. The payload is shown as-is; it is not trusted until verified."
          title="JWT"
        >
          <Field
            hint={`${token.trim().length.toLocaleString()} characters`}
            label="Token"
          >
            <Textarea
              aria-label="JWT token"
              className="min-h-[150px] break-all font-mono text-xs"
              onChange={(event) => {
                setToken(event.target.value);
                setVerified(null);
                setVerifyMessage('');
              }}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.…"
              value={token}
            />
          </Field>

          <div className="mt-3 space-y-3">
            <Field
              hint="Used only for signature verification"
              label="HMAC secret (optional)"
            >
              <Input
                aria-label="JWT verification secret"
                autoComplete="off"
                onChange={(event) => {
                  setSecret(event.target.value);
                  setVerified(null);
                  setVerifyMessage('');
                }}
                placeholder="Enter the shared secret…"
                type="password"
                value={secret}
              />
            </Field>

            <Button disabled={busy} onClick={() => void verify()}>
              {busy ? 'Verifying…' : 'Verify signature'}
            </Button>

            {verifyMessage && (
              <Callout
                variant={
                  verified === true
                    ? 'success'
                    : verified === false
                      ? 'error'
                      : 'info'
                }
              >
                {verifyMessage}
              </Callout>
            )}
          </div>

          <Callout className="mt-4" variant="warning">
            Never trust unverified claims. Decoding a token does not prove it
            was issued by a trusted party.
          </Callout>
        </Panel>

        <ResultPanel
          emptyText="Paste a JWT to inspect its header and claims."
          error={parsed.error}
          filename="jwt-decoded.txt"
          label="Decoded token"
          value={combined}
        >
          {data ? (
            <div className="space-y-4">
              {status && (
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={status.variant}>{status.label}</Badge>
                  <Badge>{String(data.header.alg ?? 'unknown alg')}</Badge>
                  {typeof data.header.typ === 'string' && (
                    <Badge>{data.header.typ}</Badge>
                  )}
                </div>
              )}

              <div className="overflow-hidden rounded-md border border-border bg-canvas-inset">
                <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-fg-muted">
                    Header
                  </span>
                  <CopyButton value={data.headerJson} />
                </div>
                <pre className="max-h-[220px] overflow-auto whitespace-pre-wrap break-words p-3 font-mono text-[13px] leading-6 text-fg">
                  {data.headerJson}
                </pre>
              </div>

              <div className="overflow-hidden rounded-md border border-border bg-canvas-inset">
                <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-fg-muted">
                    Payload
                  </span>
                  <CopyButton value={data.payloadJson} />
                </div>
                <pre className="max-h-[260px] overflow-auto whitespace-pre-wrap break-words p-3 font-mono text-[13px] leading-6 text-fg">
                  {data.payloadJson}
                </pre>
              </div>

              {claimRows.length > 0 && (
                <dl className="divide-y divide-border overflow-hidden rounded-md border border-border">
                  {claimRows.map((row) => (
                    <div
                      className="grid gap-1 px-3 py-2 sm:grid-cols-[8rem_1fr] sm:gap-3"
                      key={row.label}
                    >
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-fg-muted">
                        {row.label}
                      </dt>
                      <dd className="break-words font-mono text-xs leading-5 text-fg">
                        {row.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          ) : undefined}
        </ResultPanel>
      </ToolLayout>
    </div>
  );
}
