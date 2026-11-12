'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { Field } from '@/components/ui/Field';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import { Textarea } from '@/components/ui/Textarea';
import { ToolLayout } from '@/components/ui/ToolLayout';

import { errorMessage } from './_shared';

const DIALECTS = [
  { value: 'sql', label: 'Standard SQL' },
  { value: 'mysql', label: 'MySQL' },
  { value: 'postgresql', label: 'PostgreSQL' },
  { value: 'sqlite', label: 'SQLite' },
  { value: 'tsql', label: 'Transact-SQL (SQL Server)' },
] as const;

const KEYWORD_CASES = [
  { value: 'upper', label: 'UPPERCASE' },
  { value: 'lower', label: 'lowercase' },
  { value: 'preserve', label: 'Preserve original' },
] as const;

const INDENTS = [
  { value: '2', label: '2 spaces' },
  { value: '4', label: '4 spaces' },
  { value: '8', label: '8 spaces' },
] as const;

type Dialect = (typeof DIALECTS)[number]['value'];
type KeywordCase = (typeof KEYWORD_CASES)[number]['value'];

const EXAMPLE = `select u.id, u.name, count(o.id) as orders from users u left join orders o on o.user_id = u.id where u.active = 1 group by u.id, u.name order by orders desc limit 25;`;

export default function SqlFormatterTool() {
  const [input, setInput] = useState('');
  const [dialect, setDialect] = useState<Dialect>('sql');
  const [keywordCase, setKeywordCase] = useState<KeywordCase>('upper');
  const [indent, setIndent] = useState('2');
  const [useTabs, setUseTabs] = useState(false);
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const formatSql = async () => {
    if (!input.trim()) {
      setOutput('');
      setError('Paste a SQL query to format.');
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const sqlModule = await import('sql-formatter');
      const format =
        sqlModule.format ??
        (
          sqlModule as unknown as {
            default?: { format?: typeof sqlModule.format };
          }
        ).default?.format;

      if (typeof format !== 'function') {
        throw new Error('The SQL formatter could not be loaded.');
      }

      const formatted = format(input, {
        language: dialect,
        keywordCase,
        tabWidth: Number(indent),
        useTabs,
        linesBetweenQueries: 2,
      });
      setOutput(formatted);
    } catch (formatError) {
      setOutput('');
      setError(errorMessage(formatError));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ToolLayout>
      <Panel
        description="Formatting happens entirely in your browser. Pick the closest dialect for the best keyword and operator handling."
        title="SQL input"
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Dialect">
            <Select
              aria-label="SQL dialect"
              onChange={(event) => setDialect(event.target.value as Dialect)}
              value={dialect}
            >
              {DIALECTS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Keyword case">
            <Select
              aria-label="Keyword case"
              onChange={(event) =>
                setKeywordCase(event.target.value as KeywordCase)
              }
              value={keywordCase}
            >
              {KEYWORD_CASES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Indentation">
            <Select
              aria-label="Indentation width"
              disabled={useTabs}
              onChange={(event) => setIndent(event.target.value)}
              value={indent}
            >
              {INDENTS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <label className="mt-3 flex w-fit cursor-pointer items-center gap-2 text-xs font-medium text-fg-muted">
          <input
            checked={useTabs}
            className="h-3.5 w-3.5 cursor-pointer"
            onChange={(event) => setUseTabs(event.target.checked)}
            style={{ accentColor: 'var(--accent)' }}
            type="checkbox"
          />
          Indent with tabs
        </label>

        <div className="mt-3">
          <Field
            hint={`${input.length.toLocaleString()} characters`}
            label="Query"
          >
            <Textarea
              aria-label="SQL query"
              className="min-h-[260px]"
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
          <Button disabled={busy} onClick={formatSql} variant="primary">
            {busy && <Spinner className="h-3.5 w-3.5" />}
            Format SQL
          </Button>
          <Button onClick={() => setInput(EXAMPLE)}>Load example</Button>
          <Button
            onClick={() => {
              setInput('');
              setOutput('');
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
      </Panel>

      <ResultPanel
        emptyText="Formatted SQL will appear here."
        filename="query.sql"
        label="Formatted SQL"
        value={output}
      />
    </ToolLayout>
  );
}
