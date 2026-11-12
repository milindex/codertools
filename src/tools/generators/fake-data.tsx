'use client';

import type { Faker } from '@faker-js/faker';
import { faker as fakerDE } from '@faker-js/faker/locale/de';
import { faker as fakerEN } from '@faker-js/faker/locale/en';
import { faker as fakerEN_GB } from '@faker-js/faker/locale/en_GB';
import { faker as fakerEN_US } from '@faker-js/faker/locale/en_US';
import { faker as fakerES } from '@faker-js/faker/locale/es';
import { faker as fakerFR } from '@faker-js/faker/locale/fr';
import { faker as fakerJA } from '@faker-js/faker/locale/ja';
import { faker as fakerPT_BR } from '@faker-js/faker/locale/pt_BR';
import { faker as fakerZH_CN } from '@faker-js/faker/locale/zh_CN';
import { useState } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Select } from '@/components/ui/Select';
import { ToolLayout } from '@/components/ui/ToolLayout';
import { Checkbox } from '@/tools/generators/_controls';

type FieldKey =
  | 'name'
  | 'email'
  | 'phone'
  | 'address'
  | 'company'
  | 'date'
  | 'uuid'
  | 'lorem';

type LocaleId =
  'en' | 'en_US' | 'en_GB' | 'de' | 'fr' | 'es' | 'ja' | 'pt_BR' | 'zh_CN';

type Format = 'table' | 'json';

type FieldDefinition = {
  key: FieldKey;
  label: string;
  generate: (faker: Faker) => string;
};

type Row = Record<string, string>;

const FIELDS: FieldDefinition[] = [
  { key: 'name', label: 'Name', generate: (faker) => faker.person.fullName() },
  {
    key: 'email',
    label: 'Email',
    generate: (faker) => faker.internet.email(),
  },
  {
    key: 'phone',
    label: 'Phone',
    generate: (faker) => faker.phone.number(),
  },
  {
    key: 'address',
    label: 'Address',
    generate: (faker) => faker.location.postalAddress(),
  },
  {
    key: 'company',
    label: 'Company',
    generate: (faker) => faker.company.name(),
  },
  {
    key: 'date',
    label: 'Date',
    generate: (faker) =>
      faker.date
        .between({ from: '2000-01-01', to: '2030-12-31' })
        .toISOString()
        .slice(0, 10),
  },
  {
    key: 'uuid',
    label: 'UUID',
    generate: (faker) => faker.string.uuid(),
  },
  {
    key: 'lorem',
    label: 'Lorem',
    generate: (faker) => faker.lorem.sentence(),
  },
];

const LOCALES: { value: LocaleId; label: string; faker: Faker }[] = [
  { value: 'en', label: 'English', faker: fakerEN },
  { value: 'en_US', label: 'English (United States)', faker: fakerEN_US },
  { value: 'en_GB', label: 'English (United Kingdom)', faker: fakerEN_GB },
  { value: 'de', label: 'German', faker: fakerDE },
  { value: 'fr', label: 'French', faker: fakerFR },
  { value: 'es', label: 'Spanish', faker: fakerES },
  { value: 'ja', label: 'Japanese', faker: fakerJA },
  { value: 'pt_BR', label: 'Portuguese (Brazil)', faker: fakerPT_BR },
  { value: 'zh_CN', label: 'Chinese (Simplified)', faker: fakerZH_CN },
];

const buildRows = (
  faker: Faker,
  fields: FieldDefinition[],
  count: number
): Row[] =>
  Array.from({ length: count }, () => {
    const row: Row = {};

    for (const field of fields) {
      row[field.key] = field.generate(faker);
    }

    return row;
  });

const cleanCell = (value: string) => value.replace(/[\t\r\n]+/g, ' ').trim();

