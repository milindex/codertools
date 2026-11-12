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

import { pluralize } from './_shared';

type Mode = 'javascript' | 'css' | 'html' | 'python';

const EXAMPLES: Record<Mode, string> = {
  javascript: `// Utility helpers
const message = "Keep // inside strings";
const url = "https://example.com"; /* inline block comment */
const pattern = /\\/\\* not a comment \\*/;

/**
 * Adds two numbers.
 */
export function add(a, b) {
  console.log(message); // keep this string intact
  return a + b;
}`,
  css: `/*! License: keep this banner */
:root {
  --brand: #2f81f7; /* accent color */
  --url: url("https://example.com/a/*.png");
}

/* Base styles */
body {
  color: #1f2328;
}`,
  html: `<!doctype html>
<html>
  <head>
    <!-- Page metadata -->
    <title>Demo</title>
    <style>
      /* CSS comments inside style are preserved */
      body { color: red; }
    </style>
  </head>
  <body>
    <!-- Main content -->
    <p>Hello <!-- inline note --> world</p>
    <script>
      // JavaScript comments inside script are preserved
      console.log("hi");
    </script>
  </body>
</html>`,
  python: `#!/usr/bin/env python3
"""Module docstring with a # inside it."""

# Configuration
DEBUG = True


def greet(name):
    message = "Hello # not a comment"
    # Say hello
    return f"{message}, {name}"
`,
};

const isLicenseComment = (text: string) =>
  /^!|@license|@preserve|@copyright/i.test(text.trim());

const copyQuoted = (
  source: string,
  start: number,
  quote: string
): { value: string; next: number } => {
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

  return { value: source.slice(start, index), next: index };
};

