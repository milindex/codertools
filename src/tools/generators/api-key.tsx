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
import { ToolLayout } from '@/components/ui/ToolLayout';
import { randomBytes, toBase64Url } from '@/tools/generators/_random';

type Encoding = 'hex' | 'base64url';

const encode = (bytes: Uint8Array, encoding: Encoding) => {
  if (encoding === 'base64url') {
    return toBase64Url(bytes);
  }

  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join(
    ''
  );
};

const buildKey = (prefix: string, byteLength: number, encoding: Encoding) =>
  `${prefix}${encode(randomBytes(byteLength), encoding)}`;

export default function ApiKeyGenerator() {
  const [prefix, setPrefix] = useState('sk_live_');
  const [byteLength, setByteLength] = useState('32');
  const [encoding, setEncoding] = useState<Encoding>('base64url');
  const [count, setCount] = useState('3');
  const [output, setOutput] = useState(() =>
    Array.from({ length: 3 }, () => buildKey('sk_live_', 32, 'base64url')).join(
      '\n'
    )
  );
  const [error, setError] = useState<string | null>(null);

  const generate = () => {
    const parsedLength = Number(byteLength);
    const parsedCount = Number(count);
    const trimmedPrefix = prefix.trim();

    if (
      !Number.isInteger(parsedLength) ||
      parsedLength < 1 ||
      parsedLength > 128
    ) {
      setError('Byte length must be a whole number between 1 and 128.');
      return;
    }

    if (
      !Number.isInteger(parsedCount) ||
      parsedCount < 1 ||
      parsedCount > 100
    ) {
      setError('Count must be a whole number between 1 and 100.');
      return;
    }

    if (trimmedPrefix && !/^[\x21-\x7e]+$/.test(trimmedPrefix)) {
      setError(
        'The prefix can only contain printable ASCII characters without spaces.'
      );
      return;
    }

    setError(null);
    setOutput(
      Array.from({ length: parsedCount }, () =>
        buildKey(trimmedPrefix, parsedLength, encoding)
      ).join('\n')
    );
  };

  const encodedLength =
    encoding === 'hex'
      ? Number(byteLength) * 2
      : Math.ceil((Number(byteLength) * 4) / 3);
  const entropy = Number(byteLength) * 8;

  return (
    <div className="space-y-4">
      <ToolLayout>
        <Panel
          actions={<Badge variant="accent">Cryptographic</Badge>}
          title="Key options"
        >
          <Field
            hint="Optional. Prepended to every generated key."
            htmlFor="api-key-prefix"
            label="Prefix"
          >
            <Input
              id="api-key-prefix"
              onChange={(event) => setPrefix(event.target.value)}
              placeholder="sk_live_"
              spellCheck={false}
              value={prefix}
            />
          </Field>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field hint="1–128" htmlFor="api-key-length" label="Random bytes">
              <Input
                id="api-key-length"
                max={128}
                min={1}
                onChange={(event) => setByteLength(event.target.value)}
                type="number"
                value={byteLength}
              />
            </Field>
            <Field hint="1–100" htmlFor="api-key-count" label="How many?">
              <Input
                id="api-key-count"
                max={100}
                min={1}
                onChange={(event) => setCount(event.target.value)}
                type="number"
                value={count}
              />
            </Field>
          </div>

          <div className="mt-4">
            <Field label="Encoding">
              <SegmentedControl
                ariaLabel="Key encoding"
                onChange={(value) => setEncoding(value as Encoding)}
                options={[
                  { label: 'Hex', value: 'hex' },
                  { label: 'Base64URL', value: 'base64url' },
                ]}
                value={encoding}
              />
            </Field>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button onClick={generate} variant="primary">
              Generate API keys
            </Button>
            <span className="text-xs text-fg-muted">
              {Number.isFinite(encodedLength) ? encodedLength : 0} encoded
              characters · ≈ {Number.isFinite(entropy) ? entropy : 0} bits
            </span>
          </div>

          {error && (
            <Callout className="mt-3" variant="error">
              {error}
            </Callout>
          )}

          <Callout className="mt-4" variant="info">
            Secrets are generated from{' '}
            <code className="rounded bg-canvas-inset px-1">
              crypto.getRandomValues
            </code>
            . The prefix is not part of the secret and adds no entropy. Hex
            produces two characters per byte; Base64URL is shorter and safe for
            URLs and headers.
          </Callout>
        </Panel>

        <ResultPanel
          emptyText="Click Generate to create API keys."
          filename="api-keys.txt"
          label="API keys"
          value={output}
        />
      </ToolLayout>
    </div>
  );
}
