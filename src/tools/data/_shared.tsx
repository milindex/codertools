'use client';

import type { ReactNode } from 'react';

import { cn } from '@/utils/cn';

export type Parsed<T> = { ok: true; value: T } | { ok: false; error: string };

export function errorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

export function lineColumnAt(text: string, position: number): string {
  const safePosition = Math.max(0, Math.min(position, text.length));
  const before = text.slice(0, safePosition);
  const line = before.split('\n').length;
  const lastBreak = before.lastIndexOf('\n');
  const column = safePosition - lastBreak;
  return `line ${line}, column ${column}`;
}

export function parseJsonText(text: string): Parsed<unknown> {
  try {
    return { ok: true, value: JSON.parse(text) as unknown };
  } catch (error) {
    const message = errorMessage(error);
    const positionMatch = /position\s+(\d+)/i.exec(message);
    if (positionMatch?.[1]) {
      return {
        ok: false,
        error: `${message} (${lineColumnAt(text, Number(positionMatch[1]))})`,
      };
    }
    return { ok: false, error: message };
  }
}

export function prettyJson(value: unknown, space = 2): string {
  try {
    return JSON.stringify(value, null, space) ?? 'null';
  } catch (error) {
    return `Unable to serialize value: ${errorMessage(error)}`;
  }
}

export function jsonTypeLabel(value: unknown): string {
  if (value === null) {
    return 'null';
  }
  if (Array.isArray(value)) {
    return 'array';
  }
  return typeof value;
}

export function isPlainObject(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    !(value instanceof Date)
  );
}

/** Convert values that JSON cannot represent into JSON-safe equivalents. */
export function toJsonSafe(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value ?? null;
  }
  if (typeof value === 'bigint') {
    return value <= BigInt(Number.MAX_SAFE_INTEGER) &&
      value >= BigInt(Number.MIN_SAFE_INTEGER)
      ? Number(value)
      : value.toString();
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString();
  }
  if (Array.isArray(value)) {
    return value.map(toJsonSafe);
  }
  if (value instanceof Map) {
    const result: Record<string, unknown> = {};
    for (const [key, item] of value) {
      result[String(key)] = toJsonSafe(item);
    }
    return result;
  }
  if (value instanceof Set) {
    return Array.from(value, toJsonSafe);
  }
  if (typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) {
      if (item !== undefined) {
        result[key] = toJsonSafe(item);
      }
    }
    return result;
  }
  return value;
}

export function cellText(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? '' : value.toISOString();
  }
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

export function briefValue(value: unknown, max = 90): string {
  const serialized = prettyJson(value, 0).replace(/\s+/g, ' ');
  return serialized.length > max
    ? `${serialized.slice(0, max - 1)}…`
    : serialized;
}

export function isValidIdentifier(name: string): boolean {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name);
}

