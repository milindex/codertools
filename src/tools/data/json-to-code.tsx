'use client';

import { FlaskConical, Languages } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Textarea } from '@/components/ui/Textarea';
import { ToolLayout } from '@/components/ui/ToolLayout';

import {
  errorMessage,
  inferType,
  javaIdentifier,
  parseJsonText,
  pascalCase,
  pythonIdentifier,
  splitNullable,
  type TypeField,
  type TypeNode,
  typeSummary,
} from './_shared';

type Language = 'go' | 'java' | 'python' | 'pydantic';

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

type NamedObject = {
  name: string;
  fields: TypeField[];
};

/* ---------------------------------- Go ---------------------------------- */

function generateGo(root: TypeNode, rootName: string): string {
  const structs: NamedObject[] = [];
  const usedNames = new Set<string>([rootName]);
  const uniqueName = (base: string): string => {
    const safe = pascalCase(base, 'Model');
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
        return 'float64';
      case 'integer':
        return 'int64';
      case 'boolean':
        return 'bool';
      case 'null':
      case 'unknown':
        return 'any';
      case 'array':
        return `[]${typeFor(node.element, `${suggestedName}Item`)}`;
      case 'union': {
        const { base, nullable } = splitNullable(node);
        if (base.length === 1 && base[0]) {
          const inner = typeFor(base[0], suggestedName);
          return nullable &&
            inner !== 'any' &&
            !inner.startsWith('[]') &&
            !inner.startsWith('map[')
            ? `*${inner}`
            : inner;
        }
        return 'any';
      }
      case 'object': {
        if (node.fields.length === 0) {
          return 'map[string]any';
        }
        const name = isRoot ? rootName : uniqueName(suggestedName);
        structs.push({ name, fields: node.fields });
        return name;
      }
      default:
        return 'any';
    }
  };

  const optionalType = (type: string): string => {
    if (
      type === 'any' ||
      type.startsWith('*') ||
      type.startsWith('[]') ||
      type.startsWith('map[')
    ) {
      return type;
    }
    return `*${type}`;
  };

  const rootType = typeFor(root, rootName, root.kind === 'object');
  const renderedStructs: string[] = [];
  const rootIsStruct =
    root.kind === 'object' &&
    structs.some((struct) => struct.name === rootName);

  for (let index = 0; index < structs.length; index += 1) {
    const struct = structs[index];
    if (!struct) {
      continue;
    }
    const fieldNames = new Set<string>();
    const rows = struct.fields.map((field) => {
      let fieldName = pascalCase(field.name, 'Field');
      let suffix = 2;
      while (fieldNames.has(fieldName)) {
        fieldName = `${pascalCase(field.name, 'Field')}${suffix}`;
        suffix += 1;
      }
      fieldNames.add(fieldName);
      let fieldType = typeFor(
        field.type,
        `${struct.name}${pascalCase(field.name, 'Field')}`
      );
      if (field.optional) {
        fieldType = optionalType(fieldType);
      }
      const tagName = field.name
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/`/g, "'")
        .replace(/\r/g, '\\r')
        .replace(/\n/g, '\\n')
        .replace(/\t/g, '\\t');
      const tag = `json:"${tagName}${field.optional ? ',omitempty' : ''}"`;
      return { fieldName, fieldType, tag };
    });

    const nameWidth = Math.max(0, ...rows.map((row) => row.fieldName.length));
    const typeWidth = Math.max(0, ...rows.map((row) => row.fieldType.length));
    const body = rows
      .map(
        (row) =>
          `\t${row.fieldName}${' '.repeat(
            nameWidth - row.fieldName.length + 1
          )}${row.fieldType}${' '.repeat(
            typeWidth - row.fieldType.length + 1
          )}\`${row.tag}\``
      )
      .join('\n');
    renderedStructs.push(`type ${struct.name} struct {\n${body}\n}`);
  }

  const parts = ['package main', '', renderedStructs.join('\n\n')];
  if (!rootIsStruct) {
    parts.push(`type ${rootName} ${rootType}`);
  }
  return parts.filter((part) => part !== '').join('\n\n');
}

