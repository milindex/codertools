'use client';

import { useState } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { Field } from '@/components/ui/Field';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { ToolLayout } from '@/components/ui/ToolLayout';
import { JsonErrorCallout } from '@/tools/json/JsonErrorCallout';
import {
  byteLength,
  formatBytes,
  getJsonStats,
  type JsonError,
  parseJson,
} from '@/tools/json/utils';

import {
  type JsQuote,
  type JsWrapper,
  serializeJsonValue,
  wrapJsLiteral,
} from './json-serializer';

type ConversionResult = {
  output: string;
  inputBytes: number;
  outputBytes: number;
  depth: number;
};

type ConversionError =
  { kind: 'json'; error: JsonError } | { kind: 'text'; message: string };

export default function JsonToObject() {
  const [source, setSource] = useState('');
  const [indentSize, setIndentSize] = useState('2');
  const [quote, setQuote] = useState<JsQuote>("'");
  const [trailingComma, setTrailingComma] = useState(true);
  const [wrapper, setWrapper] = useState<JsWrapper>('literal');
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [error, setError] = useState<ConversionError | null>(null);

  const reset = () => {
    setResult(null);
    setError(null);
  };

  const convert = () => {
    setError(null);
    setResult(null);

    if (!source.trim()) {
      setError({
        kind: 'text',
        message: 'Enter some JSON first.',
      });
      return;
    }

    const parsed = parseJson(source);
    if (!parsed.ok) {
      setError({ kind: 'json', error: parsed.error });
      return;
    }

    try {
      const literal = serializeJsonValue(parsed.value, 0, {
        indent: ' '.repeat(Number(indentSize)),
        quote,
        trailingComma,
      });
      const output = wrapJsLiteral(literal, wrapper);

      setResult({
        output,
        inputBytes: byteLength(source),
        outputBytes: byteLength(output),
        depth: getJsonStats(parsed.value).depth,
      });
    } catch (conversionError) {
      setError({
        kind: 'text',
        message:
          conversionError instanceof Error
            ? conversionError.message
            : 'The JSON could not be converted.',
      });
    }
  };

  return (
    <div className="space-y-4">
      <ToolLayout>
        <Panel title="JSON">
          <Field
            hint={`${source.length.toLocaleString('en-US')} characters`}
            label="Source JSON"
          >
            <Textarea
              aria-label="JSON source"
              onChange={(event) => {
                setSource(event.target.value);
                reset();
              }}
              placeholder={
                '{\n  "name": "Ada",\n  "age": 36,\n  "tags": ["math", "code"],\n  "active": true,\n  "address": null\n}'
              }
              spellCheck={false}
              value={source}
            />
          </Field>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="Indentation">
              <SegmentedControl
                ariaLabel="Indentation size"
                onChange={(value) => {
                  setIndentSize(value);
                  reset();
                }}
                options={[
                  { label: '2 spaces', value: '2' },
                  { label: '4 spaces', value: '4' },
                ]}
                value={indentSize}
              />
            </Field>
            <Field label="Quotes">
              <SegmentedControl
                ariaLabel="Quote style"
                onChange={(value) => {
                  setQuote(value === '"' ? '"' : "'");
                  reset();
                }}
                options={[
                  { label: 'Single', value: "'" },
                  { label: 'Double', value: '"' },
                ]}
                value={quote}
              />
            </Field>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Field label="Output">
              <Select
                aria-label="Output wrapper"
                onChange={(event) => {
                  setWrapper(event.target.value as JsWrapper);
                  reset();
                }}
                value={wrapper}
              >
                <option value="literal">Object literal only</option>
                <option value="const">const data = …</option>
                <option value="export">export default …</option>
              </Select>
            </Field>
            <label className="mt-5 flex w-fit cursor-pointer items-center gap-2 text-xs font-medium text-fg-muted">
              <input
                checked={trailingComma}
                className="h-3.5 w-3.5 accent-[var(--accent)]"
                onChange={(event) => {
                  setTrailingComma(event.target.checked);
                  reset();
                }}
                type="checkbox"
              />
              Trailing commas
            </label>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={convert} size="md" variant="primary">
              Convert to JS object
            </Button>
            <Button
              disabled={!source && !result && !error}
              onClick={() => {
                setSource('');
                reset();
              }}
              variant="default"
            >
              Clear
            </Button>
          </div>

          {error?.kind === 'json' && (
            <div className="mt-3">
              <JsonErrorCallout error={error.error} />
            </div>
          )}

          {error?.kind === 'text' && (
            <Callout className="mt-3" variant="warning">
              {error.message}
            </Callout>
          )}

          {result && (
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="success">Valid JavaScript</Badge>
              <Badge>
                {formatBytes(result.inputBytes)} →{' '}
                {formatBytes(result.outputBytes)}
              </Badge>
              <Badge>
                {result.depth} level{result.depth === 1 ? '' : 's'}
              </Badge>
            </div>
          )}
        </Panel>

        <ResultPanel
          emptyText="The JavaScript object literal will appear here."
          filename="data.js"
          label="JavaScript output"
          mime="text/javascript;charset=utf-8"
          value={result?.output ?? ''}
        />
      </ToolLayout>
    </div>
  );
}