function words(input: string): string[] {
  return input
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[^A-Za-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

export function pascalCase(input: string, fallback = 'Root'): string {
  const parts = words(input);
  if (parts.length === 0) {
    return fallback;
  }
  const joined = parts
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
  return /^\d/.test(joined) ? `${fallback}${joined}` : joined;
}

export function camelCase(input: string, fallback = 'value'): string {
  const pascal = pascalCase(input, fallback);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

export function snakeCase(input: string, fallback = 'value'): string {
  const parts = words(input);
  const joined = parts.map((part) => part.toLowerCase()).join('_');
  return joined || fallback;
}

const pythonKeywords = new Set([
  'False',
  'None',
  'True',
  'and',
  'as',
  'assert',
  'async',
  'await',
  'break',
  'class',
  'continue',
  'def',
  'del',
  'elif',
  'else',
  'except',
  'finally',
  'for',
  'from',
  'global',
  'if',
  'import',
  'in',
  'is',
  'lambda',
  'nonlocal',
  'not',
  'or',
  'pass',
  'raise',
  'return',
  'try',
  'while',
  'with',
  'yield',
]);

const javaKeywords = new Set([
  'abstract',
  'assert',
  'boolean',
  'break',
  'byte',
  'case',
  'catch',
  'char',
  'class',
  'const',
  'continue',
  'default',
  'do',
  'double',
  'else',
  'enum',
  'extends',
  'final',
  'finally',
  'float',
  'for',
  'goto',
  'if',
  'implements',
  'import',
  'instanceof',
  'int',
  'interface',
  'long',
  'native',
  'new',
  'package',
  'private',
  'protected',
  'public',
  'return',
  'short',
  'static',
  'strictfp',
  'super',
  'switch',
  'synchronized',
  'this',
  'throw',
  'throws',
  'transient',
  'try',
  'void',
  'volatile',
  'while',
]);

const tsReservedTypes = new Set([
  'any',
  'boolean',
  'break',
  'case',
  'catch',
  'class',
  'const',
  'continue',
  'debugger',
  'default',
  'delete',
  'do',
  'else',
  'enum',
  'export',
  'extends',
  'false',
  'finally',
  'for',
  'function',
  'if',
  'import',
  'in',
  'instanceof',
  'interface',
  'let',
  'new',
  'null',
  'number',
  'object',
  'package',
  'private',
  'protected',
  'public',
  'return',
  'static',
  'string',
  'super',
  'switch',
  'symbol',
  'this',
  'throw',
  'true',
  'try',
  'type',
  'typeof',
  'undefined',
  'var',
  'void',
  'while',
  'with',
  'yield',
]);

export function pythonIdentifier(input: string, fallback = 'value'): string {
  let name = snakeCase(input, fallback);
  if (/^\d/.test(name)) {
    name = `_${name}`;
  }
  if (pythonKeywords.has(name)) {
    name = `${name}_`;
  }
  return name;
}

export function javaIdentifier(input: string, fallback = 'value'): string {
  let name = camelCase(input, fallback);
  if (/^\d/.test(name)) {
    name = `_${name}`;
  }
  if (javaKeywords.has(name)) {
    name = `${name}_`;
  }
  return name;
}

export function safeTsTypeName(input: string, fallback = 'Root'): string {
  const name = pascalCase(input, fallback);
  return tsReservedTypes.has(name.toLowerCase()) ? `${name}Model` : name;
}

/* ------------------------------------------------------------------ *
 * Structural type inference
 * ------------------------------------------------------------------ */

export type TypeField = {
  name: string;
  type: TypeNode;
  optional: boolean;
};

export type TypeNode =
  | {
      kind: 'string' | 'number' | 'integer' | 'boolean' | 'null' | 'unknown';
    }
  | { kind: 'array'; element: TypeNode }
  | { kind: 'object'; fields: TypeField[] }
  | { kind: 'union'; types: TypeNode[] };

function objectType(value: Record<string, unknown>): TypeNode {
  return {
    kind: 'object',
    fields: Object.entries(value).map(([name, fieldValue]) => ({
      name,
      type: inferType(fieldValue),
      optional: false,
    })),
  };
}

export function inferType(value: unknown): TypeNode {
  if (value === null) {
    return { kind: 'null' };
  }
  if (value === undefined) {
    return { kind: 'unknown' };
  }
  if (Array.isArray(value)) {
    let element: TypeNode = { kind: 'unknown' };
    for (const item of value) {
      element = mergeTypes(element, inferType(item));
    }
    return { kind: 'array', element };
  }
  if (value instanceof Date) {
    return { kind: 'string' };
  }
  if (typeof value === 'object') {
    return objectType(value as Record<string, unknown>);
  }
  if (typeof value === 'number') {
    return { kind: Number.isInteger(value) ? 'integer' : 'number' };
  }
  if (typeof value === 'bigint') {
    return { kind: 'integer' };
  }
  if (typeof value === 'boolean') {
    return { kind: 'boolean' };
  }
  if (typeof value === 'string') {
    return { kind: 'string' };
  }
  return { kind: 'unknown' };
}

function typeKey(node: TypeNode): string {
  switch (node.kind) {
    case 'array':
      return `array(${typeKey(node.element)})`;
    case 'object':
      return `{${node.fields
        .map(
          (field) =>
            `${field.name}${field.optional ? '?' : ''}:${typeKey(field.type)}`
        )
        .sort()
        .join(';')}}`;
    case 'union':
      return `(${node.types.map(typeKey).sort().join('|')})`;
    default:
      return node.kind;
  }
}

function dedupe(nodes: TypeNode[]): TypeNode[] {
  const seen = new Set<string>();
  const result: TypeNode[] = [];
  for (const node of nodes) {
    const key = typeKey(node);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(node);
    }
  }
  return result;
}

export function unionMembers(node: TypeNode): TypeNode[] {
  return node.kind === 'union'
    ? dedupe(node.types.flatMap(unionMembers))
    : [node];
}

function mergePair(a: TypeNode, b: TypeNode): TypeNode | null {
  if (a.kind === 'unknown') {
    return b;
  }
  if (b.kind === 'unknown') {
    return a;
  }
  if (a.kind === b.kind) {
    if (a.kind === 'array' && b.kind === 'array') {
      return { kind: 'array', element: mergeTypes(a.element, b.element) };
    }
    if (a.kind === 'object' && b.kind === 'object') {
      const bNames = new Set(b.fields.map((field) => field.name));
      const fields = a.fields.map((field) => ({
        ...field,
        optional: field.optional || !bNames.has(field.name),
      }));
      for (const bField of b.fields) {
        const index = fields.findIndex((field) => field.name === bField.name);
        if (index === -1) {
          fields.push({ ...bField, optional: true });
        } else {
          const existing = fields[index];
          if (existing) {
            fields[index] = {
              ...existing,
              type: mergeTypes(existing.type, bField.type),
              optional: existing.optional || bField.optional,
            };
          }
        }
      }
      return { kind: 'object', fields };
    }
    return a;
  }
  const kinds = new Set([a.kind, b.kind]);
  if (kinds.has('number') && kinds.has('integer') && kinds.size === 2) {
    return { kind: 'number' };
  }
  return null;
}

export function mergeTypes(a: TypeNode, b: TypeNode): TypeNode {
  let list = dedupe([...unionMembers(a), ...unionMembers(b)]);
  let changed = true;

  while (changed) {
    changed = false;
    outer: for (let i = 0; i < list.length; i += 1) {
      for (let j = i + 1; j < list.length; j += 1) {
        const left = list[i];
        const right = list[j];
        if (!left || !right) {
          continue;
        }
        const merged = mergePair(left, right);
        if (merged) {
          list = [...list.slice(0, j), ...list.slice(j + 1)];
          list[i] = merged;
          changed = true;
          break outer;
        }
      }
    }
  }

  list = dedupe(list);
  if (list.length === 1 && list[0]) {
    return list[0];
  }
  return { kind: 'union', types: list };
}

export function splitNullable(node: TypeNode): {
  base: TypeNode[];
  nullable: boolean;
} {
  const members = unionMembers(node);
  const base = members.filter((member) => member.kind !== 'null');
  return {
    base: base.length > 0 ? base : [{ kind: 'unknown' }],
    nullable: base.length !== members.length,
  };
}

export function typeSummary(node: TypeNode): string {
  switch (node.kind) {
    case 'array':
      return `array of ${typeSummary(node.element)}`;
    case 'object':
      return `object with ${node.fields.length} field${node.fields.length === 1 ? '' : 's'}`;
    case 'union':
      return node.types.map(typeSummary).join(' or ');
    default:
      return node.kind;
  }
}

/* ------------------------------------------------------------------ *
 * Small shared preview table
 * ------------------------------------------------------------------ */

type PreviewTableProps = {
  columns?: ReactNode[];
  rows: ReactNode[][];
  maxRows?: number;
  emptyText?: string;
  className?: string;
};

export function PreviewTable({
  columns,
  rows,
  maxRows = 50,
  emptyText = 'No rows to preview.',
  className,
}: PreviewTableProps) {
  const shown = rows.slice(0, maxRows);

  if (rows.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border bg-canvas-inset/50 p-4 text-center text-xs text-fg-muted">
        {emptyText}
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full border-collapse text-left text-xs">
          {columns && columns.length > 0 && (
            <thead className="bg-canvas-subtle/70 text-fg-muted">
              <tr>
                {columns.map((column, index) => (
                  <th
                    className="whitespace-nowrap border-b border-border px-2.5 py-2 font-semibold"
                    key={index}
                    scope="col"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {shown.map((row, rowIndex) => (
              <tr
                className="border-b border-border/70 last:border-0 odd:bg-canvas-inset/30"
                key={rowIndex}
              >
                {row.map((cell, cellIndex) => (
                  <td
                    className="max-w-[280px] truncate whitespace-nowrap px-2.5 py-1.5 text-fg-muted"
                    key={cellIndex}
                    title={typeof cell === 'string' ? cell : undefined}
                  >
                    {cell === '' || cell === null || cell === undefined ? (
                      <span className="text-fg-subtle">—</span>
                    ) : (
                      cell
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length > maxRows && (
        <p className="text-[11px] text-fg-muted">
          Showing the first {maxRows} of {rows.length} rows.
        </p>
      )}
    </div>
  );
}
