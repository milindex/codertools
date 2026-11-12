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

function encodeOctal(value: string, separator: Separator): string {
  const bytes = textToBytes(value);
  const groups = Array.from(bytes, (byte) => byte.toString(8).padStart(3, '0'));
  return groups.join(separator === 'space' ? ' ' : '');
}

function parseOctalToken(token: string): number {
  if (!/^[0-7]{1,3}$/.test(token)) {
    throw new Error(
      `"${token}" is not a valid octal byte. Use one to three digits from 0–7.`
    );
  }
  const value = Number.parseInt(token, 8);
  if (value > 255) {
    throw new Error(
      `Octal value "${token}" is greater than 255 and cannot be a byte.`
    );
  }
  return value;
}

function decodeOctal(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }

  const tokens = trimmed.split(/[\s,]+/).filter(Boolean);
  let byteValues: number[] = [];

  if (tokens.length > 1) {
    byteValues = tokens.map(parseOctalToken);
  } else {
    const cleaned = tokens[0] ?? '';
    if (!/^[0-7]+$/.test(cleaned)) {
      throw new Error('Octal input can only contain digits from 0–7.');
    }
    if (cleaned.length % 3 !== 0) {
      throw new Error(
        'Continuous octal input must be a multiple of 3 digits (three digits per byte). Separate bytes with spaces if they are not padded.'
      );
    }
    byteValues = [];
    for (let index = 0; index < cleaned.length; index += 3) {
      byteValues.push(parseOctalToken(cleaned.slice(index, index + 3)));
    }
  }

  return bytesToText(new Uint8Array(byteValues));
}

export default function OctalTool() {
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
            ? encodeOctal(input, separator)
            : decodeOctal(input),
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
                { value: 'encode', label: 'Text → octal' },
                { value: 'decode', label: 'Octal → text' },
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
                : 'Three digits per byte'
            }
            htmlFor="octal-input"
            label={mode === 'encode' ? 'Text' : 'Octal'}
          >
            <Textarea
              id="octal-input"
              onChange={(event) => setInput(event.target.value)}
              placeholder={
                mode === 'encode'
                  ? 'Paste text to convert…'
                  : 'Paste octal such as 110 151…'
              }
              value={input}
            />
          </Field>

          {mode === 'encode' && (
            <Field
              className="mt-3"
              htmlFor="octal-separator"
              label="Byte separator"
            >
              <Select
                id="octal-separator"
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
            Text is converted to UTF-8 bytes, and each byte is written as three
            octal digits (000–377). For example, <code>A</code> becomes{' '}
            <code>101</code>. Each byte is 0–255, so values above{' '}
            <code>377</code> are rejected.
          </Callout>
        </Panel>

        <ResultPanel
          emptyText="Octal or text output will appear here."
          error={result.error}
          filename={mode === 'encode' ? 'octal.txt' : 'octal-decoded.txt'}
          label={mode === 'encode' ? 'Octal output' : 'Decoded text'}
          value={result.value}
        />
      </ToolLayout>
    </div>
  );
}
