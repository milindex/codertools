'use client';

import Ajv, { type ErrorObject, type Schema } from 'ajv';
import { CheckCircle2, FlaskConical, XCircle } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { Field } from '@/components/ui/Field';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { Textarea } from '@/components/ui/Textarea';
import { ToolLayout } from '@/components/ui/ToolLayout';

import {
  errorMessage,
  isPlainObject,
  parseJsonText,
  prettyJson,
} from './_shared';

const documentSample = `{
  "name": "Ada Lovelace",
  "age": 36,
  "email": "ada@example.com",
  "tags": ["math", "computing"]
}`;

const schemaSample = `{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Person",
  "type": "object",
  "required": ["name", "age"],
  "properties": {
    "name": { "type": "string", "minLength": 1 },
    "age": { "type": "integer", "minimum": 0 },
    "email": { "type": "string" },
    "tags": {
      "type": "array",
      "items": { "type": "string" },
      "uniqueItems": true
    },
    "address": {
      "type": "object",
      "properties": {
        "city": { "type": "string" },
        "zip": { "type": "string", "pattern": "^[0-9]{5}$" }
      },
      "required": ["city"]
    }
  },
  "additionalProperties": false
}`;

type ValidationOutcome = {
  valid: boolean | null;
  errors: ErrorObject[];
  error: string | null;
  title: string;
  propertyCount: number;
  requiredCount: number;
};

