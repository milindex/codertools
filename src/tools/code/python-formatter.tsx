'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { Field } from '@/components/ui/Field';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { ToolLayout } from '@/components/ui/ToolLayout';

import { pluralize } from './_shared';

const EXAMPLE = `import os
from dataclasses import dataclass


@dataclass
class User:
    name:str
    role:str="member"

    def label(self)->str:
        # Build a display label
        return f"{self.name} ({self.role})"


def load_users(path):
    """Load users from a JSON file.

    This docstring keeps its # characters.
    """
    if(os.path.exists(path)):
        with open(path) as handle:
            return handle.read()
    return []`;

const splitCodeAndComment = (line: string) => {
  let quote: string | null = null;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];

    if (quote) {
      if (character === '\\') {
        index += 1;
      } else if (character === quote) {
        quote = null;
      }
      continue;
    }

    if (character === '"' || character === "'") {
      quote = character;
      continue;
    }

    if (character === '#') {
      return { code: line.slice(0, index), comment: line.slice(index) };
    }
  }

  return { code: line, comment: '' };
};

const transformOutsideStrings = (
  code: string,
  transform: (segment: string) => string
) => {
  let output = '';
  let segment = '';
  let quote: string | null = null;

  for (let index = 0; index < code.length; index += 1) {
    const character = code[index];

    if (quote) {
      output += character;
      if (character === '\\') {
        const next = code[index + 1];
        if (next) {
          output += next;
          index += 1;
        }
      } else if (character === quote) {
        quote = null;
      }
      continue;
    }

    if (character === '"' || character === "'") {
      let transformed = transform(segment);
      if (/,\s*$/.test(transformed)) {
        transformed = transformed.replace(/,\s*$/, ', ');
      }
      output += transformed;
      segment = '';
      output += character;
      quote = character;
      continue;
    }

    segment += character;
  }

  output += transform(segment);
  return output;
};

const tidyCode = (code: string) =>
  transformOutsideStrings(code, (segment) => {
    let result = segment;

    result = result.replace(/\s+,/g, ',');
    result = result.replace(/,(?=\S)/g, ', ');
    result = result.replace(/\(\s+/g, '(');
    result = result.replace(/\s+\)/g, ')');
    result = result.replace(/\[\s+/g, '[');
    result = result.replace(/\s+\]/g, ']');
    result = result.replace(/\b(if|elif|while|for|with|assert)\s*\(/g, '$1 (');
    result = result.replace(/\b(def|class)\s+([A-Za-z_]\w*)\s*\(/g, '$1 $2(');
    result = result.replace(/\s*->\s*/g, ' -> ');
    result = result.replace(/\s+:$/, ':');

    return result;
  });

const tidyComment = (comment: string) => {
  if (!comment.startsWith('#')) {
    return '';
  }

  if (comment.startsWith('#!') || comment.startsWith('##')) {
    return comment.replace(/\s+$/, '');
  }

  const content = comment.slice(1).trim();
  return content ? `# ${content}` : '#';
};

const findTripleQuoteStart = (
  line: string
): { quote: string; index: number } | null => {
  let quote: string | null = null;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];

    if (quote) {
      if (character === '\\') {
        index += 1;
      } else if (character === quote) {
        quote = null;
      }
      continue;
    }

    if (character === '"' || character === "'") {
      const triple = character.repeat(3);
      if (line.startsWith(triple, index)) {
        return { quote: triple, index };
      }
      quote = character;
    }
  }

  return null;
};

const countIndent = (line: string) => line.match(/^[ \t]*/)?.[0].length ?? 0;

const countTrailingBlanks = (lines: string[]) => {
  let count = 0;
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    if ((lines[index] ?? '').trim() !== '') {
      break;
    }
    count += 1;
  }
  return count;
};

const collapseBlankLines = (lines: string[]) => {
  const output: string[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? '';

    if (line.trim() !== '') {
      output.push(line);
      continue;
    }

    let next = index;
    while (next < lines.length && (lines[next] ?? '').trim() === '') {
      next += 1;
    }

    const nextLine = lines[next];
    const maxBlankLines = nextLine && countIndent(nextLine) > 0 ? 1 : 2;
    const previous = output[output.length - 1];

    if (previous && previous.trim() !== '') {
      for (let blank = 0; blank < maxBlankLines; blank += 1) {
        output.push('');
      }
    }

    index = next - 1;
  }

  return output;
};

const ensureDefinitionSpacing = (lines: string[]) => {
  const output: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    const indent = countIndent(line);
    const isDefinition = /^(async\s+def|def|class)\s/.test(trimmed);
    const isDecorator = indent === 0 && /^@/.test(trimmed);

    if ((isDefinition || isDecorator) && output.length > 0) {
      const previous = output[output.length - 1] ?? '';
      const desired = indent === 0 ? 2 : 1;

      if (
        previous.trim() !== '' &&
        !previous.trim().startsWith('@') &&
        !previous.trim().startsWith('#') &&
        !previous.trim().endsWith(':')
      ) {
        const existing = countTrailingBlanks(output);
        for (let blank = existing; blank < desired; blank += 1) {
          output.push('');
        }
      }
    }

    output.push(line);
  }

  return output;
};

