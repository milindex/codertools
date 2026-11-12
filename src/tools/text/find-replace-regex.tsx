'use client';

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
] as const;

type Flag = (typeof FLAG_OPTIONS)[number]['value'];
type FlagState = Record<Flag, boolean>;

type ReplaceResult = {
  error: string | null;
  output: string;
  count: number;
};

const advanceAfterEmptyMatch = (regex: RegExp, text: string) => {
  if (regex.lastIndex >= text.length) {
    regex.lastIndex = text.length + 1;
    return;
  }

  const codePoint = text.codePointAt(regex.lastIndex);
  regex.lastIndex += codePoint !== undefined && codePoint > 0xffff ? 2 : 1;
};

const replaceWithRegex = (
  pattern: string,
  flags: string,
  input: string,
  replacement: string
): ReplaceResult => {
  if (!pattern) {
    return { error: null, output: input, count: 0 };
  }

  let regex: RegExp;
  try {
    regex = new RegExp(pattern, flags);
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : 'Invalid regular expression.',
      output: input,
      count: 0,
    };
  }

  let count = 0;
  try {
    if (regex.global || regex.sticky) {
      let guard = 0;
      while (guard < 10000) {
        guard += 1;
        const match = regex.exec(input);
        if (!match) {
          break;
        }
        count += 1;
        if (match[0].length === 0) {
          advanceAfterEmptyMatch(regex, input);
        }
      }
    } else if (regex.test(input)) {
      count = 1;
    }
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : 'The expression could not run.',
      output: input,
      count: 0,
    };
  }

  let output = input;
  try {
    output = input.replace(new RegExp(pattern, flags), replacement);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Replacement failed.',
      output: input,
      count,
    };
  }

  return { error: null, output, count };
};

export default function FindReplaceRegex() {
  const [pattern, setPattern] = useState('');
  const [replacement, setReplacement] = useState('');
  const [input, setInput] = useState('');
  const [flags, setFlags] = useState<FlagState>({
    g: true,
    i: false,
    m: false,
    s: false,
    u: false,
  });

  const flagString = FLAG_OPTIONS.filter((flag) => flags[flag.value])
    .map((flag) => flag.value)
    .join('');

  const result = useMemo(
    () => replaceWithRegex(pattern, flagString, input, replacement),
    [pattern, flagString, input, replacement]
  );

  return (
    <div className="space-y-6">
      <Panel title="Find and replace">
        <div className="grid gap-3 md:grid-cols-2">
          <Field
            hint={flagString ? `/${flagString}` : 'no flags'}
            label="Pattern"
          >
            <Input
              aria-label="Regular expression pattern"
              className="font-mono"
              onChange={(event) => setPattern(event.target.value)}
              placeholder={'e.g. \\b(\\w+)@(\\w+\\.\\w+)\\b'}
              spellCheck={false}
              value={pattern}
            />
          </Field>

          <Field hint="$1, $& and $<name> are supported" label="Replacement">
            <Input
              aria-label="Replacement text"
              className="font-mono"
              onChange={(event) => setReplacement(event.target.value)}
              placeholder="e.g. $1 [at] $2"
              spellCheck={false}
              value={replacement}
            />
          </Field>
        </div>

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
          {FLAG_OPTIONS.map((flag) => (
            <Checkbox
              checked={flags[flag.value]}
              key={flag.value}
              label={
                <span>
                  <code className="font-semibold text-fg">{flag.value}</code>{' '}
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

        <Field
          className="mt-3"
          hint={`${input.length.toLocaleString()} characters`}
          label="Text"
        >
          <Textarea
            className="min-h-[240px]"
            onChange={(event) => setInput(event.target.value)}
            placeholder="Paste the text to edit…"
            value={input}
          />
        </Field>
      </Panel>

      <ResultPanel
        error={result.error}
        filename="replaced.txt"
        label="Result"
        value={result.output}
      >
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full border border-success/40 bg-success-subtle px-2 py-0.5 font-medium text-success">
              {result.count.toLocaleString()} replacement
              {result.count === 1 ? '' : 's'}
            </span>
            {!flags.g ? (
              <span className="text-fg-muted">
                Only the first match is replaced without the g flag.
              </span>
            ) : null}
          </div>

          {input ? (
            <pre className="max-h-[480px] min-h-[230px] overflow-auto whitespace-pre-wrap break-words rounded-md border border-border bg-canvas-inset p-3 font-mono text-[13px] leading-6 text-fg">
              {result.output}
            </pre>
          ) : (
            <div className="flex min-h-[230px] items-center justify-center rounded-md border border-dashed border-border bg-canvas-inset/50 p-4 text-center text-sm text-fg-muted">
              Enter text to apply the replacement.
            </div>
          )}
        </div>
      </ResultPanel>
    </div>
  );
}
