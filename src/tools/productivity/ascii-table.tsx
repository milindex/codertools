'use client';

import { Plus, X } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { Input } from '@/components/ui/Input';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Select } from '@/components/ui/Select';
import { ToolLayout } from '@/components/ui/ToolLayout';

type Alignment = 'left' | 'center' | 'right';
type TableStyle = 'box' | 'rounded' | 'simple' | 'markdown';

const MAX_COLUMNS = 10;
const MAX_ROWS = 30;

const cloneExample = () => ({
  headers: ['Name', 'Role', 'Location'],
  rows: [
    ['Ada Lovelace', 'Mathematician', 'London'],
    ['Grace Hopper', 'Computer scientist', 'New York'],
    ['Alan Turing', 'Cryptanalyst', 'Manchester'],
  ],
  alignments: ['left', 'left', 'left'] as Alignment[],
});

const normalize = (value: string) => value.replace(/\r?\n/g, ' ');

const padCell = (value: string, width: number, alignment: Alignment) => {
  const text = normalize(value);
  const padding = Math.max(0, width - text.length);
  if (alignment === 'right') {
    return `${' '.repeat(padding)}${text}`;
  }
  if (alignment === 'center') {
    const left = Math.floor(padding / 2);
    return `${' '.repeat(left)}${text}${' '.repeat(padding - left)}`;
  }
  return `${text}${' '.repeat(padding)}`;
};

const buildTable = (
  headers: string[],
  rows: string[][],
  alignments: Alignment[],
  style: TableStyle
) => {
  const columnCount = headers.length;
  if (columnCount === 0) {
    return '';
  }

  const widths = headers.map((header, columnIndex) => {
    let width = normalize(header).length;
    for (const row of rows) {
      width = Math.max(width, normalize(row[columnIndex] ?? '').length);
    }
    return Math.max(1, width);
  });

  const renderRow = (cells: string[], vertical: string, outer: boolean) => {
    const body = cells
      .map(
        (cell, columnIndex) =>
          ` ${padCell(
            cell,
            widths[columnIndex] ?? 1,
            alignments[columnIndex] ?? 'left'
          )} `
      )
      .join(vertical);
    return outer ? `${vertical}${body}${vertical}` : body;
  };

  if (style === 'markdown') {
    const headerLine = `| ${headers
      .map((header, columnIndex) =>
        padCell(
          header,
          widths[columnIndex] ?? 1,
          alignments[columnIndex] ?? 'left'
        )
      )
      .join(' | ')} |`;
    const separator = `| ${widths
      .map((width, columnIndex) => {
        const dashes = '-'.repeat(Math.max(3, width));
        const alignment = alignments[columnIndex] ?? 'left';
        if (alignment === 'center') {
          return `:${dashes}:`;
        }
        if (alignment === 'right') {
          return `${dashes}:`;
        }
        return `:${dashes}`;
      })
      .join(' | ')} |`;
    const bodyLines = rows.map(
      (row) =>
        `| ${headers
          .map((_, columnIndex) =>
            padCell(
              row[columnIndex] ?? '',
              widths[columnIndex] ?? 1,
              alignments[columnIndex] ?? 'left'
            )
          )
          .join(' | ')} |`
    );
    return [headerLine, separator, ...bodyLines].join('\n');
  }

  if (style === 'simple') {
    const separator = widths.map((width) => '-'.repeat(width + 2)).join('+');
    return [
      renderRow(headers, '|', false),
      separator,
      ...rows.map((row) => renderRow(row, '|', false)),
    ].join('\n');
  }

  const chars =
    style === 'rounded'
      ? {
          topLeft: '╭',
          topMid: '┬',
          topRight: '╮',
          midLeft: '├',
          midMid: '┼',
          midRight: '┤',
          bottomLeft: '╰',
          bottomMid: '┴',
          bottomRight: '╯',
          horizontal: '─',
          vertical: '│',
        }
      : {
          topLeft: '┌',
          topMid: '┬',
          topRight: '┐',
          midLeft: '├',
          midMid: '┼',
          midRight: '┤',
          bottomLeft: '└',
          bottomMid: '┴',
          bottomRight: '┘',
          horizontal: '─',
          vertical: '│',
        };

  const horizontalLine = (left: string, middle: string, right: string) =>
    `${left}${widths
      .map((width) => chars.horizontal.repeat(width + 2))
      .join(middle)}${right}`;

  return [
    horizontalLine(chars.topLeft, chars.topMid, chars.topRight),
    renderRow(headers, chars.vertical, true),
    horizontalLine(chars.midLeft, chars.midMid, chars.midRight),
    ...rows.map((row) => renderRow(row, chars.vertical, true)),
    horizontalLine(chars.bottomLeft, chars.bottomMid, chars.bottomRight),
  ].join('\n');
};

