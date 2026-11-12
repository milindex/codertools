'use client';

import { Check, ChevronDown, ChevronRight, Copy } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { Field } from '@/components/ui/Field';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { Textarea } from '@/components/ui/Textarea';

import { JsonErrorCallout } from './JsonErrorCallout';
import {
  byteLength,
  formatBytes,
  formatCount,
  getJsonStats,
  type JsonError,
  type JsonValue,
  parseJson,
} from './utils';

const MAX_VISIBLE_ROWS = 1500;
const MAX_EXPANDED_CONTAINERS = 5000;

type TreeNode = {
  path: string;
  label: string;
  value: JsonValue;
  depth: number;
  isRoot: boolean;
};

type TreeState = {
  value: JsonValue;
  bytes: number;
  depth: number;
  type: string;
};

type CopyTarget = {
  path: string;
  kind: 'path' | 'value';
};

type Frame = {
  node: TreeNode;
  index: number;
  array: boolean;
  keys?: string[];
};

const isContainer = (
  value: JsonValue
): value is JsonValue[] | Record<string, JsonValue> =>
  value !== null && typeof value === 'object';

const childPath = (parent: string, key: string, array: boolean): string => {
  if (array) {
    return `${parent}[${key}]`;
  }
  if (/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key)) {
    return `${parent}.${key}`;
  }
  return `${parent}[${JSON.stringify(key)}]`;
};

const buildRows = (
  root: JsonValue,
  expanded: Set<string>
): { rows: TreeNode[]; truncated: boolean } => {
  const rows: TreeNode[] = [];
  const frames: Frame[] = [];
  let truncated = false;

  const addNode = (node: TreeNode): boolean => {
    if (rows.length >= MAX_VISIBLE_ROWS) {
      truncated = true;
      return false;
    }

    rows.push(node);

    if (isContainer(node.value) && expanded.has(node.path)) {
      const array = Array.isArray(node.value);
      frames.push({
        node,
        array,
        index: 0,
        keys: array ? undefined : Object.keys(node.value),
      });
    }

    return true;
  };

  addNode({
    path: '$',
    label: '$',
    value: root,
    depth: 0,
    isRoot: true,
  });

  while (frames.length > 0) {
    const frame = frames[frames.length - 1]!;
    const length = frame.array
      ? (frame.node.value as JsonValue[]).length
      : (frame.keys?.length ?? 0);

    if (frame.index >= length) {
      frames.pop();
      continue;
    }

    const childIndex = frame.index;
    frame.index += 1;

    const key = frame.array
      ? String(childIndex)
      : (frame.keys?.[childIndex] ?? '');
    const childValue = frame.array
      ? (frame.node.value as JsonValue[])[childIndex]
      : (frame.node.value as Record<string, JsonValue>)[key];

    if (childValue === undefined) {
      continue;
    }

    const added = addNode({
      path: childPath(frame.node.path, key, frame.array),
      label: frame.array ? `[${key}]` : key,
      value: childValue,
      depth: frame.node.depth + 1,
      isRoot: false,
    });

    if (!added) {
      break;
    }
  }

  return { rows, truncated };
};

const collectContainers = (
  root: JsonValue,
  limit: number
): { paths: Set<string>; limited: boolean } => {
  const paths = new Set<string>(['$']);
  let limited = false;

  if (!isContainer(root)) {
    return { paths, limited };
  }

  const stack: Array<{ path: string; value: JsonValue }> = [
    { path: '$', value: root },
  ];

  while (stack.length > 0) {
    if (paths.size >= limit) {
      limited = true;
      break;
    }

    const item = stack.pop()!;
    if (!isContainer(item.value)) {
      continue;
    }

    if (Array.isArray(item.value)) {
      for (let index = 0; index < item.value.length; index += 1) {
        const child = item.value[index];
        if (child !== undefined && isContainer(child)) {
          const path = `${item.path}[${index}]`;
          paths.add(path);
          stack.push({ path, value: child });
          if (paths.size >= limit) {
            limited = true;
            break;
          }
        }
      }
    } else {
      const keys = Object.keys(item.value);
      for (let index = 0; index < keys.length; index += 1) {
        const key = keys[index];
        if (key === undefined) {
          continue;
        }
        const child = item.value[key];
        if (child !== undefined && isContainer(child)) {
          const path = childPath(item.path, key, false);
          paths.add(path);
          stack.push({ path, value: child });
          if (paths.size >= limit) {
            limited = true;
            break;
          }
        }
      }
    }
  }

  return { paths, limited };
};

