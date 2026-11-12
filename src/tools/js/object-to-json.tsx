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

import { convertObjectLiteral } from './object-literal';
import { toErrorMessage } from './utils';

type ConversionResult = {
  output: string;
  warnings: string[];
};

export default function ObjectToJson() {
  const [source, setSource] = useState('');
  const [indentSize, setIndentSize] = useState('2');
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const convert = () => {
    setError(null);
    setResult(null);

    if (!source.trim()) {
      setError('Enter a JavaScript object literal first.');
      return;
    }

    try {
      const converted = convertObjectLiteral(source);
      const parsed = JSON.parse(converted.jsonText) as unknown;
      const output = JSON.stringify(parsed, null, Number(indentSize));
      setResult({ output, warnings: converted.warnings });
    } catch (conversionError) {
      setError(toErrorMessage(conversionError));
    }
  };

  return (
    <div className="space-y-4">
      <ToolLayout>
        <Panel title="JavaScript object literal">
          <Field
            hint="Object or array literal, with or without an assignment"
            label="Source"
          >
            <Textarea
              aria-label="JavaScript object literal"
              onChange={(event) => {
                setSource(event.target.value);
                setResult(null);
                setError(null);
              }}
              placeholder={
                "const user = {\n  name: 'Ada',\n  age: 36,\n  tags: ['math', 'code'],\n  active: true,\n};"
              }
              spellCheck={false}
              value={source}
            />
          </Field>

          <div className="mt-4 max-w-xs">
            <Field label="Indentation">
              <SegmentedControl
                ariaLabel="Indentation size"
                onChange={(value) => {
                  setIndentSize(value);
                  setResult(null);
                }}
                options={[
                  { label: '2 spaces', value: '2' },
                  { label: '4 spaces', value: '4' },
                ]}
                value={indentSize}
              />
            </Field>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={convert} size="md" variant="primary">
              Convert to JSON
            </Button>
            <Button
              disabled={!source && !result && !error}
              onClick={() => {
                setSource('');
                setResult(null);
                setError(null);
              }}
              variant="default"
            >
              Clear
            </Button>
          </div>

          <Callout className="mt-3" variant="info">
            Your input is never evaluated. The converter understands quoted
            strings, unquoted keys, comments, trailing commas and common
            literals such as undefined, NaN and Infinity (mapped to null).
          </Callout>

          {error && (
            <Callout className="mt-3" title="Could not convert" variant="error">
              {error}
            </Callout>
          )}

          {result && result.warnings.length > 0 && (
            <div className="mt-3 space-y-2">
              {result.warnings.map((warning) => (
                <Callout key={warning} variant="warning">
                  {warning}
                </Callout>
              ))}
            </div>
          )}

          {result && (
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="success">Valid JSON</Badge>
              <Badge>{result.output.split('\n').length} lines</Badge>
            </div>
          )}
        </Panel>

        <ResultPanel
          emptyText="Converted JSON will appear here."
          filename="object.json"
          label="JSON output"
          mime="application/json;charset=utf-8"
          value={result?.output ?? ''}
        />
      </ToolLayout>
    </div>
  );
}
