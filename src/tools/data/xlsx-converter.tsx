'use client';

import { FileSpreadsheet, FlaskConical } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { Field } from '@/components/ui/Field';
import { FileDropzone } from '@/components/ui/FileDropzone';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Select } from '@/components/ui/Select';
import { ToolLayout } from '@/components/ui/ToolLayout';

import {
  cellText,
  errorMessage,
  prettyJson,
  PreviewTable,
  toJsonSafe,
} from './_shared';

type OutputFormat = 'csv' | 'json';
type JsonShape = 'objects' | 'arrays';

type SheetData = {
  name: string;
  matrix: unknown[][];
  csv: string;
};

function normalizeHeaders(row: unknown[], count: number): string[] {
  const used = new Map<string, number>();
  return Array.from({ length: count }, (_, index) => {
    const raw = cellText(row[index]).trim();
    const base = raw || `column_${index + 1}`;
    const seen = used.get(base) ?? 0;
    used.set(base, seen + 1);
    return seen === 0 ? base : `${base}_${seen + 1}`;
  });
}

function sheetJson(sheet: SheetData, hasHeader: boolean, shape: JsonShape) {
  const matrix = sheet.matrix;
  if (matrix.length === 0) {
    return {
      output: '',
      error: 'This sheet is empty.',
      columns: [] as string[],
    };
  }
  const columnCount = Math.max(...matrix.map((row) => row.length));
  const headers = hasHeader
    ? normalizeHeaders(matrix[0] ?? [], columnCount)
    : normalizeHeaders([], columnCount);
  const dataRows = hasHeader ? matrix.slice(1) : matrix;

  if (shape === 'arrays') {
    return {
      output: prettyJson(
        dataRows.map((row) => row.map((cell) => toJsonSafe(cell)))
      ),
      error: null as string | null,
      columns: headers,
    };
  }

  const objects = dataRows.map((row) => {
    const item: Record<string, unknown> = {};
    headers.forEach((header, index) => {
      item[header] = toJsonSafe(row[index] ?? null);
    });
    return item;
  });
  return {
    output: prettyJson(objects),
    error: null as string | null,
    columns: headers,
  };
}