/* --------------------------------- Java --------------------------------- */

function generateJava(
  root: TypeNode,
  rootName: string,
  useRecord: boolean
): string {
  if (root.kind === 'object' && root.fields.length === 0) {
    return useRecord
      ? `public record ${rootName}() {}`
      : `public class ${rootName} {\n}`;
  }
  const classes: NamedObject[] = [];
  const usedNames = new Set<string>([rootName]);
  let usesList = false;
  let usesMap = false;

  const uniqueName = (base: string): string => {
    const safe = pascalCase(base, 'Model');
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
        return 'String';
      case 'number':
        return 'Double';
      case 'integer':
        return 'Long';
      case 'boolean':
        return 'Boolean';
      case 'null':
      case 'unknown':
        return 'Object';
      case 'array':
        usesList = true;
        return `List<${typeFor(node.element, `${suggestedName}Item`)}>`;
      case 'union': {
        const { base } = splitNullable(node);
        if (base.length === 1 && base[0]) {
          return typeFor(base[0], suggestedName);
        }
        return 'Object';
      }
      case 'object': {
        if (node.fields.length === 0) {
          usesMap = true;
          return 'Map<String, Object>';
        }
        const name = isRoot ? rootName : uniqueName(suggestedName);
        classes.push({ name, fields: node.fields });
        return name;
      }
      default:
        return 'Object';
    }
  };

  const rootType = typeFor(root, rootName, root.kind === 'object');
  const classBodies: Array<{ name: string; body: string }> = [];

  for (let index = 0; index < classes.length; index += 1) {
    const cls = classes[index];
    if (!cls) {
      continue;
    }
    const fieldNames = new Set<string>();
    const fields = cls.fields.map((field) => {
      let name = javaIdentifier(field.name, 'value');
      let suffix = 2;
      while (fieldNames.has(name)) {
        name = `${javaIdentifier(field.name, 'value')}${suffix}`;
        suffix += 1;
      }
      fieldNames.add(name);
      return {
        name,
        type: typeFor(
          field.type,
          `${cls.name}${pascalCase(field.name, 'Field')}`
        ),
      };
    });

    let body: string;
    if (useRecord) {
      const components = fields
        .map((field) => `${field.type} ${field.name}`)
        .join(', ');
      body = `public record ${cls.name}(${components}) {}`;
      classBodies.push({ name: cls.name, body });
    } else {
      const fieldLines = fields
        .map((field) => `    private ${field.type} ${field.name};`)
        .join('\n');
      const accessors = fields
        .map((field) => {
          const suffix =
            field.name.charAt(0).toUpperCase() + field.name.slice(1);
          return `    public ${field.type} get${suffix}() {\n        return ${field.name};\n    }\n\n    public void set${suffix}(${field.type} ${field.name}) {\n        this.${field.name} = ${field.name};\n    }`;
        })
        .join('\n\n');
      body = `public class ${cls.name} {\n${fieldLines}${
        accessors ? `\n\n${accessors}` : ''
      }\n}`;
      classBodies.push({ name: cls.name, body });
    }
  }

  if (classBodies.length === 0) {
    return `// The root JSON value is a ${typeSummary(root)}, not an object.\n// Java has no type alias; use ${
      rootType
    } directly or generate output for an object root.`;
  }

  const primary = classBodies[0];
  if (!primary) {
    return '// No Java classes were generated.';
  }

  const nested = classBodies.slice(1);
  let code: string;
  if (useRecord) {
    const componentsMatch = /\(([^)]*)\)/.exec(primary.body);
    const components = componentsMatch?.[1] ?? '';
    const nestedCode = nested.map((item) => `    ${item.body}`).join('\n\n');
    code = `public record ${primary.name}(${components}) {${nestedCode ? `\n${nestedCode}\n` : ''}}`;
  } else {
    const bodyWithoutClose = primary.body.slice(0, -1).trimEnd();
    const nestedCode = nested
      .map((item) =>
        item.body
          .split('\n')
          .map((line) => (line ? `    ${line}` : line))
          .join('\n')
          .replace(
            `public class ${item.name}`,
            `public static class ${item.name}`
          )
      )
      .join('\n\n');
    code = `${bodyWithoutClose}${nestedCode ? `\n\n${nestedCode}` : ''}\n}`;
  }

  const headerParts: string[] = [];
  if (usesList) {
    headerParts.push('import java.util.List;');
  }
  if (usesMap) {
    headerParts.push('import java.util.Map;');
  }
  const rootNote =
    root.kind === 'object'
      ? ''
      : root.kind === 'array'
        ? '// Root JSON is an array. The class below describes its item shape.\n'
        : `// Root JSON is a ${typeSummary(root)} value. The class below is a representative wrapper shape.\n`;
  return `${headerParts.length > 0 ? `${headerParts.join('\n')}\n\n` : ''}${rootNote}${code}`;
}

