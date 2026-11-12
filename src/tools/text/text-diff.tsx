'use client';

import type { Change } from 'diff';
import { diffLines } from 'diff';
import { Fragment, useMemo, useState } from 'react';

import { Field } from '@/components/ui/Field';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Textarea } from '@/components/ui/Textarea';
import { cn } from '@/utils/cn';

type ViewMode = 'unified' | 'side-by-side';

type SideRow = {
  left: string | null;
  right: string | null;
  leftNo: number | null;
  rightNo: number | null;
  kind: 'same' | 'removed' | 'added' | 'changed';
};

type UnifiedRow = {
  text: string;
  oldNo: number | null;
  newNo: number | null;
  kind: 'same' | 'removed' | 'added';
};

const toLines = (value: string): string[] => {
  if (value === '') {
    return [];
  }

  const lines = value.split('\n');
  if (lines[lines.length - 1] === '') {
    lines.pop();
  }
  return lines;
};

const countLines = (value: string): number =>
  value ? value.split(/\r\n|\r|\n/u).length : 0;

const buildSideRows = (changes: Change[]): SideRow[] => {
  const rows: SideRow[] = [];
  const removed: string[] = [];
  const added: string[] = [];
  let leftNo = 0;
  let rightNo = 0;

  const flush = () => {
    const length = Math.max(removed.length, added.length);

    for (let index = 0; index < length; index += 1) {
      const left = removed[index];
      const right = added[index];

      if (left !== undefined) {
        leftNo += 1;
      }
      if (right !== undefined) {
        rightNo += 1;
      }

      rows.push({
        left: left ?? null,
        right: right ?? null,
        leftNo: left !== undefined ? leftNo : null,
        rightNo: right !== undefined ? rightNo : null,
        kind:
          left !== undefined && right !== undefined
            ? 'changed'
            : left !== undefined
              ? 'removed'
              : 'added',
      });
    }

    removed.length = 0;
    added.length = 0;
  };

  for (const change of changes) {
    const lines = toLines(change.value);

    if (change.removed) {
      removed.push(...lines);
      continue;
    }

    if (change.added) {
      added.push(...lines);
      continue;
    }

    flush();
    for (const line of lines) {
      leftNo += 1;
      rightNo += 1;
      rows.push({
        left: line,
        right: line,
        leftNo,
        rightNo,
        kind: 'same',
      });
    }
  }

  flush();
  return rows;
};

const buildUnifiedRows = (changes: Change[]): UnifiedRow[] => {
  const rows: UnifiedRow[] = [];
  let oldNo = 0;
  let newNo = 0;

  for (const change of changes) {
    for (const line of toLines(change.value)) {
      if (change.removed) {
        oldNo += 1;
        rows.push({ text: line, oldNo, newNo: null, kind: 'removed' });
      } else if (change.added) {
        newNo += 1;
        rows.push({ text: line, oldNo: null, newNo, kind: 'added' });
      } else {
        oldNo += 1;
        newNo += 1;
        rows.push({ text: line, oldNo, newNo, kind: 'same' });
      }
    }
  }

  return rows;
};

const buildUnifiedText = (rows: UnifiedRow[]): string =>
  rows
    .map((row) => {
      const marker =
        row.kind === 'added' ? '+' : row.kind === 'removed' ? '-' : ' ';
      return `${marker}${row.text}`;
    })
    .join('\n');

