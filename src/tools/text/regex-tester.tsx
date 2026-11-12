'use client';

import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';

import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { Textarea } from '@/components/ui/Textarea';

import { Checkbox } from './ui';

const FLAG_OPTIONS = [
  { value: 'g', label: 'global' },
  { value: 'i', label: 'ignore case' },
  { value: 'm', label: 'multiline' },
  { value: 's', label: 'dotAll' },
  { value: 'u', label: 'unicode' },
  { value: 'y', label: 'sticky' },
] as const;

type Flag = (typeof FLAG_OPTIONS)[number]['value'];
type FlagState = Record<Flag, boolean>;

type MatchInfo = {
  index: number;
  end: number;
  value: string;
  groups: Array<string | undefined>;
  namedGroups: Array<{ name: string; value: string | undefined }>;
};

type RegexResult = {
  error: string | null;
  matches: MatchInfo[];
  replaced: string;
};

const advanceAfterEmptyMatch = (regex: RegExp, text: string) => {
  if (regex.lastIndex >= text.length) {
    regex.lastIndex = text.length + 1;
    return;
  }

  const codePoint = text.codePointAt(regex.lastIndex);
  regex.lastIndex += codePoint !== undefined && codePoint > 0xffff ? 2 : 1;
};

const evaluate = (
  pattern: string,
  flags: string,
  input: string,
  replacement: string
): RegexResult => {
  if (!pattern) {
    return { error: null, matches: [], replaced: input };
  }

  let regex: RegExp;
  try {
    regex = new RegExp(pattern, flags);
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : 'Invalid regular expression.',
      matches: [],
      replaced: input,
    };
  }

  const matches: MatchInfo[] = [];

  try {
    if (regex.global) {
      let guard = 0;
      while (guard < 10000) {
        guard += 1;
        const match = regex.exec(input);
        if (!match) {
          break;
        }

        matches.push({
          index: match.index,
          end: match.index + match[0].length,
          value: match[0],
          groups: match.slice(1),
          namedGroups: match.groups
            ? Object.entries(match.groups).map(([name, value]) => ({
                name,
                value,
              }))
            : [],
        });

        if (match[0].length === 0) {
          advanceAfterEmptyMatch(regex, input);
        }
      }
    } else {
      const match = regex.exec(input);
      if (match) {
        matches.push({
          index: match.index,
          end: match.index + match[0].length,
          value: match[0],
          groups: match.slice(1),
          namedGroups: match.groups
            ? Object.entries(match.groups).map(([name, value]) => ({
                name,
                value,
              }))
            : [],
        });
      }
    }
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : 'The expression could not run.',
      matches: [],
      replaced: input,
    };
  }

  let replaced = input;
  try {
    replaced = input.replace(new RegExp(pattern, flags), replacement);
  } catch {
    replaced = input;
  }

  return { error: null, matches, replaced };
};

const renderHighlighted = (text: string, matches: MatchInfo[]): ReactNode[] => {
  const parts: ReactNode[] = [];
  let cursor = 0;

  matches.forEach((match, index) => {
    if (match.index > cursor) {
      parts.push(text.slice(cursor, match.index));
    }

    parts.push(
      <mark
        className="rounded bg-attention/30 px-0.5 text-fg"
        key={`match-${index}-${match.index}`}
      >
        {match.value === '' ? '\u200b' : match.value}
      </mark>
    );
    cursor = Math.max(cursor, match.end);
  });

  if (cursor < text.length) {
    parts.push(text.slice(cursor));
  }

  return parts;
};

