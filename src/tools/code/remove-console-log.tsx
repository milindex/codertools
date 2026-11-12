'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { Field } from '@/components/ui/Field';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Textarea } from '@/components/ui/Textarea';
import { ToolLayout } from '@/components/ui/ToolLayout';

import { lineNumberAt, pluralize } from './_shared';

const EXAMPLE = `function loadUser(id) {
  console.log("loading", id);

  fetch(\`/api/users/\${id}\`)
    .then((response) => response.json())
    .then((user) => {
      console.debug("loaded", user);
      console.table(user);
      return user;
    })
    .catch((error) => {
      console.error("request failed", error);
      console.warn("showing fallback");
    });
}

console.log("keep strings such as console.log('example') intact");`;

const CONSOLE_METHODS = [
  'assert',
  'clear',
  'count',
  'countReset',
  'debug',
  'dir',
  'dirxml',
  'error',
  'group',
  'groupCollapsed',
  'groupEnd',
  'info',
  'log',
  'profile',
  'profileEnd',
  'table',
  'time',
  'timeEnd',
  'timeLog',
  'trace',
  'warn',
];

type Mode = 'log' | 'all';

type Removal = {
  start: number;
  end: number;
  line: number;
  method: string;
};

const isIdentifierCharacter = (character: string | undefined) =>
  Boolean(character && /[\w$]/.test(character));

const skipQuoted = (source: string, start: number) => {
  const quote = source[start];
  let index = start + 1;

  while (index < source.length) {
    const character = source[index];
    if (character === '\\') {
      index += 2;
      continue;
    }
    index += 1;
    if (character === quote) {
      break;
    }
  }

  return index;
};

const skipBlockComment = (source: string, start: number) => {
  let index = start + 2;
  while (
    index < source.length &&
    !(source[index] === '*' && source[index + 1] === '/')
  ) {
    index += 1;
  }
  return Math.min(source.length, index + 2);
};

const canStartRegexAt = (source: string, index: number) => {
  let cursor = index - 1;
  while (cursor >= 0 && /\s/.test(source[cursor] ?? '')) {
    cursor -= 1;
  }
  const last = source[cursor];
  if (!last) {
    return true;
  }
  if ('([{=,:;!&|?+-*%^~<>'.includes(last)) {
    return true;
  }
  const word = source.slice(0, cursor + 1).match(/([A-Za-z_$][\w$]*)$/)?.[1];
  return Boolean(
    word &&
    [
      'return',
      'case',
      'throw',
      'typeof',
      'instanceof',
      'in',
      'of',
      'new',
      'delete',
      'void',
      'yield',
      'await',
      'else',
      'do',
    ].includes(word)
  );
};

const skipRegex = (source: string, start: number) => {
  let index = start + 1;
  let inClass = false;

  while (index < source.length) {
    const character = source[index];
    if (character === '\\') {
      index += 2;
      continue;
    }
    if (character === '[') {
      inClass = true;
    } else if (character === ']') {
      inClass = false;
    } else if (character === '/' && !inClass) {
      index += 1;
      while (index < source.length && /[a-z]/i.test(source[index] ?? '')) {
        index += 1;
      }
      return index;
    } else if (character === '\n') {
      return index;
    }
    index += 1;
  }

  return index;
};

const findMatchingParen = (source: string, openIndex: number) => {
  let depth = 0;
  let index = openIndex;

  while (index < source.length) {
    const character = source[index];

    if (character === '"' || character === "'" || character === '`') {
      index = skipQuoted(source, index);
      continue;
    }

    if (character === '/' && source[index + 1] === '/') {
      index += 2;
      while (index < source.length && source[index] !== '\n') {
        index += 1;
      }
      continue;
    }

    if (character === '/' && source[index + 1] === '*') {
      index = skipBlockComment(source, index);
      continue;
    }

    if (
      character === '/' &&
      canStartRegexAt(source, index) &&
      source[index + 1] !== '/' &&
      source[index + 1] !== '*'
    ) {
      index = skipRegex(source, index);
      continue;
    }

    if (character === '(') {
      depth += 1;
    } else if (character === ')') {
      depth -= 1;
      if (depth === 0) {
        return index;
      }
    }

    index += 1;
  }

  return -1;
};