const fallbackCopy = (value: string) => {
  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
};

const previewValue = (
  value: JsonValue,
  childCount: number
): { text: string; className: string } => {
  if (value === null) {
    return { text: 'null', className: 'text-fg-subtle' };
  }
  if (Array.isArray(value)) {
    return {
      text: `Array(${value.length})`,
      className: 'text-fg-muted',
    };
  }
  if (typeof value === 'object') {
    return {
      text: `Object {${childCount}}`,
      className: 'text-fg-muted',
    };
  }
  if (typeof value === 'string') {
    const quoted = JSON.stringify(value);
    return {
      text: quoted.length > 90 ? `${quoted.slice(0, 89)}…` : quoted,
      className: 'text-success',
    };
  }
  if (typeof value === 'number') {
    return { text: String(value), className: 'text-accent' };
  }
  return { text: value ? 'true' : 'false', className: 'text-attention' };
};

export default function JsonTreeViewer() {
  const [source, setSource] = useState('');
  const [tree, setTree] = useState<TreeState | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [expandNotice, setExpandNotice] = useState<string | null>(null);
  const [error, setError] = useState<JsonError | null>(null);
  const [inputError, setInputError] = useState<string | null>(null);
  const [copied, setCopied] = useState<CopyTarget | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
    },
    []
  );

  const reset = () => {
    setTree(null);
    setExpanded(new Set());
    setExpandNotice(null);
    setError(null);
    setInputError(null);
    setCopied(null);
  };

  const build = () => {
    reset();

    if (!source.trim()) {
      setInputError('Enter some JSON to explore.');
      return;
    }

    const parsed = parseJson(source);
    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }

    const stats = getJsonStats(parsed.value);

    setTree({
      value: parsed.value,
      bytes: byteLength(source),
      depth: stats.depth,
      type: stats.type,
    });
    setExpanded(new Set(['$']));
  };

  const toggle = (path: string) => {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const expandAll = () => {
    if (!tree) {
      return;
    }

    const collected = collectContainers(tree.value, MAX_EXPANDED_CONTAINERS);
    setExpanded(collected.paths);
    setExpandNotice(
      collected.limited
        ? `Expanded the first ${formatCount(
            collected.paths.size
          )} containers. Larger documents are capped to keep the viewer responsive.`
        : null
    );
  };

  const collapseAll = () => {
    setExpanded(new Set());
    setExpandNotice(null);
  };

  const copyNode = async (node: TreeNode, kind: 'path' | 'value') => {
    const text =
      kind === 'path'
        ? node.path
        : typeof node.value === 'string'
          ? node.value
          : (JSON.stringify(node.value) ?? String(node.value));

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        fallbackCopy(text);
      }
    } catch {
      try {
        fallbackCopy(text);
      } catch {
        return;
      }
    }

    setCopied({ path: node.path, kind });
    if (timer.current) {
      clearTimeout(timer.current);
    }
    timer.current = setTimeout(() => setCopied(null), 1400);
  };

  const view = useMemo(
    () =>
      tree
        ? buildRows(tree.value, expanded)
        : { rows: [] as TreeNode[], truncated: false },
    [tree, expanded]
  );

  return (
    <div className="space-y-4">
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
              '{\n  "users": [\n    { "name": "Ada", "roles": ["admin"] },\n    { "name": "Grace", "roles": ["editor"] }\n  ],\n  "total": 2\n}'
            }
            spellCheck={false}
            value={source}
          />
        </Field>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={build} size="md" variant="primary">
            Build tree
          </Button>
          <Button disabled={!tree} onClick={expandAll} variant="default">
            Expand all
          </Button>
          <Button disabled={!tree} onClick={collapseAll} variant="default">
            Collapse all
          </Button>
          <Button
            disabled={!source && !tree && !error && !inputError}
            onClick={() => {
              setSource('');
              reset();
            }}
            variant="ghost"
          >
            Clear
          </Button>
        </div>

        <Callout className="mt-3" variant="info">
          Deep levels start collapsed and rendering is capped, so very large
          documents stay responsive. Hover a row to copy its path or value.
        </Callout>

        {inputError && (
          <Callout className="mt-3" variant="warning">
            {inputError}
          </Callout>
        )}

        {expandNotice && (
          <Callout className="mt-3" variant="warning">
            {expandNotice}
          </Callout>
        )}

        {tree && (
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="success">Valid JSON</Badge>
            <Badge>{formatBytes(tree.bytes)}</Badge>
            <Badge>Root: {tree.type}</Badge>
            <Badge>{formatCount(tree.depth)} levels</Badge>
            <Badge>{formatCount(view.rows.length)} visible rows</Badge>
          </div>
        )}
      </Panel>

      <ResultPanel
        className="min-h-[320px]"
        emptyText="Build a tree to explore your JSON."
        filename="tree.json"
        label="Tree view"
        mime="application/json;charset=utf-8"
        value={tree ? source : ''}
      >
        {error ? (
          <JsonErrorCallout error={error} />
        ) : tree ? (
          <div className="overflow-hidden rounded-md border border-border bg-canvas-inset">
            <div className="flex flex-wrap items-center gap-2 border-b border-border bg-canvas-subtle/50 px-3 py-2">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-fg-muted">
                {formatCount(view.rows.length)} rows visible
              </span>
              {view.truncated && (
                <Badge variant="warning">
                  Limited to {formatCount(MAX_VISIBLE_ROWS)}
                </Badge>
              )}
            </div>

            <div className="max-h-[520px] overflow-auto p-1.5">
              {view.rows.map((node) => {
                const array = Array.isArray(node.value);
                const container =
                  node.value !== null && typeof node.value === 'object';
                const childCount = container
                  ? array
                    ? (node.value as JsonValue[]).length
                    : Object.keys(node.value as Record<string, JsonValue>)
                        .length
                  : 0;
                const expandable = childCount > 0;
                const open = expanded.has(node.path);
                const preview = previewValue(node.value, childCount);
                const pathCopied =
                  copied?.path === node.path && copied.kind === 'path';
                const valueCopied =
                  copied?.path === node.path && copied.kind === 'value';

                return (
                  <div
                    className="group flex min-w-0 items-center gap-1 rounded px-1 py-0.5 font-mono text-xs hover:bg-surface-hover"
                    key={node.path}
                    style={{ paddingLeft: `${node.depth * 14 + 4}px` }}
                  >
                    {expandable ? (
                      <button
                        aria-expanded={open}
                        aria-label={`${open ? 'Collapse' : 'Expand'} ${
                          node.path
                        }`}
                        className="flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded text-fg-muted hover:bg-canvas-subtle hover:text-fg"
                        onClick={() => toggle(node.path)}
                        type="button"
                      >
                        {open ? (
                          <ChevronDown aria-hidden className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronRight aria-hidden className="h-3.5 w-3.5" />
                        )}
                      </button>
                    ) : (
                      <span className="h-5 w-5 shrink-0" />
                    )}

                    <span className="min-w-0 flex-1 truncate" title={node.path}>
                      {node.isRoot ? (
                        <span className="text-fg-muted">$</span>
                      ) : (
                        <>
                          <span className="text-fg">{node.label}</span>
                          <span className="text-fg-subtle">: </span>
                        </>
                      )}
                      <span className={preview.className}>{preview.text}</span>
                    </span>

                    <span className="flex shrink-0 items-center gap-0.5 opacity-100 transition-opacity sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
                      <Button
                        aria-label={`Copy path ${node.path}`}
                        className="h-6 w-6"
                        onClick={() => {
                          void copyNode(node, 'path');
                        }}
                        size="icon"
                        title="Copy path"
                        variant="ghost"
                      >
                        {pathCopied ? (
                          <Check className="h-3 w-3 text-success" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                      <Button
                        aria-label={`Copy value at ${node.path}`}
                        className="h-6 w-6"
                        onClick={() => {
                          void copyNode(node, 'value');
                        }}
                        size="icon"
                        title="Copy value"
                        variant="ghost"
                      >
                        {valueCopied ? (
                          <Check className="h-3 w-3 text-success" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : undefined}
      </ResultPanel>
    </div>
  );
}
