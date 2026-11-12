'use client';

import { ArrowLeftRight, FlaskConical } from 'lucide-react';
import Papa from 'papaparse';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { Field } from '@/components/ui/Field';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { ToolLayout } from '@/components/ui/ToolLayout';

import {
  errorMessage,
  isPlainObject,
  parseJsonText,
  prettyJson,
} from './_shared';

type Mode = 'json-to-csv' | 'csv-to-json';
type HeaderMode = 'auto' | 'yes' | 'no';

const jsonSample = `[
  {
    "id": 1,
    "name": "Ada Lovelace",
    "email": "ada@example.com",
    "active": true,
    "address": { "city": "London", "country": "UK" },
    "tags": ["math", "computing"]
  },
  {
    "id": 2,
    "name": "Grace Hopper",
    "email": "grace@example.com",
    "active": false,
    "address": { "city": "New York", "country": "US" },
    "tags": ["navy", "compilers"]
  }
]`;

const csvSample = `id,name,email,active,address.city,address.country,tags
1,Ada Lovelace,ada@example.com,true,London,UK,"[""math"",""computing""]"
2,Grace Hopper,grace@example.com,false,New York,US,"[""navy"",""compilers""]"
`;

const delimiters = [
  { label: 'Comma (,)', value: ',' },
  { label: 'Semicolon (;)', value: ';' },
  { label: 'Tab', value: '\t' },
  { label: 'Pipe (|)', value: '|' },
];

function looksNumber(value: string): boolean {
  return /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/.test(value.trim());
}

function looksBoolean(value: string): boolean {
  return /^(true|false)$/i.test(value.trim());
}

function convertScalar(value: string, typed: boolean, trim: boolean): unknown {
  const text = trim ? value.trim() : value;
  if (!typed) {
    return text;
  }
  if (looksBoolean(text)) {
    return text.toLowerCase() === 'true';
  }
  if (looksNumber(text)) {
    return Number(text);
  }
  return text;
}

function detectHeaderRow(rows: string[][]): boolean {
  const first = rows[0];
  if (!first) {
    return false;
  }
  if (rows.length < 2) {
    return true;
  }
  if (first.every((value) => looksNumber(value) || looksBoolean(value))) {
    return false;
  }
  const second = rows[1] ?? [];
  const firstNormalized = first.map((value) => value.trim().toLowerCase());
  const unique = new Set(firstNormalized).size === first.length;
  const firstNonEmpty = first.every((value) => value.trim() !== '');
  const secondHasTyped = second.some(
    (value) => looksNumber(value) || looksBoolean(value)
  );
  return unique && firstNonEmpty && (secondHasTyped || first.length > 1);
}

function normalizeHeaders(headers: string[], count: number): string[] {
  const used = new Map<string, number>();
  return Array.from({ length: count }, (_, index) => {
    const raw = headers[index]?.trim() ?? '';
    const base = raw || `column_${index + 1}`;
    const seen = used.get(base) ?? 0;
    used.set(base, seen + 1);
    return seen === 0 ? base : `${base}_${seen + 1}`;
  });
}

function flattenEntry(
  value: unknown,
  prefix: string,
  target: Record<string, string>
) {
  if (isPlainObject(value)) {
    const entries = Object.entries(value);
    if (entries.length === 0) {
      target[prefix || 'value'] = '{}';
      return;
    }
    for (const [key, item] of entries) {
      flattenEntry(item, prefix ? `${prefix}.${key}` : key, target);
    }
    return;
  }
  if (Array.isArray(value)) {
    target[prefix || 'value'] = JSON.stringify(value);
    return;
  }
  if (value === null || value === undefined) {
    target[prefix || 'value'] = '';
    return;
  }
  if (value instanceof Date) {
    target[prefix || 'value'] = value.toISOString();
    return;
  }
  target[prefix || 'value'] = String(value);
}

