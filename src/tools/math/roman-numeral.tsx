'use client';

import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { ToolLayout } from '@/components/ui/ToolLayout';

const numerals: Array<{ value: number; symbol: string }> = [
  { value: 1000, symbol: 'M' },
  { value: 900, symbol: 'CM' },
  { value: 500, symbol: 'D' },
  { value: 400, symbol: 'CD' },
  { value: 100, symbol: 'C' },
  { value: 90, symbol: 'XC' },
  { value: 50, symbol: 'L' },
  { value: 40, symbol: 'XL' },
  { value: 10, symbol: 'X' },
  { value: 9, symbol: 'IX' },
  { value: 5, symbol: 'V' },
  { value: 4, symbol: 'IV' },
  { value: 1, symbol: 'I' },
];

const numeralValues: Record<string, number> = {
  I: 1,
  V: 5,
  X: 10,
  L: 50,
  C: 100,
  D: 500,
  M: 1000,
};

const toRoman = (value: number): string => {
  let remaining = value;
  let output = '';

  for (const numeral of numerals) {
    while (remaining >= numeral.value) {
      output += numeral.symbol;
      remaining -= numeral.value;
    }
  }

  return output;
};

const parseRoman = (raw: string): { value: number } | { error: string } => {
  const text = raw.trim().toUpperCase();

  if (!text) {
    return { error: 'Enter a Roman numeral.' };
  }

  if (!/^[IVXLCDM]+$/.test(text)) {
    return {
      error: 'Use only the Roman numeral letters I, V, X, L, C, D and M.',
    };
  }

  let value = 0;
  for (let index = 0; index < text.length; index += 1) {
    const current = numeralValues[text[index] ?? ''];
    const next = numeralValues[text[index + 1] ?? ''];
    if (current === undefined) {
      return { error: 'Unexpected character in Roman numeral.' };
    }
    value += next !== undefined && current < next ? -current : current;
  }

  if (value < 1 || value > 3999) {
    return {
      error: 'Standard Roman numerals represent values from 1 to 3999.',
    };
  }

  const canonical = toRoman(value);
  if (canonical !== text) {
    return {
      error: `“${text}” is not the canonical form. Did you mean “${canonical}”?`,
    };
  }

  return { value };
};

const breakdown = (value: number) => {
  let remaining = value;
  const parts: string[] = [];

  for (const numeral of numerals) {
    if (remaining >= numeral.value) {
      const count = Math.floor(remaining / numeral.value);
      parts.push(
        `${numeral.symbol} = ${numeral.value}${count > 1 ? ` × ${count}` : ''}`
      );
      remaining -= count * numeral.value;
    }
  }

  return parts;
};

export default function RomanNumeral() {
  const [mode, setMode] = useState('to-roman');
  const [input, setInput] = useState('2024');

  const result = useMemo(() => {
    if (!input.trim()) {
      return { error: null, value: '' };
    }

    if (input.length > 100) {
      return { error: 'Input is too long for this converter.', value: '' };
    }

    if (mode === 'to-roman') {
      if (!/^\d+$/.test(input.trim())) {
        return { error: 'Enter a whole number from 1 to 3999.', value: '' };
      }

      const value = Number(input.trim());
      if (!Number.isSafeInteger(value) || value < 1 || value > 3999) {
        return { error: 'Enter a whole number from 1 to 3999.', value: '' };
      }

      const roman = toRoman(value);
      const parts = breakdown(value);
      const lines = [
        `Number: ${value}`,
        `Roman numeral: ${roman}`,
        '',
        'Expanded by subtractive pairs:',
        ...parts.map((part) => `  ${part}`),
        '',
        `Length: ${roman.length} character${roman.length === 1 ? '' : 's'}`,
      ];

      return { error: null, value: lines.join('\n') };
    }

    const parsed = parseRoman(input);
    if ('error' in parsed) {
      return { error: parsed.error, value: '' };
    }

    const roman = toRoman(parsed.value);
    const parts = breakdown(parsed.value);
    const lines = [
      `Roman numeral: ${input.trim().toUpperCase()}`,
      `Number: ${parsed.value}`,
      '',
      'Expanded by subtractive pairs:',
      ...parts.map((part) => `  ${part}`),
      '',
      `Canonical form: ${roman}`,
    ];

    return { error: null, value: lines.join('\n') };
  }, [input, mode]);

  return (
    <div className="space-y-6">
      <ToolLayout>
        <Panel
          description="Standard Roman numerals use subtractive notation and cover values from 1 to 3999."
          title="Convert"
        >
          <div className="space-y-3">
            <Field label="Direction">
              <SegmentedControl
                ariaLabel="Conversion direction"
                onChange={(value) => {
                  setMode(value);
                  setInput(value === 'to-roman' ? '2024' : 'MMXXIV');
                }}
                options={[
                  { value: 'to-roman', label: 'Number → Roman' },
                  { value: 'from-roman', label: 'Roman → number' },
                ]}
                value={mode}
              />
            </Field>

            <Field
              hint={
                mode === 'to-roman'
                  ? 'Whole numbers from 1 to 3999.'
                  : 'Letters I, V, X, L, C, D and M.'
              }
              label={mode === 'to-roman' ? 'Number' : 'Roman numeral'}
            >
              <Input
                aria-label={mode === 'to-roman' ? 'Number' : 'Roman numeral'}
                autoComplete="off"
                onChange={(event) => setInput(event.target.value)}
                placeholder={mode === 'to-roman' ? '2024' : 'MMXXIV'}
                spellCheck={false}
                value={input}
              />
            </Field>

            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => {
                  setMode('to-roman');
                  setInput('2024');
                }}
                size="sm"
                variant="ghost"
              >
                Example 2024
              </Button>
              <Button
                onClick={() => {
                  setMode('from-roman');
                  setInput('MMXXIV');
                }}
                size="sm"
                variant="ghost"
              >
                Example MMXXIV
              </Button>
              <Button onClick={() => setInput('')} size="sm" variant="ghost">
                Clear
              </Button>
            </div>

            <div className="rounded-md border border-border bg-canvas-inset p-3">
              <p className="mb-2 text-xs font-semibold text-fg">Reference</p>
              <div className="grid grid-cols-4 gap-1.5 text-xs text-fg-muted sm:grid-cols-7">
                {(['I', 'V', 'X', 'L', 'C', 'D', 'M'] as const).map(
                  (symbol) => (
                    <button
                      className="cursor-pointer rounded border border-border bg-surface px-2 py-1 text-center font-mono text-fg hover:border-accent"
                      key={symbol}
                      onClick={() => {
                        setMode('from-roman');
                        setInput(symbol);
                      }}
                      type="button"
                    >
                      {symbol} = {numeralValues[symbol]}
                    </button>
                  )
                )}
              </div>
              <p className="mt-2 text-[11px] leading-5 text-fg-subtle">
                Subtractive pairs: IV (4), IX (9), XL (40), XC (90), CD (400),
                CM (900).
              </p>
            </div>
          </div>
        </Panel>

        <ResultPanel
          error={result.error}
          filename="roman-numeral.txt"
          label="Result"
          value={result.value}
        />
      </ToolLayout>
    </div>
  );
}
