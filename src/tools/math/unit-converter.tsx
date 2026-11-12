'use client';

import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { Select } from '@/components/ui/Select';
import { ToolLayout } from '@/components/ui/ToolLayout';
import { formatNumber } from '@/tools/math/shared';

type Unit = {
  id: string;
  label: string;
  symbol: string;
  toBase: (value: number) => number;
  fromBase: (value: number) => number;
};

type Category = {
  id: string;
  label: string;
  units: Unit[];
  note?: string;
};

const linear = (factor: number) => ({
  toBase: (value: number) => value * factor,
  fromBase: (value: number) => value / factor,
});

const makeUnit = (
  id: string,
  label: string,
  symbol: string,
  factor: number
): Unit => ({ id, label, symbol, ...linear(factor) });

const buildCategories = (dpi: number): Category[] => [
  {
    id: 'length',
    label: 'Length',
    units: [
      makeUnit('mm', 'Millimeter', 'mm', 0.001),
      makeUnit('cm', 'Centimeter', 'cm', 0.01),
      makeUnit('m', 'Meter', 'm', 1),
      makeUnit('km', 'Kilometer', 'km', 1000),
      makeUnit('in', 'Inch', 'in', 0.0254),
      makeUnit('ft', 'Foot', 'ft', 0.3048),
      makeUnit('yd', 'Yard', 'yd', 0.9144),
      makeUnit('mi', 'Mile', 'mi', 1609.344),
      makeUnit('nmi', 'Nautical mile', 'nmi', 1852),
    ],
  },
  {
    id: 'weight',
    label: 'Weight / mass',
    units: [
      makeUnit('mg', 'Milligram', 'mg', 1e-6),
      makeUnit('g', 'Gram', 'g', 0.001),
      makeUnit('kg', 'Kilogram', 'kg', 1),
      makeUnit('t', 'Metric tonne', 't', 1000),
      makeUnit('oz', 'Ounce', 'oz', 0.028349523125),
      makeUnit('lb', 'Pound', 'lb', 0.45359237),
      makeUnit('st', 'Stone', 'st', 6.35029318),
      makeUnit('ton', 'US short ton', 'ton', 907.18474),
    ],
  },
  {
    id: 'temperature',
    label: 'Temperature',
    units: [
      {
        id: 'c',
        label: 'Celsius',
        symbol: '°C',
        toBase: (value) => value,
        fromBase: (value) => value,
      },
      {
        id: 'f',
        label: 'Fahrenheit',
        symbol: '°F',
        toBase: (value) => ((value - 32) * 5) / 9,
        fromBase: (value) => (value * 9) / 5 + 32,
      },
      {
        id: 'k',
        label: 'Kelvin',
        symbol: 'K',
        toBase: (value) => value - 273.15,
        fromBase: (value) => value + 273.15,
      },
      {
        id: 'r',
        label: 'Rankine',
        symbol: '°R',
        toBase: (value) => ((value - 491.67) * 5) / 9,
        fromBase: (value) => (value * 9) / 5 + 491.67,
      },
    ],
    note: 'Absolute zero is −273.15 °C, 0 K or −459.67 °F.',
  },
  {
    id: 'area',
    label: 'Area',
    units: [
      makeUnit('mm2', 'Square millimeter', 'mm²', 1e-6),
      makeUnit('cm2', 'Square centimeter', 'cm²', 1e-4),
      makeUnit('m2', 'Square meter', 'm²', 1),
      makeUnit('ha', 'Hectare', 'ha', 10000),
      makeUnit('km2', 'Square kilometer', 'km²', 1e6),
      makeUnit('in2', 'Square inch', 'in²', 0.00064516),
      makeUnit('ft2', 'Square foot', 'ft²', 0.09290304),
      makeUnit('yd2', 'Square yard', 'yd²', 0.83612736),
      makeUnit('acre', 'Acre', 'ac', 4046.8564224),
      makeUnit('mi2', 'Square mile', 'mi²', 2589988.110336),
    ],
  },
  {
    id: 'volume',
    label: 'Volume',
    units: [
      makeUnit('ml', 'Milliliter', 'mL', 1e-6),
      makeUnit('l', 'Liter', 'L', 0.001),
      makeUnit('cm3', 'Cubic centimeter', 'cm³', 1e-6),
      makeUnit('m3', 'Cubic meter', 'm³', 1),
      makeUnit('in3', 'Cubic inch', 'in³', 0.000016387064),
      makeUnit('ft3', 'Cubic foot', 'ft³', 0.028316846592),
      makeUnit('tsp', 'US teaspoon', 'tsp', 4.92892159375e-6),
      makeUnit('tbsp', 'US tablespoon', 'tbsp', 1.478676478125e-5),
      makeUnit('floz', 'US fluid ounce', 'fl oz', 2.95735295625e-5),
      makeUnit('cup', 'US cup', 'cup', 0.0002365882365),
      makeUnit('pt', 'US pint', 'pt', 0.000473176473),
      makeUnit('qt', 'US quart', 'qt', 0.000946352946),
      makeUnit('gal', 'US gallon', 'gal', 0.003785411784),
      makeUnit('gal-uk', 'UK gallon', 'gal (UK)', 0.00454609),
    ],
  },
  {
    id: 'speed',
    label: 'Speed',
    units: [
      makeUnit('mps', 'Meters per second', 'm/s', 1),
      makeUnit('kph', 'Kilometers per hour', 'km/h', 1 / 3.6),
      makeUnit('mph', 'Miles per hour', 'mph', 0.44704),
      makeUnit('fps', 'Feet per second', 'ft/s', 0.3048),
      makeUnit('knot', 'Knot', 'kn', 0.5144444444444445),
      makeUnit('mach', 'Mach (sea level)', 'Ma', 340.29),
    ],
  },
  {
    id: 'typography',
    label: 'Pixels / points',
    units: [
      {
        id: 'px',
        label: 'Pixels',
        symbol: 'px',
        toBase: (value) => value / dpi,
        fromBase: (value) => value * dpi,
      },
      makeUnit('pt', 'Points', 'pt', 1 / 72),
      makeUnit('pc', 'Picas', 'pc', 1 / 6),
      makeUnit('in', 'Inches', 'in', 1),
      makeUnit('cm', 'Centimeters', 'cm', 1 / 2.54),
      makeUnit('mm', 'Millimeters', 'mm', 1 / 25.4),
    ],
    note: 'Pixels are resolved with the DPI below. CSS uses 96 DPI by default; print commonly uses 72, 150 or 300 DPI.',
  },
];

