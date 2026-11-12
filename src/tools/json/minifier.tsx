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

type MinifyResult = {
  output: string;
  inputBytes: number;
  outputBytes: number;
  stats: JsonStats;
};

export default function JsonMinifier() {
  const [source, setSource] = useState('');
  const [mode, setMode] = useState('minified');
  const [result, setResult] = useState<MinifyResult | null>(null);
  const [error, setError] = useState<JsonError | null>(null);
  const [inputError, setInputError] = useState<string | null>(null);

  const reset = () => {
    setResult(null);
    setError(null);
    setInputError(null);
  };

  const minify = () => {
    reset();

    if (!source.trim()) {
      setInputError('Enter some JSON to minify.');
      return;
    }

    const parsed = parseJson(source);
    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }

    const output = stringifyJson(parsed.value, mode === 'minified' ? 0 : 2);

    setResult({
      output,
      inputBytes: byteLength(source),
      outputBytes: byteLength(output),
      stats: getJsonStats(parsed.value),
    });
  };

  const savings = result
    ? result.inputBytes > 0
      ? ((result.inputBytes - result.outputBytes) / result.inputBytes) * 100
      : 0
    : 0;

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
                '{\n  "name": "Ada",\n  "tags": ["math", "code"],\n  "active": true\n}'
              }
              spellCheck={false}
              value={source}
            />
          </Field>

          <div className="mt-4 max-w-sm">
            <Field
              hint={
                mode === 'minified'
                  ? 'Removes all insignificant whitespace'
                  : 'Keeps 2-space indentation'
              }
              label="Whitespace"
            >
              <SegmentedControl
                ariaLabel="Output whitespace"
                onChange={(value) => {
                  setMode(value);
                  reset();
                }}
                options={[
                  { label: 'Remove', value: 'minified' },
                  { label: 'Keep', value: 'indented' },
                ]}
                value={mode}
              />
            </Field>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={minify} size="md" variant="primary">
              Minify JSON
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

          <Callout className="mt-3" variant="info">
            Minification only removes whitespace. Object keys, values and their
            order are preserved.
          </Callout>

          {inputError && (
            <Callout className="mt-3" variant="warning">
              {inputError}
            </Callout>
          )}

          {result && (
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge
                variant={
                  result.outputBytes <= result.inputBytes
                    ? 'success'
                    : 'warning'
                }
              >
                {mode === 'minified'
                  ? `${savings >= 0 ? '−' : '+'}${Math.abs(savings).toFixed(1)}%`
                  : 'Whitespace kept'}
              </Badge>
              <Badge>
                {formatBytes(result.inputBytes)} →{' '}
                {formatBytes(result.outputBytes)}
              </Badge>
              <Badge>{formatCount(result.stats.keys)} keys</Badge>
            </div>
          )}
        </Panel>

        <ResultPanel
          emptyText="Minified JSON will appear here."
          filename={mode === 'minified' ? 'minified.json' : 'formatted.json'}
          label={mode === 'minified' ? 'Minified JSON' : 'JSON with whitespace'}
          mime="application/json;charset=utf-8"
          value={result?.output ?? ''}
        >
          {error ? <JsonErrorCallout error={error} /> : undefined}
        </ResultPanel>
      </ToolLayout>
    </div>
  );
}
