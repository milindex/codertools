'use client';

import { FlaskConical, ShieldCheck } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { Textarea } from '@/components/ui/Textarea';
import { ToolLayout } from '@/components/ui/ToolLayout';

import {
  errorMessage,
  inferType,
  isValidIdentifier,
  parseJsonText,
  safeTsTypeName,
  splitNullable,
  type TypeNode,
  typeSummary,
} from './_shared';

const sample = `{
  "id": 42,
  "name": "Ada Lovelace",
  "email": "ada@example.com",
  "active": true,
  "balance": 128.5,
  "nickname": null,
  "tags": ["math", "computing"],
  "address": {
    "street": "12 St James's Square",
    "city": "London",
    "postalCode": "SW1Y 4LB"
  },
  "orders": [
    {
      "id": "ord-1",
      "total": 19.99,
      "shipped": true
    },
    {
      "id": "ord-2",
      "total": 5,
      "shipped": false,
      "deliveredAt": "2024-06-02"
    }
  ]
}`;

type ZodOptions = {
  indent: string;
  strictObjects: boolean;
  optionalAll: boolean;
};

function generateZod(root: TypeNode, options: ZodOptions): string {
  const typeFor = (node: TypeNode, level: number): string => {
    switch (node.kind) {
      case 'string':
        return 'z.string()';
      case 'number':
        return 'z.number()';
      case 'integer':
        return 'z.number().int()';
      case 'boolean':
        return 'z.boolean()';
      case 'null':
        return 'z.null()';
      case 'unknown':
        return 'z.unknown()';
      case 'array':
        return `z.array(${typeFor(node.element, level)})`;
      case 'object': {
        if (node.fields.length === 0) {
          return 'z.record(z.string(), z.unknown())';
        }
        const indent = options.indent.repeat(level);
        const childIndent = options.indent.repeat(level + 1);
        const lines = node.fields.map((field) => {
          const key = isValidIdentifier(field.name)
            ? field.name
            : JSON.stringify(field.name);
          const optional =
            field.optional || options.optionalAll ? '.optional()' : '';
          return `${childIndent}${key}: ${typeFor(field.type, level + 1)}${optional},`;
        });
        const strict = options.strictObjects ? '.strict()' : '';
        return `z.object({\n${lines.join('\n')}\n${indent}})${strict}`;
      }
      case 'union': {
        const { base, nullable } = splitNullable(node);
        const inner =
          base.length === 1 && base[0]
            ? typeFor(base[0], level)
            : `z.union([${base
                .map((member) => typeFor(member, level))
                .join(', ')}])`;
        return nullable ? `${inner}.nullable()` : inner;
      }
      default:
        return 'z.unknown()';
    }
  };

  return typeFor(root, 0);
}

export default function JsonToZodTool() {
  const [input, setInput] = useState(sample);
  const [schemaName, setSchemaName] = useState('RootSchema');
  const [strictObjects, setStrictObjects] = useState(false);
  const [optionalAll, setOptionalAll] = useState(false);
  const [includeType, setIncludeType] = useState(true);
  const [includeImport, setIncludeImport] = useState(true);

  const result = useMemo(() => {
    if (!input.trim()) {
      return { output: '', error: null as string | null, summary: '' };
    }
    const parsed = parseJsonText(input);
    if (!parsed.ok) {
      return { output: '', error: parsed.error, summary: '' };
    }
    try {
      const type = inferType(parsed.value);
      const trimmedName = schemaName.trim();
      const constName = isValidIdentifier(trimmedName)
        ? trimmedName
        : `${safeTsTypeName(trimmedName || 'Root', 'Root')}Schema`;
      const typeName = safeTsTypeName(
        constName.replace(/Schema$/i, '') || constName,
        'Root'
      );
      const schema = generateZod(type, {
        indent: '  ',
        strictObjects,
        optionalAll,
      });
      const parts: string[] = [];
      if (includeImport) {
        parts.push("import { z } from 'zod';");
      }
      parts.push(`export const ${constName} = ${schema};`);
      if (includeType) {
        parts.push(`export type ${typeName} = z.infer<typeof ${constName}>;`);
      }
      return {
        output: parts.join('\n\n'),
        error: null,
        summary: typeSummary(type),
      };
    } catch (error) {
      return { output: '', error: errorMessage(error), summary: '' };
    }
  }, [
    includeImport,
    includeType,
    input,
    optionalAll,
    schemaName,
    strictObjects,
  ]);

  return (
    <div className="space-y-4">
      <ToolLayout>
        <Panel title="JSON input">
          <Field
            hint={`${input.length.toLocaleString()} characters`}
            htmlFor="json-to-zod-input"
            label="JSON sample"
          >
            <Textarea
              id="json-to-zod-input"
              onChange={(event) => setInput(event.target.value)}
              placeholder="Paste JSON here…"
              spellCheck={false}
              value={input}
            />
          </Field>

          <Field
            className="mt-3"
            hint="Identifier used for the generated constant"
            htmlFor="json-to-zod-name"
            label="Schema name"
          >
            <Input
              id="json-to-zod-name"
              onChange={(event) => setSchemaName(event.target.value)}
              placeholder="RootSchema"
              value={schemaName}
            />
          </Field>

          <div className="mt-3 flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-xs text-fg-muted">
              <input
                checked={strictObjects}
                className="h-3.5 w-3.5 accent-[var(--accent)]"
                onChange={(event) => setStrictObjects(event.target.checked)}
                type="checkbox"
              />
              Strict objects
            </label>
            <label className="flex items-center gap-2 text-xs text-fg-muted">
              <input
                checked={optionalAll}
                className="h-3.5 w-3.5 accent-[var(--accent)]"
                onChange={(event) => setOptionalAll(event.target.checked)}
                type="checkbox"
              />
              All properties optional
            </label>
            <label className="flex items-center gap-2 text-xs text-fg-muted">
              <input
                checked={includeImport}
                className="h-3.5 w-3.5 accent-[var(--accent)]"
                onChange={(event) => setIncludeImport(event.target.checked)}
                type="checkbox"
              />
              Include import
            </label>
            <label className="flex items-center gap-2 text-xs text-fg-muted">
              <input
                checked={includeType}
                className="h-3.5 w-3.5 accent-[var(--accent)]"
                onChange={(event) => setIncludeType(event.target.checked)}
                type="checkbox"
              />
              Infer TypeScript type
            </label>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button
              onClick={() => {
                setInput(sample);
                setSchemaName('RootSchema');
              }}
              size="sm"
              variant="ghost"
            >
              <FlaskConical aria-hidden className="h-3.5 w-3.5" />
              Load example
            </Button>
            {result.summary && <Badge variant="accent">{result.summary}</Badge>}
            <Badge>
              <ShieldCheck aria-hidden className="mr-1 h-3 w-3" />
              Recursive schema
            </Badge>
          </div>

          <p className="mt-3 text-xs leading-5 text-fg-muted">
            Objects from array examples are merged so missing properties become
            optional. Integers use <code>z.number().int()</code> and nullable
            fields use <code>.nullable()</code>.
          </p>
        </Panel>

        <ResultPanel
          emptyText="Paste JSON to generate a Zod schema."
          error={result.error}
          filename="schema.ts"
          label="Zod schema"
          mime="text/typescript"
          value={result.output}
        />
      </ToolLayout>
    </div>
  );
}
