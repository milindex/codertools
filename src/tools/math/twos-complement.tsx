'use client';

import { useMemo, useState } from 'react';

import { Callout } from '@/components/ui/Callout';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Select } from '@/components/ui/Select';
import { ToolLayout } from '@/components/ui/ToolLayout';
import { parseBigIntInBase, toBaseString } from '@/tools/math/shared';

const widths = [4, 8, 12, 16, 24, 32, 48, 64, 128];

const inputBases = [
  { value: '10', label: 'Decimal' },
  { value: '16', label: 'Hexadecimal' },
  { value: '2', label: 'Binary' },
];

const groupBits = (bits: string): string => bits.replace(/(.{4})(?=.)/g, '$1 ');

export default function TwosComplement() {
  const [raw, setRaw] = useState('-5');
  const [width, setWidth] = useState('8');
  const [inputBase, setInputBase] = useState('10');
  const [mode, setMode] = useState('signed');

  const calculation = useMemo(() => {
    if (!raw.trim()) {
      return { error: null, value: '' };
    }

    if (raw.length > 10000) {
      return {
        error: 'Input is too long (maximum 10,000 characters).',
        value: '',
      };
    }

    const parsed = parseBigIntInBase(raw, Number(inputBase));
    if (!parsed.ok) {
      return { error: parsed.error, value: '' };
    }

    const bits = Number(width);
    const modulus = 1n << BigInt(bits);
    const half = 1n << BigInt(bits - 1);
    const signedMin = -half;
    const signedMax = half - 1n;
    const unsignedMax = modulus - 1n;
    const value = parsed.value;

    if (mode === 'signed' && (value < signedMin || value > signedMax)) {
      return {
        error: `Signed ${bits}-bit values must be between ${signedMin.toString()} and ${signedMax.toString()}.`,
        value: '',
      };
    }

    if (mode === 'unsigned' && (value < 0n || value > unsignedMax)) {
      return {
        error: `Unsigned ${bits}-bit values must be between 0 and ${unsignedMax.toString()}.`,
        value: '',
      };
    }

    const stored = BigInt.asUintN(bits, value);
    const signed = BigInt.asIntN(bits, value);
    const binary = groupBits(stored.toString(2).padStart(bits, '0'));
    const hexDigits = Math.ceil(bits / 4);
    const hex = stored.toString(16).toUpperCase().padStart(hexDigits, '0');

    const lines = [
      `Bit width: ${bits} bits`,
      `Mode: ${mode === 'signed' ? 'signed input' : 'unsigned input'}`,
      '',
      `Input value: ${value.toString()}`,
      `Bit pattern: ${stored.toString(2).padStart(bits, '0')}`,
      `Grouped:     ${binary}`,
      `Hexadecimal: 0x${hex}`,
      `Octal:       ${toBaseString(stored, 8, true)}`,
      '',
      `Signed interpretation:   ${signed.toString()}`,
      `Unsigned interpretation: ${stored.toString()}`,
      '',
      `Signed range:   ${signedMin.toString()} … ${signedMax.toString()}`,
      `Unsigned range: 0 … ${unsignedMax.toString()}`,
      `Two's-complement range size: ${modulus.toString()}`,
      '',
      value === signed
        ? 'The stored bits already equal the signed value.'
        : value < 0n
          ? `To encode ${value.toString()}, flip the bits of ${(value < 0n ? -value : value).toString()} and add 1.`
          : `The bit pattern ${stored.toString()} decodes to ${signed.toString()} when read as signed.`,
    ];

    return { error: null, value: lines.join('\n') };
  }, [inputBase, mode, raw, width]);

  return (
    <ToolLayout>
      <Panel
        description="Encode a signed integer into a fixed-width bit pattern, or decode an unsigned bit pattern as a signed value."
        title="Input"
      >
        <div className="space-y-3">
          <Field label="Mode">
            <SegmentedControl
              ariaLabel="Input interpretation"
              onChange={setMode}
              options={[
                { value: 'signed', label: 'Signed input' },
                { value: 'unsigned', label: 'Unsigned input' },
              ]}
              value={mode}
            />
          </Field>

          <Field label="Bit width">
            <Select
              aria-label="Bit width"
              onChange={(event) => setWidth(event.target.value)}
              value={width}
            >
              {widths.map((item) => (
                <option key={item} value={item}>
                  {item} bits
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Input base">
            <Select
              aria-label="Input base"
              onChange={(event) => setInputBase(event.target.value)}
              value={inputBase}
            >
              {inputBases.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            hint={
              mode === 'signed'
                ? 'Enter a value inside the signed range.'
                : 'Enter a non-negative value inside the unsigned range.'
            }
            label="Value"
          >
            <Input
              aria-label="Value"
              autoComplete="off"
              onChange={(event) => setRaw(event.target.value)}
              placeholder={mode === 'signed' ? '-5' : '251'}
              spellCheck={false}
              value={raw}
            />
          </Field>

          <Callout variant="info">
            With <span className="font-mono">8</span> bits, signed values run
            from <span className="font-mono">-128</span> to{' '}
            <span className="font-mono">127</span>. The same bit pattern read as
            unsigned runs from <span className="font-mono">0</span> to{' '}
            <span className="font-mono">255</span>.
          </Callout>
        </div>
      </Panel>

      <ResultPanel
        error={calculation.error}
        filename="twos-complement.txt"
        label="Two's complement"
        value={calculation.value}
      />
    </ToolLayout>
  );
}
