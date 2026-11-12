'use client';

import { useMemo, useState } from 'react';

import { Callout } from '@/components/ui/Callout';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { ToolLayout } from '@/components/ui/ToolLayout';

type Mode = 'encode' | 'decode';

const BASE = 36;
const T_MIN = 1;
const T_MAX = 26;
const SKEW = 38;
const DAMP = 700;
const INITIAL_BIAS = 72;
const INITIAL_N = 128;
const MAX = Number.MAX_SAFE_INTEGER;

function adapt(delta: number, numPoints: number, firstTime: boolean): number {
  let value = firstTime ? Math.floor(delta / DAMP) : Math.floor(delta / 2);
  value += Math.floor(value / numPoints);

  let k = 0;
  while (value > ((BASE - T_MIN) * T_MAX) / 2) {
    value = Math.floor(value / (BASE - T_MIN));
    k += BASE;
  }

  return k + Math.floor(((BASE - T_MIN + 1) * value) / (value + SKEW));
}

function encodeDigit(digit: number): string {
  return digit < 26
    ? String.fromCharCode(97 + digit)
    : String.fromCharCode(48 + digit - 26);
}

function decodeDigit(codePoint: number): number {
  if (codePoint >= 48 && codePoint <= 57) {
    return codePoint - 22;
  }
  if (codePoint >= 65 && codePoint <= 90) {
    return codePoint - 65;
  }
  if (codePoint >= 97 && codePoint <= 122) {
    return codePoint - 97;
  }
  return -1;
}

function punycodeEncode(input: string): string {
  const codePoints = Array.from(
    input,
    (character) => character.codePointAt(0) ?? 0
  );
  let output = '';
  for (const codePoint of codePoints) {
    if (codePoint < 0x80) {
      output += String.fromCharCode(codePoint);
    }
  }

  const basicCount = output.length;
  let handled = basicCount;
  if (basicCount > 0) {
    output += '-';
  }

  let n = INITIAL_N;
  let delta = 0;
  let bias = INITIAL_BIAS;

  while (handled < codePoints.length) {
    let next = MAX;
    for (const codePoint of codePoints) {
      if (codePoint >= n && codePoint < next) {
        next = codePoint;
      }
    }
    if (next === MAX) {
      throw new Error('Could not encode this label as Punycode.');
    }
    if (next - n > Math.floor((MAX - delta) / (handled + 1))) {
      throw new Error('This label is too long to encode.');
    }

    delta += (next - n) * (handled + 1);
    n = next;

    for (const codePoint of codePoints) {
      if (codePoint < n) {
        delta += 1;
        if (delta > MAX) {
          throw new Error('This label is too long to encode.');
        }
      } else if (codePoint === n) {
        let q = delta;
        for (let k = BASE; ; k += BASE) {
          const threshold =
            k <= bias ? T_MIN : k >= bias + T_MAX ? T_MAX : k - bias;
          if (q < threshold) {
            break;
          }
          output += encodeDigit(
            threshold + ((q - threshold) % (BASE - threshold))
          );
          q = Math.floor((q - threshold) / (BASE - threshold));
        }
        output += encodeDigit(q);
        bias = adapt(delta, handled + 1, handled === basicCount);
        delta = 0;
        handled += 1;
      }
    }

    delta += 1;
    n += 1;
  }

  return output;
}

function punycodeDecode(input: string): string {
  const delimiter = input.lastIndexOf('-');
  const output: number[] = [];
  let position = 0;

  if (delimiter > 0) {
    for (const character of input.slice(0, delimiter)) {
      const codePoint = character.codePointAt(0) ?? 0;
      if (codePoint >= 0x80) {
        throw new Error('Invalid Punycode: basic code points must be ASCII.');
      }
      output.push(codePoint);
    }
    position = delimiter + 1;
  } else if (delimiter === 0) {
    position = 1;
  }

  let n = INITIAL_N;
  let i = 0;
  let bias = INITIAL_BIAS;

  while (position < input.length) {
    const oldI = i;
    let weight = 1;

    for (let k = BASE; ; k += BASE) {
      if (position >= input.length) {
        throw new Error('Invalid Punycode: truncated sequence.');
      }
      const digit = decodeDigit(input.charCodeAt(position));
      position += 1;
      if (digit < 0) {
        throw new Error('Invalid Punycode: unexpected character.');
      }
      if (digit > Math.floor((MAX - i) / weight)) {
        throw new Error('Invalid Punycode: number overflow.');
      }
      i += digit * weight;

      const threshold =
        k <= bias ? T_MIN : k >= bias + T_MAX ? T_MAX : k - bias;
      if (digit < threshold) {
        break;
      }
      if (weight > Math.floor(MAX / (BASE - threshold))) {
        throw new Error('Invalid Punycode: number overflow.');
      }
      weight *= BASE - threshold;
    }

    const length = output.length + 1;
    bias = adapt(i - oldI, length, oldI === 0);
    if (Math.floor(i / length) > MAX - n) {
      throw new Error('Invalid Punycode: number overflow.');
    }
    n += Math.floor(i / length);
    i %= length;

    if (n > 0x10ffff || (n >= 0xd800 && n <= 0xdfff)) {
      throw new Error('Invalid Punycode: decoded an invalid code point.');
    }

    output.splice(i, 0, n);
    i += 1;
  }

  return String.fromCodePoint(...output);
}