export default function JsonSchemaValidatorTool() {
  const [documentText, setDocumentText] = useState(documentSample);
  const [schemaText, setSchemaText] = useState(schemaSample);

  const documentParsed = useMemo(
    () => (documentText.trim() ? parseJsonText(documentText) : null),
    [documentText]
  );
  const schemaParsed = useMemo(
    () => (schemaText.trim() ? parseJsonText(schemaText) : null),
    [schemaText]
  );

  const outcome = useMemo<ValidationOutcome>(() => {
    if (!documentParsed || !schemaParsed) {
      return {
        valid: null,
        errors: [],
        error: null,
        title: '',
        propertyCount: 0,
        requiredCount: 0,
      };
    }
    if (!documentParsed.ok) {
      return {
        valid: null,
        errors: [],
        error: documentParsed.error,
        title: '',
        propertyCount: 0,
        requiredCount: 0,
      };
    }
    if (!schemaParsed.ok) {
      return {
        valid: null,
        errors: [],
        error: schemaParsed.error,
        title: '',
        propertyCount: 0,
        requiredCount: 0,
      };
    }

    const schemaValue = schemaParsed.value;
    const title =
      isPlainObject(schemaValue) && typeof schemaValue.title === 'string'
        ? schemaValue.title
        : 'Untitled schema';
    const propertyCount =
      isPlainObject(schemaValue) && isPlainObject(schemaValue.properties)
        ? Object.keys(schemaValue.properties).length
        : 0;
    const requiredCount =
      isPlainObject(schemaValue) && Array.isArray(schemaValue.required)
        ? schemaValue.required.length
        : 0;

    try {
      const ajv = new Ajv({
        allErrors: true,
        allowUnionTypes: true,
        strict: false,
        verbose: true,
      });
      const validate = ajv.compile(schemaValue as Schema);
      const valid = validate(documentParsed.value) as boolean;
      return {
        valid,
        errors: (validate.errors ?? []) as ErrorObject[],
        error: null,
        title,
        propertyCount,
        requiredCount,
      };
    } catch (error) {
      return {
        valid: null,
        errors: [],
        error: errorMessage(error),
        title,
        propertyCount,
        requiredCount,
      };
    }
  }, [documentParsed, schemaParsed]);

  const documentError =
    documentParsed && !documentParsed.ok ? documentParsed.error : null;
  const schemaError =
    schemaParsed && !schemaParsed.ok ? schemaParsed.error : null;
  const fatalError = documentError ?? schemaError ?? outcome.error;
  const hasBoth = Boolean(documentParsed && schemaParsed);
  const output =
    hasBoth && !fatalError
      ? prettyJson({ valid: outcome.valid, errors: outcome.errors })
      : '';

  return (
    <div className="space-y-4">
      <ToolLayout>
        <Panel title="Document and schema">
          <Field
            error={documentError ?? undefined}
            hint={`${documentText.length.toLocaleString()} characters`}
            htmlFor="schema-validator-document"
            label="JSON document"
          >
            <Textarea
              className="min-h-[170px]"
              id="schema-validator-document"
              onChange={(event) => setDocumentText(event.target.value)}
              placeholder="Paste the JSON instance here…"
              spellCheck={false}
              value={documentText}
            />
          </Field>

          <Field
            className="mt-3"
            error={schemaError ?? undefined}
            hint="Draft-07"
            htmlFor="schema-validator-schema"
            label="JSON Schema"
          >
            <Textarea
              className="min-h-[240px]"
              id="schema-validator-schema"
              onChange={(event) => setSchemaText(event.target.value)}
              placeholder="Paste a JSON Schema here…"
              spellCheck={false}
              value={schemaText}
            />
          </Field>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button
              onClick={() => {
                setDocumentText(documentSample);
                setSchemaText(schemaSample);
              }}
              size="sm"
              variant="ghost"
            >
              <FlaskConical aria-hidden className="h-3.5 w-3.5" />
              Load example
            </Button>
            {outcome.valid !== null && !fatalError && (
              <Badge variant={outcome.valid ? 'success' : 'danger'}>
                {outcome.valid ? (
                  <CheckCircle2 aria-hidden className="mr-1 h-3 w-3" />
                ) : (
                  <XCircle aria-hidden className="mr-1 h-3 w-3" />
                )}
                {outcome.valid ? 'Valid' : 'Invalid'}
              </Badge>
            )}
            {hasBoth && !fatalError && (
              <>
                <Badge>{outcome.title}</Badge>
                <Badge>{outcome.propertyCount} properties</Badge>
                <Badge>{outcome.requiredCount} required</Badge>
              </>
            )}
          </div>

          {outcome.error && !documentError && !schemaError && (
            <Callout
              className="mt-3"
              title="Schema compilation error"
              variant="error"
            >
              <pre className="whitespace-pre-wrap break-words text-xs leading-5">
                {outcome.error}
              </pre>
            </Callout>
          )}

          <p className="mt-3 text-xs leading-5 text-fg-muted">
            Validates with Ajv in draft-07 mode using all-errors output. Schema
            errors and instance paths are reported below. Format keywords are
            not enforced without an optional format plugin.
          </p>
        </Panel>

        <ResultPanel
          emptyText="Paste a JSON document and schema to validate them."
          error={fatalError}
          filename="validation-result.json"
          label="Validation result"
          mime="application/json"
          value={output}
        >
          {hasBoth && !fatalError ? (
            <div className="space-y-3">
              {outcome.valid ? (
                <Callout variant="success" title="Valid JSON">
                  The document satisfies every constraint in the schema.
                </Callout>
              ) : (
                <Callout
                  title={`${outcome.errors.length} validation error${
                    outcome.errors.length === 1 ? '' : 's'
                  }`}
                  variant="error"
                >
                  The document does not satisfy the schema.
                </Callout>
              )}

              {outcome.errors.length > 0 && (
                <ol className="max-h-[420px] space-y-2 overflow-auto pr-1">
                  {outcome.errors.map((error, index) => (
                    <li
                      className="rounded-md border border-border bg-canvas-inset/60 p-2.5"
                      key={`${error.instancePath}-${error.keyword}-${index}`}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="danger">{error.keyword}</Badge>
                        <code className="break-all text-xs text-fg">
                          {error.instancePath || '(root)'}
                        </code>
                      </div>
                      <p className="mt-1.5 text-xs leading-5 text-fg-muted">
                        {error.message ?? 'Validation failed.'}
                      </p>
                      <code className="mt-1 block break-all text-[10px] text-fg-subtle">
                        {error.schemaPath}
                      </code>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          ) : undefined}
        </ResultPanel>
      </ToolLayout>
    </div>
  );
}