const removeConsoleCalls = (source: string, methods: Set<string>) => {
  const removals: Removal[] = [];
  const suspicious: number[] = [];
  let index = 0;

  while (index < source.length) {
    const character = source[index];

    if (character === '"' || character === "'" || character === '`') {
      index = skipQuoted(source, index);
      continue;
    }

    if (character === '/' && source[index + 1] === '/') {
      index += 2;
      while (index < source.length && source[index] !== '\n') {
        index += 1;
      }
      continue;
    }

    if (character === '/' && source[index + 1] === '*') {
      index = skipBlockComment(source, index);
      continue;
    }

    if (
      character === '/' &&
      canStartRegexAt(source, index) &&
      source[index + 1] !== '/' &&
      source[index + 1] !== '*'
    ) {
      index = skipRegex(source, index);
      continue;
    }

    if (
      source.startsWith('console', index) &&
      !isIdentifierCharacter(source[index - 1]) &&
      source[index - 1] !== '.' &&
      !isIdentifierCharacter(source[index + 7])
    ) {
      const afterConsole = index + 7;
      const rest = source.slice(afterConsole);
      const match = rest.match(/^\s*\.\s*([A-Za-z_$][\w$]*)\s*\(/);

      if (match?.[1] && methods.has(match[1])) {
        const openIndex = afterConsole + match[0].length - 1;
        const closeIndex = findMatchingParen(source, openIndex);

        if (closeIndex !== -1) {
          const line = lineNumberAt(source, index);
          const lineStart = source.lastIndexOf('\n', index - 1) + 1;
          const onlyIndentBefore = /^\s*$/.test(source.slice(lineStart, index));

          let start = onlyIndentBefore ? lineStart : index;
          let end = closeIndex + 1;

          if (source[end] === ';') {
            end += 1;
          }

          while (source[end] === ' ' || source[end] === '\t') {
            end += 1;
          }

          const lineEnd = source.indexOf('\n', end);
          const restOfLine = source.slice(
            end,
            lineEnd === -1 ? source.length : lineEnd
          );

          if (onlyIndentBefore && /^\s*$/.test(restOfLine)) {
            start = lineStart;
            end = lineEnd === -1 ? source.length : lineEnd + 1;
          } else {
            const previous = source.slice(0, start).replace(/\s+$/, '');
            const previousCharacter = previous[previous.length - 1];
            if (previousCharacter && '=(,:?'.includes(previousCharacter)) {
              suspicious.push(line);
            }
          }

          removals.push({ start, end, line, method: match[1] });
          index = end;
          continue;
        }
      }
    }

    index += 1;
  }

  let output = source;
  for (let cursor = removals.length - 1; cursor >= 0; cursor -= 1) {
    const removal = removals[cursor];
    if (!removal) {
      continue;
    }
    output = output.slice(0, removal.start) + output.slice(removal.end);
  }

  return { output, removals, suspicious };
};

export default function RemoveConsoleLogTool() {
  const [mode, setMode] = useState<Mode>('log');
  const [input, setInput] = useState(EXAMPLE);
  const [output, setOutput] = useState('');
  const [removed, setRemoved] = useState<Removal[]>([]);
  const [suspicious, setSuspicious] = useState<number[]>([]);
  const [keepErrors, setKeepErrors] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const run = () => {
    if (!input.trim()) {
      setOutput('');
      setRemoved([]);
      setSuspicious([]);
      setError('Paste JavaScript or TypeScript code to clean up.');
      return;
    }

    try {
      const methods =
        mode === 'log'
          ? new Set(['log'])
          : new Set(
              CONSOLE_METHODS.filter(
                (method) =>
                  !(keepErrors && (method === 'error' || method === 'warn'))
              )
            );
      const result = removeConsoleCalls(input, methods);
      setOutput(result.output);
      setRemoved(result.removals);
      setSuspicious(result.suspicious);
      setError(null);
    } catch {
      setOutput('');
      setError('Console statements could not be removed from this input.');
    }
  };

  return (
    <ToolLayout>
      <Panel
        description="Calls inside strings, comments and template literals are ignored. Only console calls in code are removed."
        title="Source code"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SegmentedControl
            ariaLabel="Console methods to remove"
            onChange={(value) => {
              setMode(value as Mode);
              setOutput('');
              setRemoved([]);
              setSuspicious([]);
              setError(null);
            }}
            options={[
              { value: 'log', label: 'console.log only' },
              { value: 'all', label: 'All console methods' },
            ]}
            value={mode}
          />
          <span className="text-xs text-fg-muted">
            {input.length} characters
          </span>
        </div>

        {mode === 'all' && (
          <label className="mt-3 flex w-fit cursor-pointer items-center gap-2 text-xs font-medium text-fg-muted">
            <input
              checked={keepErrors}
              className="h-3.5 w-3.5 cursor-pointer"
              onChange={(event) => setKeepErrors(event.target.checked)}
              style={{ accentColor: 'var(--accent)' }}
              type="checkbox"
            />
            Keep <code>console.error</code> and <code>console.warn</code>
          </label>
        )}

        <div className="mt-3">
          <Field label="JavaScript / TypeScript">
            <Textarea
              aria-label="JavaScript or TypeScript source"
              className="min-h-[340px]"
              onChange={(event) => {
                setInput(event.target.value);
                setError(null);
              }}
              value={input}
            />
          </Field>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button onClick={run} variant="primary">
            Remove console statements
          </Button>
          <Button
            onClick={() => {
              setInput(EXAMPLE);
              setOutput('');
              setRemoved([]);
              setSuspicious([]);
              setError(null);
            }}
          >
            Load example
          </Button>
          <Button
            onClick={() => {
              setInput('');
              setOutput('');
              setRemoved([]);
              setSuspicious([]);
              setError(null);
            }}
            variant="ghost"
          >
            Clear
          </Button>
        </div>

        {error && (
          <Callout className="mt-3" variant="error">
            {error}
          </Callout>
        )}

        {removed.length > 0 && (
          <Callout className="mt-3" variant="success">
            Removed {pluralize(removed.length, 'console call')} on{' '}
            {pluralize(new Set(removed.map((item) => item.line)).size, 'line')}.
          </Callout>
        )}

        {suspicious.length > 0 && (
          <Callout className="mt-3" title="Review the output" variant="warning">
            Some calls were used inside larger expressions (for example after
            <code> =</code> or <code>(</code>). They were removed, but the
            surrounding expression may need cleanup on line(s){' '}
            {suspicious.join(', ')}.
          </Callout>
        )}
      </Panel>

      <ResultPanel
        emptyText="Cleaned JavaScript will appear here."
        filename="console-removed.js"
        label="Cleaned code"
        value={output}
      />
    </ToolLayout>
  );
}
