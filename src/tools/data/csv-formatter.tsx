'use client';

import { FileSpreadsheet, FlaskConical } from 'lucide-react';
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

import { errorMessage, PreviewTable } from './_shared';

const sample = `id,name,email,active,notes
1,Ada Lovelace,ada@example.com,true,"First programmer"
2,Grace Hopper,grace@example.com,false,"COBOL pioneer"
3,Alan Turing,alan@example.com,true,"""Universal"" machine"
`;

const delimiterOptions = [
  { label: 'Auto-detect', value: '' },
  { label: 'Comma (,)', value: ',' },
  { label: 'Semicolon (;)', value: ';' },
  { label: 'Tab', value: '\t' },
  { label: 'Pipe (|)', value: '|' },
];

type CsvCheck = {
  delimiter: string;
  rows: string[][];
  columns: string[];
  output: string;
  warnings: string[];
  errors: string[];
};

function inspectCsv(
  input: string,
  delimiter: string,
  quoteChar: string,
  hasHeader: boolean,
  trim: boolean
): CsvCheck {
  const parsed = Papa.parse<string[]>(input, {
    delimiter: delimiter || undefined,
    header: false,
    quoteChar,
    skipEmptyLines: 'greedy',
    transform: trim ? (value) => value.trim() : undefined,
  });
  const rows = parsed.data.filter((row) => row.length > 0);
  const actualDelimiter = parsed.meta.delimiter || delimiter || ',';
  const expected = rows[0]?.length ?? 0;
  const columns = rows[0]
    ? (hasHeader
        ? rows[0]
        : rows[0].map((_, index) => `Column ${index + 1}`)
      ).map((value, index) => value || `Column ${index + 1}`)
    : [];
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const error of parsed.errors.slice(0, 12)) {
    const row = typeof error.row === 'number' ? ` (row ${error.row + 1})` : '';
    warnings.push(
      `${error.message}${row}${error.code ? ` [${error.code}]` : ''}`
    );
  }
  if (parsed.errors.length > 12) {
    warnings.push(`…and ${parsed.errors.length - 12} more parser warning(s).`);
  }

  if (rows.length === 0) {
    errors.push('No CSV rows were found.');
    return {
      delimiter: actualDelimiter,
      rows,
      columns,
      output: '',
      warnings,
      errors,
    };
  }

  rows.forEach((row, index) => {
    if (row.length !== expected) {
      warnings.push(
        `Row ${index + 1} has ${row.length} column${
          row.length === 1 ? '' : 's'
        }; ${expected} expected.`
      );
    }
  });

  if (hasHeader) {
    const seen = new Map<string, number>();
    rows[0]?.forEach((header, index) => {
      const name = header.trim();
      if (!name) {
        warnings.push(`Header ${index + 1} is empty.`);
      }
      const count = seen.get(name) ?? 0;
      seen.set(name, count + 1);
      if (count > 0) {
        warnings.push(`Duplicate header "${name}".`);
      }
    });
  }

  let output = '';
  try {
    output = Papa.unparse(rows, {
      delimiter: actualDelimiter,
      newline: '\n',
      quotes: false,
    });
  } catch (error) {
    errors.push(errorMessage(error));
  }

  return {
    delimiter: actualDelimiter,
    rows,
    columns,
    output,
    warnings,
    errors,
  };
}

