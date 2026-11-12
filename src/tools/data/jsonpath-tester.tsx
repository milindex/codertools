'use client';

import { JSONPath } from 'jsonpath-plus';
import { FlaskConical, Search } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { Textarea } from '@/components/ui/Textarea';
import { ToolLayout } from '@/components/ui/ToolLayout';

import { errorMessage, parseJsonText, prettyJson } from './_shared';

const sampleJson = `{
  "store": {
    "book": [
      {
        "category": "reference",
        "author": "Nigel Rees",
        "title": "Sayings of the Century",
        "price": 8.95
      },
      {
        "category": "fiction",
        "author": "Evelyn Waugh",
        "title": "Sword of Honour",
        "price": 12.99
      },
      {
        "category": "fiction",
        "author": "Herman Melville",
        "title": "Moby Dick",
        "isbn": "0-553-21311-3",
        "price": 8.99
      },
      {
        "category": "fiction",
        "author": "J. R. R. Tolkien",
        "title": "The Lord of the Rings",
        "isbn": "0-395-19395-8",
        "price": 22.99
      }
    ],
    "bicycle": {
      "color": "red",
      "price": 399
    }
  }
}`;

const expressions = [
  { label: 'All authors', value: '$.store.book[*].author' },
  { label: 'Books under $10', value: '$.store.book[?(@.price < 10)]' },
  { label: 'All prices', value: '$..price' },
  { label: 'First book title', value: '$.store.book[0].title' },
];

export default function JsonPathTesterTool() {
  const [input, setInput] = useState(sampleJson);
  const [expression, setExpression] = useState('$.store.book[*].author');
  const [includePaths, setIncludePaths] = useState(true);

  const result = useMemo(() => {
    if (!input.trim()) {
      return {
        output: '',
        error: null as string | null,
        count: 0,
        paths: [] as string[],
      };
    }
    const parsed = parseJsonText(input);
    if (!parsed.ok) {
      return { output: '', error: parsed.error, count: 0, paths: [] };
    }
    if (!expression.trim()) {
      return {
        output: '',
        error:
          'Enter a JSONPath expression, for example $.store.book[*].author.',
        count: 0,
        paths: [],
      };
    }
    try {
      const matches = JSONPath({
        path: expression,
        json: parsed.value,
        resultType: includePaths ? 'all' : 'value',
        wrap: true,
      }) as unknown;

      if (!Array.isArray(matches)) {
        return {
          output: prettyJson({ count: 1, results: matches }),
          error: null,
          count: 1,
          paths: [],
        };
      }

      if (includePaths) {
        const rows = matches.map((match) => {
          const item = match as { path?: string; value?: unknown };
          return { path: item.path ?? '', value: item.value };
        });
        return {
          output: prettyJson({ count: rows.length, results: rows }),
          error: null,
          count: rows.length,
          paths: rows.map((row) => row.path),
        };
      }

      return {
        output: prettyJson({ count: matches.length, results: matches }),
        error: null,
        count: matches.length,
        paths: [],
      };
    } catch (error) {
      return {
        output: '',
        error: errorMessage(error),
        count: 0,
        paths: [],
      };
    }
  }, [expression, includePaths, input]);

  return (
    <div className="space-y-4">
      <ToolLayout>
        <Panel
          actions={
            <div className="flex items-center gap-2">
              <Search aria-hidden className="h-3.5 w-3.5 text-fg-muted" />
              <Badge variant="accent">
                {result.count} match{result.count === 1 ? '' : 'es'}
              </Badge>
            </div>
          }
          title="Query"
        >
          <Field
            hint="JSONPath"
            htmlFor="jsonpath-expression"
            label="Expression"
          >
            <Input
              id="jsonpath-expression"
              onChange={(event) => setExpression(event.target.value)}
              placeholder="$.store.book[*].author"
              spellCheck={false}
              value={expression}
            />
          </Field>

          <div className="mt-2 flex flex-wrap gap-1.5">
            {expressions.map((option) => (
              <button
                className="cursor-pointer rounded-full border border-border bg-canvas-subtle px-2 py-0.5 text-[11px] text-fg-muted transition-colors hover:border-accent/40 hover:text-fg"
                key={option.value}
                onClick={() => setExpression(option.value)}
                type="button"
              >
                {option.label}
              </button>
            ))}
          </div>

          <Field
            className="mt-4"
            hint={`${input.length.toLocaleString()} characters`}
            htmlFor="jsonpath-input"
            label="JSON input"
          >
            <Textarea
              className="min-h-[280px]"
              id="jsonpath-input"
              onChange={(event) => setInput(event.target.value)}
              placeholder="Paste JSON here…"
              spellCheck={false}
              value={input}
            />
          </Field>

          <div className="mt-3 flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-xs text-fg-muted">
              <input
                checked={includePaths}
                className="h-3.5 w-3.5 accent-[var(--accent)]"
                onChange={(event) => setIncludePaths(event.target.checked)}
                type="checkbox"
              />
              Include matched paths
            </label>
            <Button
              onClick={() => {
                setInput(sampleJson);
                setExpression('$.store.book[*].author');
              }}
              size="sm"
              variant="ghost"
            >
              <FlaskConical aria-hidden className="h-3.5 w-3.5" />
              Load example
            </Button>
          </div>

          {result.paths.length > 0 && (
            <div className="mt-3 space-y-1">
              <p className="text-xs font-semibold text-fg">Matched paths</p>
              <div className="max-h-40 overflow-auto rounded-md border border-border bg-canvas-inset p-2">
                {result.paths.map((path, index) => (
                  <code
                    className="block break-all text-[11px] leading-5 text-fg-muted"
                    key={`${path}-${index}`}
                  >
                    {path}
                  </code>
                ))}
              </div>
            </div>
          )}

          {result.error && (
            <Callout className="mt-3" variant="error">
              {result.error}
            </Callout>
          )}

          <p className="mt-3 text-xs leading-5 text-fg-muted">
            Supports filters, recursive descent, slices, unions and script
            expressions. Results show both the matched value and its path.
          </p>
        </Panel>

        <ResultPanel
          emptyText="Paste JSON and enter a JSONPath expression to see matches."
          error={result.error}
          filename="jsonpath-results.json"
          label="Matches"
          mime="application/json"
          value={result.output}
        />
      </ToolLayout>
    </div>
  );
}
