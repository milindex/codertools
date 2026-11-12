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
type Language = 'javascript' | 'python' | 'c' | 'json';

const hex = (value: number, width: number) =>
  value.toString(16).toUpperCase().padStart(width, '0');

function escapeJs(value: string): string {
  let output = '';
  for (const character of value) {
    const codePoint = character.codePointAt(0) ?? 0;
    switch (character) {
      case '\\':
        output += '\\\\';
        break;
      case "'":
        output += "\\'";
        break;
      case '"':
        output += '\\"';
        break;
      case '\n':
        output += '\\n';
        break;
      case '\r':
        output += '\\r';
        break;
      case '\t':
        output += '\\t';
        break;
      case '\b':
        output += '\\b';
        break;
      case '\f':
        output += '\\f';
        break;
      case '\v':
        output += '\\v';
        break;
      default:
        if (codePoint < 0x20 || codePoint === 0x7f) {
          output += `\\x${hex(codePoint, 2)}`;
        } else if (codePoint === 0x2028) {
          output += '\\u2028';
        } else if (codePoint === 0x2029) {
          output += '\\u2029';
        } else {
          output += character;
        }
    }
  }
  return output;
}

function escapePython(value: string): string {
  let output = '';
  for (const character of value) {
    const codePoint = character.codePointAt(0) ?? 0;
    switch (character) {
      case '\\':
        output += '\\\\';
        break;
      case "'":
        output += "\\'";
        break;
      case '"':
        output += '\\"';
        break;
      case '\n':
        output += '\\n';
        break;
      case '\r':
        output += '\\r';
        break;
      case '\t':
        output += '\\t';
        break;
      case '\b':
        output += '\\b';
        break;
      case '\f':
        output += '\\f';
        break;
      case '\v':
        output += '\\v';
        break;
      case '\u0007':
        output += '\\a';
        break;
      default:
        if (codePoint < 0x20 || codePoint === 0x7f) {
          output += `\\x${hex(codePoint, 2)}`;
        } else if (codePoint > 0x7f) {
          output +=
            codePoint <= 0xffff
              ? `\\u${hex(codePoint, 4)}`
              : `\\U${hex(codePoint, 8)}`;
        } else {
          output += character;
        }
    }
  }
  return output;
}

function escapeC(value: string): string {
  let output = '';
  for (const character of value) {
    const codePoint = character.codePointAt(0) ?? 0;
    switch (character) {
      case '\\':
        output += '\\\\';
        break;
      case '"':
        output += '\\"';
        break;
      case '\n':
        output += '\\n';
        break;
      case '\r':
        output += '\\r';
        break;
      case '\t':
        output += '\\t';
        break;
      case '\b':
        output += '\\b';
        break;
      case '\f':
        output += '\\f';
        break;
      case '\v':
        output += '\\v';
        break;
      case '\u0007':
        output += '\\a';
        break;
      default:
        if (codePoint < 0x20 || codePoint === 0x7f) {
          output += `\\${codePoint.toString(8).padStart(3, '0')}`;
        } else if (codePoint > 0x7f) {
          output +=
            codePoint <= 0xffff
              ? `\\u${hex(codePoint, 4)}`
              : `\\U${hex(codePoint, 8)}`;
        } else {
          output += character;
        }
    }
  }
  return output;
}

function escapeValue(value: string, language: Language): string {
  switch (language) {
    case 'python':
      return escapePython(value);
    case 'c':
      return escapeC(value);
    case 'json':
      return JSON.stringify(value).slice(1, -1);
    default:
      return escapeJs(value);
  }
}

export default function StringEscaperTool() {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<Mode>('escape');
  const [language, setLanguage] = useState<Language>('javascript');

  const result = useMemo(() => {
    const isEmpty = mode === 'escape' ? input.length === 0 : !input.trim();
    if (isEmpty) {
      return { value: '', error: null as string | null };
    }
    try {
      return {
        value:
          mode === 'escape'
            ? escapeValue(input, language)
            : unescapeCommon(input),
        error: null as string | null,
      };
    } catch (error) {
      return { value: '', error: errorMessage(error) };
    }
  }, [input, language, mode]);

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
            hint={`${input.length} characters`}
            htmlFor="string-escaper-input"
            label={mode === 'escape' ? 'Text' : 'Escaped string content'}
          >
            <Textarea
              id="string-escaper-input"
              onChange={(event) => setInput(event.target.value)}
              placeholder={
                mode === 'escape'
                  ? 'Paste text with quotes, newlines or Unicode…'
                  : 'Paste escaped content such as line\\nbreak…'
              }
              value={input}
            />
          </Field>

          <Field
            className="mt-3"
            hint={
              mode === 'escape'
                ? 'Output omits the surrounding quotes'
                : undefined
            }
            htmlFor="string-escaper-language"
            label="Language"
          >
            <Select
              id="string-escaper-language"
              onChange={(event) => setLanguage(event.target.value as Language)}
              value={language}
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="c">C / C++</option>
              <option value="json">JSON</option>
            </Select>
          </Field>

          <Callout className="mt-3" variant="info">
            {mode === 'escape'
              ? 'Escapes backslashes, quotes and control characters. Python and C outputs use \\uXXXX / \\UXXXXXXXX for non-ASCII; JSON keeps Unicode characters literal. Paste the result inside quotes.'
              : 'Unescaping understands \\n, \\r, \\t, \\xHH, \\uXXXX, \\u{…}, \\UXXXXXXXX, octal escapes and JSON escapes.'}
          </Callout>
        </Panel>

        <ResultPanel
          emptyText="Escaped or unescaped text will appear here."
          error={result.error}
          filename={
            mode === 'escape' ? 'escaped-string.txt' : 'unescaped-string.txt'
          }
          label={mode === 'escape' ? 'Escaped output' : 'Unescaped text'}
          value={result.value}
        />
      </ToolLayout>
    </div>
  );
}
