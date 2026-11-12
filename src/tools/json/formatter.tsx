'use client';

import { useState } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { Field } from '@/components/ui/Field';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Textarea } from '@/components/ui/Textarea';
import { ToolLayout } from '@/components/ui/ToolLayout';

import { JsonErrorCallout } from './JsonErrorCallout';
import {
  byteLength,
  formatBytes,
  formatCount,
  getJsonStats,
  type JsonError,
  type JsonStats,
  parseJson,
  stringifyJson,
} from './utils';

type FormatResult = {
  output: string;
  inputBytes: number;
  outputBytes: number;
  stats: JsonStats;
};

export default function JsonFormatter() {
  const [source, setSource] = useState('');
  const [indent, setIndent] = useState('2');
  const [sortKeys, setSortKeys] = useState(false);
  const [result, setResult] = useState<FormatResult | null>(null);
  const [error, setError] = useState<JsonError | null>(null);
  const [inputError, setInputError] = useState<string | null>(null);

  const reset = () => {
    setResult(null);
    setError(null);
    setInputError(null);
  };

  const format = () => {
    reset();

    if (!source.trim()) {
      setInputError('Enter some JSON to format.');
      return;
    }

    const parsed = parseJson(source);
    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }

    const indentValue = indent === 'tab' ? '\t' : Number(indent);
    const output = stringifyJson(parsed.value, indentValue, sortKeys);

    setResult({
      output,
      inputBytes: byteLength(source),
      outputBytes: byteLength(output),
      stats: getJsonStats(parsed.value),
    });
  };

  return (
    <div className="space-y-4">
      <ToolLayout>
        <Panel title="JSON">
          <Field
            hint={`${formatCount(source.length)} characters`}
            label="Source JSON"
          >
            <Textarea
              aria-label="JSON source"
              onChange={(event) => {
                setSource(event.target.value);
                reset();
              }}
              placeholder={
                '{"name":"Ada","tags":["math","code"],"active":true}'
              }
              spellCheck={false}
              value={source}
            />
          </Field>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="Indentation">
              <SegmentedControl
                ariaLabel="Indentation style"
                onChange={(value) => {
                  setIndent(value);
                  reset();
                }}
                options={[
                  { label: '2 spaces', value: '2' },
                  { label: '4 spaces', value: '4' },
                  { label: 'Tab', value: 'tab' },
                ]}
                value={indent}
              />
            </Field>
            <label className="mt-5 flex w-fit cursor-pointer items-center gap-2 text-xs font-medium text-fg-muted">
              <input
                checked={sortKeys}
                className="h-3.5 w-3.5 accent-[var(--accent)]"
                onChange={(event) => {
                  setSortKeys(event.target.checked);
                  reset();
                }}
                type="checkbox"
              />
              Sort object keys
            </label>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={format} size="md" variant="primary">
              Format JSON
            </Button>
            <Button
              disabled={!source && !result && !error && !inputError}
              onClick={() => {
                setSource('');
                reset();
              }}
              variant="default"
            >
              Clear
            </Button>
          </div>

          {inputError && (
            <Callout className="mt-3" variant="warning">
              {inputError}
            </Callout>
          )}

          {result && (
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="success">Valid JSON</Badge>
              <Badge>
                {formatBytes(result.inputBytes)} →{' '}
                {formatBytes(result.outputBytes)}
              </Badge>
              <Badge>{formatCount(result.stats.keys)} keys</Badge>
              <Badge>{result.stats.depth} levels</Badge>
            </div>
          )}
        </Panel>

        <ResultPanel
          emptyText="Formatted JSON will appear here."
          filename="formatted.json"
          label="Formatted JSON"
          mime="application/json;charset=utf-8"
          value={result?.output ?? ''}
        >
          {error ? <JsonErrorCallout error={error} /> : undefined}
        </ResultPanel>
      </ToolLayout>
    </div>
  );
}
