'use client';

import { Braces, FlaskConical } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { ToolLayout } from '@/components/ui/ToolLayout';

import {
  inferType,
  isValidIdentifier,
  parseJsonText,
  pascalCase,
  safeTsTypeName,
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

type GeneratorOptions = {
  rootName: string;
  includeExport: boolean;
  readonly: boolean;
  optional: boolean;
  indent: string;
};

function generateTypeScript(root: TypeNode, options: GeneratorOptions): string {
  const interfaces: string[] = [];
  const usedNames = new Set<string>();
  const exportKeyword = options.includeExport ? 'export ' : '';
  const rootTypeName = safeTsTypeName(options.rootName.trim() || 'Root');
  usedNames.add(rootTypeName);

  const uniqueName = (base: string): string => {
    const safe = safeTsTypeName(base);
    let candidate = safe;
    let index = 2;
    while (usedNames.has(candidate)) {
      candidate = `${safe}${index}`;
      index += 1;
    }
    usedNames.add(candidate);
    return candidate;
  };

  const typeFor = (
    node: TypeNode,
    suggestedName: string,
    isRoot = false
  ): string => {
    switch (node.kind) {
      case 'string':
        return 'string';
      case 'number':
      case 'integer':
        return 'number';
      case 'boolean':
        return 'boolean';
      case 'null':
        return 'null';
      case 'unknown':
        return 'unknown';
      case 'array': {
        const itemType = typeFor(node.element, `${suggestedName}Item`);
        return itemType.includes(' | ') ? `(${itemType})[]` : `${itemType}[]`;
      }
      case 'union':
        return node.types
          .map((member) => typeFor(member, suggestedName))
          .join(' | ');
      case 'object': {
        if (node.fields.length === 0) {
          return 'Record<string, unknown>';
        }
        const interfaceName = isRoot ? rootTypeName : uniqueName(suggestedName);
        const lines = node.fields.map((field) => {
          const propertyName = isValidIdentifier(field.name)
            ? field.name
            : JSON.stringify(field.name);
          const optional = field.optional || options.optional ? '?' : '';
          const readonly = options.readonly ? 'readonly ' : '';
          const childName = `${interfaceName}${pascalCase(field.name, 'Field')}`;
          return `${options.indent}${readonly}${propertyName}${optional}: ${typeFor(
            field.type,
            childName
          )};`;
        });
        interfaces.push(
          `${exportKeyword}interface ${interfaceName} {\n${lines.join('\n')}\n}`
        );
        return interfaceName;
      }
      default:
        return 'unknown';
    }
  };

  const rootType = typeFor(root, rootTypeName, root.kind === 'object');
  const interfaceCode = interfaces.reverse().join('\n\n');
  if (root.kind === 'object') {
    return (
      interfaceCode ||
      `${exportKeyword}type ${rootTypeName} = Record<string, unknown>;`
    );
  }
  const alias = `${exportKeyword}type ${rootTypeName} = ${rootType};`;
  return interfaceCode ? `${interfaceCode}\n\n${alias}` : alias;
}

export default function JsonToTypescriptTool() {
  const [input, setInput] = useState(sample);
  const [rootName, setRootName] = useState('Root');
  const [includeExport, setIncludeExport] = useState(true);
  const [readonly, setReadonly] = useState(false);
  const [optional, setOptional] = useState(false);
  const [indentValue, setIndentValue] = useState('2');

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
      return {
        output: generateTypeScript(type, {
          rootName,
          includeExport,
          readonly,
          optional,
          indent: indentValue === '4' ? '    ' : '  ',
        }),
        error: null,
        summary: typeSummary(type),
      };
    } catch (error) {
      return {
        output: '',
        error: error instanceof Error ? error.message : String(error),
        summary: '',
      };
    }
  }, [includeExport, indentValue, input, optional, readonly, rootName]);

  return (
    <div className="space-y-4">
      <ToolLayout>
        <Panel title="JSON input">
          <Field
            hint={`${input.length.toLocaleString()} characters`}
            htmlFor="json-to-typescript-input"
            label="JSON sample"
          >
            <Textarea
              id="json-to-typescript-input"
              onChange={(event) => setInput(event.target.value)}
              placeholder="Paste JSON here…"
              spellCheck={false}
              value={input}
            />
          </Field>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Field htmlFor="json-to-typescript-root" label="Root type name">
              <Input
                id="json-to-typescript-root"
                onChange={(event) => setRootName(event.target.value)}
                placeholder="Root"
                value={rootName}
              />
            </Field>
            <Field htmlFor="json-to-typescript-indent" label="Indent">
              <Select
                id="json-to-typescript-indent"
                onChange={(event) => setIndentValue(event.target.value)}
                value={indentValue}
              >
                <option value="2">2 spaces</option>
                <option value="4">4 spaces</option>
              </Select>
            </Field>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-xs text-fg-muted">
              <input
                checked={includeExport}
                className="h-3.5 w-3.5 accent-[var(--accent)]"
                onChange={(event) => setIncludeExport(event.target.checked)}
                type="checkbox"
              />
              Export declarations
            </label>
            <label className="flex items-center gap-2 text-xs text-fg-muted">
              <input
                checked={readonly}
                className="h-3.5 w-3.5 accent-[var(--accent)]"
                onChange={(event) => setReadonly(event.target.checked)}
                type="checkbox"
              />
              Readonly properties
            </label>
            <label className="flex items-center gap-2 text-xs text-fg-muted">
              <input
                checked={optional}
                className="h-3.5 w-3.5 accent-[var(--accent)]"
                onChange={(event) => setOptional(event.target.checked)}
                type="checkbox"
              />
              All properties optional
            </label>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button onClick={() => setInput(sample)} size="sm" variant="ghost">
              <FlaskConical aria-hidden className="h-3.5 w-3.5" />
              Load example
            </Button>
            {result.summary && <Badge variant="accent">{result.summary}</Badge>}
            <Badge>
              <Braces aria-hidden className="mr-1 h-3 w-3" />
              Recursive interfaces
            </Badge>
          </div>

          <p className="mt-3 text-xs leading-5 text-fg-muted">
            Arrays are merged into one item type. Properties that appear in only
            some objects of an array are marked optional. Null values become
            <code className="mx-1">null</code> union types.
          </p>
        </Panel>

        <ResultPanel
          emptyText="Paste JSON to generate TypeScript interfaces."
          error={result.error}
          filename="types.ts"
          label="TypeScript"
          mime="text/typescript"
          value={result.output}
        />
      </ToolLayout>
    </div>
  );
}
