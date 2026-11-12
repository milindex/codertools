'use client';

import { useMemo, useState } from 'react';

import { Callout } from '@/components/ui/Callout';
import { Field } from '@/components/ui/Field';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Textarea } from '@/components/ui/Textarea';
import { ToolLayout } from '@/components/ui/ToolLayout';

import {
  base64ToBytes,
  bytesToBase64,
  bytesToText,
  errorMessage,
  textToBytes,
} from './codec';

type Mode = 'encode' | 'decode';

const DATA_URI_PREFIX = /^data:[^,]*;base64,/i;

function wrapLines(value: string, width: number): string {
  if (!value) {
    return '';
  }
  const chunks: string[] = [];
  for (let index = 0; index < value.length; index += width) {
    chunks.push(value.slice(index, index + width));
  }
  return chunks.join('\r\n');
}

function encodeBase64(value: string, wrap: boolean): string {
  const encoded = bytesToBase64(textToBytes(value));
  return wrap ? wrapLines(encoded, 76) : encoded;
}

function decodeBase64(value: string): string {
  const cleaned = value.trim().replace(DATA_URI_PREFIX, '');
  return bytesToText(base64ToBytes(cleaned));
}

export default function Base64Tool() {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<Mode>('encode');
  const [wrap, setWrap] = useState(false);

  const result = useMemo(() => {
    const isEmpty = mode === 'encode' ? input.length === 0 : !input.trim();
    if (isEmpty) {
      return { value: '', error: null as string | null };
    }
    try {
      return {
        value:
          mode === 'encode' ? encodeBase64(input, wrap) : decodeBase64(input),
        error: null as string | null,
      };
    } catch (error) {
      return { value: '', error: errorMessage(error) };
    }
  }, [input, mode, wrap]);

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
                : 'Standard Base64'
            }
            htmlFor="base64-input"
            label={mode === 'encode' ? 'Text' : 'Base64'}
          >
            <Textarea
              id="base64-input"
              onChange={(event) => setInput(event.target.value)}
              placeholder={
                mode === 'encode'
                  ? 'Paste text to encode…'
                  : 'Paste Base64 to decode…'
              }
              value={input}
            />
          </Field>

          {mode === 'encode' ? (
            <label className="mt-3 flex cursor-pointer items-center gap-2 text-xs text-fg-muted">
              <input
                checked={wrap}
                className="h-4 w-4"
                onChange={(event) => setWrap(event.target.checked)}
                type="checkbox"
              />
              Wrap output at 76 characters (MIME style)
            </label>
          ) : (
            <p className="mt-3 text-xs text-fg-muted">
              Whitespace and a leading <code>data:…;base64,</code> prefix are
              ignored.
            </p>
          )}

          <Callout className="mt-3" variant="info">
            Text is converted to UTF-8 bytes before Base64 encoding, so
            non-Latin characters and emoji are handled correctly. Decoded bytes
            must form valid UTF-8 text.
          </Callout>
        </Panel>

        <ResultPanel
          emptyText="Base64 output will appear here."
          error={result.error}
          filename="base64-result.txt"
          label={mode === 'encode' ? 'Base64 output' : 'Decoded text'}
          value={result.value}
        />
      </ToolLayout>
    </div>
  );
}
