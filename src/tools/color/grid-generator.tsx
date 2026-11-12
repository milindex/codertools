'use client';

import { useMemo, useState } from 'react';

import { Callout } from '@/components/ui/Callout';
import { CodeBlock } from '@/components/ui/CodeBlock';
import { Panel } from '@/components/ui/Panel';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { ToolLayout } from '@/components/ui/ToolLayout';

import { PreviewSurface, SliderField } from './shared';

const JUSTIFY_OPTIONS = [
  { label: 'Stretch', value: 'stretch' },
  { label: 'Start', value: 'start' },
  { label: 'Center', value: 'center' },
  { label: 'End', value: 'end' },
];

const ALIGN_OPTIONS = [
  { label: 'Stretch', value: 'stretch' },
  { label: 'Start', value: 'start' },
  { label: 'Center', value: 'center' },
  { label: 'End', value: 'end' },
];

const AREA_PRESETS: Record<
  string,
  { areas: string; columns: number; rows: number }
> = {
  'holy-grail': {
    columns: 3,
    rows: 3,
    areas: `"header header header"
"sidebar main aside"
"footer footer footer"`,
  },
  sidebar: {
    columns: 2,
    rows: 3,
    areas: `"header header"
"sidebar main"
"footer footer"`,
  },
  dashboard: {
    columns: 4,
    rows: 3,
    areas: `"header header header header"
"sidebar main main aside"
"footer footer footer footer"`,
  },
};

type ParsedAreas = {
  rows: string[][];
  names: string[];
  error: string | null;
};