export default function CsvFormatterTool() {
  const [input, setInput] = useState(sample);
  const [delimiter, setDelimiter] = useState('');
  const [quoteChar, setQuoteChar] = useState('"');
  const [hasHeader, setHasHeader] = useState(true);
  const [trim, setTrim] = useState(true);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const result = useMemo(() => {
    if (!input.trim()) {
      return {
        delimiter: delimiter || ',',
        rows: [] as string[][],
        columns: [] as string[],
        output: '',
        warnings: [] as string[],
        errors: [] as string[],
      };
    }
    try {
      return inspectCsv(input, delimiter, quoteChar, hasHeader, trim);
    } catch (error) {
      return {
        delimiter: delimiter || ',',
        rows: [] as string[][],
        columns: [] as string[],
        output: '',
        warnings: [] as string[],
        errors: [errorMessage(error)],
      };
    }
  }, [delimiter, hasHeader, input, quoteChar, trim]);

  const hasErrors = result.errors.length > 0;
  const previewRows = result.rows
    .slice(hasHeader ? 1 : 0, 51)
    .map((row) => row.map((cell) => cell));

  return (
    <div className="space-y-4">
      <ToolLayout>
        <Panel title="CSV input">
          <FileDropzone
            accept=".csv,.tsv,.txt,text/csv,text/tab-separated-values"
            className="mb-3 px-4 py-5"
            hint="CSV, TSV or plain text — processed locally"
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
                .catch((error) => {
                  setFileError(errorMessage(error));
                });
            }}
          />
          {fileError && (
            <Callout className="mb-3" variant="error">
              {fileError}
            </Callout>
          )}

          <Field
            hint={`${input.length.toLocaleString()} characters`}
            htmlFor="csv-formatter-input"
            label="CSV text"
          >
            <Textarea
              className="min-h-[150px]"
              id="csv-formatter-input"
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
            <Field htmlFor="csv-formatter-delimiter" label="Delimiter">
              <Select
                id="csv-formatter-delimiter"
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
            <Field htmlFor="csv-formatter-quote" label="Quote character">
              <Select
                id="csv-formatter-quote"
                onChange={(event) => setQuoteChar(event.target.value)}
                value={quoteChar}
              >
                <option value={'"'}>Double quote (&quot;)</option>
                <option value="'">Single quote (&apos;)</option>
              </Select>
            </Field>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-xs text-fg-muted">
              <input
                checked={hasHeader}
                className="h-3.5 w-3.5 accent-[var(--accent)]"
                onChange={(event) => setHasHeader(event.target.checked)}
                type="checkbox"
              />
              First row is a header
            </label>
            <label className="flex items-center gap-2 text-xs text-fg-muted">
              <input
                checked={trim}
                className="h-3.5 w-3.5 accent-[var(--accent)]"
                onChange={(event) => setTrim(event.target.checked)}
                type="checkbox"
              />
              Trim field whitespace
            </label>
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
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Badge variant={hasErrors ? 'danger' : 'success'}>
              {hasErrors
                ? 'Invalid CSV'
                : result.warnings.length > 0
                  ? 'Parsed with warnings'
                  : 'Valid CSV'}
            </Badge>
            <Badge>{result.rows.length.toLocaleString()} rows</Badge>
            <Badge>
              {Math.max(0, result.rows[0]?.length ?? 0).toLocaleString()}{' '}
              columns
            </Badge>
            <Badge>
              Delimiter:{' '}
              {result.delimiter === '\t'
                ? 'tab'
                : result.delimiter === ','
                  ? 'comma'
                  : result.delimiter === ';'
                    ? 'semicolon'
                    : result.delimiter === '|'
                      ? 'pipe'
                      : JSON.stringify(result.delimiter)}
            </Badge>
          </div>

          {hasErrors && (
            <Callout className="mt-3" title="CSV errors" variant="error">
              <ul className="list-disc space-y-1 pl-4 text-xs">
                {result.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </Callout>
          )}
          {result.warnings.length > 0 && (
            <Callout
              className="mt-3"
              title="Validation warnings"
              variant="warning"
            >
              <ul className="max-h-40 list-disc space-y-1 overflow-auto pl-4 text-xs">
                {result.warnings.slice(0, 30).map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </Callout>
          )}

          <div className="mt-4">
            <div className="mb-2 flex items-center gap-2">
              <FileSpreadsheet aria-hidden className="h-4 w-4 text-fg-muted" />
              <h3 className="text-xs font-semibold text-fg">Preview</h3>
            </div>
            <PreviewTable
              columns={result.columns}
              maxRows={20}
              rows={previewRows}
            />
          </div>
        </Panel>

        <ResultPanel
          emptyText="Paste or upload CSV to see the formatted output."
          error={hasErrors ? result.errors.join(' ') : null}
          filename="formatted.csv"
          label="Formatted CSV"
          mime="text/csv"
          value={hasErrors ? '' : result.output}
        />
      </ToolLayout>
    </div>
  );
}
