'use client';

import { useEffect, useMemo, useState } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Callout } from '@/components/ui/Callout';
import { CopyButton } from '@/components/ui/CopyButton';
import { Field } from '@/components/ui/Field';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { ToolLayout } from '@/components/ui/ToolLayout';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

const decodeBase32 = (input: string): Uint8Array<ArrayBuffer> => {
  const clean = input.toUpperCase().replace(/[\s-]/g, '').replace(/=+$/, '');
  if (!clean) {
    throw new Error('Enter a base32 secret.');
  }

  let buffer = 0;
  let bits = 0;
  const output: number[] = [];
  for (const character of clean) {
    const index = BASE32_ALPHABET.indexOf(character);
    if (index === -1) {
      throw new Error(
        `"${character}" is not a valid base32 character. Use A–Z and 2–7.`
      );
    }
    buffer = (buffer << 5) | index;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      output.push((buffer >>> bits) & 0xff);
    }
  }

  if (output.length === 0) {
    throw new Error('The base32 secret is too short.');
  }
  return new Uint8Array(output);
};

const computeTotp = async (
  secret: Uint8Array<ArrayBuffer>,
  counter: number,
  digits: number
): Promise<string> => {
  const bytes = new Uint8Array(8);
  let value = BigInt(counter);
  for (let index = 7; index >= 0; index -= 1) {
    bytes[index] = Number(value & 0xffn);
    value >>= 8n;
  }

  const key = await globalThis.crypto.subtle.importKey(
    'raw',
    secret,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );
  const signature = new Uint8Array(
    await globalThis.crypto.subtle.sign('HMAC', key, bytes)
  );
  const offset = (signature[signature.length - 1] ?? 0) & 0x0f;
  const binary =
    (((signature[offset] ?? 0) & 0x7f) << 24) |
    ((signature[offset + 1] ?? 0) << 16) |
    ((signature[offset + 2] ?? 0) << 8) |
    (signature[offset + 3] ?? 0);
  return String(binary % 10 ** digits).padStart(digits, '0');
};

const groupCode = (code: string): string => {
  if (code.length === 6) {
    return `${code.slice(0, 3)} ${code.slice(3)}`;
  }
  if (code.length === 8) {
    return `${code.slice(0, 4)} ${code.slice(4)}`;
  }
  return code;
};