const canStartRegex = (output: string) => {
  const trimmed = output.replace(/\s+$/, '');
  const last = trimmed[trimmed.length - 1];

  if (!last) {
    return true;
  }
  if ('([{=,:;!&|?+-*%^~<>'.includes(last)) {
    return true;
  }

  const word = trimmed.match(/([A-Za-z_$][\w$]*)$/)?.[1];
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

const stripJsComments = (source: string, keepLicense: boolean) => {
  let output = '';
  let removed = 0;
  let index = 0;

  while (index < source.length) {
    const character = source[index];
    const next = source[index + 1];

    if (character === '/' && next === '/') {
      const start = index;
      index += 2;
      while (index < source.length && source[index] !== '\n') {
        index += 1;
      }
      const text = source.slice(start + 2, index);
      if (keepLicense && isLicenseComment(text)) {
        output += source.slice(start, index);
      } else {
        removed += 1;
      }
      continue;
    }

    if (character === '/' && next === '*') {
      const start = index;
      index += 2;
      while (
        index < source.length &&
        !(source[index] === '*' && source[index + 1] === '/')
      ) {
        index += 1;
      }
      index = Math.min(source.length, index + 2);
      const text = source.slice(start + 2, Math.max(start + 2, index - 2));

      if (keepLicense && isLicenseComment(text)) {
        output += source.slice(start, index);
      } else {
        removed += 1;
        const newlines = text.match(/\n/g)?.length ?? 0;
        output += newlines > 0 ? '\n'.repeat(newlines) : ' ';
      }
      continue;
    }

    if (character === '"' || character === "'") {
      const copied = copyQuoted(source, index, character);
      output += copied.value;
      index = copied.next;
      continue;
    }

    if (character === '`') {
      const copied = copyQuoted(source, index, '`');
      output += copied.value;
      index = copied.next;
      continue;
    }

    if (
      character === '/' &&
      index + 1 < source.length &&
      next !== '/' &&
      next !== '*' &&
      canStartRegex(output)
    ) {
      const start = index;
      index += 1;
      let inClass = false;
      let closed = false;

      while (index < source.length) {
        const current = source[index];
        if (current === '\\') {
          index += 2;
          continue;
        }
        if (current === '[') {
          inClass = true;
        } else if (current === ']') {
          inClass = false;
        } else if (current === '/' && !inClass) {
          index += 1;
          closed = true;
          break;
        } else if (current === '\n') {
          break;
        }
        index += 1;
      }

      if (closed) {
        while (index < source.length && /[a-z]/i.test(source[index] ?? '')) {
          index += 1;
        }
      }

      output += source.slice(start, index);
      continue;
    }

    output += character;
    index += 1;
  }

  return { output, removed };
};

const stripCssComments = (
  source: string,
  keepLicense: boolean,
  lineComments: boolean
) => {
  let output = '';
  let removed = 0;
  let index = 0;

  while (index < source.length) {
    const character = source[index];

    if (character === '"' || character === "'") {
      const copied = copyQuoted(source, index, character);
      output += copied.value;
      index = copied.next;
      continue;
    }

    if (character === '/' && source[index + 1] === '*') {
      const start = index;
      index += 2;
      while (
        index < source.length &&
        !(source[index] === '*' && source[index + 1] === '/')
      ) {
        index += 1;
      }
      index = Math.min(source.length, index + 2);
      const text = source.slice(start + 2, Math.max(start + 2, index - 2));

      if (keepLicense && isLicenseComment(text)) {
        output += source.slice(start, index);
      } else {
        removed += 1;
        const newlines = text.match(/\n/g)?.length ?? 0;
        output += newlines > 0 ? '\n'.repeat(newlines) : ' ';
      }
      continue;
    }

    if (lineComments && character === '/' && source[index + 1] === '/') {
      const start = index;
      index += 2;
      while (index < source.length && source[index] !== '\n') {
        index += 1;
      }
      const text = source.slice(start + 2, index);
      if (keepLicense && isLicenseComment(text)) {
        output += source.slice(start, index);
      } else {
        removed += 1;
      }
      continue;
    }

    output += character;
    index += 1;
  }

  return { output, removed };
};

const stripHtmlComments = (source: string, keepLicense: boolean) => {
  let output = '';
  let removed = 0;
  let index = 0;
  const lowerSource = source.toLowerCase();

  while (index < source.length) {
    if (source.startsWith('<!--', index)) {
      const end = source.indexOf('-->', index + 4);
      if (end === -1) {
        output += source.slice(index);
        break;
      }
      const comment = source.slice(index + 4, end);
      const conditional = /^\s*\[if\b|\[endif\]\s*$/i.test(comment);

      if ((keepLicense && isLicenseComment(comment)) || conditional) {
        output += source.slice(index, end + 3);
      } else {
        removed += 1;
      }

      index = end + 3;
      continue;
    }

    if (source[index] === '<') {
      const tagMatch = source
        .slice(index)
        .match(/^<(script|style|pre|textarea)\b/i);

      if (tagMatch?.[1]) {
        const tag = tagMatch[1].toLowerCase();
        const closeIndex = lowerSource.indexOf(`</${tag}`, index);
        if (closeIndex !== -1) {
          const closeEnd = source.indexOf('>', closeIndex);
          const end = closeEnd === -1 ? source.length : closeEnd + 1;
          output += source.slice(index, end);
          index = end;
          continue;
        }
      }
    }

    output += source[index];
    index += 1;
  }

  return { output, removed };
};

const stripPythonComments = (source: string, keepLicense: boolean) => {
  let output = '';
  let removed = 0;
  let index = 0;
  let quote: string | null = null;

  while (index < source.length) {
    const character = source[index];

    if (!quote) {
      if (character === '#' && source.startsWith('#!', 0) && index === 0) {
        while (index < source.length && source[index] !== '\n') {
          output += source[index];
          index += 1;
        }
        continue;
      }

      if (character === '#') {
        const start = index;
        index += 1;
        while (index < source.length && source[index] !== '\n') {
          index += 1;
        }
        const text = source.slice(start + 1, index);
        if (keepLicense && isLicenseComment(text)) {
          output += source.slice(start, index);
        } else {
          removed += 1;
        }
        continue;
      }

      if (character === '"' || character === "'") {
        const triple = character.repeat(3);
        quote = source.startsWith(triple, index) ? triple : character;
        output += quote;
        index += quote.length;
        continue;
      }

      output += character;
      index += 1;
      continue;
    }

    if (character === '\\') {
      output += character;
      const next = source[index + 1];
      if (next !== undefined) {
        output += next;
      }
      index += 2;
      continue;
    }

    if (source.startsWith(quote, index)) {
      output += quote;
      index += quote.length;
      quote = null;
      continue;
    }

    output += character;
    index += 1;
  }

  return { output, removed };
};

const stripComments = (
  source: string,
  mode: Mode,
  keepLicense: boolean,
  cssLineComments: boolean
) => {
  switch (mode) {
    case 'javascript':
      return stripJsComments(source, keepLicense);
    case 'css':
      return stripCssComments(source, keepLicense, cssLineComments);
    case 'html':
      return stripHtmlComments(source, keepLicense);
    case 'python':
      return stripPythonComments(source, keepLicense);
  }
};

export default function StripCommentsTool() {
  const [mode, setMode] = useState<Mode>('javascript');
  const [input, setInput] = useState(EXAMPLES.javascript);
  const [output, setOutput] = useState('');
  const [removed, setRemoved] = useState(0);
  const [keepLicense, setKeepLicense] = useState(true);
  const [cssLineComments, setCssLineComments] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = () => {
    if (!input.trim()) {
      setOutput('');
      setRemoved(0);
      setError('Paste some source code to strip comments from.');
      return;
    }

    try {
      const result = stripComments(input, mode, keepLicense, cssLineComments);
      setOutput(result.output);
      setRemoved(result.removed);
      setError(null);
    } catch {
      setOutput('');
      setError('Comments could not be stripped from this input.');
    }
  };

  const changeMode = (nextMode: string) => {
    const resolved = nextMode as Mode;
    setMode(resolved);
    setInput(EXAMPLES[resolved]);
    setOutput('');
    setRemoved(0);
    setError(null);
  };

  return (
    <ToolLayout>
      <Panel
        description="String literals, template literals, regex literals and raw <script>/<style> blocks are left untouched."
        title="Source code"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SegmentedControl
            ariaLabel="Source language"
            onChange={changeMode}
            options={[
              { value: 'javascript', label: 'JavaScript' },
              { value: 'css', label: 'CSS' },
              { value: 'html', label: 'HTML' },
              { value: 'python', label: 'Python' },
            ]}
            value={mode}
          />
          <span className="text-xs text-fg-muted">
            {input.length} characters
          </span>
        </div>

        <div className="mt-3">
          <Field
            label={`${mode === 'javascript' ? 'JavaScript' : mode === 'css' ? 'CSS' : mode === 'html' ? 'HTML' : 'Python'} source`}
          >
            <Textarea
              aria-label="Source code"
              className="min-h-[340px]"
              onChange={(event) => {
                setInput(event.target.value);
                setError(null);
              }}
              value={input}
            />
          </Field>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-4">
          <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-fg-muted">
            <input
              checked={keepLicense}
              className="h-3.5 w-3.5 cursor-pointer"
              onChange={(event) => setKeepLicense(event.target.checked)}
              style={{ accentColor: 'var(--accent)' }}
              type="checkbox"
            />
            Keep license / banner comments
          </label>

          {mode === 'css' && (
            <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-fg-muted">
              <input
                checked={cssLineComments}
                className="h-3.5 w-3.5 cursor-pointer"
                onChange={(event) => setCssLineComments(event.target.checked)}
                style={{ accentColor: 'var(--accent)' }}
                type="checkbox"
              />
              {'Also strip '}
              <code>{'//'}</code>
              {' comments (SCSS)'}
            </label>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button onClick={run} variant="primary">
            Strip comments
          </Button>
          <Button
            onClick={() => {
              setInput(EXAMPLES[mode]);
              setOutput('');
              setRemoved(0);
              setError(null);
            }}
          >
            Load example
          </Button>
          <Button
            onClick={() => {
              setInput('');
              setOutput('');
              setRemoved(0);
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

        {removed > 0 && (
          <Callout className="mt-3" variant="success">
            Removed {pluralize(removed, 'comment')}.
          </Callout>
        )}
      </Panel>

      <ResultPanel
        emptyText="Code without comments will appear here."
        filename={`comments-removed.${mode === 'javascript' ? 'js' : mode === 'python' ? 'py' : mode}`}
        label="Clean code"
        value={output}
      />
    </ToolLayout>
  );
}
