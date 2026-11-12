'use client';

import { Columns3, FlaskConical, Rows3, X } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { Select } from '@/components/ui/Select';
import { ToolLayout } from '@/components/ui/ToolLayout';

type Alignment = 'default' | 'left' | 'center' | 'right';

const sampleHeaders = ['Name', 'Role', 'Team', 'Location'];
const sampleRows = [
  ['Ada Lovelace', 'Engineer', 'Platform', 'London'],
  ['Grace Hopper', 'Maintainer', 'Compilers', 'New York'],
  ['Alan Turing', 'Researcher', 'Science', 'Cambridge'],
];

function escapeCell(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\r?\n/g, '<br>');
}

function buildMarkdown(
  headers: string[],
  rows: string[][],
  alignments: Alignment[],
  pad: boolean
): string {
  const escapedHeaders = headers.map(
    (header, index) => escapeCell(header) || `Column ${index + 1}`
  );
  const escapedRows = rows.map((row) =>
    headers.map((_, index) => escapeCell(row[index] ?? ''))
  );

  const widths = headers.map((_, index) =>
    Math.max(
      3,
      escapedHeaders[index]?.length ?? 0,
      ...escapedRows.map((row) => row[index]?.length ?? 0)
    )
  );

  const separators = alignments.map((alignment, index) => {
    const width = widths[index] ?? 3;
    if (alignment === 'left') {
      return `:${'-'.repeat(Math.max(3, width - 1))}`;
    }
    if (alignment === 'right') {
      return `${'-'.repeat(Math.max(3, width - 1))}:`;
    }
    if (alignment === 'center') {
      return `:${'-'.repeat(Math.max(3, width - 2))}:`;
    }
    return '-'.repeat(width);
  });

  const finalWidths = widths.map((width, index) =>
    Math.max(width, separators[index]?.length ?? 3)
  );

  const formatRow = (cells: string[]) =>
    `| ${cells
      .map((cell, index) =>
        pad ? cell.padEnd(finalWidths[index] ?? cell.length) : cell
      )
      .join(' | ')} |`;

  return [
    formatRow(escapedHeaders),
    formatRow(separators),
    ...escapedRows.map((row) => formatRow(row)),
  ].join('\n');
}

