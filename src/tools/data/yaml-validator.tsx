'use client';

import { load, loadAll, YAMLException } from 'js-yaml';
import { CheckCircle2, FlaskConical, XCircle } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { CodeBlock } from '@/components/ui/CodeBlock';
import { Field } from '@/components/ui/Field';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { Textarea } from '@/components/ui/Textarea';
import { ToolLayout } from '@/components/ui/ToolLayout';

import { errorMessage, inferType, prettyJson, typeSummary } from './_shared';

const sample = `service:
  name: api
  port: 8080
  enabled: true
  replicas: 3
  environment: production
  labels:
    team: platform
    tier: backend
  allowedOrigins:
    - https://example.com
    - https://app.example.com
`;

type ValidationResult = {
  error: string | null;
  details: string | null;
  line: number | null;
  column: number | null;
  value: unknown;
  documents: number;
};

function validateYaml(input: string, multiple: boolean): ValidationResult {
  try {
    if (multiple) {
      const documents = loadAll(input);
      return {
        error: null,
        details: null,
        line: null,
        column: null,
        value: documents,
        documents: documents.length,
      };
    }
    const value = load(input);
    return {
      error: null,
      details: null,
      line: null,
      column: null,
      value: value === undefined ? null : value,
      documents: 1,
    };
  } catch (error) {
    if (error instanceof YAMLException) {
      return {
        error: error.reason,
        details: error.message,
        line: error.mark ? error.mark.line + 1 : null,
        column: error.mark ? error.mark.column + 1 : null,
        value: null,
        documents: 0,
      };
    }
    return {
      error: errorMessage(error),
      details: null,
      line: null,
      column: null,
      value: null,
      documents: 0,
    };
  }
}

export default function YamlValidatorTool() {
  const [input, setInput] = useState(sample);
  const [multiple, setMultiple] = useState(false);

  const result = useMemo(() => {
    if (!input.trim()) {
      return {
        error: null,
        details: null,
        line: null,
        column: null,
        value: null,
        documents: 0,
      } satisfies ValidationResult;
    }
    return validateYaml(input, multiple);
  }, [input, multiple]);

  const hasInput = input.trim().length > 0;
  const valid = hasInput && !result.error;
  const output = valid ? prettyJson(result.value) : '';

  return (
    <div className="space-y-4">
      <ToolLayout>
        <Panel title="YAML input">
          <Field
            hint={`${input.length.toLocaleString()} characters`}
            htmlFor="yaml-validator-input"
            label="YAML document"
          >
            <Textarea
              id="yaml-validator-input"
              onChange={(event) => setInput(event.target.value)}
              placeholder="Paste YAML here…"
              spellCheck={false}
              value={input}
            />
          </Field>

          <div className="mt-3 flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-xs text-fg-muted">
              <input
                checked={multiple}
                className="h-3.5 w-3.5 accent-[var(--accent)]"
                onChange={(event) => setMultiple(event.target.checked)}
                type="checkbox"
              />
              Allow multiple documents (---)
            </label>
            <Button onClick={() => setInput(sample)} size="sm" variant="ghost">
              <FlaskConical aria-hidden className="h-3.5 w-3.5" />
              Load example
            </Button>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {hasInput ? (
              <Badge variant={valid ? 'success' : 'danger'}>
                {valid ? (
                  <CheckCircle2 aria-hidden className="mr-1 h-3 w-3" />
                ) : (
                  <XCircle aria-hidden className="mr-1 h-3 w-3" />
                )}
                {valid ? 'Valid YAML' : 'Invalid YAML'}
              </Badge>
            ) : (
              <Badge>Waiting for input</Badge>
            )}
            {result.line !== null && (
              <Badge variant="danger">
                Line {result.line}, column {result.column}
              </Badge>
            )}
            {valid && (
              <Badge>
                {result.documents} document{result.documents === 1 ? '' : 's'}
              </Badge>
            )}
            {valid && <Badge>{typeSummary(inferType(result.value))}</Badge>}
          </div>

          {result.error && (
            <Callout className="mt-3" title="YAML syntax error" variant="error">
              <p>{result.error}</p>
              {result.details && result.details !== result.error && (
                <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-words rounded border border-border bg-canvas-inset p-2 text-[11px] leading-5">
                  {result.details}
                </pre>
              )}
            </Callout>
          )}

          {valid && (
            <Callout
              className="mt-3"
              variant="success"
              title="No YAML errors found"
            >
              The document parsed successfully. Duplicate mapping keys, invalid
              indentation and malformed collections are reported as errors.
            </Callout>
          )}

          <p className="mt-3 text-xs leading-5 text-fg-muted">
            Uses the js-yaml parser with line and column reporting. Anchors,
            aliases, multi-line scalars and YAML 1.2 core types are supported.
          </p>
        </Panel>

        <ResultPanel
          emptyText="Paste YAML to validate it and inspect the parsed value."
          error={result.error}
          filename="parsed-yaml.json"
          label="Parsed value"
          mime="application/json"
          value={output}
        >
          {valid ? (
            <div className="space-y-3">
              <Callout variant="success" title="Valid YAML">
                Parsed {result.documents} document
                {result.documents === 1 ? '' : 's'} successfully.
              </Callout>
              <CodeBlock
                code={output}
                filename="parsed-yaml.json"
                language="JSON"
              />
            </div>
          ) : undefined}
        </ResultPanel>
      </ToolLayout>
    </div>
  );
}
