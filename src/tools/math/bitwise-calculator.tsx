'use client';

import { useMemo, useState } from 'react';

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

type Operator = '&' | '|' | '^' | '~' | '<<' | '>>' | '>>>';

const operators: Array<{ value: Operator; label: string; needsB: boolean }> = [
  { value: '&', label: 'AND (a & b)', needsB: true },
  { value: '|', label: 'OR (a | b)', needsB: true },
  { value: '^', label: 'XOR (a ^ b)', needsB: true },
  { value: '~', label: 'NOT (~a)', needsB: false },
  { value: '<<', label: 'Left shift (a << b)', needsB: true },
  { value: '>>', label: 'Arithmetic right shift (a >> b)', needsB: true },
  { value: '>>>', label: 'Logical right shift (a >>> b)', needsB: true },
];

const bases = [
  { value: '10', label: 'Decimal' },
  { value: '16', label: 'Hexadecimal' },
  { value: '2', label: 'Binary' },
];

export default function BitwiseCalculator() {
  const [aInput, setAInput] = useState('0b1100');
  const [bInput, setBInput] = useState('0b1010');
  const [base, setBase] = useState('2');
  const [operator, setOperator] = useState<Operator>('&');

  const selected = operators.find((item) => item.value === operator);
  const needsB = selected?.needsB ?? true;

  const calculation = useMemo(() => {
    if (!aInput.trim()) {
      return { error: null, value: '' };
    }

    if (aInput.length > 100000 || (needsB && bInput.length > 100000)) {
      return {
        error: 'Operands are too long (maximum 100,000 characters each).',
        value: '',
      };
    }

    const radix = Number(base);
    const aResult = parseBigIntInBase(aInput, radix);
    if (!aResult.ok) {
      return { error: `First operand: ${aResult.error}`, value: '' };
    }

    let b = 0n;
    if (needsB) {
      if (!bInput.trim()) {
        return { error: 'Enter the second operand.', value: '' };
      }

      const bResult = parseBigIntInBase(bInput, radix);
      if (!bResult.ok) {
        return { error: `Second operand: ${bResult.error}`, value: '' };
      }
      b = bResult.value;
    }

    if (operator === '<<' || operator === '>>' || operator === '>>>') {
      if (b < 0n) {
        return { error: 'Shift counts must be zero or greater.', value: '' };
      }
      if (b > 100000n) {
        return {
          error: 'Shift count is too large (maximum 100,000).',
          value: '',
        };
      }
    }

    if (operator === '>>>' && aResult.value < 0n) {
      return {
        error:
          'Logical right shift (>>>) needs a non-negative operand. Use >> for signed values.',
        value: '',
      };
    }

    let result: bigint;
    switch (operator) {
      case '&':
        result = aResult.value & b;
        break;
      case '|':
        result = aResult.value | b;
        break;
      case '^':
        result = aResult.value ^ b;
        break;
      case '~':
        result = ~aResult.value;
        break;
      case '<<':
        result = aResult.value << b;
        break;
      case '>>':
        result = aResult.value >> b;
        break;
      case '>>>':
        result = aResult.value >> b;
        break;
      default:
        result = 0n;
    }

    const magnitude = result < 0n ? -result : result;
    const bitLength = magnitude === 0n ? 1 : magnitude.toString(2).length;

    const aText = toBaseString(aResult.value, radix, radix !== 10, true);
    const bText = toBaseString(b, radix, radix !== 10, true);
    const expression =
      operator === '~' ? `~${aText}` : `${aText} ${operator} ${bText}`;

    const lines = [
      `Expression: ${expression}`,
      '',
      `Decimal:     ${result.toString()}`,
      `Grouped:     ${groupDigits(result)}`,
      `Binary:      ${toBaseString(result, 2, true)}`,
      `Hexadecimal: ${toBaseString(result, 16, true, true)}`,
      `Octal:       ${toBaseString(result, 8, true)}`,
      '',
      `Bit length: ${bitLength} bit${bitLength === 1 ? '' : 's'}`,
      `Is zero: ${result === 0n ? 'yes' : 'no'}`,
      `Is negative: ${result < 0n ? 'yes' : 'no'}`,
    ];

    return { error: null, value: lines.join('\n') };
  }, [aInput, bInput, base, needsB, operator]);

  return (
    <ToolLayout>
      <Panel
        description="Operates on arbitrary-precision integers. Inputs are read in the selected base, with optional 0b / 0x prefixes."
        title="Operands"
      >
        <div className="space-y-3">
          <Field label="Input base">
            <Select
              aria-label="Input base"
              onChange={(event) => setBase(event.target.value)}
              value={base}
            >
              {bases.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Operand A">
            <Input
              aria-label="Operand A"
              autoComplete="off"
              onChange={(event) => setAInput(event.target.value)}
              placeholder="0b1100"
              spellCheck={false}
              value={aInput}
            />
          </Field>

          <Field label="Operator">
            <Select
              aria-label="Bitwise operator"
              onChange={(event) => setOperator(event.target.value as Operator)}
              value={operator}
            >
              {operators.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            hint={
              needsB
                ? 'Shift count must be a non-negative integer.'
                : 'Not used by NOT.'
            }
            label="Operand B"
          >
            <Input
              aria-label="Operand B"
              autoComplete="off"
              disabled={!needsB}
              onChange={(event) => setBInput(event.target.value)}
              placeholder="0b1010"
              spellCheck={false}
              value={bInput}
            />
          </Field>

          <div className="rounded-md border border-border bg-canvas-inset p-3 text-xs leading-6 text-fg-muted">
            <p>NOT uses an infinite two’s-complement representation.</p>
            <p className="mt-1 font-mono text-fg">~0b1100 = -0b1101 = -13</p>
          </div>
        </div>
      </Panel>

      <ResultPanel
        error={calculation.error}
        filename="bitwise-result.txt"
        label="Result"
        value={calculation.value}
      />
    </ToolLayout>
  );
}
