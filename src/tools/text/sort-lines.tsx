'use client';

import { useMemo, useState } from 'react';

import { Field } from '@/components/ui/Field';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { ToolLayout } from '@/components/ui/ToolLayout';

import { Checkbox } from './ui';

type SortMode = 'alphabetical' | 'numeric' | 'natural';
type SortOrder = 'asc' | 'desc';

const collatorFor = (caseInsensitive: boolean, numeric: boolean) =>
  new Intl.Collator(undefined, {
    numeric,
    sensitivity: caseInsensitive ? 'base' : 'variant',
  });

const numericKey = (line: string): number => {
  const match = line.match(/-?\d+(?:[.,]\d+)?/u);
  if (!match) {
    return Number.POSITIVE_INFINITY;
  }

  const value = Number.parseFloat(match[0].replace(',', '.'));
  return Number.isNaN(value) ? Number.POSITIVE_INFINITY : value;
};

const sortLines = (
  text: string,
  mode: SortMode,
  order: SortOrder,
  caseInsensitive: boolean,
  removeEmpty: boolean
): { output: string; count: number } => {
  if (!text) {
    return { output: '', count: 0 };
  }

  const lines = text
    .split(/\r\n|\r|\n/u)
    .filter((line) => !removeEmpty || line.trim() !== '');

  if (lines.length === 0) {
    return { output: '', count: 0 };
  }

  const collator = collatorFor(caseInsensitive, mode === 'natural');
  const direction = order === 'desc' ? -1 : 1;

  const decorated = lines.map((line, index) => ({
    line,
    index,
    numeric: mode === 'numeric' ? numericKey(line) : 0,
  }));

  decorated.sort((left, right) => {
    let comparison = 0;

    if (mode === 'numeric') {
      const leftNumeric = Number.isFinite(left.numeric);
      const rightNumeric = Number.isFinite(right.numeric);

      if (leftNumeric && rightNumeric) {
        comparison = left.numeric - right.numeric;
      } else if (leftNumeric) {
        comparison = -1;
      } else if (rightNumeric) {
        comparison = 1;
      }
    }

    if (comparison === 0) {
      comparison = collator.compare(left.line, right.line);
    }

    if (comparison === 0) {
      return left.index - right.index;
    }

    return comparison * direction;
  });

  return {
    output: decorated.map((item) => item.line).join('\n'),
    count: decorated.length,
  };
};

export default function SortLines() {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<SortMode>('alphabetical');
  const [order, setOrder] = useState<SortOrder>('asc');
  const [caseInsensitive, setCaseInsensitive] = useState(true);
  const [removeEmpty, setRemoveEmpty] = useState(false);

  const result = useMemo(
    () => sortLines(input, mode, order, caseInsensitive, removeEmpty),
    [input, mode, order, caseInsensitive, removeEmpty]
  );

  return (
    <ToolLayout>
      <Panel title="Input">
        <Field
          hint={`${
            input ? input.split(/\r\n|\r|\n/u).length.toLocaleString() : 0
          } lines`}
          label="Lines"
        >
          <Textarea
            className="min-h-[340px]"
            onChange={(event) => setInput(event.target.value)}
            placeholder={'item 10\nitem 2\nItem 1'}
            value={input}
          />
        </Field>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="Sort by">
            <Select
              aria-label="Sort method"
              onChange={(event) => setMode(event.target.value as SortMode)}
              value={mode}
            >
              <option value="alphabetical">Alphabetical</option>
              <option value="numeric">Numeric</option>
              <option value="natural">Natural (numbers aware)</option>
            </Select>
          </Field>

          <Field label="Order">
            <Select
              aria-label="Sort order"
              onChange={(event) => setOrder(event.target.value as SortOrder)}
              value={order}
            >
              <option value="asc">Ascending (A → Z)</option>
              <option value="desc">Descending (Z → A)</option>
            </Select>
          </Field>
        </div>

        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
          <Checkbox
            checked={caseInsensitive}
            label="Case-insensitive"
            onChange={setCaseInsensitive}
          />
          <Checkbox
            checked={removeEmpty}
            label="Remove empty lines"
            onChange={setRemoveEmpty}
          />
        </div>
      </Panel>

      <ResultPanel
        emptyText="Paste lines to sort them."
        filename="sorted.txt"
        label="Sorted lines"
        value={result.output}
      >
        {input ? (
          <div className="space-y-3">
            <span className="inline-flex rounded-full border border-accent/40 bg-accent-subtle/50 px-2 py-0.5 text-xs font-medium text-accent">
              {result.count.toLocaleString()} lines sorted
            </span>
            <pre className="max-h-[470px] min-h-[230px] overflow-auto whitespace-pre-wrap break-words rounded-md border border-border bg-canvas-inset p-3 font-mono text-[13px] leading-6 text-fg">
              {result.output}
            </pre>
          </div>
        ) : undefined}
      </ResultPanel>
    </ToolLayout>
  );
}