/* -------------------------------- Python -------------------------------- */

function generatePython(root: TypeNode, rootName: string, pydantic: boolean) {
  const classes: NamedObject[] = [];
  const usedNames = new Set<string>([rootName]);
  let usesAny = false;
  let usesOptional = false;
  let usesUnion = false;

  const uniqueName = (base: string): string => {
    const safe = pascalCase(base, 'Model');
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
        return 'str';
      case 'number':
        return 'float';
      case 'integer':
        return 'int';
      case 'boolean':
        return 'bool';
      case 'null':
      case 'unknown':
        usesAny = true;
        return 'Any';
      case 'array':
        return `list[${typeFor(node.element, `${suggestedName}Item`)}]`;
      case 'union': {
        const { base, nullable } = splitNullable(node);
        let inner: string;
        if (base.length === 1 && base[0]) {
          inner = typeFor(base[0], suggestedName);
        } else {
          usesUnion = true;
          inner = `Union[${base
            .map((member) => typeFor(member, suggestedName))
            .join(', ')}]`;
        }
        if (nullable) {
          usesOptional = true;
          return `Optional[${inner}]`;
        }
        return inner;
      }
      case 'object': {
        if (node.fields.length === 0) {
          usesAny = true;
          return 'dict[str, Any]';
        }
        const name = isRoot ? rootName : uniqueName(suggestedName);
        classes.push({ name, fields: node.fields });
        return name;
      }
      default:
        return 'Any';
    }
  };

  const rootType = typeFor(root, rootName, root.kind === 'object');
  const rendered: string[] = [];
  const rootIsClass =
    root.kind === 'object' && classes.some((cls) => cls.name === rootName);

  for (let index = 0; index < classes.length; index += 1) {
    const cls = classes[index];
    if (!cls) {
      continue;
    }
    const fieldNames = new Set<string>();
    const fields = cls.fields.map((field) => {
      let name = pythonIdentifier(field.name, 'value');
      let suffix = 2;
      while (fieldNames.has(name)) {
        name = `${pythonIdentifier(field.name, 'value')}_${suffix}`;
        suffix += 1;
      }
      fieldNames.add(name);
      let type = typeFor(
        field.type,
        `${cls.name}${pascalCase(field.name, 'Field')}`
      );
      if (field.optional && !type.startsWith('Optional[')) {
        usesOptional = true;
        type = `Optional[${type}]`;
      }
      return { name, type, optional: field.optional };
    });

    const required = fields.filter((field) => !field.optional);
    const optional = fields.filter((field) => field.optional);
    const lines = [...required, ...optional].map((field) =>
      field.optional
        ? `    ${field.name}: ${field.type} = None`
        : `    ${field.name}: ${field.type}`
    );
    const body = lines.length > 0 ? lines.join('\n') : '    pass';
    rendered.push(
      pydantic
        ? `class ${cls.name}(BaseModel):\n${body}`
        : `@dataclass\nclass ${cls.name}:\n${body}`
    );
  }

  const typingNames = [
    usesAny ? 'Any' : null,
    usesOptional ? 'Optional' : null,
    usesUnion ? 'Union' : null,
  ].filter((name): name is string => Boolean(name));

  const parts: string[] = ['from __future__ import annotations'];
  if (rendered.length > 0) {
    if (pydantic) {
      parts.push('from pydantic import BaseModel');
    } else {
      parts.push('from dataclasses import dataclass');
    }
  }
  if (typingNames.length > 0) {
    parts.push(`from typing import ${typingNames.join(', ')}`);
  }
  parts.push('');
  if (rendered.length > 0) {
    // Nested classes first so Pydantic can resolve annotations without a
    // separate model_rebuild() pass.
    parts.push([...rendered].reverse().join('\n\n'));
  }
  if (!rootIsClass) {
    parts.push(`${rootName} = ${rootType}`);
  }
  return parts
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trimEnd();
}

