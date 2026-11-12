'use client';

import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Callout } from '@/components/ui/Callout';
import { Field } from '@/components/ui/Field';
import { FileDropzone } from '@/components/ui/FileDropzone';
import { Input } from '@/components/ui/Input';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { ToolLayout } from '@/components/ui/ToolLayout';

type LogLevel =
  'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace' | 'unknown';

type LogLine = {
  number: number;
  text: string;
  level: LogLevel;
};

const LEVEL_PATTERN =
  /\b(FATAL|CRITICAL|ERROR|ERR|WARN(?:ING)?|NOTICE|INFO|DEBUG|TRACE|VERBOSE)\b/i;

const LEVEL_ORDER: LogLevel[] = [
  'fatal',
  'error',
  'warn',
  'info',
  'debug',
  'trace',
  'unknown',
];

const LEVEL_STYLES: Record<LogLevel, string> = {
  fatal: 'border-danger/50 bg-danger-subtle text-danger',
  error: 'border-danger/50 bg-danger-subtle text-danger',
  warn: 'border-attention/50 bg-attention-subtle text-attention',
  info: 'border-accent/50 bg-accent-subtle text-accent',
  debug: 'border-border bg-neutral-subtle text-fg-muted',
  trace: 'border-border bg-neutral-subtle text-fg-subtle',
  unknown: 'border-border bg-neutral-subtle text-fg-muted',
};

const normalizeLevel = (raw: string): LogLevel => {
  const value = raw.toUpperCase();
  if (value === 'FATAL' || value === 'CRITICAL') {
    return 'fatal';
  }
  if (value === 'ERROR' || value === 'ERR') {
    return 'error';
  }
  if (value === 'WARN' || value === 'WARNING') {
    return 'warn';
  }
  if (value === 'INFO' || value === 'NOTICE') {
    return 'info';
  }
  if (value === 'DEBUG') {
    return 'debug';
  }
  if (value === 'TRACE' || value === 'VERBOSE') {
    return 'trace';
  }
  return 'unknown';
};

const parseLog = (text: string): LogLine[] => {
  if (!text) {
    return [];
  }
  const rawLines = text.split(/\r?\n/);
  if (rawLines.length > 0 && rawLines[rawLines.length - 1] === '') {
    rawLines.pop();
  }
  return rawLines.map((line, index) => {
    const match = LEVEL_PATTERN.exec(line);
    return {
      number: index + 1,
      text: line,
      level: match?.[1] ? normalizeLevel(match[1]) : 'unknown',
    };
  });
};

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const VISIBLE_LIMIT = 1000;