function convertLabel(label: string, mode: Mode): string {
  if (!label) {
    throw new Error('Domain names cannot contain empty labels.');
  }

  if (mode === 'encode') {
    if (/^[\x00-\x7f]+$/.test(label)) {
      if (label.length > 63) {
        throw new Error(`Label "${label}" is longer than 63 characters.`);
      }
      return label;
    }

    const normalized = label.normalize('NFC').toLowerCase();
    const encoded = `xn--${punycodeEncode(normalized)}`;
    if (encoded.length > 63) {
      throw new Error(
        `Label "${label}" is longer than 63 characters after encoding.`
      );
    }
    return encoded;
  }

  if (!/^xn--/i.test(label)) {
    return label;
  }

  const decoded = punycodeDecode(label.slice(4));
  if (!decoded) {
    throw new Error(
      `Label "${label}" does not contain a valid Punycode value.`
    );
  }
  if (/[.\s/\\@?#:]/.test(decoded) || /[\u0000-\u001f\u007f]/.test(decoded)) {
    throw new Error(`Label "${label}" decoded to an invalid domain label.`);
  }
  return decoded;
}

function convertDomain(value: string, mode: Mode): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }
  if (/[\s/\\@?#:]/.test(trimmed)) {
    throw new Error(
      'Enter a domain name only — no scheme, path, port, spaces or @ sign.'
    );
  }
  if (/[\u0000-\u001f\u007f]/.test(trimmed)) {
    throw new Error('The domain name contains control characters.');
  }

  const trailingDot = trimmed.endsWith('.');
  const body = trailingDot ? trimmed.slice(0, -1) : trimmed;
  if (!body) {
    throw new Error('Enter a domain name.');
  }

  const converted = body
    .split('.')
    .map((label) => convertLabel(label, mode))
    .join('.');

  const result = converted + (trailingDot ? '.' : '');
  if (result.length > 253) {
    throw new Error('The converted domain name is longer than 253 characters.');
  }
  return result;
}

export default function PunycodeIdnTool() {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<Mode>('encode');

  const result = useMemo(() => {
    if (!input.trim()) {
      return { value: '', error: null as string | null };
    }
    try {
      return {
        value: convertDomain(input, mode),
        error: null as string | null,
      };
    } catch (error) {
      return {
        value: '',
        error: error instanceof Error ? error.message : 'Conversion failed.',
      };
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
                { value: 'encode', label: 'IDN → Punycode' },
                { value: 'decode', label: 'Punycode → IDN' },
              ]}
              value={mode}
            />
          }
          title="Input"
        >
          <Field
            hint="Hostname only, one label per dot"
            htmlFor="punycode-input"
            label={
              mode === 'encode' ? 'Internationalized domain' : 'Punycode domain'
            }
          >
            <Input
              autoCapitalize="off"
              autoComplete="off"
              id="punycode-input"
              onChange={(event) => setInput(event.target.value)}
              placeholder={
                mode === 'encode'
                  ? 'münchen.de or 例え.テスト'
                  : 'xn--mnchen-3ya.de'
              }
              spellCheck={false}
              value={input}
            />
          </Field>

          <Callout className="mt-3" variant="info">
            Implements Punycode (RFC 3492) for each domain label. Encoding
            lowercases and NFC-normalizes non-ASCII labels. Existing{' '}
            <code>xn--</code> labels are left alone when encoding.
          </Callout>

          <Callout className="mt-3" variant="warning">
            This converts hostnames, not full URLs. It does not perform full UTS
            #46 mapping or check whether a domain can actually be registered.
          </Callout>
        </Panel>

        <ResultPanel
          emptyText="The converted domain will appear here."
          error={result.error}
          filename="punycode-result.txt"
          label={
            mode === 'encode' ? 'Punycode (ASCII) domain' : 'Unicode domain'
          }
          value={result.value}
        />
      </ToolLayout>
    </div>
  );
}
