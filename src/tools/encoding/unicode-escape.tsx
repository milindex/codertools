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

import { errorMessage, unescapeCommon } from './codec';

type Mode = 'escape' | 'unescape';
type Style = 'u4' | 'braces' | 'json';

const hex4 = (value: number) =>
  value.toString(16).toUpperCase().padStart(4, '0');

function escapeUnicode(value: string, style: Style): string {
  if (style === 'json') {
    return JSON.stringify(value).slice(1, -1);
  }

  let output = '';
  for (const char of value) {
    const codePoint = char.codePointAt(0);
    if (codePoint === undefined) {
      continue;
    }

    if (char === '\\') {
      output += '\\\\';
      continue;
    }

    if (codePoint >= 0x20 && codePoint <= 0x7e) {
      output += char;
      continue;
    }

    if (style === 'braces') {
      output += `\\u{${codePoint.toString(16).toUpperCase()}}`;
      continue;
    }

    if (codePoint > 0xffff) {
      const offset = codePoint - 0x10000;
      output += `\\u${hex4(0xd800 + (offset >> 10))}`;
      output += `\\u${hex4(0xdc00 + (offset & 0x3ff))}`;
    } else {
      output += `\\u${hex4(codePoint)}`;
    }
  }

  return output;
}

export default function UnicodeEscapeTool() {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<Mode>('escape');
  const [style, setStyle] = useState<Style>('u4');

  const result = useMemo(() => {
    const isEmpty = mode === 'escape' ? input.length === 0 : !input.trim();
    if (isEmpty) {
      return { value: '', error: null as string | null };
    }
    try {
      return {
        value:
          mode === 'escape'
            ? escapeUnicode(input, style)
            : unescapeCommon(input),
        error: null as string | null,
      };
    } catch (error) {
      return { value: '', error: errorMessage(error) };
    }
  }, [input, mode, style]);

  return (
    <div className="space-y-4">
      <ToolLayout>
        <Panel
          actions={
            <SegmentedControl
              ariaLabel="Conversion direction"
              onChange={(value) => setMode(value as Mode)}
              options={[
                { value: 'escape', label: 'Escape' },
                { value: 'unescape', label: 'Unescape' },
              ]}
              value={mode}
            />
          }
          title="Input"
        >
          <Field
            hint={
              mode === 'escape'
                ? `${input.length} characters`
                : '\\uXXXX, \\u{…}, \\xHH and JSON escapes'
            }
            htmlFor="unicode-input"
            label={mode === 'escape' ? 'Text' : 'Escaped text'}
          >
            <Textarea
              id="unicode-input"
              onChange={(event) => setInput(event.target.value)}
              placeholder={
                mode === 'escape'
                  ? 'Paste text such as Hello — 世界 🙂…'
                  : 'Paste escapes such as \\u4F60\\u597D…'
              }
              value={input}
            />
          </Field>

          {mode === 'escape' && (
            <Field
              className="mt-3"
              hint={
                style === 'json' ? 'Output omits the outer quotes' : undefined
              }
              htmlFor="unicode-style"
              label="Escape style"
            >
              <Select
                id="unicode-style"
                onChange={(event) => setStyle(event.target.value as Style)}
                value={style}
              >
                <option value="u4">\uXXXX (UTF-16 code units)</option>
                <option value="braces">{'\\u{…} (code points)'}</option>
                <option value="json">JSON string escapes</option>
              </Select>
            </Field>
          )}

          <Callout className="mt-3" variant="info">
            {mode === 'escape'
              ? 'Printable ASCII is left as-is; backslashes, control characters and non-ASCII characters are escaped. Characters outside the BMP (such as emoji) become a surrogate pair in \\uXXXX mode.'
              : 'Decoding understands \\uXXXX, \\u{…}, \\xHH, \\UXXXXXXXX, octal escapes and the usual \\n, \\r, \\t, \\b, \\f, \\v, \\a escapes.'}
          </Callout>
        </Panel>

        <ResultPanel
          emptyText="Escaped or decoded text will appear here."
          error={result.error}
          filename="unicode-result.txt"
          label={mode === 'escape' ? 'Escaped output' : 'Decoded text'}
          value={result.value}
        />
      </ToolLayout>
    </div>
  );
}