const parseAreas = (input: string): ParsedAreas => {
  const lines = input
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return { rows: [], names: [], error: null };
  }

  const rows: string[][] = [];

  for (const line of lines) {
    const quoted = line.match(/^["'](.+?)["']\s*,?$/);
    const content = quoted?.[1] ?? line;
    const cells = content.trim().split(/\s+/).filter(Boolean);

    if (cells.length === 0) {
      return {
        rows: [],
        names: [],
        error: 'Each grid-template-areas row needs at least one named cell.',
      };
    }

    rows.push(cells);
  }

  const width = rows[0]?.length ?? 0;
  const mismatch = rows.some((row) => row.length !== width);

  if (mismatch) {
    return {
      rows: [],
      names: [],
      error:
        'Every grid-template-areas row must have the same number of columns.',
    };
  }

  const names: string[] = [];
  const invalidName = rows
    .flat()
    .find((name) => name !== '.' && !/^-?[A-Za-z_][A-Za-z0-9_-]*$/.test(name));

  if (invalidName) {
    return {
      rows: [],
      names: [],
      error: `"${invalidName}" is not a valid grid area name. Use letters, digits, hyphens or underscores, and do not start with a digit.`,
    };
  }

  rows.forEach((row) => {
    row.forEach((name) => {
      if (name !== '.' && !names.includes(name)) {
        names.push(name);
      }
    });
  });

  return { rows, names, error: null };
};

export default function GridGenerator() {
  const [columns, setColumns] = useState(3);
  const [rows, setRows] = useState(2);
  const [columnGap, setColumnGap] = useState(16);
  const [rowGap, setRowGap] = useState(16);
  const [justifyItems, setJustifyItems] = useState('stretch');
  const [alignItems, setAlignItems] = useState('stretch');
  const [areas, setAreas] = useState('');
  const [preset, setPreset] = useState('none');

  const parsedAreas = useMemo(() => parseAreas(areas), [areas]);
  const hasAreas = parsedAreas.rows.length > 0;

  const applyPreset = (name: string) => {
    setPreset(name);

    if (name === 'none') {
      setAreas('');
      return;
    }

    const next = AREA_PRESETS[name];

    if (next) {
      setAreas(next.areas);
      setColumns(next.columns);
      setRows(next.rows);
    }
  };

  const effectiveColumns = hasAreas
    ? (parsedAreas.rows[0]?.length ?? columns)
    : columns;
  const effectiveRows = hasAreas ? parsedAreas.rows.length : rows;

  const containerStyle = {
    alignItems,
    display: 'grid',
    gap: `${rowGap}px ${columnGap}px`,
    gridTemplateAreas: hasAreas
      ? parsedAreas.rows.map((row) => `"${row.join(' ')}"`).join(' ')
      : undefined,
    gridTemplateColumns: `repeat(${effectiveColumns}, minmax(0, 1fr))`,
    gridTemplateRows: `repeat(${effectiveRows}, minmax(0, 1fr))`,
    justifyContent: 'stretch',
    justifyItems,
    minHeight: 300,
  };

  const templateAreasLine = hasAreas
    ? `\n  grid-template-areas:\n${parsedAreas.rows
        .map((row) => `    "${row.join(' ')}"`)
        .join('\n')};`
    : '';

  const css = `.grid-container {
  display: grid;
  grid-template-columns: repeat(${effectiveColumns}, 1fr);
  grid-template-rows: repeat(${effectiveRows}, 1fr);
  gap: ${rowGap}px ${columnGap}px;
  justify-items: ${justifyItems};
  align-items: ${alignItems};${templateAreasLine}
}`;

  const cells = hasAreas
    ? parsedAreas.names.map((name) => ({ key: name, label: name, area: name }))
    : Array.from({ length: effectiveColumns * effectiveRows }, (_, index) => {
        const row = Math.floor(index / effectiveColumns) + 1;
        const column = (index % effectiveColumns) + 1;

        return {
          key: `${row}-${column}`,
          label: `${row} · ${column}`,
          area: undefined,
        };
      });

  return (
    <div className="space-y-6">
      <ToolLayout>
        <Panel
          description="Set the track counts and gaps, or define named template areas."
          title="Grid controls"
        >
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <SliderField
                label="Columns"
                max={8}
                min={1}
                onChange={(value) => setColumns(Math.round(value))}
                value={columns}
              />
              <SliderField
                label="Rows"
                max={6}
                min={1}
                onChange={(value) => setRows(Math.round(value))}
                value={rows}
              />
              <SliderField
                label="Column gap"
                max={48}
                min={0}
                onChange={setColumnGap}
                unit="px"
                value={columnGap}
              />
              <SliderField
                label="Row gap"
                max={48}
                min={0}
                onChange={setRowGap}
                unit="px"
                value={rowGap}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label
                  className="text-xs font-semibold text-fg"
                  htmlFor="grid-justify"
                >
                  Justify items
                </label>
                <Select
                  id="grid-justify"
                  onChange={(event) => setJustifyItems(event.target.value)}
                  value={justifyItems}
                >
                  {JUSTIFY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-1.5">
                <label
                  className="text-xs font-semibold text-fg"
                  htmlFor="grid-align"
                >
                  Align items
                </label>
                <Select
                  id="grid-align"
                  onChange={(event) => setAlignItems(event.target.value)}
                  value={alignItems}
                >
                  {ALIGN_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                className="text-xs font-semibold text-fg"
                htmlFor="grid-preset"
              >
                Layout preset
              </label>
              <Select
                id="grid-preset"
                onChange={(event) => applyPreset(event.target.value)}
                value={preset}
              >
                <option value="none">None (use columns and rows)</option>
                <option value="holy-grail">Holy grail</option>
                <option value="sidebar">Sidebar</option>
                <option value="dashboard">Dashboard</option>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label
                className="text-xs font-semibold text-fg"
                htmlFor="grid-areas"
              >
                Grid template areas
              </label>
              <Textarea
                className="min-h-[120px]"
                id="grid-areas"
                onChange={(event) => {
                  setAreas(event.target.value);
                  setPreset('custom');
                }}
                placeholder={`"header header"\n"sidebar main"`}
                rows={4}
                value={areas}
              />
              <p className="text-[11px] text-fg-muted">
                One quoted row per line. Use a period for empty cells. When
                areas are present they take priority over the column and row
                counts.
              </p>
            </div>

            {parsedAreas.error && (
              <Callout variant="error">{parsedAreas.error}</Callout>
            )}
          </div>
        </Panel>

        <Panel title="Preview">
          <PreviewSurface className="min-h-[360px] items-stretch bg-canvas-subtle">
            <div
              className="w-full rounded-md border border-dashed border-fg-subtle/70 bg-canvas-inset p-3"
              style={containerStyle}
            >
              {cells.map((cell, index) => (
                <div
                  className="flex min-h-10 items-center justify-center rounded-md border border-white/20 px-2 font-mono text-xs font-semibold text-white shadow-sm"
                  key={cell.key}
                  style={{
                    backgroundColor: `hsl(${(index * 43 + 190) % 360} 65% 48%)`,
                    gridArea: cell.area,
                  }}
                >
                  {cell.label}
                </div>
              ))}
            </div>
          </PreviewSurface>
        </Panel>
      </ToolLayout>

      <CodeBlock code={css} filename="grid.css" language="css" />
    </div>
  );
}