const formatPython = (
  source: string,
  options: { indentSize: number; convertTabs: boolean }
) => {
  const warnings: string[] = [];
  const normalized = source.replace(/\r\n?/g, '\n');
  const inputLines = normalized.split('\n');
  const formatted: string[] = [];
  let tripleQuote: string | null = null;
  let tabLines = 0;

  for (const rawLine of inputLines) {
    let line = rawLine;

    if (tripleQuote) {
      formatted.push(`\u0000${line.replace(/\s+$/, '')}`);
      if (line.includes(tripleQuote)) {
        tripleQuote = null;
      }
      continue;
    }

    if (options.convertTabs && /^\t+/.test(line)) {
      tabLines += 1;
      line = line.replace(/^\t+/, (tabs) =>
        ' '.repeat(tabs.length * options.indentSize)
      );
    }

    const { code, comment } = splitCodeAndComment(line);

    if (!tripleQuote) {
      const tripleStart = findTripleQuoteStart(code);
      if (
        tripleStart &&
        code.indexOf(tripleStart.quote, tripleStart.index + 3) === -1
      ) {
        tripleQuote = tripleStart.quote;
      }
    }

    if (tripleQuote) {
      formatted.push(`\u0000${line.replace(/\s+$/, '')}`);
      continue;
    }

    const indentation = code.match(/^[ \t]*/)?.[0] ?? '';
    const content = code.slice(indentation.length).replace(/\s+$/, '');
    const tidied = tidyCode(content);
    const commentText = tidyComment(comment.trimStart());
    const joined = `${indentation}${tidied}${
      commentText ? `${tidied ? '  ' : ''}${commentText}` : ''
    }`;

    formatted.push(joined.replace(/\s+$/, ''));
  }

  if (tabLines > 0) {
    warnings.push(
      `Converted leading tabs on ${pluralize(tabLines, 'line')} to spaces.`
    );
  }

  const collapsed = collapseBlankLines(formatted);
  const spaced = ensureDefinitionSpacing(collapsed);
  const cleaned = spaced.map((line) =>
    line.startsWith('\u0000') ? line.slice(1) : line
  );

  while (cleaned.length > 0 && (cleaned[0] ?? '').trim() === '') {
    cleaned.shift();
  }
  while (
    cleaned.length > 0 &&
    (cleaned[cleaned.length - 1] ?? '').trim() === ''
  ) {
    cleaned.pop();
  }

  return {
    code: `${cleaned.join('\n')}\n`,
    warnings,
    longLines: cleaned.filter((line) => line.length > 88).length,
  };
};

export default function PythonFormatterTool() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [indentSize, setIndentSize] = useState('4');
  const [convertTabs, setConvertTabs] = useState(true);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [longLines, setLongLines] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const format = () => {
    if (!input.trim()) {
      setOutput('');
      setWarnings([]);
      setLongLines(0);
      setError('Paste some Python code to format.');
      return;
    }

    try {
      const result = formatPython(input, {
        indentSize: Number(indentSize),
        convertTabs,
      });
      setOutput(result.code);
      setWarnings(result.warnings);
      setLongLines(result.longLines);
      setError(null);
    } catch {
      setOutput('');
      setError('The Python source could not be formatted.');
    }
  };

  return (
    <ToolLayout>
      <Panel
        description="A lightweight formatter that tidies indentation, comma spacing, block headers, comments and blank lines. It does not parse Python or wrap long expressions."
        title="Python input"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field hint="Used when converting tabs" label="Indent width">
            <Select
              aria-label="Indent width"
              onChange={(event) => setIndentSize(event.target.value)}
              value={indentSize}
            >
              <option value="2">2 spaces</option>
              <option value="4">4 spaces</option>
              <option value="8">8 spaces</option>
            </Select>
          </Field>

          <div className="flex items-end pb-1">
            <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-fg-muted">
              <input
                checked={convertTabs}
                className="h-3.5 w-3.5 cursor-pointer"
                onChange={(event) => setConvertTabs(event.target.checked)}
                style={{ accentColor: 'var(--accent)' }}
                type="checkbox"
              />
              Convert leading tabs to spaces
            </label>
          </div>
        </div>

        <div className="mt-3">
          <Field
            hint={`${input.length.toLocaleString()} characters`}
            label="Python source"
          >
            <Textarea
              aria-label="Python source"
              className="min-h-[340px]"
              onChange={(event) => {
                setInput(event.target.value);
                setError(null);
              }}
              placeholder={EXAMPLE}
              value={input}
            />
          </Field>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button onClick={format} variant="primary">
            Format Python
          </Button>
          <Button onClick={() => setInput(EXAMPLE)}>Load example</Button>
          <Button
            onClick={() => {
              setInput('');
              setOutput('');
              setWarnings([]);
              setLongLines(0);
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

        <Callout className="mt-3" variant="info">
          This is a basic whitespace formatter, not an AST-based formatter like
          Black. It preserves indentation levels, strings and triple-quoted
          blocks, so review the result before committing it.
        </Callout>

        {warnings.length > 0 && (
          <Callout className="mt-3" variant="warning">
            <ul className="list-disc space-y-1 pl-4">
              {warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </Callout>
        )}

        {longLines > 0 && (
          <Callout className="mt-3" variant="info">
            {pluralize(longLines, 'line')} exceed 88 characters. This formatter
            does not reflow long lines.
          </Callout>
        )}
      </Panel>

      <ResultPanel
        emptyText="Formatted Python will appear here."
        filename="formatted.py"
        label="Formatted Python"
        value={output}
      />
    </ToolLayout>
  );
}