export default function XlsxConverterTool() {
  const [sheets, setSheets] = useState<SheetData[]>([]);
  const [activeSheet, setActiveSheet] = useState(0);
  const [fileName, setFileName] = useState('');
  const [format, setFormat] = useState<OutputFormat>('csv');
  const [hasHeader, setHasHeader] = useState(true);
  const [shape, setShape] = useState<JsonShape>('objects');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const current = sheets[activeSheet];

  const result = useMemo(() => {
    if (!current) {
      return {
        output: '',
        error: null as string | null,
        columns: [] as string[],
      };
    }
    if (format === 'csv') {
      const lines = current.csv.replace(/\r\n/g, '\n').trimEnd();
      return {
        output: lines ? `${lines}\n` : '',
        error: lines ? null : 'This sheet is empty.',
        columns: [] as string[],
      };
    }
    try {
      return sheetJson(current, hasHeader, shape);
    } catch (caught) {
      return {
        output: '',
        error: errorMessage(caught),
        columns: [] as string[],
      };
    }
  }, [current, format, hasHeader, shape]);

  const preview = useMemo(() => {
    if (!current || current.matrix.length === 0) {
      return { columns: [] as string[], rows: [] as string[][] };
    }
    const matrix = current.matrix;
    const columnCount = Math.max(...matrix.map((row) => row.length));
    const headers = hasHeader
      ? normalizeHeaders(matrix[0] ?? [], columnCount)
      : normalizeHeaders([], columnCount);
    const dataRows = (hasHeader ? matrix.slice(1) : matrix).slice(0, 20);
    return {
      columns: headers,
      rows: dataRows.map((row) => row.map((cell) => cellText(cell))),
    };
  }, [current, hasHeader]);

  const loadFile = async (file: File) => {
    setLoading(true);
    setError(null);
    try {
      const XLSX = await import('xlsx');
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, {
        type: 'array',
        cellDates: true,
        dense: false,
      });
      const parsed: SheetData[] = workbook.SheetNames.map((name) => {
        const worksheet = workbook.Sheets[name];
        if (!worksheet) {
          return { name, matrix: [], csv: '' };
        }
        const matrix = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
          blankrows: false,
          defval: null,
          header: 1,
          raw: true,
        });
        return {
          name,
          matrix,
          csv: XLSX.utils.sheet_to_csv(worksheet, { blankrows: false }),
        };
      });
      setSheets(parsed);
      setActiveSheet(0);
      setFileName(file.name);
    } catch (caught) {
      setError(errorMessage(caught));
      setSheets([]);
      setFileName(file.name);
    } finally {
      setLoading(false);
    }
  };

  const outputName = current
    ? `${
        (fileName.replace(/\.[^.]+$/, '') || 'sheet')
          .replace(/[^A-Za-z0-9._-]+/g, '-')
          .replace(/^-+|-+$/g, '') || 'sheet'
      }-${
        current.name
          .replace(/[^A-Za-z0-9._-]+/g, '-')
          .replace(/^-+|-+$/g, '') || 'sheet'
      }.${format}`
    : `converted.${format}`;

  return (
    <div className="space-y-4">
      <ToolLayout>
        <Panel title="Workbook">
          <FileDropzone
            accept=".xlsx,.xls,.xlsm,.xlsb,.ods,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            disabled={loading}
            hint="XLSX, XLS, XLSM, XLSB, ODS or CSV — parsed locally"
            label={
              fileName
                ? `Loaded ${fileName}. Drop another file or click to browse`
                : 'Drop a spreadsheet here, or click to browse'
            }
            onFiles={(files) => {
              const file = files[0];
              if (file) {
                void loadFile(file);
              }
            }}
          />

          {loading && (
            <p className="mt-3 text-xs text-fg-muted">Reading workbook…</p>
          )}
          {error && (
            <Callout
              className="mt-3"
              title="Could not read workbook"
              variant="error"
            >
              {error}
            </Callout>
          )}

          {sheets.length > 0 && (
            <>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Field htmlFor="xlsx-sheet" label="Sheet">
                  <Select
                    id="xlsx-sheet"
                    onChange={(event) =>
                      setActiveSheet(Number(event.target.value))
                    }
                    value={String(activeSheet)}
                  >
                    {sheets.map((sheet, index) => (
                      <option
                        key={`${sheet.name}-${index}`}
                        value={String(index)}
                      >
                        {sheet.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field htmlFor="xlsx-format" label="Output format">
                  <div className="flex h-8 items-center">
                    <SegmentedControl
                      ariaLabel="Output format"
                      onChange={(value) => setFormat(value as OutputFormat)}
                      options={[
                        { label: 'CSV', value: 'csv' },
                        { label: 'JSON', value: 'json' },
                      ]}
                      value={format}
                    />
                  </div>
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
                  First row contains headers
                </label>
                {format === 'json' && (
                  <Field
                    className="w-40"
                    htmlFor="xlsx-shape"
                    label="JSON shape"
                  >
                    <Select
                      id="xlsx-shape"
                      onChange={(event) =>
                        setShape(event.target.value as JsonShape)
                      }
                      value={shape}
                    >
                      <option value="objects">Array of objects</option>
                      <option value="arrays">Array of arrays</option>
                    </Select>
                  </Field>
                )}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge variant="accent">
                  {sheets.length} sheet{sheets.length === 1 ? '' : 's'}
                </Badge>
                <Badge>{current?.matrix.length ?? 0} rows</Badge>
                <Badge>
                  {Math.max(0, current?.matrix[0]?.length ?? 0)} columns
                </Badge>
              </div>

              <div className="mt-4">
                <div className="mb-2 flex items-center gap-2">
                  <FileSpreadsheet
                    aria-hidden
                    className="h-4 w-4 text-fg-muted"
                  />
                  <h3 className="text-xs font-semibold text-fg">
                    Preview · {current?.name}
                  </h3>
                </div>
                <PreviewTable
                  columns={preview.columns}
                  maxRows={20}
                  rows={preview.rows}
                />
              </div>
            </>
          )}

          {sheets.length === 0 && !loading && !error && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button
                onClick={() => {
                  setSheets([
                    {
                      name: 'Sample',
                      matrix: [
                        ['id', 'name', 'active', 'score'],
                        [1, 'Ada Lovelace', true, 99.5],
                        [2, 'Grace Hopper', false, 98],
                        [3, 'Alan Turing', true, 97.25],
                      ],
                      csv: 'id,name,active,score\n1,Ada Lovelace,true,99.5\n2,Grace Hopper,false,98\n3,Alan Turing,true,97.25\n',
                    },
                  ]);
                  setActiveSheet(0);
                  setFileName('sample.xlsx');
                }}
                size="sm"
                variant="ghost"
              >
                <FlaskConical aria-hidden className="h-3.5 w-3.5" />
                Load sample sheet
              </Button>
              <p className="text-xs text-fg-muted">
                Files are read with SheetJS in your browser. Nothing is
                uploaded.
              </p>
            </div>
          )}
        </Panel>

        <ResultPanel
          emptyText="Upload a workbook to convert its first sheet or choose a sheet."
          error={result.error}
          filename={outputName}
          label={format === 'csv' ? 'CSV output' : 'JSON output'}
          mime={format === 'csv' ? 'text/csv' : 'application/json'}
          value={result.output}
        />
      </ToolLayout>
    </div>
  );
}
