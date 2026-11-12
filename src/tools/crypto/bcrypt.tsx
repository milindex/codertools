'use client';

import { useState } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Select } from '@/components/ui/Select';
import { ToolLayout } from '@/components/ui/ToolLayout';

const COST_FACTORS = Array.from({ length: 13 }, (_, index) => index + 4);

type Mode = 'hash' | 'verify';

export default function BcryptTool() {
  const [mode, setMode] = useState<Mode>('hash');
  const [password, setPassword] = useState('');
  const [costFactor, setCostFactor] = useState(10);
  const [hashInput, setHashInput] = useState('');
  const [hash, setHash] = useState('');
  const [verified, setVerified] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetResult = () => {
    setHash('');
    setVerified(null);
    setError(null);
  };

  const generate = async () => {
    if (!password) {
      setError('Enter a password to hash.');
      return;
    }

    setBusy(true);
    setHash('');
    setVerified(null);
    setError(null);
    try {
      const { bcrypt } = await import('hash-wasm');
      if (!globalThis.crypto?.getRandomValues) {
        throw new Error('Secure random number generation is not available.');
      }
      const salt = globalThis.crypto.getRandomValues(new Uint8Array(16));
      const digest = await bcrypt({
        password,
        salt,
        costFactor,
        outputType: 'encoded',
      });
      setHash(digest);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'The bcrypt hash could not be generated.'
      );
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    if (!password) {
      setError('Enter the password to verify.');
      return;
    }
    if (!hashInput.trim()) {
      setError('Paste a bcrypt hash to verify against.');
      return;
    }

    setBusy(true);
    setVerified(null);
    setError(null);
    try {
      const { bcryptVerify } = await import('hash-wasm');
      const match = await bcryptVerify({
        password,
        hash: hashInput.trim(),
      });
      setVerified(match);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'The hash could not be checked. Make sure it is a bcrypt hash.'
      );
    } finally {
      setBusy(false);
    }
  };

  const resultValue =
    mode === 'hash'
      ? hash
      : verified === null
        ? ''
        : verified
          ? 'Password matches the bcrypt hash.'
          : 'Password does not match the bcrypt hash.';

  return (
    <div className="space-y-4">
      <ToolLayout>
        <Panel
          actions={
            busy ? (
              <Badge variant="accent">
                {mode === 'hash' ? 'Hashing…' : 'Checking…'}
              </Badge>
            ) : undefined
          }
          description="bcrypt is intentionally slow and salts every hash. Cost 10 is a common default."
          title="bcrypt"
        >
          <Field label="Mode">
            <SegmentedControl
              ariaLabel="bcrypt mode"
              onChange={(value) => {
                setMode(value as Mode);
                resetResult();
              }}
              options={[
                { value: 'hash', label: 'Hash password' },
                { value: 'verify', label: 'Verify hash' },
              ]}
              value={mode}
            />
          </Field>

          <div className="mt-3 space-y-3">
            <Field
              hint={`${password.length.toLocaleString()} characters`}
              label={mode === 'hash' ? 'Password' : 'Password to check'}
            >
              <Input
                aria-label="Password"
                autoComplete="new-password"
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter the password…"
                type="password"
                value={password}
              />
            </Field>

            {mode === 'hash' ? (
              <Field
                hint="Each step doubles the work. Higher is slower."
                label="Cost factor (rounds)"
              >
                <Select
                  aria-label="bcrypt cost factor"
                  onChange={(event) =>
                    setCostFactor(Number(event.target.value))
                  }
                  value={costFactor}
                >
                  {COST_FACTORS.map((factor) => (
                    <option key={factor} value={factor}>
                      {factor}
                      {factor === 10 ? ' (default)' : ''}
                    </option>
                  ))}
                </Select>
              </Field>
            ) : (
              <Field
                hint="Format: $2a$, $2b$ or $2y$ followed by cost, salt and hash"
                label="bcrypt hash"
              >
                <Input
                  aria-label="bcrypt hash"
                  autoComplete="off"
                  className="font-mono text-xs"
                  onChange={(event) => setHashInput(event.target.value)}
                  placeholder="$2b$10$…"
                  type="text"
                  value={hashInput}
                />
              </Field>
            )}
          </div>

          <div className="mt-3">
            <Button
              disabled={busy}
              onClick={() => {
                void (mode === 'hash' ? generate() : verify());
              }}
              variant="primary"
            >
              {busy
                ? 'Working…'
                : mode === 'hash'
                  ? 'Generate bcrypt hash'
                  : 'Verify password'}
            </Button>
          </div>

          <Callout className="mt-4" variant="info">
            bcrypt hashes include a random salt, so hashing the same password
            twice produces different strings. Store the encoded hash as-is.
          </Callout>
        </Panel>

        <ResultPanel
          error={error}
          filename="bcrypt.txt"
          label={mode === 'hash' ? 'bcrypt hash' : 'Verification result'}
          value={resultValue}
          emptyText={
            mode === 'hash'
              ? 'The bcrypt hash will appear here.'
              : 'Enter a password and hash, then verify.'
          }
        >
          {mode === 'verify' && verified !== null ? (
            <Callout
              title={verified ? 'Password matches' : 'Password does not match'}
              variant={verified ? 'success' : 'error'}
            >
              {verified
                ? 'The supplied password produces the same bcrypt hash.'
                : 'The supplied password does not match that bcrypt hash.'}
            </Callout>
          ) : undefined}
        </ResultPanel>
      </ToolLayout>
    </div>
  );
}