export default function AsciiTable() {
  const [headers, setHeaders] = useState(() => cloneExample().headers);
  const [rows, setRows] = useState<string[][]>(() => cloneExample().rows);
  const [alignments, setAlignments] = useState<Alignment[]>(
    () => cloneExample().alignments
  );
  const [style, setStyle] = useState<TableStyle>('box');

  const output = useMemo(() => {
    const hasContent =
      headers.some((header) => header.trim().length > 0) ||
      rows.some((row) => row.some((cell) => cell.trim().length > 0));
    if (!hasContent) {
      return '';
    }
    return buildTable(headers, rows, alignments, style);
  }, [headers, rows, alignments, style]);

  const updateCell = (rowIndex: number, columnIndex: number, value: string) => {
    setRows((previous) =>
      previous.map((row, index) => {
        if (index !== rowIndex) {
          return row;
        }
        return headers.map((_, column) =>
          column === columnIndex ? value : (row[column] ?? '')
        );
      })
    );
  };

  const updateHeader = (columnIndex: number, value: string) => {
    setHeaders((previous) =>
      previous.map((header, index) => (index === columnIndex ? value : header))
    );
  };

  const updateAlignment = (columnIndex: number, value: Alignment) => {
    setAlignments((previous) =>
      previous.map((alignment, index) =>
        index === columnIndex ? value : alignment
      )
    );
  };

  const addRow = () => {
    if (rows.length >= MAX_ROWS) {
      return;
    }
    setRows((previous) => [...previous, headers.map(() => '')]);
  };

  const addColumn = () => {
    if (headers.length >= MAX_COLUMNS) {
      return;
    }
    setHeaders((previous) => [...previous, `Column ${previous.length + 1}`]);
    setAlignments((previous) => [...previous, 'left']);
    setRows((previous) => previous.map((row) => [...row, '']));
  };

  const removeRow = (rowIndex: number) => {
    if (rows.length <= 1) {
      setRows([headers.map(() => '')]);
      return;
    }
    setRows((previous) => previous.filter((_, index) => index !== rowIndex));
  };

  const removeColumn = (columnIndex: number) => {
    if (headers.length <= 1) {
      setHeaders(['Column 1']);
      setAlignments(['left']);
      setRows((previous) => previous.map(() => ['']));
      return;
    }
    setHeaders((previous) =>
      previous.filter((_, index) => index !== columnIndex)
    );
    setAlignments((previous) =>
      previous.filter((_, index) => index !== columnIndex)
    );
    setRows((previous) =>
      previous.map((row) => row.filter((_, index) => index !== columnIndex))
    );
  };

  const reset = () => {
    const example = cloneExample();
    setHeaders(example.headers);
    setRows(example.rows);
    setAlignments(example.alignments);
  };

  return (
    <div className="space-y-4">
      <ToolLayout>
        <Panel
          description="Edit the cells, headers and alignment. The ASCII table updates live."
          title="Table editor"
        >
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <SegmentedControl
              ariaLabel="Table style"
              onChange={(value) => {
                if (
                  value === 'box' ||
                  value === 'rounded' ||
                  value === 'simple' ||
                  value === 'markdown'
                ) {
                  setStyle(value);
                }
              }}
              options={[
                { value: 'box', label: 'Box' },
                { value: 'rounded', label: 'Rounded' },
                { value: 'simple', label: 'Simple' },
                { value: 'markdown', label: 'Markdown' },
              ]}
              value={style}
            />
            <span className="text-xs text-fg-muted">
              {rows.length} rows × {headers.length} columns
            </span>
          </div>

          <div className="overflow-x-auto rounded-md border border-border bg-canvas-inset p-2">
            <table className="w-full border-separate border-spacing-1">
              <thead>
                <tr>
                  <th className="w-6" />
                  {headers.map((header, columnIndex) => (
                    <th className="min-w-[9rem] align-top" key={columnIndex}>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1">
                          <Input
                            aria-label={`Header ${columnIndex + 1}`}
                            onChange={(event) =>
                              updateHeader(columnIndex, event.target.value)
                            }
                            value={header}
                          />
                          <Button
                            aria-label={`Remove column ${columnIndex + 1}`}
                            onClick={() => removeColumn(columnIndex)}
                            size="icon"
                            variant="ghost"
                          >
                            <X aria-hidden className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        <Select
                          aria-label={`Alignment for column ${columnIndex + 1}`}
                          className="h-7 text-xs"
                          onChange={(event) =>
                            updateAlignment(
                              columnIndex,
                              event.target.value as Alignment
                            )
                          }
                          value={alignments[columnIndex] ?? 'left'}
                        >
                          <option value="left">Left</option>
                          <option value="center">Center</option>
                          <option value="right">Right</option>
                        </Select>
                      </div>
                    </th>
                  ))}
                  <th className="w-6" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    <td className="pr-1 text-right align-middle text-[11px] text-fg-subtle">
                      {rowIndex + 1}
                    </td>
                    {headers.map((_, columnIndex) => (
                      <td key={columnIndex}>
                        <Input
                          aria-label={`Row ${rowIndex + 1}, column ${columnIndex + 1}`}
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
                    <td>
                      <Button
                        aria-label={`Remove row ${rowIndex + 1}`}
                        onClick={() => removeRow(rowIndex)}
                        size="icon"
                        variant="ghost"
                      >
                        <X aria-hidden className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              disabled={rows.length >= MAX_ROWS}
              onClick={addRow}
              size="sm"
            >
              <Plus aria-hidden className="h-3.5 w-3.5" />
              Add row
            </Button>
            <Button
              disabled={headers.length >= MAX_COLUMNS}
              onClick={addColumn}
              size="sm"
            >
              <Plus aria-hidden className="h-3.5 w-3.5" />
              Add column
            </Button>
            <Button onClick={reset} size="sm" variant="ghost">
              Reset example
            </Button>
          </div>

          {!headers.some((header) => header.trim()) &&
            !rows.some((row) => row.some((cell) => cell.trim())) && (
              <Callout className="mt-3" variant="warning">
                Add a header or at least one cell value to generate a table.
              </Callout>
            )}
        </Panel>

        <div className="space-y-4">
          <ResultPanel
            emptyText="Your table will appear here."
            filename={style === 'markdown' ? 'table.md' : 'table.txt'}
            label="Generated table"
            value={output}
          />

          <Panel title="Format notes">
            <div className="flex flex-wrap gap-2">
              <Badge variant="accent">Box drawing</Badge>
              <Badge>Unicode</Badge>
              <Badge>Copy or download</Badge>
            </div>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-xs leading-5 text-fg-muted">
              <li>Cells are padded to the widest value in each column.</li>
              <li>Newlines inside a cell are collapsed to a space.</li>
              <li>
                The Markdown style embeds alignment colons instead of padded
                borders.
              </li>
            </ul>
          </Panel>
        </div>
      </ToolLayout>
    </div>
  );
}