export default function FakeDataGenerator() {
  const [locale, setLocale] = useState<LocaleId>('en');
  const [selected, setSelected] = useState<FieldKey[]>([
    'name',
    'email',
    'phone',
    'address',
    'company',
  ]);
  const [count, setCount] = useState('10');
  const [format, setFormat] = useState<Format>('table');
  const [rows, setRows] = useState<Row[]>(() =>
    buildRows(fakerEN, FIELDS.slice(0, 5), 10)
  );
  const [error, setError] = useState<string | null>(null);

  const toggleField = (key: FieldKey, checked: boolean) => {
    setSelected((previous) =>
      checked ? [...previous, key] : previous.filter((item) => item !== key)
    );
  };

  const generate = () => {
    const parsedCount = Number(count);
    const fields = FIELDS.filter((field) => selected.includes(field.key));

    if (fields.length === 0) {
      setError('Select at least one field to generate.');
      return;
    }

    if (
      !Number.isInteger(parsedCount) ||
      parsedCount < 1 ||
      parsedCount > 100
    ) {
      setError('Count must be a whole number between 1 and 100.');
      return;
    }

    const localeEntry = LOCALES.find((entry) => entry.value === locale);

    setError(null);
    setRows(buildRows(localeEntry?.faker ?? fakerEN, fields, parsedCount));
  };

  const resultFields = (rows[0] ? Object.keys(rows[0]) : [])
    .map((key) => FIELDS.find((field) => field.key === key))
    .filter((field): field is FieldDefinition => Boolean(field));

  const tsv = [
    resultFields.map((field) => field.label).join('\t'),
    ...rows.map((row) =>
      resultFields.map((field) => cleanCell(row[field.key] ?? '')).join('\t')
    ),
  ].join('\n');

  const json = JSON.stringify(rows, null, 2);

  return (
    <div className="space-y-4">
      <ToolLayout>
        <Panel
          actions={<Badge variant="accent">@faker-js/faker</Badge>}
          title="Options"
        >
          <Field htmlFor="fake-data-locale" label="Locale">
            <Select
              id="fake-data-locale"
              onChange={(event) => setLocale(event.target.value as LocaleId)}
              value={locale}
            >
              {LOCALES.map((entry) => (
                <option key={entry.value} value={entry.value}>
                  {entry.label}
                </option>
              ))}
            </Select>
          </Field>

          <fieldset className="mt-4">
            <legend className="text-xs font-semibold text-fg">Fields</legend>
            <div className="mt-2 grid gap-2.5 sm:grid-cols-2">
              {FIELDS.map((field) => (
                <Checkbox
                  checked={selected.includes(field.key)}
                  id={`fake-data-${field.key}`}
                  key={field.key}
                  label={field.label}
                  onChange={(checked) => toggleField(field.key, checked)}
                />
              ))}
            </div>
          </fieldset>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field hint="1–100" htmlFor="fake-data-count" label="Rows">
              <Input
                id="fake-data-count"
                max={100}
                min={1}
                onChange={(event) => setCount(event.target.value)}
                type="number"
                value={count}
              />
            </Field>
            <Field label="Output format">
              <SegmentedControl
                ariaLabel="Output format"
                onChange={(value) => setFormat(value as Format)}
                options={[
                  { label: 'Table', value: 'table' },
                  { label: 'JSON', value: 'json' },
                ]}
                value={format}
              />
            </Field>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button onClick={generate} variant="primary">
              Generate fake data
            </Button>
            <span className="text-xs text-fg-muted">
              Generated locally; no network requests.
            </span>
          </div>

          {error && (
            <Callout className="mt-3" variant="error">
              {error}
            </Callout>
          )}

          <Callout className="mt-4" variant="info">
            Locale affects names, addresses, phone numbers and other
            locale-aware fields. Dates are random between 2000 and 2030. The
            JSON view uses the field ids as keys.
          </Callout>
        </Panel>

        <ResultPanel
          emptyText="Click Generate to create fake data."
          filename={format === 'json' ? 'fake-data.json' : 'fake-data.tsv'}
          label={format === 'json' ? 'Fake data (JSON)' : 'Fake data (table)'}
          mime={
            format === 'json'
              ? 'application/json;charset=utf-8'
              : 'text/tab-separated-values;charset=utf-8'
          }
          value={format === 'json' ? json : tsv}
        >
          {format === 'table' ? (
            <div className="max-h-[480px] overflow-auto rounded-md border border-border">
              <table className="w-full border-collapse text-left text-xs">
                <thead className="sticky top-0 bg-canvas-subtle text-fg-muted">
                  <tr>
                    <th className="whitespace-nowrap border-b border-border px-3 py-2 font-semibold">
                      #
                    </th>
                    {resultFields.map((field) => (
                      <th
                        className="whitespace-nowrap border-b border-border px-3 py-2 font-semibold"
                        key={field.key}
                      >
                        {field.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => (
                    <tr
                      className="border-b border-border last:border-b-0"
                      key={index}
                    >
                      <td className="px-3 py-2 text-fg-subtle">{index + 1}</td>
                      {resultFields.map((field) => (
                        <td
                          className="whitespace-nowrap px-3 py-2 text-fg"
                          key={field.key}
                        >
                          {row[field.key] ?? ''}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : undefined}
        </ResultPanel>
      </ToolLayout>
    </div>
  );
}
