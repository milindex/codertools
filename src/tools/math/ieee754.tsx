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

type Precision = '32' | '64';

type Breakdown = {
  totalBits: number;
  exponentBits: number;
  mantissaBits: number;
  bias: number;
  sign: bigint;
  exponentRaw: bigint;
  mantissa: bigint;
  bits: bigint;
  value: number;
};

const getBreakdown = (bits: bigint, precision: Precision): Breakdown => {
  const totalBits = precision === '32' ? 32 : 64;
  const exponentBits = precision === '32' ? 8 : 11;
  const mantissaBits = precision === '32' ? 23 : 52;
  const bias = precision === '32' ? 127 : 1023;
  const mantissaMask = (1n << BigInt(mantissaBits)) - 1n;
  const exponentMask = (1n << BigInt(exponentBits)) - 1n;

  const sign = (bits >> BigInt(totalBits - 1)) & 1n;
  const exponentRaw = (bits >> BigInt(mantissaBits)) & exponentMask;
  const mantissa = bits & mantissaMask;

  const buffer = new ArrayBuffer(totalBits / 8);
  const view = new DataView(buffer);
  if (precision === '32') {
    view.setUint32(0, Number(bits), false);
  } else {
    view.setBigUint64(0, bits, false);
  }
  const value =
    precision === '32' ? view.getFloat32(0, false) : view.getFloat64(0, false);

  return {
    totalBits,
    exponentBits,
    mantissaBits,
    bias,
    sign,
    exponentRaw,
    mantissa,
    bits,
    value,
  };
};

const classify = (data: Breakdown): string => {
  const exponentMax = (1n << BigInt(data.exponentBits)) - 1n;

  if (data.exponentRaw === exponentMax) {
    return data.mantissa === 0n ? 'Infinity' : 'NaN (not a number)';
  }
  if (data.exponentRaw === 0n) {
    return data.mantissa === 0n ? 'Zero' : 'Subnormal';
  }
  return 'Normal';
};

const formatValue = (value: number): string => {
  if (Number.isNaN(value)) {
    return 'NaN';
  }
  if (!Number.isFinite(value)) {
    return value > 0 ? 'Infinity' : '-Infinity';
  }
  if (Object.is(value, -0)) {
    return '-0';
  }
  return value.toString();
};