export default function TextDiff() {
  const [left, setLeft] = useState('');
  const [right, setRight] = useState('');
  const [view, setView] = useState<ViewMode>('side-by-side');

  const changes = useMemo(
    () => diffLines(left, right, { ignoreNewlineAtEof: true }),
    [left, right]
  );
  const sideRows = useMemo(() => buildSideRows(changes), [changes]);
  const unifiedRows = useMemo(() => buildUnifiedRows(changes), [changes]);
  const unifiedText = useMemo(
    () => buildUnifiedText(unifiedRows),
    [unifiedRows]
  );

  const added = unifiedRows.filter((row) => row.kind === 'added').length;
  const removed = unifiedRows.filter((row) => row.kind === 'removed').length;
  const hasInput = left.length > 0 || right.length > 0;

  return (
    <div className="space-y-6">
      <Panel
        actions={
          <SegmentedControl
            ariaLabel="Diff view"
            onChange={(value) => setView(value as ViewMode)}
            options={[
              { value: 'side-by-side', label: 'Side by side' },
              { value: 'unified', label: 'Unified' },
            ]}
            value={view}
          />
        }
        title="Compare text"
      >
        <div className="grid gap-3 md:grid-cols-2">
          <Field
            hint={`${countLines(left).toLocaleString()} lines`}
            label="Original"
          >
            <Textarea
              onChange={(event) => setLeft(event.target.value)}
              placeholder="Paste the original text…"
              value={left}
            />
          </Field>
          <Field
            hint={`${countLines(right).toLocaleString()} lines`}
            label="Changed"
          >
            <Textarea
              onChange={(event) => setRight(event.target.value)}
              placeholder="Paste the changed text…"
              value={right}
            />
          </Field>
        </div>
      </Panel>

      <ResultPanel
        emptyText="Enter text in both panels to see a line-by-line comparison."
        filename="diff.txt"
        label="Diff"
        value={hasInput ? unifiedText : ''}
      >
        {!hasInput ? (
          <div className="flex min-h-[230px] items-center justify-center rounded-md border border-dashed border-border bg-canvas-inset/50 p-4 text-center text-sm text-fg-muted">
            Enter text in both panels to see a line-by-line comparison.
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full border border-success/40 bg-success-subtle px-2 py-0.5 font-medium text-success">
                +{added.toLocaleString()} added
              </span>
              <span className="rounded-full border border-danger/40 bg-danger-subtle px-2 py-0.5 font-medium text-danger">
                −{removed.toLocaleString()} removed
              </span>
              <span className="text-fg-muted">
                {
                  changes.filter((change) => !change.added && !change.removed)
                    .length
                }{' '}
                unchanged block(s)
              </span>
            </div>

            <div className="max-h-[560px] overflow-auto rounded-md border border-border bg-canvas-inset">
              {view === 'unified' ? (
                <div className="min-w-[560px] py-2 font-mono text-[12.5px] leading-5">
                  {unifiedRows.map((row, index) => (
                    <div
                      className={cn(
                        'grid grid-cols-[3.5rem_3.5rem_1.25rem_1fr]',
                        row.kind === 'added' && 'bg-success-subtle/50',
                        row.kind === 'removed' && 'bg-danger-subtle/50'
                      )}
                      key={`${index}-${row.oldNo ?? 'x'}-${row.newNo ?? 'x'}`}
                    >
                      <span className="select-none border-r border-border/60 px-2 text-right text-fg-subtle">
                        {row.oldNo ?? ''}
                      </span>
                      <span className="select-none border-r border-border/60 px-2 text-right text-fg-subtle">
                        {row.newNo ?? ''}
                      </span>
                      <span
                        className={cn(
                          'select-none text-center',
                          row.kind === 'added' && 'text-success',
                          row.kind === 'removed' && 'text-danger',
                          row.kind === 'same' && 'text-fg-subtle'
                        )}
                      >
                        {row.kind === 'added'
                          ? '+'
                          : row.kind === 'removed'
                            ? '−'
                            : ' '}
                      </span>
                      <span className="whitespace-pre-wrap break-words px-2 text-fg">
                        {row.text || '\u00a0'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="min-w-[720px] py-2 font-mono text-[12.5px] leading-5">
                  <div className="sticky top-0 z-10 grid grid-cols-[3.5rem_1fr_3.5rem_1fr] border-b border-border bg-surface text-[11px] font-semibold uppercase tracking-wide text-fg-muted">
                    <span className="px-2 py-1 text-right">#</span>
                    <span className="px-2 py-1">Original</span>
                    <span className="border-l border-border px-2 py-1 text-right">
                      #
                    </span>
                    <span className="px-2 py-1">Changed</span>
                  </div>
                  {sideRows.map((row, index) => (
                    <Fragment
                      key={`${index}-${row.leftNo ?? 'x'}-${row.rightNo ?? 'x'}`}
                    >
                      <div className="grid grid-cols-[3.5rem_1fr_3.5rem_1fr]">
                        <span className="select-none border-r border-border/60 px-2 text-right text-fg-subtle">
                          {row.leftNo ?? ''}
                        </span>
                        <span
                          className={cn(
                            'whitespace-pre-wrap break-words border-r border-border px-2 text-fg',
                            (row.kind === 'removed' ||
                              row.kind === 'changed') &&
                              'bg-danger-subtle/50'
                          )}
                        >
                          {row.left ?? ''}
                        </span>
                        <span className="select-none border-r border-border/60 px-2 text-right text-fg-subtle">
                          {row.rightNo ?? ''}
                        </span>
                        <span
                          className={cn(
                            'whitespace-pre-wrap break-words px-2 text-fg',
                            row.kind === 'added' && 'bg-success-subtle/50',
                            row.kind === 'changed' && 'bg-success-subtle/40'
                          )}
                        >
                          {row.right ?? ''}
                        </span>
                      </div>
                    </Fragment>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </ResultPanel>
    </div>
  );
}