function jsonToCsv(input: string, delimiter: string, quoteAll: boolean) {
  const parsed = parseJsonText(input);
  if (!parsed.ok) {
    return { output: '', error: parsed.error, info: '', warning: null };
  }
  const value = parsed.value;
  if (!Array.isArray(value)) {
    if (isPlainObject(value)) {
      const row: Record<string, string> = {};
      flattenEntry(value, '', row);
      const columns = Object.keys(row);
      return {
        output: Papa.unparse(
          {
            fields: columns,
            data: [columns.map((column) => row[column] ?? '')],
          },
          {
            delimiter,
            header: true,
            newline: '\n',
            quotes: quoteAll,
          }
        ),
        error: null,
        info: 'Converted a single object as one CSV row.',
        warning: null,
      };
    }
    return {
      output: '',
      error:
        'JSON must be an array of objects, an array of arrays, or a single object.',
      info: '',
      warning: null,
    };
  }
  if (value.length === 0) {
    return {
      output: '',
      error: 'The JSON array is empty.',
      info: '',
      warning: null,
    };
  }

  if (value.every((item) => Array.isArray(item))) {
    const matrix = value.map((row) =>
      (row as unknown[]).map((cell) => {
        if (cell === null || cell === undefined) {
          return '';
        }
        if (cell instanceof Date) {
          return cell.toISOString();
        }
        if (typeof cell === 'object') {
          return JSON.stringify(cell);
        }
        return String(cell);
      })
    );
    const columnCount = Math.max(...matrix.map((row) => row.length));
    const columns = Array.from(
      { length: columnCount },
      (_, index) => `column_${index + 1}`
    );
    return {
      output: Papa.unparse(
        { fields: columns, data: matrix },
        { delimiter, header: true, newline: '\n', quotes: quoteAll }
      ),
      error: null,
      info: `${matrix.length} row${matrix.length === 1 ? '' : 's'}, ${columnCount} column${
        columnCount === 1 ? '' : 's'
      }.`,
      warning: null,
    };
  }

  const records = value.map((item) => {
    const record: Record<string, string> = {};
    flattenEntry(item, '', record);
    if (Object.keys(record).length === 0) {
      record.value = '';
    }
    return record;
  });
  const columns: string[] = [];
  const seen = new Set<string>();
  for (const record of records) {
    for (const key of Object.keys(record)) {
      if (!seen.has(key)) {
        seen.add(key);
        columns.push(key);
      }
    }
  }

  const output = Papa.unparse(
    {
      fields: columns,
      data: records.map((record) =>
        columns.map((column) => record[column] ?? '')
      ),
    },
    {
      delimiter,
      header: true,
      newline: '\n',
      quotes: quoteAll,
    }
  );
  return {
    output,
    error: null,
    info: `${records.length} row${records.length === 1 ? '' : 's'}, ${columns.length} column${
      columns.length === 1 ? '' : 's'
    }.`,
    warning: null,
  };
}

function csvToJson(
  input: string,
  delimiter: string,
  headerMode: HeaderMode,
  typed: boolean,
  trim: boolean
) {
  const parsed = Papa.parse<string[]>(input, {
    delimiter,
    header: false,
    skipEmptyLines: 'greedy',
  });
  const rows = parsed.data.filter((row) => row.length > 0);
  if (rows.length === 0) {
    return {
      output: '',
      error: 'No CSV rows were found.',
      warning: null as string | null,
      info: '',
    };
  }

  const hasHeader =
    headerMode === 'yes'
      ? true
      : headerMode === 'no'
        ? false
        : detectHeaderRow(rows);
  const columnCount = Math.max(...rows.map((row) => row.length));
  const firstRow = rows[0] ?? [];
  const headers = hasHeader
    ? normalizeHeaders(firstRow, columnCount)
    : normalizeHeaders([], columnCount);
  const dataRows = hasHeader ? rows.slice(1) : rows;

  const objects = dataRows.map((row) => {
    const item: Record<string, unknown> = {};
    headers.forEach((header, index) => {
      item[header] = convertScalar(row[index] ?? '', typed, trim);
    });
    return item;
  });

  const result =
    dataRows.length > 0
      ? hasHeader
        ? objects
        : dataRows.map((row) =>
            row.map((cell) => convertScalar(cell, typed, trim))
          )
      : [];

  const rowIssues: string[] = [];
  dataRows.forEach((row, index) => {
    if (row.length !== columnCount) {
      rowIssues.push(
        `Row ${index + (hasHeader ? 2 : 1)} has ${row.length} column${
          row.length === 1 ? '' : 's'
        } but ${columnCount} were expected.`
      );
    }
  });
  const parseIssues = parsed.errors.slice(0, 8).map((error) => {
    const row = typeof error.row === 'number' ? ` row ${error.row + 1}` : '';
    return `${error.message}${row}${error.code ? ` (${error.code})` : ''}`;
  });
  const warningParts = [...parseIssues, ...rowIssues.slice(0, 8)];
  if (rowIssues.length > 8) {
    warningParts.push(`…and ${rowIssues.length - 8} more row length issue(s).`);
  }

  return {
    output: prettyJson(result),
    error: null as string | null,
    warning: warningParts.length > 0 ? warningParts.join('\n') : null,
    info: `${dataRows.length} data row${dataRows.length === 1 ? '' : 's'}, ${
      hasHeader ? 'header row detected' : 'no header row'
    }.`,
  };
}

