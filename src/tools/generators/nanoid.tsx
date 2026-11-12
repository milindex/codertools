'use client';

import { customAlphabet, urlAlphabet } from 'nanoid';
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

type AlphabetPreset = 'url' | 'alphanumeric' | 'hex' | 'custom';

const ALPHABETS: Record<Exclude<AlphabetPreset, 'custom'>, string> = {
  url: urlAlphabet,
  alphanumeric:
    '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  hex: '0123456789abcdef',
};

const buildNanoIds = (
  size: number,
  count: number,
  alphabet: string
): string => {
  const generate = customAlphabet(alphabet, size);
  return Array.from({ length: count }, () => generate()).join('\n');
};

export default function NanoidGenerator() {
  const [size, setSize] = useState('21');
  const [count, setCount] = useState('5');
  const [preset, setPreset] = useState<AlphabetPreset>('url');
  const [customChars, setCustomChars] = useState(
    '0123456789abcdefghijklmnopqrstuvwxyz'
  );
  const [output, setOutput] = useState(() => buildNanoIds(21, 5, urlAlphabet));
  const [error, setError] = useState<string | null>(null);

  const activeAlphabet = preset === 'custom' ? customChars : ALPHABETS[preset];

  const generate = () => {
    const parsedSize = Number(size);
    const parsedCount = Number(count);

    if (!Number.isInteger(parsedSize) || parsedSize < 1 || parsedSize > 256) {
      setError('Size must be a whole number between 1 and 256.');
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

    if (activeAlphabet.length < 2) {
      setError('The alphabet needs at least two characters.');
      return;
    }

    if (activeAlphabet.length > 256) {
      setError('NanoID alphabets can contain at most 256 characters.');
      return;
    }

    if (
      Array.from(activeAlphabet).some((character) => character.length !== 1)
    ) {
      setError(
        'Use single-code-unit characters in a custom alphabet (emoji and other astral symbols are not supported).'
      );
      return;
    }

    setError(null);
    setOutput(buildNanoIds(parsedSize, parsedCount, activeAlphabet));
  };

  const alphabetSize = new Set(Array.from(activeAlphabet)).size;
  const bitsPerId =
    alphabetSize > 1 ? Math.round(Number(size) * Math.log2(alphabetSize)) : 0;

  return (
    <div className="space-y-4">
      <ToolLayout>
        <Panel
          actions={<Badge variant="accent">URL-safe</Badge>}
          title="Options"
        >
          <Field
            hint="Pick a preset or define your own characters."
            label="Alphabet"
          >
            <SegmentedControl
              ariaLabel="NanoID alphabet preset"
              onChange={(value) => setPreset(value as AlphabetPreset)}
              options={[
                { label: 'URL-safe', value: 'url' },
                { label: 'Alphanumeric', value: 'alphanumeric' },
                { label: 'Hex', value: 'hex' },
                { label: 'Custom', value: 'custom' },
              ]}
              value={preset}
            />
          </Field>

          {preset === 'custom' && (
            <Field
              className="mt-4"
              hint={`${alphabetSize} unique characters`}
              htmlFor="nanoid-alphabet"
              label="Custom alphabet"
            >
              <Input
                id="nanoid-alphabet"
                onChange={(event) => setCustomChars(event.target.value)}
                spellCheck={false}
                value={customChars}
              />
            </Field>
          )}

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field hint="1–256" htmlFor="nanoid-size" label="Size">
              <Input
                id="nanoid-size"
                max={256}
                min={1}
                onChange={(event) => setSize(event.target.value)}
                type="number"
                value={size}
              />
            </Field>
            <Field hint="1–100" htmlFor="nanoid-count" label="How many?">
              <Input
                id="nanoid-count"
                max={100}
                min={1}
                onChange={(event) => setCount(event.target.value)}
                type="number"
                value={count}
              />
            </Field>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button onClick={generate} variant="primary">
              Generate NanoIDs
            </Button>
            <span className="text-xs text-fg-muted">
              {bitsPerId > 0
                ? `≈ ${bitsPerId} bits of entropy per ID`
                : 'Enter an alphabet to see the entropy estimate.'}
            </span>
          </div>

          {error && (
            <Callout className="mt-3" variant="error">
              {error}
            </Callout>
          )}

          <Callout className="mt-4" variant="info">
            NanoID uses the Web Crypto API and a compact, URL-safe alphabet by
            default. A 21-character URL-safe ID has roughly the same collision
            resistance as a UUID v4.
          </Callout>
        </Panel>

        <ResultPanel
          emptyText="Click Generate to create NanoIDs."
          filename="nanoids.txt"
          label="NanoIDs"
          value={output}
        />
      </ToolLayout>
    </div>
  );
}
