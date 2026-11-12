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

import { bytesToText, errorMessage, textToBytes } from './codec';

type Mode = 'encode' | 'decode';
type Separator = 'space' | 'none';

function encodeBinary(value: string, separator: Separator): string {
  const bytes = textToBytes(value);
  const groups = Array.from(bytes, (byte) => byte.toString(2).padStart(8, '0'));
  return groups.join(separator === 'space' ? ' ' : '');
}

function decodeBinary(value: string): string {
  const cleaned = value.replace(/0b/gi, '').replace(/[\s_,]+/g, '');
  if (!cleaned) {
    return '';
  }
  if (!/^[01]+$/.test(cleaned)) {
    throw new Error(
      'Binary input can only contain 0 and 1 (whitespace, commas and 0b prefixes are allowed).'
    );
  }
  if (cleaned.length % 8 !== 0) {
    throw new Error(
      `Binary input must contain a multiple of 8 bits. It currently has ${cleaned.length} bits.`
    );
  }

  const bytes = new Uint8Array(cleaned.length / 8);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(cleaned.slice(index * 8, index * 8 + 8), 2);
  }
  return bytesToText(bytes);
}

export default function BinaryToTextTool() {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<Mode>('encode');
  const [separator, setSeparator] = useState<Separator>('space');

  const result = useMemo(() => {
    const isEmpty = mode === 'encode' ? input.length === 0 : !input.trim();
    if (isEmpty) {
      return { value: '', error: null as string | null };
    }
    try {
      return {
        value:
          mode === 'encode'
            ? encodeBinary(input, separator)
            : decodeBinary(input),
        error: null as string | null,
      };
    } catch (error) {
      return { value: '', error: errorMessage(error) };
    }
  }, [input, mode, separator]);

  return (
    <div className="space-y-4">
      <ToolLayout>
        <Panel
          actions={
            <SegmentedControl
              ariaLabel="Conversion direction"
              onChange={(value) => setMode(value as Mode)}
              options={[
                { value: 'encode', label: 'Text → binary' },
                { value: 'decode', label: 'Binary → text' },
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
                : '8 bits per byte'
            }
            htmlFor="binary-input"
            label={mode === 'encode' ? 'Text' : 'Binary'}
          >
            <Textarea
              id="binary-input"
              onChange={(event) => setInput(event.target.value)}
              placeholder={
                mode === 'encode'
                  ? 'Paste text to convert…'
                  : 'Paste binary such as 01001000 01101001…'
              }
              value={input}
            />
          </Field>

          {mode === 'encode' && (
            <Field
              className="mt-3"
              htmlFor="binary-separator"
              label="Byte separator"
            >
              <Select
                id="binary-separator"
                onChange={(event) =>
                  setSeparator(event.target.value as Separator)
                }
                value={separator}
              >
                <option value="space">Space</option>
                <option value="none">None</option>
              </Select>
            </Field>
          )}

          <Callout className="mt-3" variant="info">
            Text is converted to UTF-8 bytes and each byte is written as eight
            bits. For example, <code>A</code> becomes <code>01000001</code>.
            Decoding ignores whitespace, commas and <code>0b</code> prefixes.
          </Callout>
        </Panel>

        <ResultPanel
          emptyText="Binary or text output will appear here."
          error={result.error}
          filename={mode === 'encode' ? 'binary.txt' : 'binary-decoded.txt'}
          label={mode === 'encode' ? 'Binary output' : 'Decoded text'}
          value={result.value}
        />
      </ToolLayout>
    </div>
  );
}
