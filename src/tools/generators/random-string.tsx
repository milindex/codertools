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
import { Checkbox } from '@/tools/generators/_controls';
import { randomChar, uniqueChars } from '@/tools/generators/_random';

type CharsetPreset =
  | 'alphanumeric'
  | 'letters'
  | 'lowercase'
  | 'uppercase'
  | 'digits'
  | 'hex'
  | 'base64url'
  | 'custom';

const CHARSETS: Record<Exclude<CharsetPreset, 'custom'>, string> = {
  alphanumeric:
    '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  letters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  digits: '0123456789',
  hex: '0123456789abcdef',
  base64url: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_',
};

const AMBIGUOUS = new Set(Array.from('0O1lI|'));

const sanitizeCharset = (charset: string, excludeAmbiguous: boolean) => {
  const unique = uniqueChars(charset);

  return excludeAmbiguous
    ? Array.from(unique)
        .filter((character) => !AMBIGUOUS.has(character))
        .join('')
    : unique;
};

const buildString = (length: number, charset: string) => {
  let value = '';

  for (let index = 0; index < length; index += 1) {
    value += randomChar(charset);
  }

  return value;
};

export default function RandomStringGenerator() {
  const [length, setLength] = useState('32');
  const [count, setCount] = useState('1');
  const [preset, setPreset] = useState<CharsetPreset>('alphanumeric');
  const [customChars, setCustomChars] = useState(
    'abcdefghijklmnopqrstuvwxyz0123456789'
  );
  const [excludeAmbiguous, setExcludeAmbiguous] = useState(false);
  const [output, setOutput] = useState(() =>
    buildString(32, CHARSETS.alphanumeric)
  );
  const [error, setError] = useState<string | null>(null);

  const rawCharset = preset === 'custom' ? customChars : CHARSETS[preset];
  const activeCharset = sanitizeCharset(rawCharset, excludeAmbiguous);

  const generate = () => {
    const parsedLength = Number(length);
    const parsedCount = Number(count);

    if (
      !Number.isInteger(parsedLength) ||
      parsedLength < 1 ||
      parsedLength > 4096
    ) {
      setError('Length must be a whole number between 1 and 4,096.');
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

    if (parsedLength * parsedCount > 200_000) {
      setError('Reduce the length or count (200,000 characters maximum).');
      return;
    }

    if (activeCharset.length < 2) {
      setError(
        'The charset needs at least two characters after exclusions are applied.'
      );
      return;
    }

    setError(null);
    setOutput(
      Array.from({ length: parsedCount }, () =>
        buildString(parsedLength, activeCharset)
      ).join('\n')
    );
  };

  const entropy =
    activeCharset.length > 1
      ? Math.round(Number(length) * Math.log2(activeCharset.length))
      : 0;

  return (
    <div className="space-y-4">
      <ToolLayout>
        <Panel
          actions={<Badge variant="accent">Web Crypto</Badge>}
          title="Options"
        >
          <Field
            hint="All presets are URL-safe except Custom."
            label="Character set"
          >
            <SegmentedControl
              ariaLabel="Character set"
              onChange={(value) => setPreset(value as CharsetPreset)}
              options={[
                { label: 'Alphanumeric', value: 'alphanumeric' },
                { label: 'Letters', value: 'letters' },
                { label: 'Lowercase', value: 'lowercase' },
                { label: 'Uppercase', value: 'uppercase' },
                { label: 'Digits', value: 'digits' },
                { label: 'Hex', value: 'hex' },
                { label: 'Base64URL', value: 'base64url' },
                { label: 'Custom', value: 'custom' },
              ]}
              value={preset}
            />
          </Field>

          {preset === 'custom' && (
            <Field
              className="mt-4"
              hint="Characters are de-duplicated."
              htmlFor="random-string-chars"
              label="Custom characters"
            >
              <Input
                id="random-string-chars"
                onChange={(event) => setCustomChars(event.target.value)}
                spellCheck={false}
                value={customChars}
              />
            </Field>
          )}

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field hint="1–4096" htmlFor="random-string-length" label="Length">
              <Input
                id="random-string-length"
                max={4096}
                min={1}
                onChange={(event) => setLength(event.target.value)}
                type="number"
                value={length}
              />
            </Field>
            <Field hint="1–100" htmlFor="random-string-count" label="How many?">
              <Input
                id="random-string-count"
                max={100}
                min={1}
                onChange={(event) => setCount(event.target.value)}
                type="number"
                value={count}
              />
            </Field>
          </div>

          <div className="mt-3">
            <Checkbox
              checked={excludeAmbiguous}
              id="random-string-ambiguous"
              label="Exclude ambiguous characters (0 O 1 l I |)"
              onChange={setExcludeAmbiguous}
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button onClick={generate} variant="primary">
              Generate strings
            </Button>
            <span className="text-xs text-fg-muted">
              {activeCharset.length} characters in the pool
              {entropy > 0 ? ` · ≈ ${entropy} bits per string` : ''}
            </span>
          </div>

          {error && (
            <Callout className="mt-3" variant="error">
              {error}
            </Callout>
          )}

          <Callout className="mt-4" variant="info">
            Each character is selected with{' '}
            <code className="rounded bg-canvas-inset px-1">
              crypto.getRandomValues
            </code>{' '}
            and rejection sampling, which avoids the bias of a plain modulo
            operation.
          </Callout>
        </Panel>

        <ResultPanel
          emptyText="Click Generate to create random strings."
          filename="random-strings.txt"
          label="Random strings"
          value={output}
        />
      </ToolLayout>
    </div>
  );
}