export default function JsonCsvTool() {
  const [mode, setMode] = useState<Mode>('json-to-csv');
  const [input, setInput] = useState(jsonSample);
  const [delimiter, setDelimiter] = useState(',');
  const [quoteAll, setQuoteAll] = useState(false);
  const [headerMode, setHeaderMode] = useState<HeaderMode>('auto');
  const [typed, setTyped] = useState(true);
  const [trim, setTrim] = useState(true);

  const result = useMemo(() => {
    if (!input.trim()) {
      return {
        output: '',
        error: null as string | null,
        warning: null as string | null,
        info: '',
      };
    }
    try {
      return mode === 'json-to-csv'
        ? jsonToCsv(input, delimiter, quoteAll)
        : csvToJson(input, delimiter, headerMode, typed, trim);
    } catch (error) {
      return {
        output: '',
        error: errorMessage(error),
        warning: null as string | null,
        info: '',
      };
    }
  }, [delimiter, headerMode, input, mode, quoteAll, trim, typed]);

  const switchMode = (nextMode: string) => {
    const typedMode = nextMode as Mode;
    if (typedMode === mode) {
      return;
    }
    setMode(typedMode);
    if (result.output && !result.error) {
      setInput(result.output);
    }
  };

  return (
    <div className="space-y-4">
      <ToolLayout>
        <Panel
          actions={
            <SegmentedControl
              ariaLabel="Conversion direction"
              onChange={switchMode}
              options={[
                { label: 'JSON → CSV', value: 'json-to-csv' },
                { label: 'CSV → JSON', value: 'csv-to-json' },
              ]}
              value={mode}
            />
          }
          title="Input"
        >
          <Field
            hint={`${input.length.toLocaleString()} characters`}
            htmlFor="json-csv-input"
            label={mode === 'json-to-csv' ? 'JSON' : 'CSV'}
          >
            <Textarea
              id="json-csv-input"
              onChange={(event) => setInput(event.target.value)}
              placeholder={
                mode === 'json-to-csv'
                  ? 'Paste a JSON array of objects…'
                  : 'Paste CSV rows here…'
              }
              spellCheck={false}
              value={input}
            />
          </Field>

          <div className="mt-3 flex flex-wrap items-end gap-3">
            <Field
              className="w-40"
              htmlFor="json-csv-delimiter"
              label="Delimiter"
            >
              <Select
                id="json-csv-delimiter"
                onChange={(event) => setDelimiter(event.target.value)}
                value={delimiter}
              >
                {delimiters.map((option) => (
                  <option key={option.label} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </Field>

            {mode === 'json-to-csv' ? (
              <label className="flex h-8 items-center gap-2 text-xs text-fg-muted">
                <input
                  checked={quoteAll}
                  className="h-3.5 w-3.5 accent-[var(--accent)]"
                  onChange={(event) => setQuoteAll(event.target.checked)}
                  type="checkbox"
                />
                Quote every field
              </label>
            ) : (
              <>
                <Field
                  className="w-36"
                  htmlFor="json-csv-header"
                  label="Header row"
                >
                  <Select
                    id="json-csv-header"
                    onChange={(event) =>
                      setHeaderMode(event.target.value as HeaderMode)
                    }
                    value={headerMode}
                  >
                    <option value="auto">Auto-detect</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </Select>
                </Field>
                <label className="flex h-8 items-center gap-2 text-xs text-fg-muted">
                  <input
                    checked={typed}
                    className="h-3.5 w-3.5 accent-[var(--accent)]"
                    onChange={(event) => setTyped(event.target.checked)}
                    type="checkbox"
                  />
                  Typed values
                </label>
                <label className="flex h-8 items-center gap-2 text-xs text-fg-muted">
                  <input
                    checked={trim}
                    className="h-3.5 w-3.5 accent-[var(--accent)]"
                    onChange={(event) => setTrim(event.target.checked)}
                    type="checkbox"
                  />
                  Trim values
                </label>
              </>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              onClick={() =>
                setInput(mode === 'json-to-csv' ? jsonSample : csvSample)
              }
              size="sm"
              variant="ghost"
            >
              <FlaskConical aria-hidden className="h-3.5 w-3.5" />
              Load example
            </Button>
            <Button
              disabled={!result.output || Boolean(result.error)}
              onClick={() => {
                if (result.output && !result.error) {
                  setInput(result.output);
                  setMode(
                    mode === 'json-to-csv' ? 'csv-to-json' : 'json-to-csv'
                  );
                }
              }}
              size="sm"
            >
              <ArrowLeftRight aria-hidden className="h-3.5 w-3.5" />
              Use output as input
            </Button>
          </div>

          {result.info && (
            <p className="mt-3 text-xs text-fg-muted">{result.info}</p>
          )}
          {result.warning && (
            <Callout className="mt-3" title="CSV warnings" variant="warning">
              <pre className="whitespace-pre-wrap break-words text-xs leading-5">
                {result.warning}
              </pre>
            </Callout>
          )}
          <p className="mt-3 text-xs leading-5 text-fg-muted">
            {mode === 'json-to-csv'
              ? 'Nested objects are flattened with dot notation. Arrays and complex values are serialized as JSON strings.'
              : 'Auto-detect treats the first row as a header when it looks like labels and the second row looks like data.'}
          </p>
        </Panel>

        <ResultPanel
          emptyText="Paste JSON or CSV to see the converted output."
          error={result.error}
          filename={mode === 'json-to-csv' ? 'data.csv' : 'data.json'}
          label={mode === 'json-to-csv' ? 'CSV output' : 'JSON output'}
          mime={mode === 'json-to-csv' ? 'text/csv' : 'application/json'}
          value={result.output}
        />
      </ToolLayout>
    </div>
  );
}
