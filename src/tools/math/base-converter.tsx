'use client';

import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { Select } from '@/components/ui/Select';
import { ToolLayout } from '@/components/ui/ToolLayout';
import {
  groupDigits,
  parseBigIntInBase,
  toBaseString,
} from '@/tools/math/shared';

const baseOptions = [
  { value: '2', label: 'Binary (base 2)' },
  { value: '8', label: 'Octal (base 8)' },
  { value: '10', label: 'Decimal (base 10)' },
  { value: '16', label: 'Hexadecimal (base 16)' },
];

const placeholders: Record<string, string> = {
  '2': '1111 1111',
  '8': '377',
  '10': '255',
  '16': 'FF',
};

export default function BaseConverter() {
  const [input, setInput] = useState('255');
  const [base, setBase] = useState('10');

  const conversion = useMemo(() => {
    if (!input.trim()) {
      return { error: null, value: '' };
    }

    if (input.length > 100000) {
      return {
        error: 'Input is too long (maximum 100,000 characters).',
        value: '',
      };
    }

    const parsed = parseBigIntInBase(input, Number(base));
    if (!parsed.ok) {
      return { error: parsed.error, value: '' };
    }

    const value = parsed.value;
    const magnitude = value < 0n ? -value : value;
    const bitLength = magnitude === 0n ? 1 : magnitude.toString(2).length;

    const lines = [
      `Input (base ${base}): ${input.trim()}`,
      '',
      `Binary:      ${toBaseString(value, 2, true)}`,
      `Octal:       ${toBaseString(value, 8, true)}`,
      `Decimal:     ${value.toString()}`,
      `Hexadecimal: ${toBaseString(value, 16, true, true)}`,
      '',
      `Grouped decimal: ${groupDigits(value)}`,
      `Bit length: ${bitLength} bit${bitLength === 1 ? '' : 's'}`,
      `Hex digits: ${magnitude === 0n ? 1 : Math.ceil(bitLength / 4)}`,
      '',
      `Base-36: ${toBaseString(value, 36, false, true)}`,
    ];

    return { error: null, value: lines.join('\n') };
  }, [base, input]);

  return (
    <ToolLayout>
      <Panel
        description="Accepts arbitrarily large integers, optional 0b / 0o / 0x prefixes, underscores and an optional leading sign."
        title="Input"
      >
        <div className="space-y-3">
          <Field hint={`${input.length} characters`} label="Number to convert">
            <Input
              aria-label="Number to convert"
              autoComplete="off"
              onChange={(event) => setInput(event.target.value)}
              placeholder={placeholders[base] ?? 'Enter a number'}
              spellCheck={false}
              value={input}
            />
          </Field>

          <Field label="Input base">
            <Select
              aria-label="Input base"
              onChange={(event) => setBase(event.target.value)}
              value={base}
            >
              {baseOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>

          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setInput('')} variant="ghost">
              Clear
            </Button>
            <Button onClick={() => setBase('10')} variant="default">
              Reset base
            </Button>
          </div>

          <div className="rounded-md border border-border bg-canvas-inset p-3 text-xs leading-6 text-fg-muted">
            <p>
              Digits may be separated with spaces or underscores. Negative
              values keep their sign in every base.
            </p>
            <p className="mt-1 font-mono text-fg">
              255 = 0b11111111 = 0o377 = 0xFF
            </p>
          </div>
        </div>
      </Panel>

      <ResultPanel
        error={conversion.error}
        filename="base-conversion.txt"
        label="Conversions"
        value={conversion.value}
      />
    </ToolLayout>
  );
}
