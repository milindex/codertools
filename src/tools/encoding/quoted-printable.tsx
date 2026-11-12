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

type Mode = 'encode' | 'decode';

function encodeQuotedPrintable(value: string): string {
  const normalized = value.replace(/\r\n?/g, '\n');
  const bytes = textToBytes(normalized);
  const lines: string[] = [];
  let line = '';
  let pendingWhitespace = '';

  const append = (token: string) => {
    if (line.length + token.length > 75) {
      lines.push(`${line}=`);
      line = '';
    }
    line += token;
  };

  const flushWhitespace = (literal: boolean) => {
    if (!pendingWhitespace) {
      return;
    }
    for (const character of pendingWhitespace) {
      if (literal) {
        append(character);
      } else {
        append(character === ' ' ? '=20' : '=09');
      }
    }
    pendingWhitespace = '';
  };

  for (const byte of bytes) {
    if (byte === 0x20 || byte === 0x09) {
      pendingWhitespace += String.fromCharCode(byte);
      continue;
    }

    if (byte === 0x0a) {
      flushWhitespace(false);
      lines.push(line);
      line = '';
      continue;
    }

    flushWhitespace(true);

    if (byte >= 33 && byte <= 126 && byte !== 61) {
      append(String.fromCharCode(byte));
    } else {
      append(`=${byte.toString(16).toUpperCase().padStart(2, '0')}`);
    }
  }

  flushWhitespace(false);
  lines.push(line);

  return lines.join('\r\n');
}

function decodeQuotedPrintable(value: string): string {
  const bytes: number[] = [];

  for (let index = 0; index < value.length; index += 1) {
    const character = value[index]!;

    if (character === '=') {
      let cursor = index + 1;
      while (value[cursor] === ' ' || value[cursor] === '\t') {
        cursor += 1;
      }
      if (value[cursor] === '\r' && value[cursor + 1] === '\n') {
        index = cursor + 1;
        continue;
      }
      if (value[cursor] === '\n') {
        index = cursor;
        continue;
      }

      const hex = value.slice(index + 1, index + 3);
      if (!/^[0-9a-fA-F]{2}$/.test(hex)) {
        throw new Error(
          `Invalid quoted-printable escape at position ${index + 1}. Expected =HH with two hex digits.`
        );
      }
      bytes.push(Number.parseInt(hex, 16));
      index += 2;
      continue;
    }

    if (character === '\r') {
      if (value[index + 1] === '\n') {
        index += 1;
      }
      bytes.push(0x0a);
      continue;
    }

    for (const byte of textToBytes(character)) {
      bytes.push(byte);
    }
  }

  return bytesToText(new Uint8Array(bytes));
}

export default function QuotedPrintableTool() {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<Mode>('encode');

  const result = useMemo(() => {
    const isEmpty = mode === 'encode' ? input.length === 0 : !input.trim();
    if (isEmpty) {
      return { value: '', error: null as string | null };
    }
    try {
      return {
        value:
          mode === 'encode'
            ? encodeQuotedPrintable(input)
            : decodeQuotedPrintable(input),
        error: null as string | null,
      };
    } catch (error) {
      return { value: '', error: errorMessage(error) };
    }
  }, [input, mode]);

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
                : 'Soft breaks are joined automatically'
            }
            htmlFor="quoted-printable-input"
            label={mode === 'encode' ? 'Text' : 'Quoted-printable text'}
          >
            <Textarea
              id="quoted-printable-input"
              onChange={(event) => setInput(event.target.value)}
              placeholder={
                mode === 'encode'
                  ? 'Paste text to encode…'
                  : 'Paste quoted-printable text such as Caf=C3=A9…'
              }
              value={input}
            />
          </Field>

          <Callout className="mt-3" variant="info">
            {mode === 'encode'
              ? 'Text is encoded as UTF-8 bytes. Non-printable bytes become =HH, lines are limited to 76 characters, and soft line breaks end with =.'
              : 'Soft line breaks (a trailing = followed by a newline) are removed before =HH escapes are decoded. Hard line breaks are returned as LF. The result must be valid UTF-8 text.'}
          </Callout>
        </Panel>

        <ResultPanel
          emptyText="Quoted-printable output will appear here."
          error={result.error}
          filename="quoted-printable.txt"
          label={mode === 'encode' ? 'Quoted-printable output' : 'Decoded text'}
          value={result.value}
        />
      </ToolLayout>
    </div>
  );
}