export default function TotpTool() {
  const [input, setInput] = useState('');
  const [uriSecret, setUriSecret] = useState<string | null>(null);
  const [otpLabel, setOtpLabel] = useState<string | null>(null);
  const [digits, setDigits] = useState<6 | 8>(6);
  const [period, setPeriod] = useState(30);
  const [now, setNow] = useState(() => Date.now());
  const [codes, setCodes] = useState<{
    current: string;
    previous: string;
    next: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [uriError, setUriError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const secretSource = uriSecret ?? input;

  const decoded = useMemo<{
    bytes: Uint8Array<ArrayBuffer> | null;
    error: string | null;
  }>(() => {
    if (!secretSource.trim()) {
      return { bytes: null, error: null };
    }
    try {
      return { bytes: decodeBase32(secretSource), error: null };
    } catch (cause) {
      return {
        bytes: null,
        error:
          cause instanceof Error ? cause.message : 'Invalid base32 secret.',
      };
    }
  }, [secretSource]);

  const counter = Math.floor(now / 1000 / Math.max(period, 1));

  useEffect(() => {
    let active = true;
    const secret = decoded.bytes;

    if (!secret) {
      setCodes(null);
      setCodeError(null);
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
        const [current, previous, next] = await Promise.all([
          computeTotp(secret, counter, digits),
          computeTotp(secret, counter - 1, digits),
          computeTotp(secret, counter + 1, digits),
        ]);
        if (!active) {
          return;
        }
        setCodes({ current, previous, next });
        setCodeError(null);
      } catch (cause) {
        if (!active) {
          return;
        }
        setCodes(null);
        setCodeError(
          cause instanceof Error
            ? cause.message
            : 'The TOTP code could not be generated.'
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
  }, [decoded.bytes, digits, counter]);

  const handleInput = (value: string) => {
    setInput(value);
    setUriError(null);
    setCodeError(null);

    const trimmed = value.trim();
    if (!trimmed.toLowerCase().startsWith('otpauth://')) {
      setUriSecret(null);
      setOtpLabel(null);
      return;
    }

    try {
      const url = new URL(trimmed);
      if (url.protocol !== 'otpauth:') {
        throw new Error('Only otpauth:// URIs are supported.');
      }
      if (url.hostname.toLowerCase() !== 'totp') {
        throw new Error('Only otpauth://totp/ URIs are supported.');
      }
      const secret = url.searchParams.get('secret');
      if (!secret) {
        throw new Error('The otpauth URI does not contain a secret.');
      }
      const uriAlgorithm = (
        url.searchParams.get('algorithm') ?? 'SHA1'
      ).toUpperCase();
      if (uriAlgorithm !== 'SHA1') {
        throw new Error(
          `This tool generates SHA-1 TOTP codes; the URI requests ${uriAlgorithm}.`
        );
      }
      setUriSecret(secret.replace(/\s+/g, ''));

      const parsedDigits = Number(url.searchParams.get('digits') ?? '6');
      setDigits(parsedDigits === 8 ? 8 : 6);

      const parsedPeriod = Number(url.searchParams.get('period') ?? '30');
      setPeriod([15, 30, 60].includes(parsedPeriod) ? parsedPeriod : 30);

      const pathLabel = decodeURIComponent(url.pathname.replace(/^\/+/, ''));
      const issuer = url.searchParams.get('issuer');
      setOtpLabel([issuer, pathLabel].filter(Boolean).join(' · ') || null);
    } catch (cause) {
      setUriSecret(null);
      setOtpLabel(null);
      setUriError(
        cause instanceof Error ? cause.message : 'Invalid otpauth URI.'
      );
    }
  };

  const secondsRemaining = period - (Math.floor(now / 1000) % period);
  const progress = ((period - secondsRemaining) / period) * 100;
  const error = uriError ?? decoded.error ?? codeError;

  return (
    <div className="space-y-4">
      <ToolLayout>
        <Panel
          actions={
            busy ? <Badge variant="accent">Generating…</Badge> : undefined
          }
          description="Time-based one-time passwords using HMAC-SHA-1, compatible with standard authenticator apps."
          title="Secret"
        >
          <Field
            hint={`${input.length.toLocaleString()} characters`}
            label="Base32 secret or otpauth:// URI"
          >
            <Textarea
              aria-label="TOTP secret or otpauth URI"
              className="min-h-[120px]"
              onChange={(event) => handleInput(event.target.value)}
              placeholder={
                'JBSWY3DPEHPK3PXP\nor otpauth://totp/Example:user?secret=JBSWY3DPEHPK3PXP&digits=6&period=30'
              }
              value={input}
            />
          </Field>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Field label="Digits">
              <Select
                aria-label="TOTP digits"
                onChange={(event) =>
                  setDigits(Number(event.target.value) === 8 ? 8 : 6)
                }
                value={digits}
              >
                <option value={6}>6 digits</option>
                <option value={8}>8 digits</option>
              </Select>
            </Field>

            <Field label="Period">
              <Select
                aria-label="TOTP period"
                onChange={(event) => setPeriod(Number(event.target.value))}
                value={period}
              >
                <option value={30}>30 seconds</option>
                <option value={15}>15 seconds</option>
                <option value={60}>60 seconds</option>
              </Select>
            </Field>
          </div>

          {otpLabel && (
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="accent">{otpLabel}</Badge>
              <Badge>otpauth URI parsed</Badge>
            </div>
          )}

          <Callout className="mt-4" variant="info">
            Authenticator secrets are sensitive. TOTP depends on your device
            clock, so keep it in sync.
          </Callout>
        </Panel>

        <ResultPanel
          emptyText="Enter a base32 secret to generate TOTP codes."
          error={error}
          filename="totp.txt"
          label="TOTP code"
          value={codes?.current ?? ''}
        >
          {codes ? (
            <div className="space-y-4">
              <div className="rounded-md border border-border bg-canvas-inset p-4 text-center">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-fg-muted">
                  Current code
                </p>
                <p
                  aria-live="polite"
                  className="mt-2 font-mono text-3xl font-semibold tracking-[0.25em] text-fg sm:text-4xl"
                >
                  {groupCode(codes.current)}
                </p>
                <div
                  aria-label="Time remaining for this code"
                  aria-valuemax={period}
                  aria-valuemin={0}
                  aria-valuenow={secondsRemaining}
                  className="mx-auto mt-4 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-canvas-subtle"
                  role="progressbar"
                >
                  <div
                    className="h-full rounded-full bg-accent transition-[width] duration-1000 ease-linear"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-fg-muted">
                  Refreshes in {secondsRemaining}s · {digits} digits
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-md border border-border bg-canvas-inset px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-fg-muted">
                      Previous
                    </span>
                    <CopyButton value={codes.previous} />
                  </div>
                  <p className="mt-1 font-mono text-lg tracking-[0.2em] text-fg">
                    {groupCode(codes.previous)}
                  </p>
                </div>
                <div className="rounded-md border border-border bg-canvas-inset px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-fg-muted">
                      Next
                    </span>
                    <CopyButton value={codes.next} />
                  </div>
                  <p className="mt-1 font-mono text-lg tracking-[0.2em] text-fg">
                    {groupCode(codes.next)}
                  </p>
                </div>
              </div>
            </div>
          ) : undefined}
        </ResultPanel>
      </ToolLayout>
    </div>
  );
}
