'use client';

import { diffLines } from 'diff';
import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { Field } from '@/components/ui/Field';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Textarea } from '@/components/ui/Textarea';
import { ToolLayout } from '@/components/ui/ToolLayout';
import { cn } from '@/utils/cn';

type DiffRowType = 'ctx' | 'add' | 'del';

type LineRow = {
  type: DiffRowType;
  oldNo: number | null;
  newNo: number | null;
  text: string;
};

type DisplayRow =
  | { kind: 'meta'; text: string }
  | { kind: 'hunk'; text: string }
  | ({ kind: 'line' } & LineRow);

type SideRow = {
  left: { no: number; text: string; type: 'ctx' | 'del' } | null;
  right: { no: number; text: string; type: 'ctx' | 'add' } | null;
};

const splitLines = (value: string) => {
  const lines = value.split('\n');
  if (lines.length > 0 && lines[lines.length - 1] === '') {
    lines.pop();
  }
  return lines;
};

const buildRows = (before: string, after: string): LineRow[] => {
  const rows: LineRow[] = [];
  let oldNo = 1;
  let newNo = 1;

  for (const change of diffLines(before, after, {
    ignoreNewlineAtEof: true,
  })) {
    for (const text of splitLines(change.value)) {
      if (change.added) {
        rows.push({ type: 'add', oldNo: null, newNo: newNo++, text });
      } else if (change.removed) {
        rows.push({ type: 'del', oldNo: oldNo++, newNo: null, text });
      } else {
        rows.push({ type: 'ctx', oldNo: oldNo++, newNo: newNo++, text });
      }
    }
  }

  return rows;
};

const buildSideBySide = (rows: LineRow[]): SideRow[] => {
  const result: SideRow[] = [];
  let index = 0;

  while (index < rows.length) {
    const row = rows[index];

    if (!row) {
      index += 1;
      continue;
    }

    if (row.type === 'ctx') {
      result.push({
        left: { no: row.oldNo ?? 0, text: row.text, type: 'ctx' },
        right: { no: row.newNo ?? 0, text: row.text, type: 'ctx' },
      });
      index += 1;
      continue;
    }

    const removed: LineRow[] = [];
    const added: LineRow[] = [];

    while (index < rows.length) {
      const current = rows[index];
      if (!current || current.type === 'ctx') {
        break;
      }
      if (current.type === 'del') {
        removed.push(current);
      } else {
        added.push(current);
      }
      index += 1;
    }

    const length = Math.max(removed.length, added.length);
    for (let offset = 0; offset < length; offset += 1) {
      const left = removed[offset];
      const right = added[offset];
      result.push({
        left: left
          ? { no: left.oldNo ?? 0, text: left.text, type: 'del' }
          : null,
        right: right
          ? { no: right.newNo ?? 0, text: right.text, type: 'add' }
          : null,
      });
    }
  }

  return result;
};

const parsePatch = (patch: string): DisplayRow[] => {
  const rows: DisplayRow[] = [];
  let oldNo = 0;
  let newNo = 0;

  for (const rawLine of splitLines(patch)) {
    const line = rawLine.endsWith('\r') ? rawLine.slice(0, -1) : rawLine;

    if (line.startsWith('@@')) {
      const match = /^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(line);
      if (match) {
        oldNo = Number(match[1]);
        newNo = Number(match[2]);
      }
      rows.push({ kind: 'hunk', text: line });
      continue;
    }

    if (
      line.startsWith('diff ') ||
      line.startsWith('index ') ||
      line.startsWith('--- ') ||
      line.startsWith('+++ ') ||
      line.startsWith('new file') ||
      line.startsWith('deleted file') ||
      line.startsWith('similarity index') ||
      line.startsWith('rename ') ||
      line.startsWith('\\ No newline')
    ) {
      rows.push({ kind: 'meta', text: line });
      continue;
    }

    if (line.startsWith('+')) {
      rows.push({
        kind: 'line',
        type: 'add',
        oldNo: null,
        newNo,
        text: line.slice(1),
      });
      newNo += 1;
      continue;
    }

    if (line.startsWith('-')) {
      rows.push({
        kind: 'line',
        type: 'del',
        oldNo,
        newNo: null,
        text: line.slice(1),
      });
      oldNo += 1;
      continue;
    }

    if (line.startsWith(' ') || line === '') {
      rows.push({
        kind: 'line',
        type: 'ctx',
        oldNo,
        newNo,
        text: line.startsWith(' ') ? line.slice(1) : line,
      });
      oldNo += 1;
      newNo += 1;
      continue;
    }

    rows.push({ kind: 'meta', text: line });
  }

  return rows;
};

const countChanges = (rows: LineRow[]) => {
  let additions = 0;
  let deletions = 0;
  for (const row of rows) {
    if (row.type === 'add') {
      additions += 1;
    } else if (row.type === 'del') {
      deletions += 1;
    }
  }
  return { additions, deletions };
};