export default function JsonToCodeTool() {
  const [input, setInput] = useState(sample);
  const [language, setLanguage] = useState<Language>('go');
  const [rootName, setRootName] = useState('Root');
  const [javaRecord, setJavaRecord] = useState(false);

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
      const safeRoot = pascalCase(rootName.trim() || 'Root', 'Root');
      const output =
        language === 'go'
          ? generateGo(type, safeRoot)
          : language === 'java'
            ? generateJava(type, safeRoot, javaRecord)
            : generatePython(type, safeRoot, language === 'pydantic');
      return { output, error: null, summary: typeSummary(type) };
    } catch (error) {
      return { output: '', error: errorMessage(error), summary: '' };
    }
  }, [input, javaRecord, language, rootName]);

  const filename =
    language === 'go'
      ? 'types.go'
      : language === 'java'
        ? `${pascalCase(rootName || 'Root', 'Root')}.java`
        : 'models.py';

  return (
    <div className="space-y-4">
      <ToolLayout>
        <Panel
          actions={
            <SegmentedControl
              ariaLabel="Target language"
              onChange={(value) => setLanguage(value as Language)}
              options={[
                { label: 'Go', value: 'go' },
                { label: 'Java', value: 'java' },
                { label: 'Python', value: 'python' },
                { label: 'Pydantic', value: 'pydantic' },
              ]}
              value={language}
            />
          }
          title="JSON input"
        >
          <Field
            hint={`${input.length.toLocaleString()} characters`}
            htmlFor="json-to-code-input"
            label="JSON sample"
          >
            <Textarea
              id="json-to-code-input"
              onChange={(event) => setInput(event.target.value)}
              placeholder="Paste JSON here…"
              spellCheck={false}
              value={input}
            />
          </Field>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Field htmlFor="json-to-code-root" label="Root type name">
              <Input
                id="json-to-code-root"
                onChange={(event) => setRootName(event.target.value)}
                placeholder="Root"
                value={rootName}
              />
            </Field>
            {language === 'java' && (
              <div className="flex flex-col justify-end pb-1">
                <label className="flex items-center gap-2 text-xs text-fg-muted">
                  <input
                    checked={javaRecord}
                    className="h-3.5 w-3.5 accent-[var(--accent)]"
                    onChange={(event) => setJavaRecord(event.target.checked)}
                    type="checkbox"
                  />
                  Generate Java records
                </label>
              </div>
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button onClick={() => setInput(sample)} size="sm" variant="ghost">
              <FlaskConical aria-hidden className="h-3.5 w-3.5" />
              Load example
            </Button>
            {result.summary && <Badge variant="accent">{result.summary}</Badge>}
            <Badge>
              <Languages aria-hidden className="mr-1 h-3 w-3" />
              {language === 'go'
                ? 'Go structs'
                : language === 'java'
                  ? javaRecord
                    ? 'Java records'
                    : 'Java POJO'
                  : language === 'python'
                    ? 'Python dataclass'
                    : 'Pydantic model'}
            </Badge>
          </div>

          <p className="mt-3 text-xs leading-5 text-fg-muted">
            Nested objects become nested types. Array object shapes are merged
            and missing keys are marked optional. Java generation expects an
            object or array-of-objects root; other roots produce a clear note.
          </p>
        </Panel>

        <ResultPanel
          emptyText="Paste JSON to generate Go, Java or Python types."
          error={result.error}
          filename={filename}
          label="Generated code"
          value={result.output}
        />
      </ToolLayout>
    </div>
  );
}