export default function MarkdownTableTool() {
  const [headers, setHeaders] = useState(sampleHeaders);
  const [rows, setRows] = useState<string[][]>(sampleRows);
  const [alignments, setAlignments] = useState<Alignment[]>(
    sampleHeaders.map(() => 'default')
  );
  const [pad, setPad] = useState(true);

  const markdown = useMemo(
    () => buildMarkdown(headers, rows, alignments, pad),
    [alignments, headers, pad, rows]
  );

  const updateHeader = (index: number, value: string) => {
    setHeaders((current) =>
      current.map((header, headerIndex) =>
        headerIndex === index ? value : header
      )
    );
  };

  const updateCell = (rowIndex: number, columnIndex: number, value: string) => {
    setRows((current) =>
      current.map((row, index) =>
        index === rowIndex
          ? row.map((cell, cellIndex) =>
              cellIndex === columnIndex ? value : cell
            )
          : row
      )
    );
  };

  const addColumn = () => {
    setHeaders((current) => [...current, `Column ${current.length + 1}`]);
    setRows((current) => current.map((row) => [...row, '']));
    setAlignments((current) => [...current, 'default']);
  };

  const removeColumn = (index: number) => {
    if (headers.length <= 1) {
      return;
    }
    setHeaders((current) =>
      current.filter((_, columnIndex) => columnIndex !== index)
    );
    setRows((current) =>
      current.map((row) =>
        row.filter((_, columnIndex) => columnIndex !== index)
      )
    );
    setAlignments((current) =>
      current.filter((_, columnIndex) => columnIndex !== index)
    );
  };

  const addRow = () => {
    setRows((current) => [...current, headers.map(() => '')]);
  };

  const removeRow = (index: number) => {
    setRows((current) => current.filter((_, rowIndex) => rowIndex !== index));
  };

  return (
    <div className="space-y-4">
      <ToolLayout>
        <Panel
          actions={
            <div className="flex items-center gap-2">
              <Badge>{rows.length} rows</Badge>
              <Badge>{headers.length} columns</Badge>
            </div>
          }
          title="Table editor"
        >
          <div className="overflow-x-auto rounded-md border border-border">
            <table className="w-full border-collapse text-xs">
              <thead className="bg-canvas-subtle/70">
                <tr>
                  <th className="w-8 border-b border-border px-2 py-2 text-left font-semibold text-fg-muted">
                    #
                  </th>
                  {headers.map((header, columnIndex) => (
                    <th
                      className="min-w-[150px] border-b border-border px-2 py-2 text-left align-top"
                      key={columnIndex}
                    >
                      <Input
                        aria-label={`Column ${columnIndex + 1} header`}
                        className="h-7 text-xs"
                        onChange={(event) =>
                          updateHeader(columnIndex, event.target.value)
                        }
                        placeholder={`Column ${columnIndex + 1}`}
                        value={header}
                      />
                      <div className="mt-1.5 flex items-center gap-1">
                        <Select
                          aria-label={`Column ${columnIndex + 1} alignment`}
                          className="h-6 flex-1 px-1 text-[11px]"
                          onChange={(event) =>
                            setAlignments((current) =>
                              current.map((alignment, index) =>
                                index === columnIndex
                                  ? (event.target.value as Alignment)
                                  : alignment
                              )
                            )
                          }
                          value={alignments[columnIndex] ?? 'default'}
                        >
                          <option value="default">Default</option>
                          <option value="left">Left</option>
                          <option value="center">Center</option>
                          <option value="right">Right</option>
                        </Select>
                        <Button
                          aria-label={`Remove column ${columnIndex + 1}`}
                          disabled={headers.length <= 1}
                          onClick={() => removeColumn(columnIndex)}
                          size="icon"
                          variant="ghost"
                        >
                          <X aria-hidden className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, rowIndex) => (
                  <tr
                    className="border-b border-border/70 last:border-0"
                    key={rowIndex}
                  >
                    <td className="px-1.5 py-1.5 align-middle">
                      <div className="flex items-center gap-1">
                        <span className="w-3 text-center text-[10px] text-fg-subtle">
                          {rowIndex + 1}
                        </span>
                        <Button
                          aria-label={`Remove row ${rowIndex + 1}`}
                          onClick={() => removeRow(rowIndex)}
                          size="icon"
                          variant="ghost"
                        >
                          <X aria-hidden className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                    {headers.map((_, columnIndex) => (
                      <td className="px-1.5 py-1.5" key={columnIndex}>
                        <Input
                          aria-label={`Row ${rowIndex + 1} column ${
                            columnIndex + 1
                          }`}
                          className="h-7 text-xs"
                          onChange={(event) =>
                            updateCell(
                              rowIndex,
                              columnIndex,
                              event.target.value
                            )
                          }
                          value={row[columnIndex] ?? ''}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {rows.length === 0 && (
            <p className="mt-2 text-xs text-fg-muted">
              The table has no body rows. Add a row to include data.
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button onClick={addRow} size="sm" variant="default">
              <Rows3 aria-hidden className="h-3.5 w-3.5" />
              Add row
            </Button>
            <Button onClick={addColumn} size="sm" variant="default">
              <Columns3 aria-hidden className="h-3.5 w-3.5" />
              Add column
            </Button>
            <Button
              onClick={() => {
                setHeaders(sampleHeaders);
                setRows(sampleRows);
                setAlignments(sampleHeaders.map(() => 'default'));
              }}
              size="sm"
              variant="ghost"
            >
              <FlaskConical aria-hidden className="h-3.5 w-3.5" />
              Load example
            </Button>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-xs text-fg-muted">
              <input
                checked={pad}
                className="h-3.5 w-3.5 accent-[var(--accent)]"
                onChange={(event) => setPad(event.target.checked)}
                type="checkbox"
              />
              Pad cells to align columns
            </label>
            <Field
              className="w-36"
              htmlFor="markdown-table-align-all"
              label="Set all alignments"
            >
              <Select
                id="markdown-table-align-all"
                onChange={(event) =>
                  setAlignments(
                    headers.map(() => event.target.value as Alignment)
                  )
                }
                value=""
              >
                <option value="" disabled>
                  Choose…
                </option>
                <option value="default">Default</option>
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </Select>
            </Field>
          </div>

          <p className="mt-3 text-xs leading-5 text-fg-muted">
            Pipe characters inside cells are escaped and line breaks become
            <code className="mx-1">&lt;br&gt;</code>. Alignment markers use
            leading, trailing or both colons in the separator row.
          </p>
        </Panel>

        <ResultPanel
          emptyText="Add columns and rows to generate a Markdown table."
          filename="table.md"
          label="Markdown table"
          mime="text/markdown"
          value={markdown}
        />
      </ToolLayout>
    </div>
  );
}