const EXAMPLE_BEFORE = `function greet(name) {
  console.log("Hello, " + name);
}

export default greet;`;

const EXAMPLE_AFTER = `function greet(name, punctuation = "!") {
  console.log(\`Hello, \${name}\${punctuation}\`);
}

export default greet;`;

const lineClass = (type: DiffRowType) => {
  if (type === 'add') {
    return 'bg-success-subtle/60';
  }
  if (type === 'del') {
    return 'bg-danger-subtle/60';
  }
  return '';
};

const markerClass = (type: DiffRowType) => {
  if (type === 'add') {
    return 'text-success';
  }
  if (type === 'del') {
    return 'text-danger';
  }
  return 'text-fg-subtle';
};

const markerFor = (type: DiffRowType) =>
  type === 'add' ? '+' : type === 'del' ? '-' : ' ';

export default function DiffViewer() {
  const [mode, setMode] = useState<'compare' | 'patch'>('compare');
  const [view, setView] = useState<'unified' | 'side-by-side'>('unified');
  const [before, setBefore] = useState('');
  const [after, setAfter] = useState('');
  const [patch, setPatch] = useState('');

  const rows = useMemo(() => buildRows(before, after), [before, after]);
  const sideRows = useMemo(() => buildSideBySide(rows), [rows]);
  const patchRows = useMemo(() => parsePatch(patch), [patch]);
  const stats = useMemo(() => countChanges(rows), [rows]);

  const compareActive = before.length > 0 || after.length > 0;
  const patchActive = patch.trim().length > 0;
  const active = mode === 'compare' ? compareActive : patchActive;

  const diffText = useMemo(() => {
    if (mode === 'patch') {
      return patch;
    }
    if (!compareActive) {
      return '';
    }
    const oldCount = rows.filter((row) => row.type !== 'add').length;
    const newCount = rows.filter((row) => row.type !== 'del').length;
    return [
      '--- original',
      '+++ modified',
      `@@ -${oldCount === 0 ? 0 : 1},${oldCount} +${
        newCount === 0 ? 0 : 1
      },${newCount} @@`,
      ...rows.map((row) => `${markerFor(row.type)}${row.text}`),
    ].join('\n');
  }, [mode, patch, compareActive, rows]);

  return (
    <div className="space-y-4">
      <ToolLayout>
        <Panel
          description="Compare two texts, or paste a unified diff / .patch file to inspect it."
          title="Input"
        >
          <SegmentedControl
            ariaLabel="Diff input mode"
            onChange={(value) =>
              setMode(value === 'patch' ? 'patch' : 'compare')
            }
            options={[
              { value: 'compare', label: 'Compare two texts' },
              { value: 'patch', label: 'Paste a diff' },
            ]}
            value={mode}
          />

          {mode === 'compare' ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <Field
                hint={`${before.split('\n').length} lines`}
                htmlFor="diff-before"
                label="Original"
              >
                <Textarea
                  className="min-h-[260px]"
                  id="diff-before"
                  onChange={(event) => setBefore(event.target.value)}
                  placeholder="Paste the original text…"
                  value={before}
                />
              </Field>
              <Field
                hint={`${after.split('\n').length} lines`}
                htmlFor="diff-after"
                label="Modified"
              >
                <Textarea
                  className="min-h-[260px]"
                  id="diff-after"
                  onChange={(event) => setAfter(event.target.value)}
                  placeholder="Paste the modified text…"
                  value={after}
                />
              </Field>
            </div>
          ) : (
            <Field
              className="mt-4"
              hint="Supports git diffs and unified patches"
              htmlFor="diff-patch"
              label="Unified diff"
            >
              <Textarea
                className="min-h-[420px]"
                id="diff-patch"
                onChange={(event) => setPatch(event.target.value)}
                placeholder={
                  '--- a/file.ts\n+++ b/file.ts\n@@ -1,3 +1,3 @@\n-old line\n+new line'
                }
                value={patch}
              />
            </Field>
          )}

          {mode === 'compare' && (
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                onClick={() => {
                  setBefore(EXAMPLE_BEFORE);
                  setAfter(EXAMPLE_AFTER);
                }}
                size="sm"
              >
                Load example
              </Button>
              <Button
                onClick={() => {
                  setBefore('');
                  setAfter('');
                }}
                size="sm"
                variant="ghost"
              >
                Clear
              </Button>
            </div>
          )}

          <Callout className="mt-3" variant="info">
            Nothing leaves your browser. The comparison uses line-based diffing.
          </Callout>
        </Panel>

        <div className="space-y-4">
          <ResultPanel
            emptyText={
              mode === 'compare'
                ? 'Paste an original and a modified text to see the differences.'
                : 'Paste a unified diff to inspect its changes.'
            }
            filename={mode === 'patch' ? 'patch.diff' : 'changes.diff'}
            label={mode === 'patch' ? 'Parsed diff' : 'Diff'}
            value={active ? diffText : ''}
          >
            {!active ? null : mode === 'compare' ? (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <SegmentedControl
                    ariaLabel="Diff layout"
                    onChange={(value) =>
                      setView(
                        value === 'side-by-side' ? 'side-by-side' : 'unified'
                      )
                    }
                    options={[
                      { value: 'unified', label: 'Unified' },
                      { value: 'side-by-side', label: 'Side by side' },
                    ]}
                    value={view}
                  />
                  <div className="flex gap-1.5">
                    <Badge variant="success">+{stats.additions}</Badge>
                    <Badge variant="danger">−{stats.deletions}</Badge>
                  </div>
                </div>

                {rows.length === 0 ? (
                  <p className="rounded-md border border-border bg-canvas-inset p-4 text-sm text-fg-muted">
                    Both texts are empty.
                  </p>
                ) : view === 'unified' ? (
                  <div className="max-h-[520px] overflow-auto rounded-md border border-border bg-canvas-inset font-mono text-[12px] leading-5">
                    {rows.map((row, index) => (
                      <div
                        className={cn(
                          'grid grid-cols-[2.75rem_2.75rem_1.25rem_1fr]',
                          lineClass(row.type)
                        )}
                        key={`${index}-${row.type}`}
                      >
                        <span className="select-none border-r border-border/60 px-2 text-right text-fg-subtle">
                          {row.oldNo ?? ''}
                        </span>
                        <span className="select-none border-r border-border/60 px-2 text-right text-fg-subtle">
                          {row.newNo ?? ''}
                        </span>
                        <span
                          className={cn(
                            'select-none px-1 text-center',
                            markerClass(row.type)
                          )}
                        >
                          {markerFor(row.type)}
                        </span>
                        <span className="whitespace-pre px-2 text-fg">
                          {row.text || ' '}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="max-h-[520px] min-w-[640px] overflow-auto rounded-md border border-border bg-canvas-inset font-mono text-[12px] leading-5">
                    <div className="grid grid-cols-2 border-b border-border bg-canvas-subtle/60 text-[11px] text-fg-muted">
                      <span className="px-2 py-1">Original</span>
                      <span className="border-l border-border px-2 py-1">
                        Modified
                      </span>
                    </div>
                    {sideRows.map((row, index) => (
                      <div className="grid grid-cols-2" key={index}>
                        <div
                          className={cn(
                            'flex min-h-[20px]',
                            row.left && lineClass(row.left.type)
                          )}
                        >
                          <span className="w-10 shrink-0 select-none px-2 text-right text-fg-subtle">
                            {row.left?.no ?? ''}
                          </span>
                          <span className="whitespace-pre px-2 text-fg">
                            {row.left ? row.left.text || ' ' : ''}
                          </span>
                        </div>
                        <div
                          className={cn(
                            'flex min-h-[20px] border-l border-border',
                            row.right && lineClass(row.right.type)
                          )}
                        >
                          <span className="w-10 shrink-0 select-none px-2 text-right text-fg-subtle">
                            {row.right?.no ?? ''}
                          </span>
                          <span className="whitespace-pre px-2 text-fg">
                            {row.right ? row.right.text || ' ' : ''}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="max-h-[560px] overflow-auto rounded-md border border-border bg-canvas-inset font-mono text-[12px] leading-5">
                {patchRows.length === 0 ? (
                  <p className="p-4 text-sm text-fg-muted">
                    No diff lines detected. Paste a unified diff starting with
                    <code className="mx-1">---</code> and
                    <code className="mx-1">+++</code>.
                  </p>
                ) : (
                  patchRows.map((row, index) =>
                    row.kind === 'line' ? (
                      <div
                        className={cn(
                          'grid grid-cols-[2.75rem_2.75rem_1.25rem_1fr]',
                          lineClass(row.type)
                        )}
                        key={index}
                      >
                        <span className="select-none border-r border-border/60 px-2 text-right text-fg-subtle">
                          {row.oldNo ?? ''}
                        </span>
                        <span className="select-none border-r border-border/60 px-2 text-right text-fg-subtle">
                          {row.newNo ?? ''}
                        </span>
                        <span
                          className={cn(
                            'select-none px-1 text-center',
                            markerClass(row.type)
                          )}
                        >
                          {markerFor(row.type)}
                        </span>
                        <span className="whitespace-pre px-2 text-fg">
                          {row.text || ' '}
                        </span>
                      </div>
                    ) : (
                      <div
                        className={cn(
                          'whitespace-pre px-3 py-1 text-[11px]',
                          row.kind === 'hunk'
                            ? 'border-y border-accent/30 bg-accent-subtle/30 text-accent'
                            : 'bg-canvas-subtle/60 text-fg-muted'
                        )}
                        key={index}
                      >
                        {row.text}
                      </div>
                    )
                  )
                )}
              </div>
            )}
          </ResultPanel>
        </div>
      </ToolLayout>
    </div>
  );
}
