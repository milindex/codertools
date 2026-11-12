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

const EXAMPLE = `import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { z } from 'zod';
import { formatDate, parseDate } from './date-utils';
import { Button } from '@/components/ui/Button';
import './styles.css';
import { useState } from 'react';
import fs from 'node:fs';

export default function Page() {
  const [open, setOpen] = useState(false);
  useEffect(() => undefined, []);
  return <Link href="/">{formatDate(parseDate('2026-01-01'))}</Link>;
}`;

type ParsedImport = {
  start: number;
  end: number;
  raw: string;
  module: string;
  typeOnly: boolean;
  sideEffect: boolean;
  clause: string;
  trailingComment: string;
  preserveRaw: boolean;
};

type ParsedResult = {
  statement?: ParsedImport;
  end: number;
  warnings: string[];
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

const parseImportAt = (source: string, start: number): ParsedResult => {
  const warnings: string[] = [];
  let cursor = start + 6;
  let braceDepth = 0;
  let moduleEnd = -1;
  let end = -1;

  if (source.slice(start).match(/^import\s+[\w$]+\s*=\s*require\s*\(/)) {
    let close = start;
    while (close < source.length && source[close] !== ';') {
      close += 1;
    }
    return {
      end: close < source.length ? close + 1 : source.length,
      warnings: [
        'TypeScript `import x = require(...)` statements are not sorted.',
      ],
    };
  }

  while (cursor < source.length) {
    const character = source[cursor];

    if (character === '"' || character === "'") {
      if (braceDepth === 0) {
        const next = skipQuoted(source, cursor);
        if (moduleEnd === -1) {
          moduleEnd = next;
          cursor = next;

          const afterModule = source
            .slice(cursor)
            .match(/^\s*(with|assert)\s*\{/);
          if (afterModule) {
            cursor += afterModule[0].length;
            braceDepth = 1;
            continue;
          }

          const semicolon = source.slice(cursor).match(/^\s*;/);
          if (semicolon) {
            cursor += semicolon[0].length;
          }
          end = cursor;
          break;
        }
      } else {
        cursor = skipQuoted(source, cursor);
        continue;
      }
    }

    if (character === '/' && source[cursor + 1] === '/') {
      cursor += 2;
      while (cursor < source.length && source[cursor] !== '\n') {
        cursor += 1;
      }
      continue;
    }

    if (character === '/' && source[cursor + 1] === '*') {
      cursor = skipBlockComment(source, cursor);
      continue;
    }

    if (character === ';' && braceDepth === 0) {
      cursor += 1;
      end = cursor;
      break;
    }

    if (character === '{') {
      braceDepth += 1;
    } else if (character === '}') {
      braceDepth = Math.max(0, braceDepth - 1);
    }

    cursor += 1;
  }

  if (end === -1) {
    return {
      end: Math.min(source.length, Math.max(start + 6, cursor)),
      warnings: ['An import statement could not be parsed and was left alone.'],
    };
  }

  let trailingComment = '';
  const trailingMatch = source.slice(end).match(/^[ \t]*(\/\/[^\n]*)/);
  if (trailingMatch?.[1]) {
    trailingComment = trailingMatch[1];
    end += trailingMatch[0].length;
  }

  const raw = source.slice(start, end);
  const sideEffectMatch = raw.match(/^import\s*(['"])([^'"]+)\1/);
  const fromMatch = raw.match(/\sfrom\s*(['"])([^'"]+)\1/);
  const typeOnly = /^import\s+type\b/.test(raw);
  const prefixLength = raw.match(/^import\s+(?:type\s*)?/)?.[0].length ?? 6;

  const moduleName = fromMatch?.[2] ?? sideEffectMatch?.[2] ?? '';
  const clause = fromMatch
    ? raw.slice(prefixLength, fromMatch.index).trim()
    : '';

  if (!moduleName) {
    return {
      end,
      warnings: ['An import statement could not be parsed and was left alone.'],
    };
  }

  if (/\b(?:with|assert)\s*\{/.test(raw)) {
    warnings.push(
      `Import attributes on "${moduleName}" were preserved without rewriting that statement.`
    );
  }

  return {
    end,
    warnings,
    statement: {
      start,
      end,
      raw,
      module: moduleName,
      typeOnly,
      sideEffect: !fromMatch,
      clause,
      trailingComment,
      preserveRaw: /\b(?:with|assert)\s*\{/.test(raw),
    },
  };
};

const findImports = (source: string) => {
  const statements: ParsedImport[] = [];
  const warnings: string[] = [];
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
      source.startsWith('import', index) &&
      !isIdentifierCharacter(source[index - 1]) &&
      !isIdentifierCharacter(source[index + 6]) &&
      source[index + 6] !== '(' &&
      source[index + 6] !== '.'
    ) {
      const lineStart = source.lastIndexOf('\n', index - 1) + 1;
      if (/^\s*$/.test(source.slice(lineStart, index))) {
        const parsed = parseImportAt(source, index);
        warnings.push(...parsed.warnings);
        if (parsed.statement) {
          statements.push(parsed.statement);
        }
        index = Math.max(index + 1, parsed.end);
        continue;
      }
    }

    index += 1;
  }

  return { statements, warnings };
};

const splitTopLevelCommas = (value: string) => {
  const parts: string[] = [];
  let current = '';
  let depth = 0;
  let quote: string | null = null;

  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];

    if (quote) {
      current += character;
      if (character === '\\') {
        const next = value[index + 1];
        if (next) {
          current += next;
          index += 1;
        }
      } else if (character === quote) {
        quote = null;
      }
      continue;
    }

    if (character === '"' || character === "'") {
      quote = character;
      current += character;
      continue;
    }

    if (character === '{' || character === '(') {
      depth += 1;
    } else if (character === '}' || character === ')') {
      depth = Math.max(0, depth - 1);
    }

    if (character === ',' && depth === 0) {
      parts.push(current);
      current = '';
    } else {
      current += character;
    }
  }

  parts.push(current);
  return parts.map((part) => part.trim()).filter(Boolean);
};

const sortSpecifiers = (content: string) => {
  const seen = new Set<string>();
  return splitTopLevelCommas(content)
    .filter((specifier) => {
      if (seen.has(specifier)) {
        return false;
      }
      seen.add(specifier);
      return true;
    })
    .sort((left, right) => {
      const leftKey = left.replace(/^type\s+/, '').toLowerCase();
      const rightKey = right.replace(/^type\s+/, '').toLowerCase();
      return leftKey < rightKey ? -1 : leftKey > rightKey ? 1 : 0;
    });
};

const normalizeClause = (clause: string, sortNamed: boolean) => {
  const braceStart = clause.indexOf('{');
  const braceEnd = clause.lastIndexOf('}');

  if (braceStart === -1 || braceEnd < braceStart) {
    return clause.replace(/\s+/g, ' ').trim();
  }

  const before = clause.slice(0, braceStart).replace(/,\s*$/, '').trim();

  const named = sortNamed
    ? sortSpecifiers(clause.slice(braceStart + 1, braceEnd))
    : splitTopLevelCommas(clause.slice(braceStart + 1, braceEnd));

  const block = named.length > 0 ? `{ ${named.join(', ')} }` : '';

  return [before, block].filter(Boolean).join(', ');
};

const isRelativeModule = (module: string) =>
  module.startsWith('.') || module.startsWith('@/') || module.startsWith('~/');

const resolveQuote = (source: string, preference: string) => {
  if (preference === 'single') {
    return "'";
  }
  if (preference === 'double') {
    return '"';
  }

  const single = source.match(/'/g)?.length ?? 0;
  const double = source.match(/"/g)?.length ?? 0;
  return single >= double ? "'" : '"';
};

const buildStatement = (
  statement: ParsedImport,
  options: {
    quote: "'" | '"';
    semicolons: boolean;
    sortNamed: boolean;
  }
) => {
  if (statement.preserveRaw) {
    return statement.raw;
  }

  const separator = options.semicolons ? ';' : '';
  const quote = options.quote;
  const clause = normalizeClause(statement.clause, options.sortNamed);
  const suffix = statement.trailingComment
    ? ` ${statement.trailingComment}`
    : '';

  if (statement.sideEffect) {
    return `import ${quote}${statement.module}${quote}${separator}${suffix}`;
  }

  const typePrefix = statement.typeOnly ? 'type ' : '';
  return `import ${typePrefix}${clause} from ${quote}${statement.module}${quote}${separator}${suffix}`;
};

type Grouping = 'package-first' | 'alphabetical';
type QuotePreference = 'auto' | 'single' | 'double';

export default function ImportSorterTool() {
  const [input, setInput] = useState(EXAMPLE);
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [duplicateCount, setDuplicateCount] = useState(0);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [grouping, setGrouping] = useState<Grouping>('package-first');
  const [typeFirst, setTypeFirst] = useState(true);
  const [quote, setQuote] = useState<QuotePreference>('auto');
  const [semicolons, setSemicolons] = useState(true);
  const [sortNamed, setSortNamed] = useState(true);

  const sortImports = () => {
    if (!input.trim()) {
      setOutput('');
      setError('Paste JavaScript or TypeScript code with import statements.');
      setDuplicateCount(0);
      setWarnings([]);
      return;
    }

    try {
      const found = findImports(input);
      if (found.statements.length === 0) {
        setOutput('');
        setError('No import statements were found in this code.');
        setDuplicateCount(0);
        setWarnings(found.warnings);
        return;
      }

      const warnings = [...found.warnings];
      const first = found.statements[0];
      if (!first) {
        return;
      }

      let previousEnd = first.end;
      for (const statement of found.statements.slice(1)) {
        const gap = input.slice(previousEnd, statement.start);
        if (gap.trim()) {
          warnings.push(
            'Imports were not contiguous. They were consolidated at the first import location.'
          );
          break;
        }
        previousEnd = statement.end;
      }

      const unique: ParsedImport[] = [];
      const seen = new Set<string>();
      let duplicates = 0;

      for (const statement of found.statements) {
        const key = `${statement.typeOnly ? 'type' : 'value'}|${statement.module}|${normalizeClause(statement.clause, sortNamed)}`;
        if (seen.has(key)) {
          duplicates += 1;
          continue;
        }
        seen.add(key);
        unique.push(statement);
      }

      const quoteCharacter = resolveQuote(input, quote) as "'" | '"';

      const grouped = unique.map((statement) => {
        const isRelative = isRelativeModule(statement.module);
        let group = 0;

        if (statement.sideEffect) {
          group = 0;
        } else if (typeFirst && statement.typeOnly) {
          group = 1;
        } else if (grouping === 'alphabetical') {
          group = 2;
        } else {
          group = isRelative ? 3 : 2;
        }

        return { statement, group };
      });

      grouped.sort((left, right) => {
        if (left.group !== right.group) {
          return left.group - right.group;
        }

        const moduleCompare = left.statement.module.localeCompare(
          right.statement.module
        );
        if (moduleCompare !== 0) {
          return moduleCompare;
        }

        if (left.statement.typeOnly !== right.statement.typeOnly) {
          return left.statement.typeOnly ? -1 : 1;
        }

        return normalizeClause(left.statement.clause, sortNamed) <
          normalizeClause(right.statement.clause, sortNamed)
          ? -1
          : 1;
      });

      const groups = new Map<number, string[]>();
      for (const entry of grouped) {
        const list = groups.get(entry.group) ?? [];
        list.push(
          buildStatement(entry.statement, {
            quote: quoteCharacter,
            semicolons,
            sortNamed,
          })
        );
        groups.set(entry.group, list);
      }

      const sortedBlock = [...groups.entries()]
        .sort(([left], [right]) => left - right)
        .map(([, lines]) => lines.join('\n'))
        .join('\n\n');

      const prefix = input.slice(0, first.start).replace(/\s+$/, '');

      let rest = '';
      let cursor = first.start;
      for (const statement of found.statements) {
        if (statement.start > cursor) {
          rest += input.slice(cursor, statement.start);
        }
        cursor = statement.end;
      }
      rest += input.slice(cursor);
      rest = rest.replace(/^\s+/, '').replace(/\s+$/, '');

      const sections = [prefix, sortedBlock, rest].filter(Boolean);
      setOutput(`${sections.join('\n\n')}\n`);
      setDuplicateCount(duplicates);
      setWarnings(warnings);
      setError(null);
    } catch {
      setOutput('');
      setError('Imports could not be sorted from this input.');
      setDuplicateCount(0);
      setWarnings([]);
    }
  };

  return (
    <ToolLayout>
      <Panel
        description="Collects top-level imports, removes exact duplicates, sorts specifiers, and orders modules into side-effect, type, package, and relative groups."
        title="Source code"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Grouping">
            <Select
              aria-label="Import grouping"
              onChange={(event) => setGrouping(event.target.value as Grouping)}
              value={grouping}
            >
              <option value="package-first">Packages, then relative</option>
              <option value="alphabetical">Alphabetical only</option>
            </Select>
          </Field>

          <Field label="Quotes">
            <Select
              aria-label="Quote style"
              onChange={(event) =>
                setQuote(event.target.value as QuotePreference)
              }
              value={quote}
            >
              <option value="auto">Keep dominant style</option>
              <option value="single">Single quotes</option>
              <option value="double">Double quotes</option>
            </Select>
          </Field>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-4">
          <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-fg-muted">
            <input
              checked={typeFirst}
              className="h-3.5 w-3.5 cursor-pointer"
              onChange={(event) => setTypeFirst(event.target.checked)}
              style={{ accentColor: 'var(--accent)' }}
              type="checkbox"
            />
            Type imports first
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-fg-muted">
            <input
              checked={semicolons}
              className="h-3.5 w-3.5 cursor-pointer"
              onChange={(event) => setSemicolons(event.target.checked)}
              style={{ accentColor: 'var(--accent)' }}
              type="checkbox"
            />
            Add semicolons
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-fg-muted">
            <input
              checked={sortNamed}
              className="h-3.5 w-3.5 cursor-pointer"
              onChange={(event) => setSortNamed(event.target.checked)}
              style={{ accentColor: 'var(--accent)' }}
              type="checkbox"
            />
            Sort named specifiers
          </label>
        </div>

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
          <Button onClick={sortImports} variant="primary">
            Sort imports
          </Button>
          <Button
            onClick={() => {
              setInput(EXAMPLE);
              setOutput('');
              setError(null);
              setDuplicateCount(0);
              setWarnings([]);
            }}
          >
            Load example
          </Button>
          <Button
            onClick={() => {
              setInput('');
              setOutput('');
              setError(null);
              setDuplicateCount(0);
              setWarnings([]);
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

        {duplicateCount > 0 && (
          <Callout className="mt-3" variant="success">
            Removed {pluralize(duplicateCount, 'duplicate import')}.
          </Callout>
        )}

        {warnings.length > 0 && (
          <Callout className="mt-3" title="Notes" variant="warning">
            <ul className="list-disc space-y-1 pl-4">
              {[...new Set(warnings)].map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </Callout>
        )}
      </Panel>

      <ResultPanel
        emptyText="Sorted imports will appear here."
        filename="imports-sorted.ts"
        label="Sorted code"
        value={output}
      />
    </ToolLayout>
  );
}
