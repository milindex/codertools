'use client';

import { useMemo, useState } from 'react';

import { Callout } from '@/components/ui/Callout';
import { Field } from '@/components/ui/Field';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { ToolLayout } from '@/components/ui/ToolLayout';

import { bytesToText, errorMessage, hexToBytes, textToBytes } from './codec';

type Mode = 'encode' | 'decode';
type Separator = 'space' | 'none' | 'colon' | 'comma' | '0x';

const SEPARATORS: Array<{ value: Separator; label: string }> = [
  { value: 'space', label: 'Space' },
  { value: 'none', label: 'None' },
  { value: 'colon', label: 'Colon' },
  { value: 'comma', label: 'Comma' },
  { value: '0x', label: '0x prefix' },
];

function encodeHex(
  value: string,
  separator: Separator,
  uppercase: boolean
): string {
  const bytes = textToBytes(value);
  const parts = Array.from(bytes, (byte) => {
    const hex = byte.toString(16).padStart(2, '0');
    return uppercase ? hex.toUpperCase() : hex;
  });

  switch (separator) {
    case 'none':
      return parts.join('');
    case 'colon':
      return parts.join(':');
    case 'comma':
      return parts.join(',');
    case '0x':
      return parts.map((part) => `0x${part}`).join(' ');
    default:
      return parts.join(' ');
  }
}

export default function HexTool() {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<Mode>('encode');
  const [separator, setSeparator] = useState<Separator>('space');
  const [uppercase, setUppercase] = useState(false);

  const result = useMemo(() => {
    const isEmpty = mode === 'encode' ? input.length === 0 : !input.trim();
    if (isEmpty) {
      return { value: '', error: null as string | null };
    }
    try {
      return {
        value:
          mode === 'encode'
            ? encodeHex(input, separator, uppercase)
            : bytesToText(hexToBytes(input)),
        error: null as string | null,
      };
    } catch (error) {
      return { value: '', error: errorMessage(error) };
    }
  }, [input, mode, separator, uppercase]);

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
            hint={
              mode === 'encode'
                ? `${textToBytes(input).length} UTF-8 bytes`
                : 'Two digits per byte'
            }
            htmlFor="hex-input"
            label={mode === 'encode' ? 'Text' : 'Hex'}
          >
            <Textarea
              id="hex-input"
              onChange={(event) => setInput(event.target.value)}
              placeholder={
                mode === 'encode'
                  ? 'Paste text to encode…'
                  : 'Paste hex such as 48 65 6c 6c 6f…'
              }
              value={input}
            />
          </Field>

          {mode === 'encode' && (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field htmlFor="hex-separator" label="Byte separator">
                <Select
                  id="hex-separator"
                  onChange={(event) =>
                    setSeparator(event.target.value as Separator)
                  }
                  value={separator}
                >
                  {SEPARATORS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <label className="flex cursor-pointer items-center gap-2 self-end pb-2 text-xs text-fg-muted">
                <input
                  checked={uppercase}
                  className="h-4 w-4"
                  onChange={(event) => setUppercase(event.target.checked)}
                  type="checkbox"
                />
                Uppercase A–F
              </label>
            </div>
          )}

          <Callout className="mt-3" variant="info">
            Text is encoded as UTF-8 bytes, so accented characters and emoji
            become multiple hex bytes. Decoding ignores spaces, colons, commas,
            dashes and <code>0x</code> prefixes.
          </Callout>
        </Panel>

        <ResultPanel
          emptyText="Hex output will appear here."
          error={result.error}
          filename="hex-result.txt"
          label={mode === 'encode' ? 'Hex output' : 'Decoded text'}
          value={result.value}
        />
      </ToolLayout>
    </div>
  );
}
