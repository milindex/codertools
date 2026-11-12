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
import { Textarea } from '@/components/ui/Textarea';
import { ToolLayout } from '@/components/ui/ToolLayout';
import {
  base64ToBytes,
  bytesToBase64,
  concatBytes,
  textDecoder,
  textEncoder,
} from '@/tools/crypto/_utils';

const ITERATIONS = 210_000;
const SALT_LENGTH = 16;
const IV_LENGTH = 12;

type Mode = 'encrypt' | 'decrypt';

const deriveKey = async (password: string, salt: Uint8Array<ArrayBuffer>) => {
  const baseKey = await globalThis.crypto.subtle.importKey(
    'raw',
    textEncoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return globalThis.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: ITERATIONS,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
};

export default function AesTool() {
  const [mode, setMode] = useState<Mode>('encrypt');
  const [password, setPassword] = useState('');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    if (!password) {
      setError('Enter a password to derive the encryption key.');
      return;
    }
    if (!input) {
      setError(
        mode === 'encrypt'
          ? 'Enter some text to encrypt.'
          : 'Paste a base64 payload to decrypt.'
      );
      return;
    }

    setBusy(true);
    setOutput('');
    setError(null);

    try {
      if (!globalThis.crypto?.subtle || !globalThis.crypto?.getRandomValues) {
        throw new Error(
          'Web Crypto is not available. Use a modern browser over HTTPS.'
        );
      }

      if (mode === 'encrypt') {
        const salt = globalThis.crypto.getRandomValues(
          new Uint8Array(SALT_LENGTH)
        );
        const iv = globalThis.crypto.getRandomValues(new Uint8Array(IV_LENGTH));
        const key = await deriveKey(password, salt);
        const ciphertext = new Uint8Array(
          await globalThis.crypto.subtle.encrypt(
            { name: 'AES-GCM', iv },
            key,
            textEncoder.encode(input)
          )
        );
        setOutput(bytesToBase64(concatBytes(salt, iv, ciphertext)));
      } else {
        const payload = new Uint8Array(base64ToBytes(input));
        if (payload.length <= SALT_LENGTH + IV_LENGTH) {
          throw new Error(
            'The payload is too short to contain a salt, IV and ciphertext.'
          );
        }
        const salt = payload.slice(0, SALT_LENGTH);
        const iv = payload.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
        const ciphertext = payload.slice(SALT_LENGTH + IV_LENGTH);
        const key = await deriveKey(password, salt);
        const plaintext = await globalThis.crypto.subtle.decrypt(
          { name: 'AES-GCM', iv },
          key,
          ciphertext
        );
        setOutput(textDecoder.decode(plaintext));
      }
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : 'The operation failed.';
      setError(
        mode === 'decrypt' && /operation|decrypt|tag|data/i.test(message)
          ? 'Decryption failed. Check the password and paste the complete base64 payload.'
          : message
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <ToolLayout>
        <Panel
          actions={
            busy ? (
              <Badge variant="accent">
                {mode === 'encrypt' ? 'Encrypting…' : 'Decrypting…'}
              </Badge>
            ) : undefined
          }
          description="AES-256-GCM with a PBKDF2-SHA-256 key derived from your password."
          title="AES-GCM"
        >
          <Field label="Mode">
            <SegmentedControl
              ariaLabel="AES mode"
              onChange={(value) => {
                setMode(value as Mode);
                setOutput('');
                setError(null);
              }}
              options={[
                { value: 'encrypt', label: 'Encrypt' },
                { value: 'decrypt', label: 'Decrypt' },
              ]}
              value={mode}
            />
          </Field>

          <div className="mt-3 space-y-3">
            <Field
              hint="The same password is required to decrypt."
              label="Password"
            >
              <Input
                aria-label="Encryption password"
                autoComplete="new-password"
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter a strong password…"
                type="password"
                value={password}
              />
            </Field>

            <Field
              hint={
                mode === 'encrypt'
                  ? `${input.length.toLocaleString()} characters`
                  : 'Base64 payload'
              }
              label={mode === 'encrypt' ? 'Plaintext' : 'Encrypted payload'}
            >
              <Textarea
                aria-label={
                  mode === 'encrypt'
                    ? 'Plaintext to encrypt'
                    : 'Base64 payload to decrypt'
                }
                className="min-h-[150px]"
                onChange={(event) => {
                  setInput(event.target.value);
                  setOutput('');
                  setError(null);
                }}
                placeholder={
                  mode === 'encrypt'
                    ? 'Type or paste the text to encrypt…'
                    : 'Paste the base64 output produced by this tool…'
                }
                value={input}
              />
            </Field>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              disabled={busy}
              onClick={() => void run()}
              variant="primary"
            >
              {busy
                ? 'Working…'
                : mode === 'encrypt'
                  ? 'Encrypt text'
                  : 'Decrypt payload'}
            </Button>
          </div>

          <Callout className="mt-4" variant="info">
            <p>
              The payload is base64 of: <strong>16-byte salt</strong> +{' '}
              <strong>12-byte IV</strong> + <strong>AES-GCM ciphertext</strong>.
              The salt and IV are random for every encryption and are stored at
              the start of the payload.
            </p>
            <p className="mt-2">
              To decrypt: switch to Decrypt, paste the entire base64 string and
              enter the same password. Key derivation uses PBKDF2-SHA-256 with{' '}
              {ITERATIONS.toLocaleString()} iterations.
            </p>
          </Callout>
        </Panel>

        <ResultPanel
          emptyText={
            mode === 'encrypt'
              ? 'The base64 payload will appear here.'
              : 'The decrypted text will appear here.'
          }
          error={error}
          filename={mode === 'encrypt' ? 'aes-payload.txt' : 'decrypted.txt'}
          label={
            mode === 'encrypt' ? 'Encrypted payload (base64)' : 'Plaintext'
          }
          value={output}
        />
      </ToolLayout>
    </div>
  );
}