export default function RegexTester() {
  const [pattern, setPattern] = useState('');
  const [input, setInput] = useState('');
  const [replacement, setReplacement] = useState('');
  const [flags, setFlags] = useState<FlagState>({
    g: true,
    i: false,
    m: false,
    s: false,
    u: false,
    y: false,
  });

  const flagString = FLAG_OPTIONS.filter((flag) => flags[flag.value])
    .map((flag) => flag.value)
    .join('');

  const result = useMemo(
    () => evaluate(pattern, flagString, input, replacement),
    [pattern, flagString, input, replacement]
  );

  const report = result.matches
    .map(
      (match, index) =>
        `${index + 1}. [${match.index}–${match.end}] ${JSON.stringify(match.value)}`
    )
    .join('\n');

  return (
    <div className="space-y-6">
      <Panel title="Regular expression">
        <div className="grid gap-3 md:grid-cols-2">
          <Field
            hint={flagString ? `/${flagString}` : 'no flags'}
            label="Pattern"
          >
            <Input
              aria-label="Regular expression pattern"
              className="font-mono"
              onChange={(event) => setPattern(event.target.value)}
              placeholder={'e.g. (\\w+)@(\\w+\\.\\w+)'}
              spellCheck={false}
              value={pattern}
            />
          </Field>

          <Field label="Flags">
            <div className="flex min-h-8 flex-wrap items-center gap-x-4 gap-y-1.5">
              {FLAG_OPTIONS.map((flag) => (
                <Checkbox
                  checked={flags[flag.value]}
                  key={flag.value}
                  label={
                    <span>
                      <code className="font-semibold text-fg">
                        {flag.value}
                      </code>{' '}
                      <span className="text-fg-muted">{flag.label}</span>
                    </span>
                  }
                  onChange={(checked) =>
                    setFlags((current) => ({
                      ...current,
                      [flag.value]: checked,
                    }))
                  }
                />
              ))}
            </div>
          </Field>
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <Field label="Test string">
            <Textarea
              className="min-h-[180px]"
              onChange={(event) => setInput(event.target.value)}
              placeholder="Paste the text to search…"
              value={input}
            />
          </Field>

          <Field
            hint="$1, $& and $<name> are supported"
            label="Replacement (optional)"
          >
            <Textarea
              className="min-h-[180px]"
              onChange={(event) => setReplacement(event.target.value)}
              placeholder="e.g. $1 [at] $2"
              value={replacement}
            />
          </Field>
        </div>
      </Panel>

      <ResultPanel
        error={result.error}
        filename="regex-matches.txt"
        label="Matches"
        value={replacement ? result.replaced : report}
      >
        <div className="space-y-3">
          {input && pattern ? (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full border border-accent/40 bg-accent-subtle/50 px-2 py-0.5 font-medium text-accent">
                {result.matches.length.toLocaleString()} match
                {result.matches.length === 1 ? '' : 'es'}
              </span>
              {!flags.g && !flags.y ? (
                <span className="text-fg-muted">
                  Enable the g flag to find every match.
                </span>
              ) : null}
            </div>
          ) : null}

          {!pattern ? (
            <div className="flex min-h-[230px] items-center justify-center rounded-md border border-dashed border-border bg-canvas-inset/50 p-4 text-center text-sm text-fg-muted">
              Enter a regular expression to begin.
            </div>
          ) : input ? (
            <>
              <pre className="max-h-[280px] min-h-[120px] overflow-auto whitespace-pre-wrap break-words rounded-md border border-border bg-canvas-inset p-3 font-mono text-[13px] leading-6 text-fg">
                {renderHighlighted(input, result.matches)}
              </pre>

              {result.matches.length === 0 ? (
                <p className="text-sm text-fg-muted">No matches found.</p>
              ) : (
                <div className="overflow-auto rounded-md border border-border">
                  <table className="w-full min-w-[640px] border-collapse text-left text-xs">
                    <thead className="bg-canvas-subtle text-[11px] uppercase tracking-wide text-fg-muted">
                      <tr>
                        <th className="px-2.5 py-2 font-semibold">#</th>
                        <th className="px-2.5 py-2 font-semibold">Index</th>
                        <th className="px-2.5 py-2 font-semibold">Match</th>
                        <th className="px-2.5 py-2 font-semibold">Groups</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.matches.map((match, index) => (
                        <tr
                          className="border-t border-border align-top"
                          key={`${match.index}-${index}`}
                        >
                          <td className="px-2.5 py-2 tabular-nums text-fg-muted">
                            {index + 1}
                          </td>
                          <td className="px-2.5 py-2 font-mono text-fg-muted">
                            {match.index}–{match.end}
                          </td>
                          <td className="break-all px-2.5 py-2 font-mono text-fg">
                            {match.value === ''
                              ? '(empty match)'
                              : JSON.stringify(match.value)}
                          </td>
                          <td className="px-2.5 py-2 font-mono text-fg-muted">
                            {match.groups.length === 0 &&
                            match.namedGroups.length === 0 ? (
                              <span className="text-fg-subtle">—</span>
                            ) : (
                              <div className="space-y-0.5">
                                {match.groups.map((group, groupIndex) => (
                                  <div key={`group-${groupIndex}`}>
                                    ${groupIndex + 1}:{' '}
                                    {group === undefined
                                      ? 'undefined'
                                      : JSON.stringify(group)}
                                  </div>
                                ))}
                                {match.namedGroups.map((group) => (
                                  <div key={`named-${group.name}`}>
                                    {group.name}:{' '}
                                    {group.value === undefined
                                      ? 'undefined'
                                      : JSON.stringify(group.value)}
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : (
            <div className="flex min-h-[180px] items-center justify-center rounded-md border border-dashed border-border bg-canvas-inset/50 p-4 text-center text-sm text-fg-muted">
              Add a test string to see matches and capture groups.
            </div>
          )}

          {replacement && pattern && !result.error ? (
            <div>
              <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-fg-muted">
                Replacement preview
              </h3>
              <pre className="max-h-[240px] overflow-auto whitespace-pre-wrap break-words rounded-md border border-border bg-canvas-inset p-3 font-mono text-[13px] leading-6 text-fg">
                {result.replaced}
              </pre>
            </div>
          ) : null}
        </div>
      </ResultPanel>
    </div>
  );
}