export default function UnitConverter() {
  const [categoryId, setCategoryId] = useState('length');
  const [fromId, setFromId] = useState('m');
  const [toId, setToId] = useState('ft');
  const [value, setValue] = useState('1');
  const [dpiText, setDpiText] = useState('96');

  const dpi = Number(dpiText);
  const effectiveDpi = Number.isFinite(dpi) && dpi > 0 ? dpi : 96;
  const categories = useMemo(
    () => buildCategories(effectiveDpi),
    [effectiveDpi]
  );

  const category =
    categories.find((item) => item.id === categoryId) ?? categories[0]!;
  const fromUnit =
    category.units.find((unit) => unit.id === fromId) ?? category.units[0]!;
  const toUnit =
    category.units.find((unit) => unit.id === toId) ??
    category.units[1] ??
    category.units[0]!;

  const calculation = useMemo(() => {
    const numeric = Number(value.trim().replace(/,/g, ''));
    if (!value.trim()) {
      return { error: null, value: '', warning: null };
    }
    if (!Number.isFinite(numeric)) {
      return { error: 'Enter a valid number.', value: '', warning: null };
    }

    const baseValue = fromUnit.toBase(numeric);
    const converted = toUnit.fromBase(baseValue);
    const unitFactor = toUnit.fromBase(fromUnit.toBase(1));

    const warning =
      category.id === 'temperature' && baseValue < -273.15
        ? 'This value is below absolute zero.'
        : null;

    const lines = [
      `Result: ${formatNumber(converted)} ${toUnit.symbol}`,
      '',
      `${formatNumber(numeric)} ${fromUnit.symbol} = ${formatNumber(converted)} ${toUnit.symbol}`,
      `1 ${fromUnit.symbol} = ${formatNumber(unitFactor)} ${toUnit.symbol}`,
      '',
      'All units',
      ...category.units.map(
        (unit) =>
          `  ${unit.label.padEnd(20, ' ')} ${formatNumber(unit.fromBase(baseValue)).padStart(16, ' ')} ${unit.symbol}`
      ),
    ];

    return { error: null, value: lines.join('\n'), warning };
  }, [category, fromUnit, toUnit, value]);

  const changeCategory = (nextId: string) => {
    const next = categories.find((item) => item.id === nextId);
    if (!next) {
      return;
    }
    setCategoryId(next.id);
    setFromId(next.units[0]?.id ?? '');
    setToId(next.units[1]?.id ?? next.units[0]?.id ?? '');
  };

  return (
    <ToolLayout>
      <Panel
        description="Accurate conversions for length, mass, temperature, area, volume, speed and CSS/print sizes."
        title="Conversion"
      >
        <div className="space-y-3">
          <Field label="Category">
            <Select
              aria-label="Unit category"
              onChange={(event) => changeCategory(event.target.value)}
              value={category.id}
            >
              {categories.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Value">
            <Input
              aria-label="Value to convert"
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
                {category.units.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.label} ({unit.symbol})
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
                {category.units.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.label} ({unit.symbol})
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
            <Button
              onClick={() => {
                setValue('1');
              }}
              variant="ghost"
            >
              Reset value
            </Button>
          </div>

          {category.id === 'typography' && (
            <Field
              hint="Used only for px ↔ physical units."
              label="Resolution (DPI)"
            >
              <Input
                aria-label="Resolution in dots per inch"
                inputMode="numeric"
                onChange={(event) => setDpiText(event.target.value)}
                spellCheck={false}
                value={dpiText}
              />
            </Field>
          )}

          {category.note && <Callout variant="info">{category.note}</Callout>}
          {calculation.warning && (
            <Callout variant="warning">{calculation.warning}</Callout>
          )}
        </div>
      </Panel>

      <ResultPanel
        error={calculation.error}
        filename="unit-conversion.txt"
        label="Converted value"
        value={calculation.value}
      />
    </ToolLayout>
  );
}
