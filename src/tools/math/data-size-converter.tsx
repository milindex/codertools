'use client';

import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Select } from '@/components/ui/Select';
import { ToolLayout } from '@/components/ui/ToolLayout';
import { formatNumber } from '@/tools/math/shared';

type Basis = 'decimal' | 'binary';

type SizeUnit = {
  id: string;
  label: string;
  bytes: number;
  note: string;
};

const byteUnits: SizeUnit[] = [
  { id: 'b', label: 'Bytes', bytes: 1, note: 'B' },
  { id: 'kib', label: 'Kibibytes', bytes: 1024, note: 'KiB' },
  { id: 'mib', label: 'Mebibytes', bytes: 1024 ** 2, note: 'MiB' },
  { id: 'gib', label: 'Gibibytes', bytes: 1024 ** 3, note: 'GiB' },
  { id: 'tib', label: 'Tebibytes', bytes: 1024 ** 4, note: 'TiB' },
  { id: 'pib', label: 'Pebibytes', bytes: 1024 ** 5, note: 'PiB' },
];

const decimalUnits: SizeUnit[] = [
  { id: 'kb', label: 'Kilobytes', bytes: 1000, note: 'KB' },
  { id: 'mb', label: 'Megabytes', bytes: 1000 ** 2, note: 'MB' },
  { id: 'gb', label: 'Gigabytes', bytes: 1000 ** 3, note: 'GB' },
  { id: 'tb', label: 'Terabytes', bytes: 1000 ** 4, note: 'TB' },
  { id: 'pb', label: 'Petabytes', bytes: 1000 ** 5, note: 'PB' },
];

const binaryUnits: SizeUnit[] = [
  { id: 'kb', label: 'Kilobytes (binary)', bytes: 1024, note: 'KB' },
  { id: 'mb', label: 'Megabytes (binary)', bytes: 1024 ** 2, note: 'MB' },
  { id: 'gb', label: 'Gigabytes (binary)', bytes: 1024 ** 3, note: 'GB' },
  { id: 'tb', label: 'Terabytes (binary)', bytes: 1024 ** 4, note: 'TB' },
  { id: 'pb', label: 'Petabytes (binary)', bytes: 1024 ** 5, note: 'PB' },
];

export default function DataSizeConverter() {
  const [value, setValue] = useState('1');
  const [fromId, setFromId] = useState('mb');
  const [toId, setToId] = useState('mib');
  const [basis, setBasis] = useState<Basis>('decimal');

  const units = useMemo(
    () =>
      basis === 'decimal'
        ? [byteUnits[0]!, ...decimalUnits, ...byteUnits.slice(1)]
        : [byteUnits[0]!, ...binaryUnits, ...byteUnits.slice(1)],
    [basis]
  );

  const fromUnit = units.find((unit) => unit.id === fromId) ?? units[0]!;
  const toUnit =
    units.find((unit) => unit.id === toId) ?? units[1] ?? units[0]!;

  const calculation = useMemo(() => {
    const numeric = Number(value.trim().replace(/,/g, ''));
    if (!value.trim()) {
      return { error: null, value: '' };
    }
    if (!Number.isFinite(numeric)) {
      return { error: 'Enter a valid number.', value: '' };
    }
    if (numeric < 0) {
      return { error: 'Data sizes cannot be negative.', value: '' };
    }

    const bytes = numeric * fromUnit.bytes;
    const converted = bytes / toUnit.bytes;

    const lines = [
      `Result: ${formatNumber(converted)} ${toUnit.note}`,
      '',
      `${formatNumber(numeric)} ${fromUnit.note} = ${formatNumber(converted)} ${toUnit.note}`,
      '',
      `Bytes: ${formatNumber(bytes, 15)}`,
      `Bits:  ${formatNumber(bytes * 8, 15)}`,
      '',
      `Basis: ${basis === 'decimal' ? 'decimal (1 KB = 1,000 B)' : 'binary (1 KB = 1,024 B)'}`,
      '',
      'All units',
      ...units.map(
        (unit) =>
          `  ${unit.note.padEnd(4, ' ')} ${formatNumber(bytes / unit.bytes, 15).padStart(18, ' ')}  ${unit.label}`
      ),
    ];

    return { error: null, value: lines.join('\n') };
  }, [basis, fromUnit, toUnit, units, value]);

  return (
    <ToolLayout>
      <Panel
        description="Convert between decimal SI units and binary IEC units. The toggle controls how the KB / MB / GB / TB labels are interpreted."
        title="Data size"
      >
        <div className="space-y-3">
          <Field label="Size basis">
            <SegmentedControl
              ariaLabel="Decimal or binary basis"
              onChange={(next) => {
                const nextBasis = next as Basis;
                setBasis(nextBasis);
                const nextUnits =
                  nextBasis === 'decimal'
                    ? [byteUnits[0]!, ...decimalUnits, ...byteUnits.slice(1)]
                    : [byteUnits[0]!, ...binaryUnits, ...byteUnits.slice(1)];
                if (!nextUnits.some((unit) => unit.id === fromId)) {
                  setFromId(nextUnits[0]?.id ?? 'b');
                }
                if (!nextUnits.some((unit) => unit.id === toId)) {
                  setToId(nextUnits[1]?.id ?? nextUnits[0]?.id ?? 'b');
                }
              }}
              options={[
                { value: 'decimal', label: 'Decimal (1000)' },
                { value: 'binary', label: 'Binary (1024)' },
              ]}
              value={basis}
            />
          </Field>

          <Field label="Value">
            <Input
              aria-label="Amount to convert"
              autoComplete="off"
              inputMode="decimal"
              onChange={(event) => setValue(event.target.value)}
              spellCheck={false}
              value={value}
            />
          </Field>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="From">
              <Select
                aria-label="Convert from unit"
                onChange={(event) => setFromId(event.target.value)}
                value={fromUnit.id}
              >
                {units.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.note} — {unit.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="To">
              <Select
                aria-label="Convert to unit"
                onChange={(event) => setToId(event.target.value)}
                value={toUnit.id}
              >
                {units.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.note} — {unit.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => {
                setFromId(toUnit.id);
                setToId(fromUnit.id);
              }}
              variant="default"
            >
              Swap units
            </Button>
            <Button onClick={() => setValue('1')} variant="ghost">
              Reset value
            </Button>
          </div>

          <Callout variant="info">
            Decimal units use powers of 1000. Binary units use powers of 1024.
            KiB, MiB, GiB and TiB always mean the binary values, regardless of
            the toggle.
          </Callout>
        </div>
      </Panel>

      <ResultPanel
        error={calculation.error}
        filename="data-size-conversion.txt"
        label="Converted value"
        value={calculation.value}
      />
    </ToolLayout>
  );
}