export default function LogViewer() {
  const [text, setText] = useState('');
  const [levelFilter, setLevelFilter] = useState<'all' | LogLevel>('all');
  const [query, setQuery] = useState('');
  const [useRegex, setUseRegex] = useState(false);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const lines = useMemo(() => parseLog(text), [text]);

  const search = useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      return {
        regex: null as RegExp | null,
        highlight: null as RegExp | null,
        error: null as string | null,
      };
    }
    try {
      const source = useRegex ? query : escapeRegex(query);
      const flags = caseSensitive ? '' : 'i';
      return {
        regex: new RegExp(source, flags),
        highlight: new RegExp(source, `${flags}g`),
        error: null,
      };
    } catch (caught) {
      return {
        regex: null,
        highlight: null,
        error:
          caught instanceof Error
            ? caught.message
            : 'The regular expression is invalid.',
      };
    }
  }, [query, useRegex, caseSensitive]);

  const filtered = useMemo(() => {
    if (search.error) {
      return [];
    }
    return lines.filter((line) => {
      if (levelFilter !== 'all' && line.level !== levelFilter) {
        return false;
      }
      if (search.regex && !search.regex.test(line.text)) {
        return false;
      }
      return true;
    });
  }, [lines, levelFilter, search]);

  const counts = useMemo(() => {
    const result: Record<LogLevel, number> = {
      fatal: 0,
      error: 0,
      warn: 0,
      info: 0,
      debug: 0,
      trace: 0,
      unknown: 0,
    };
    for (const line of lines) {
      result[line.level] += 1;
    }
    return result;
  }, [lines]);

  const visible = filtered.slice(0, VISIBLE_LIMIT);
  const output = filtered.map((line) => line.text).join('\n');

  const renderHighlighted = (value: string): ReactNode => {
    if (!search.highlight) {
      return value;
    }
    const pattern = new RegExp(search.highlight.source, search.highlight.flags);
    const nodes: ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    let guard = 0;

    while ((match = pattern.exec(value)) !== null && guard < 500) {
      if (match.index > lastIndex) {
        nodes.push(value.slice(lastIndex, match.index));
      }
      nodes.push(
        <mark
          className="rounded-sm bg-attention-subtle px-0.5 text-attention"
          key={`${match.index}-${guard}`}
        >
          {match[0]}
        </mark>
      );
      lastIndex = match.index + match[0].length;
      if (match[0].length === 0) {
        pattern.lastIndex += 1;
      }
      guard += 1;
    }

    if (lastIndex < value.length) {
      nodes.push(value.slice(lastIndex));
    }
    return nodes;
  };

  return (
    <div className="space-y-4">
      <ToolLayout>
        <Panel
          description="Paste a log or drop a text file. Filter by level or search text; a regex mode is available."
          title="Log input"
        >
          <FileDropzone
            accept=".log,.txt,text/plain,text/*"
            hint="Plain text log files, up to about 5 MB"
            label="Drop a log file here, or click to browse"
            onFiles={(files) => {
              const file = files[0];
              if (!file) {
                return;
              }
              if (file.size > 5 * 1024 * 1024) {
                setFileError(
                  'That file is larger than 5 MB. Paste a smaller excerpt instead.'
                );
                return;
              }
              void file
                .text()
                .then((content) => {
                  setText(content);
                  setFileError(null);
                })
                .catch(() => {
                  setFileError(
                    'The file could not be read. Try pasting the text instead.'
                  );
                });
            }}
          />

          {fileError && (
            <Callout className="mt-3" variant="error">
              {fileError}
            </Callout>
          )}

          <Field
            className="mt-4"
            hint={`${lines.length} line${lines.length === 1 ? '' : 's'}`}
            htmlFor="log-text"
            label="Log text"
          >
            <Textarea
              className="min-h-[260px]"
              id="log-text"
              onChange={(event) => setText(event.target.value)}
              placeholder={
                '2026-01-01T10:00:00Z INFO  Server started on port 3000\n2026-01-01T10:00:01Z WARN  Cache is empty\n2026-01-01T10:00:02Z ERROR Failed to connect to database'
              }
              value={text}
            />
          </Field>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field htmlFor="log-level" label="Level filter">
              <Select
                id="log-level"
                onChange={(event) =>
                  setLevelFilter(event.target.value as 'all' | LogLevel)
                }
                value={levelFilter}
              >
                <option value="all">All levels</option>
                <option value="fatal">Fatal / critical</option>
                <option value="error">Error</option>
                <option value="warn">Warning</option>
                <option value="info">Info</option>
                <option value="debug">Debug</option>
                <option value="trace">Trace / verbose</option>
                <option value="unknown">No level detected</option>
              </Select>
            </Field>
            <Field
              error={search.error ?? undefined}
              htmlFor="log-search"
              label="Search text"
            >
              <Input
                id="log-search"
                onChange={(event) => setQuery(event.target.value)}
                placeholder={useRegex ? 'timeout|refused' : 'timeout'}
                value={query}
              />
            </Field>
          </div>

          <div className="mt-3 flex flex-wrap gap-4 text-sm">
            <label className="flex cursor-pointer items-center gap-2 text-fg">
              <input
                checked={useRegex}
                className="accent-[var(--accent)]"
                onChange={(event) => setUseRegex(event.target.checked)}
                type="checkbox"
              />
              Regex
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-fg">
              <input
                checked={caseSensitive}
                className="accent-[var(--accent)]"
                onChange={(event) => setCaseSensitive(event.target.checked)}
                type="checkbox"
              />
              Case sensitive
            </label>
          </div>

          <div className="mt-4 flex flex-wrap gap-1.5">
            {LEVEL_ORDER.filter((level) => counts[level] > 0).map((level) => (
              <span
                className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${LEVEL_STYLES[level]}`}
                key={level}
              >
                {level}: {counts[level]}
              </span>
            ))}
            {lines.length === 0 && (
              <Badge variant="warning">No log lines yet</Badge>
            )}
          </div>
        </Panel>

        <ResultPanel
          emptyText="Paste log text or load a file to inspect it."
          error={search.error}
          filename="filtered-log.txt"
          label="Matching lines"
          value={search.error ? '' : output}
        >
          {visible.length > 0 ? (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2 text-xs text-fg-muted">
                <Badge variant="accent">{filtered.length} matching</Badge>
                <span>
                  of {lines.length} total line{lines.length === 1 ? '' : 's'}
                </span>
                {filtered.length > VISIBLE_LIMIT && (
                  <Badge variant="warning">showing first {VISIBLE_LIMIT}</Badge>
                )}
              </div>
              <div className="max-h-[520px] overflow-auto rounded-md border border-border bg-canvas-inset font-mono text-[12px] leading-5">
                {visible.map((line) => (
                  <div
                    className="grid grid-cols-[3rem_4.5rem_1fr] gap-1 border-b border-border/40 px-2 py-1 last:border-b-0"
                    key={line.number}
                  >
                    <span className="select-none text-right text-fg-subtle">
                      {line.number}
                    </span>
                    <span>
                      <span
                        className={`inline-block rounded border px-1 text-[10px] uppercase ${LEVEL_STYLES[line.level]}`}
                      >
                        {line.level}
                      </span>
                    </span>
                    <span className="whitespace-pre-wrap break-words text-fg">
                      {renderHighlighted(line.text) || ' '}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="rounded-md border border-dashed border-border bg-canvas-inset/50 p-4 text-sm text-fg-muted">
              {lines.length === 0
                ? 'The log viewer is waiting for input.'
                : 'No lines match the current level and text filters.'}
            </p>
          )}
        </ResultPanel>
      </ToolLayout>
    </div>
  );
}
