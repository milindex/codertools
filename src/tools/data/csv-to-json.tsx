'use client';

import { Braces, FlaskConical } from 'lucide-react';
import Papa from 'papaparse';
import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { Field } from '@/components/ui/Field';
import { FileDropzone } from '@/components/ui/FileDropzone';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { ToolLayout } from '@/components/ui/ToolLayout';

import { cellText, errorMessage, prettyJson, PreviewTable } from './_shared';

type HeaderMode = 'auto' | 'yes' | 'no';
type Shape = 'objects' | 'arrays';

const sample = `id,name,email,active,score,joined
1,Ada Lovelace,ada@example.com,true,99.5,2024-01-15
2,Grace Hopper,grace@example.com,false,98,2023-11-02
3,Alan Turing,alan@example.com,true,97.25,2022-06-30
`;

const delimiterOptions = [
  { label: 'Auto-detect', value: '' },
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
  const normalized = first.map((value) => value.trim().toLowerCase());
  const unique = new Set(normalized).size === first.length;
  const nonEmpty = first.every((value) => value.trim() !== '');
  const secondHasTyped = second.some(
    (value) => looksNumber(value) || looksBoolean(value)
  );
  return unique && nonEmpty && (secondHasTyped || first.length > 1);
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

function convertScalar(
  value: string,
  typed: boolean,
  trim: boolean
): string | number | boolean {
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

function convert(
  input: string,
  delimiter: string,
  headerMode: HeaderMode,
  shape: Shape,
  typed: boolean,
  trim: boolean
) {
  const parsed = Papa.parse<string[]>(input, {
    delimiter: delimiter || undefined,
    header: false,
    skipEmptyLines: 'greedy',
  });
  const rows = parsed.data.filter((row) => row.length > 0);
  if (rows.length === 0) {
    return {
      output: '',
      error: 'No CSV rows were found.',
      warnings: [] as string[],
      info: '',
      headers: [] as string[],
      preview: [] as string[][],
      detectedHeader: false,
    };
  }

  const detectedHeader =
    headerMode === 'yes'
      ? true
      : headerMode === 'no'
        ? false
        : detectHeaderRow(rows);
  const firstRow = rows[0] ?? [];
  const columnCount = Math.max(...rows.map((row) => row.length));
  const headers = detectedHeader
    ? normalizeHeaders(firstRow, columnCount)
    : normalizeHeaders([], columnCount);
  const dataRows = detectedHeader ? rows.slice(1) : rows;

  const objects = dataRows.map((row) => {
    const item: Record<string, string | number | boolean> = {};
    headers.forEach((header, index) => {
      item[header] = convertScalar(row[index] ?? '', typed, trim);
    });
    return item;
  });
  const arrays = dataRows.map((row) =>
    row.map((cell) => convertScalar(cell, typed, trim))
  );
  const outputValue = shape === 'objects' ? objects : arrays;

  const warnings: string[] = [];
  dataRows.forEach((row, index) => {
    if (row.length !== columnCount) {
      warnings.push(
        `Row ${index + (detectedHeader ? 2 : 1)} has ${row.length} column${
          row.length === 1 ? '' : 's'
        }; ${columnCount} expected.`
      );
    }
  });
  for (const error of parsed.errors.slice(0, 8)) {
    warnings.push(
      `${error.message}${typeof error.row === 'number' ? ` (row ${error.row + 1})` : ''}`
    );
  }

  const previewRows =
    shape === 'objects'
      ? objects
          .slice(0, 20)
          .map((item) => headers.map((header) => cellText(item[header])))
      : arrays.slice(0, 20).map((row) => row.map((cell) => cellText(cell)));

  return {
    output: prettyJson(outputValue),
    error: null as string | null,
    warnings,
    info: `${dataRows.length} data row${
      dataRows.length === 1 ? '' : 's'
    }, ${headers.length} column${headers.length === 1 ? '' : 's'}.`,
    headers,
    preview: previewRows,
    detectedHeader,
  };
}

export default function CsvToJsonTool() {
  const [input, setInput] = useState(sample);
  const [delimiter, setDelimiter] = useState('');
  const [headerMode, setHeaderMode] = useState<HeaderMode>('auto');
  const [shape, setShape] = useState<Shape>('objects');
  const [typed, setTyped] = useState(true);
  const [trim, setTrim] = useState(true);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const result = useMemo(() => {
    if (!input.trim()) {
      return {
        output: '',
        error: null as string | null,
        warnings: [] as string[],
        info: '',
        headers: [] as string[],
        preview: [] as string[][],
        detectedHeader: false,
      };
    }
    try {
      return convert(input, delimiter, headerMode, shape, typed, trim);
    } catch (error) {
      return {
        output: '',
        error: errorMessage(error),
        warnings: [] as string[],
        info: '',
        headers: [] as string[],
        preview: [] as string[][],
        detectedHeader: false,
      };
    }
  }, [delimiter, headerMode, input, shape, trim, typed]);

  return (
    <div className="space-y-4">
      <ToolLayout>
        <Panel title="CSV input">
          <FileDropzone
            accept=".csv,.tsv,.txt,text/csv,text/tab-separated-values"
            className="mb-3 px-4 py-5"
            hint="Processed locally in your browser"
            label={
              fileName
                ? `Loaded ${fileName}. Drop another file or click to browse`
                : 'Drop a CSV file here, or click to browse'
            }
            onFiles={(files) => {
              const file = files[0];
              if (!file) {
                return;
              }
              setFileError(null);
              file
                .text()
                .then((text) => {
                  setInput(text);
                  setFileName(file.name);
                })
                .catch((error) => setFileError(errorMessage(error)));
            }}
          />
          {fileError && (
            <Callout className="mb-3" variant="error">
              {fileError}
            </Callout>
          )}

          <Field
            hint={`${input.length.toLocaleString()} characters`}
            htmlFor="csv-to-json-input"
            label="CSV text"
          >
            <Textarea
              className="min-h-[150px]"
              id="csv-to-json-input"
              onChange={(event) => {
                setInput(event.target.value);
                setFileName(null);
              }}
              placeholder="Paste CSV rows here…"
              spellCheck={false}
              value={input}
            />
          </Field>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Field htmlFor="csv-to-json-delimiter" label="Delimiter">
              <Select
                id="csv-to-json-delimiter"
                onChange={(event) => setDelimiter(event.target.value)}
                value={delimiter}
              >
                {delimiterOptions.map((option) => (
                  <option key={option.label} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field htmlFor="csv-to-json-header" label="Header row">
              <Select
                id="csv-to-json-header"
                onChange={(event) =>
                  setHeaderMode(event.target.value as HeaderMode)
                }
                value={headerMode}
              >
                <option value="auto">Auto-detect</option>
                <option value="yes">Yes, first row</option>
                <option value="no">No header</option>
              </Select>
            </Field>
            <Field htmlFor="csv-to-json-shape" label="Output shape">
              <Select
                id="csv-to-json-shape"
                onChange={(event) => setShape(event.target.value as Shape)}
                value={shape}
              >
                <option value="objects">Array of objects</option>
                <option value="arrays">Array of arrays</option>
              </Select>
            </Field>
            <div className="flex flex-col justify-end gap-2 pb-1">
              <label className="flex items-center gap-2 text-xs text-fg-muted">
                <input
                  checked={typed}
                  className="h-3.5 w-3.5 accent-[var(--accent)]"
                  onChange={(event) => setTyped(event.target.checked)}
                  type="checkbox"
                />
                Convert numbers and booleans
              </label>
              <label className="flex items-center gap-2 text-xs text-fg-muted">
                <input
                  checked={trim}
                  className="h-3.5 w-3.5 accent-[var(--accent)]"
                  onChange={(event) => setTrim(event.target.checked)}
                  type="checkbox"
                />
                Trim whitespace
              </label>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button
              onClick={() => {
                setInput(sample);
                setFileName(null);
              }}
              size="sm"
              variant="ghost"
            >
              <FlaskConical aria-hidden className="h-3.5 w-3.5" />
              Load example
            </Button>
            <Badge variant={result.detectedHeader ? 'accent' : 'default'}>
              {result.detectedHeader ? 'Header detected' : 'No header'}
            </Badge>
            <Badge>{result.info || 'No rows'}</Badge>
          </div>

          {result.error && (
            <Callout className="mt-3" variant="error">
              {result.error}
            </Callout>
          )}
          {result.warnings.length > 0 && (
            <Callout className="mt-3" title="CSV warnings" variant="warning">
              <ul className="max-h-32 list-disc space-y-1 overflow-auto pl-4 text-xs">
                {result.warnings.slice(0, 20).map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </Callout>
          )}

          <div className="mt-4">
            <div className="mb-2 flex items-center gap-2">
              <Braces aria-hidden className="h-4 w-4 text-fg-muted" />
              <h3 className="text-xs font-semibold text-fg">Parsed preview</h3>
            </div>
            <PreviewTable
              columns={result.headers}
              maxRows={20}
              rows={result.preview}
            />
          </div>
        </Panel>

        <ResultPanel
          emptyText="Paste or upload CSV to see JSON output."
          error={result.error}
          filename="data.json"
          label="JSON output"
          mime="application/json"
          value={result.output}
        />
      </ToolLayout>
    </div>
  );
}