export default function Ieee754() {
  const [precision, setPrecision] = useState<Precision>('64');
  const [mode, setMode] = useState('number');
  const [input, setInput] = useState('3.141592653589793');

  const calculation = useMemo(() => {
    if (!input.trim()) {
      return { error: null, value: '' };
    }

    const totalBits = precision === '32' ? 32 : 64;
    let bits: bigint;

    if (mode === 'number') {
      if (input.length > 1000) {
        return { error: 'Input is too long.', value: '' };
      }

      const numeric = Number(input.trim());
      if (Number.isNaN(numeric) && input.trim().toLowerCase() !== 'nan') {
        return {
          error: 'Enter a decimal number, NaN, Infinity or -Infinity.',
          value: '',
        };
      }

      const buffer = new ArrayBuffer(totalBits / 8);
      const view = new DataView(buffer);
      if (precision === '32') {
        view.setFloat32(0, numeric, false);
        bits = BigInt(view.getUint32(0, false));
      } else {
        view.setFloat64(0, numeric, false);
        bits = view.getBigUint64(0, false);
      }
    } else {
      const text = input.trim().replace(/[\s_]/g, '').replace(/^0x/i, '');
      if (!text) {
        return { error: 'Enter the raw bits in hexadecimal.', value: '' };
      }
      if (text.length > 64) {
        return { error: 'Input is too long for a 64-bit value.', value: '' };
      }
      if (!/^[0-9a-f]+$/i.test(text)) {
        return { error: 'Raw bits must be hexadecimal digits.', value: '' };
      }
      bits = BigInt(`0x${text}`);
      const max = (1n << BigInt(totalBits)) - 1n;
      if (bits > max) {
        return {
          error: `A ${totalBits}-bit value needs at most ${totalBits / 4} hex digits.`,
          value: '',
        };
      }
    }

    const data = getBreakdown(bits, precision);
    const exponentMax = (1n << BigInt(data.exponentBits)) - 1n;
    const fraction = Number(data.mantissa) / 2 ** data.mantissaBits;
    const unbiased =
      data.exponentRaw === 0n
        ? 1 - data.bias
        : Number(data.exponentRaw) - data.bias;
    const classification = classify(data);
    const hexWidth = totalBits / 4;
    const hex = data.bits.toString(16).toUpperCase().padStart(hexWidth, '0');
    const signBits = data.sign.toString(2);
    const exponentBinary = data.exponentRaw
      .toString(2)
      .padStart(data.exponentBits, '0');
    const mantissaBinary = data.mantissa
      .toString(2)
      .padStart(data.mantissaBits, '0');

    const lines = [
      `Precision: ${precision === '32' ? 'binary32 (single, 32-bit)' : 'binary64 (double, 64-bit)'}`,
      `Classification: ${classification}`,
      `Stored value: ${formatValue(data.value)}`,
      '',
      `Raw bits: 0x${hex}`,
      `Binary:   ${data.bits.toString(2).padStart(totalBits, '0')}`,
      '',
      'Layout',
      `  Sign:     ${signBits}  (${data.sign === 1n ? 'negative' : 'positive'})`,
      `  Exponent: ${exponentBinary}  (raw ${data.exponentRaw.toString()}, ${data.exponentBits} bits)`,
      `  Mantissa: ${mantissaBinary}`,
      '',
      `Bias: ${data.bias}`,
      `Raw exponent: ${data.exponentRaw.toString()} / 0x${data.exponentRaw.toString(16).toUpperCase()}`,
      `Unbiased exponent: ${unbiased}`,
      `Mantissa integer: ${data.mantissa.toString()}`,
      `Mantissa hex: 0x${data.mantissa
        .toString(16)
        .toUpperCase()
        .padStart(Math.ceil(data.mantissaBits / 4), '0')}`,
      `Fraction: ${fraction.toPrecision(17)}`,
      '',
      data.exponentRaw === exponentMax
        ? 'The exponent field is all ones, so this is Infinity or NaN.'
        : data.exponentRaw === 0n
          ? 'The exponent field is zero: the value is zero or subnormal and has no implicit leading 1.'
          : 'Normal number: value = (-1)^sign × 2^(exponent − bias) × (1 + fraction)',
    ];

    return { error: null, value: lines.join('\n') };
  }, [input, mode, precision]);

  return (
    <ToolLayout>
      <Panel
        description="Inspect the sign, exponent and mantissa fields of IEEE 754 binary32 and binary64 values."
        title="Input"
      >
        <div className="space-y-3">
          <Field label="Precision">
            <SegmentedControl
              ariaLabel="Floating-point precision"
              onChange={(value) => setPrecision(value as Precision)}
              options={[
                { value: '32', label: 'Float32 (single)' },
                { value: '64', label: 'Float64 (double)' },
              ]}
              value={precision}
            />
          </Field>

          <Field label="Direction">
            <SegmentedControl
              ariaLabel="Conversion direction"
              onChange={setMode}
              options={[
                { value: 'number', label: 'Number → bits' },
                { value: 'bits', label: 'Bits → number' },
              ]}
              value={mode}
            />
          </Field>

          <Field
            hint={
              mode === 'number'
                ? 'Accepts NaN, Infinity and -Infinity.'
                : 'Hexadecimal, up to 8 or 16 digits.'
            }
            label={mode === 'number' ? 'Decimal number' : 'Raw bits (hex)'}
          >
            <Input
              aria-label={mode === 'number' ? 'Decimal number' : 'Raw bits'}
              autoComplete="off"
              onChange={(event) => setInput(event.target.value)}
              placeholder={
                mode === 'number' ? '3.141592653589793' : '400921FB54442D18'
              }
              spellCheck={false}
              value={input}
            />
          </Field>

          {mode === 'bits' && (
            <Field label="Quick example">
              <Select
                aria-label="Example bit pattern"
                onChange={(event) => {
                  if (event.target.value) {
                    setInput(event.target.value);
                  }
                }}
                value=""
              >
                <option value="">Choose a bit pattern…</option>
                {precision === '32' ? (
                  <>
                    <option value="3F800000">0x3F800000 (1.0)</option>
                    <option value="40490FDB">0x40490FDB (π)</option>
                    <option value="7F800000">0x7F800000 (+∞)</option>
                    <option value="FF800000">0xFF800000 (−∞)</option>
                    <option value="7FC00000">0x7FC00000 (NaN)</option>
                  </>
                ) : (
                  <>
                    <option value="3FF0000000000000">
                      0x3FF0000000000000 (1.0)
                    </option>
                    <option value="400921FB54442D18">
                      0x400921FB54442D18 (π)
                    </option>
                    <option value="7FF0000000000000">
                      0x7FF0000000000000 (+∞)
                    </option>
                    <option value="FFF0000000000000">
                      0xFFF0000000000000 (−∞)
                    </option>
                    <option value="7FF8000000000000">
                      0x7FF8000000000000 (NaN)
                    </option>
                  </>
                )}
              </Select>
            </Field>
          )}

          {precision === '32' && mode === 'number' && (
            <Callout variant="info">
              Values are rounded to the nearest 32-bit float before inspection.
              Expect a small loss of precision for numbers such as{' '}
              <span className="font-mono">0.1</span>.
            </Callout>
          )}
        </div>
      </Panel>

      <ResultPanel
        error={calculation.error}
        filename="ieee754.txt"
        label="Float breakdown"
        value={calculation.value}
      />
    </ToolLayout>
  );
}
