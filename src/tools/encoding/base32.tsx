'use client';

import { useMemo, useState } from 'react';

import { Callout } from '@/components/ui/Callout';
import { Field } from '@/components/ui/Field';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Textarea } from '@/components/ui/Textarea';
import { ToolLayout } from '@/components/ui/ToolLayout';

import { bytesToText, errorMessage, textToBytes } from './codec';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

type Mode = 'encode' | 'decode';

function encodeBase32(value: string, padding: boolean): string {
  const bytes = textToBytes(value);
  let buffer = 0;
  let bits = 0;
  let output = '';

  for (const byte of bytes) {
    buffer = (buffer << 8) | byte;
    bits += 8;

    while (bits >= 5) {
      output += ALPHABET[(buffer >>> (bits - 5)) & 31] ?? '';
      bits -= 5;
    }
    buffer &= bits > 0 ? (1 << bits) - 1 : 0;
  }

  if (bits > 0) {
    output += ALPHABET[(buffer << (5 - bits)) & 31] ?? '';
  }

  if (padding) {
    while (output.length % 8 !== 0) {
      output += '=';
    }
  }

  return output;
}

function decodeBase32(value: string): string {
  const cleaned = value.replace(/[\s-]+/g, '').toUpperCase();
  if (!cleaned) {
    return '';
  }

  const core = cleaned.replace(/=+$/, '');
  if (!/^[A-Z2-7]*$/.test(core)) {
    throw new Error(
      'Base32 input contains invalid characters. Use A–Z and 2–7, with optional = padding.'
    );
  }
  const remainder = core.length % 8;
  if (remainder === 1 || remainder === 3 || remainder === 6) {
    throw new Error('Base32 input has an invalid length.');
  }

  const bytes: number[] = [];
  let buffer = 0;
  let bits = 0;

  for (const char of core) {
    const index = ALPHABET.indexOf(char);
    if (index === -1) {
      throw new Error(`Invalid Base32 character "${char}".`);
    }
    buffer = (buffer << 5) | index;
    bits += 5;

    if (bits >= 8) {
      bytes.push((buffer >>> (bits - 8)) & 0xff);
      bits -= 8;
      buffer &= bits > 0 ? (1 << bits) - 1 : 0;
    }
  }

  return bytesToText(new Uint8Array(bytes));
}

export default function Base32Tool() {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<Mode>('encode');
  const [padding, setPadding] = useState(true);

  const result = useMemo(() => {
    const isEmpty = mode === 'encode' ? input.length === 0 : !input.trim();
    if (isEmpty) {
      return { value: '', error: null as string | null };
    }
    try {
      return {
        value:
          mode === 'encode'
            ? encodeBase32(input, padding)
            : decodeBase32(input),
        error: null as string | null,
      };
    } catch (error) {
      return { value: '', error: errorMessage(error) };
    }
  }, [input, mode, padding]);

  return (
    <div className="space-y-4">
      <ToolLayout>
        <Panel
          actions={
            <SegmentedControl
              ariaLabel="Conversion direction"
              onChange={(value) => setMode(value as Mode)}
              options={[
                { value: 'encode', label: 'Encode' },
                { value: 'decode', label: 'Decode' },
              ]}
              value={mode}
            />
          }
          title="Input"
        >
          <Field
            hint={mode === 'encode' ? `${input.length} characters` : 'RFC 4648'}
            htmlFor="base32-input"
            label={mode === 'encode' ? 'Text' : 'Base32'}
          >
            <Textarea
              id="base32-input"
              onChange={(event) => setInput(event.target.value)}
              placeholder={
                mode === 'encode'
                  ? 'Paste text to encode…'
                  : 'Paste Base32 to decode…'
              }
              value={input}
            />
          </Field>

          {mode === 'encode' && (
            <label className="mt-3 flex cursor-pointer items-center gap-2 text-xs text-fg-muted">
              <input
                checked={padding}
                className="h-4 w-4"
                onChange={(event) => setPadding(event.target.checked)}
                type="checkbox"
              />
              Add = padding to make the output a multiple of 8 characters
            </label>
          )}

          <Callout className="mt-3" variant="info">
            {mode === 'encode'
              ? 'Input text is encoded as UTF-8 bytes, then Base32 per RFC 4648.'
              : 'Decoded bytes are interpreted as UTF-8 text.'}
          </Callout>
        </Panel>

        <ResultPanel
          emptyText="Base32 output will appear here."
          error={result.error}
          filename="base32-result.txt"
          label={mode === 'encode' ? 'Base32 output' : 'Decoded text'}
          value={result.value}
        />
      </ToolLayout>
    </div>
  );
}
