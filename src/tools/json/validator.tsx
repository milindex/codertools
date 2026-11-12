'use client';

import { useState } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { Field } from '@/components/ui/Field';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
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
} from './utils';

type ValidationSuccess = {
  stats: JsonStats;
  inputBytes: number;
  lines: number;
};

export default function JsonValidator() {
  const [source, setSource] = useState('');
  const [result, setResult] = useState<ValidationSuccess | null>(null);
  const [error, setError] = useState<JsonError | null>(null);
  const [inputError, setInputError] = useState<string | null>(null);

  const reset = () => {
    setResult(null);
    setError(null);
    setInputError(null);
  };

  const validate = () => {
    reset();

    if (!source.trim()) {
      setInputError('Enter some JSON to validate.');
      return;
    }

    const parsed = parseJson(source);
    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }

    setResult({
      stats: getJsonStats(parsed.value),
      inputBytes: byteLength(source),
      lines: source.split(/\r\n|\r|\n/).length,
    });
  };

  const report = result
    ? [
        'Valid JSON.',
        `Type: ${result.stats.type}`,
        `Size: ${formatBytes(result.inputBytes)}`,
        `Lines: ${formatCount(result.lines)}`,
        `Depth: ${formatCount(result.stats.depth)}`,
        `Keys: ${formatCount(result.stats.keys)}`,
        `Objects: ${formatCount(result.stats.objects)}`,
        `Arrays: ${formatCount(result.stats.arrays)}`,
        `Scalars: ${formatCount(result.stats.scalars)}`,
        `Nodes: ${formatCount(result.stats.nodes)}${
          result.stats.truncated ? ' (count capped)' : ''
        }`,
      ].join('\n')
    : '';

  const stats: Array<[string, string]> = result
    ? [
        ['Type', result.stats.type],
        ['Size', formatBytes(result.inputBytes)],
        ['Depth', formatCount(result.stats.depth)],
        ['Keys', formatCount(result.stats.keys)],
        ['Objects', formatCount(result.stats.objects)],
        ['Arrays', formatCount(result.stats.arrays)],
        ['Scalars', formatCount(result.stats.scalars)],
        ['Nodes', formatCount(result.stats.nodes)],
      ]
    : [];

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

          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={validate} size="md" variant="primary">
              Validate JSON
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
            JSON validation uses the browser&apos;s native parser. Invalid input
            is reported with its line, column and character offset.
          </Callout>

          {inputError && (
            <Callout className="mt-3" variant="warning">
              {inputError}
            </Callout>
          )}
        </Panel>

        <ResultPanel
          emptyText="Validation results will appear here."
          filename="json-validation.txt"
          label="Validation result"
          value={report}
        >
          {error ? (
            <JsonErrorCallout error={error} />
          ) : result ? (
            <div className="space-y-3">
              <Callout title="Valid JSON" variant="success">
                The document parsed successfully.
                {result.stats.truncated
                  ? ' The statistics below were capped for a very large document.'
                  : ''}
              </Callout>

              <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {stats.map(([label, value]) => (
                  <div
                    className="rounded-md border border-border bg-canvas-subtle/40 p-2.5"
                    key={label}
                  >
                    <dt className="text-[11px] font-medium uppercase tracking-wide text-fg-muted">
                      {label}
                    </dt>
                    <dd className="mt-0.5 truncate font-mono text-sm text-fg">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>

              <div className="flex flex-wrap gap-2">
                <Badge>{formatCount(result.lines)} lines</Badge>
                <Badge>{formatBytes(result.inputBytes)} of JSON</Badge>
              </div>
            </div>
          ) : undefined}
        </ResultPanel>
      </ToolLayout>
    </div>
  );
}
