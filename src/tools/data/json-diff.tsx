'use client';

import { ArrowLeftRight, FlaskConical } from 'lucide-react';
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
  briefValue,
  isPlainObject,
  parseJsonText,
  prettyJson,
} from './_shared';

type ChangeType = 'added' | 'removed' | 'changed';

type Change = {
  path: string;
  type: ChangeType;
  before?: unknown;
  after?: unknown;
};

const beforeSample = `{
  "name": "CoderTools",
  "version": "2.0.0",
  "private": true,
  "features": ["json", "yaml", "csv"],
  "server": {
    "port": 3000,
    "host": "localhost",
    "tls": false
  },
  "deprecatedFlag": "remove-me"
}`;

const afterSample = `{
  "name": "CoderTools",
  "version": "3.0.0",
  "private": true,
  "license": "MIT",
  "features": ["json", "yaml", "csv", "toml"],
  "server": {
    "port": 8080,
    "host": "localhost",
    "tls": true
  }
}`;

function childPath(base: string, key: string): string {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key)
    ? `${base}.${key}`
    : `${base}[${JSON.stringify(key)}]`;
}

function diffValues(
  before: unknown,
  after: unknown,
  path: string,
  changes: Change[],
  depth = 0
) {
  if (changes.length >= 2000) {
    return;
  }
  if (Object.is(before, after)) {
    return;
  }
  if (depth > 80) {
    changes.push({ path, type: 'changed', before, after });
    return;
  }

  if (isPlainObject(before) && isPlainObject(after)) {
    const beforeKeys = Object.keys(before);
    const afterKeys = Object.keys(after);
    const afterSet = new Set(afterKeys);
    const beforeSet = new Set(beforeKeys);

    for (const key of beforeKeys) {
      const keyPath = childPath(path, key);
      if (!afterSet.has(key)) {
        changes.push({ path: keyPath, type: 'removed', before: before[key] });
      } else {
        diffValues(before[key], after[key], keyPath, changes, depth + 1);
      }
    }
    for (const key of afterKeys) {
      if (!beforeSet.has(key)) {
        changes.push({
          path: childPath(path, key),
          type: 'added',
          after: after[key],
        });
      }
    }
    return;
  }

  if (Array.isArray(before) && Array.isArray(after)) {
    const length = Math.max(before.length, after.length);
    for (let index = 0; index < length; index += 1) {
      const indexValueBefore = before[index];
      const indexValueAfter = after[index];
      const indexPath = `${path}[${index}]`;
      if (index >= before.length) {
        changes.push({
          path: indexPath,
          type: 'added',
          after: indexValueAfter,
        });
      } else if (index >= after.length) {
        changes.push({
          path: indexPath,
          type: 'removed',
          before: indexValueBefore,
        });
      } else {
        diffValues(
          indexValueBefore,
          indexValueAfter,
          indexPath,
          changes,
          depth + 1
        );
      }
    }
    return;
  }

  changes.push({ path, type: 'changed', before, after });
}

function changeBadge(type: ChangeType) {
  if (type === 'added') {
    return <Badge variant="success">added</Badge>;
  }
  if (type === 'removed') {
    return <Badge variant="danger">removed</Badge>;
  }
  return <Badge variant="warning">changed</Badge>;
}

export default function JsonDiffTool() {
  const [beforeText, setBeforeText] = useState(beforeSample);
  const [afterText, setAfterText] = useState(afterSample);

  const parsedBefore = useMemo(
    () => (beforeText.trim() ? parseJsonText(beforeText) : null),
    [beforeText]
  );
  const parsedAfter = useMemo(
    () => (afterText.trim() ? parseJsonText(afterText) : null),
    [afterText]
  );

  const bothValid = parsedBefore?.ok === true && parsedAfter?.ok === true;

  const changes = useMemo(() => {
    if (!bothValid) {
      return [] as Change[];
    }
    const list: Change[] = [];
    if (parsedBefore?.ok && parsedAfter?.ok) {
      diffValues(parsedBefore.value, parsedAfter.value, '$', list);
    }
    return list;
  }, [bothValid, parsedAfter, parsedBefore]);

  const error =
    (parsedBefore && !parsedBefore.ok
      ? `Left JSON: ${parsedBefore.error}`
      : null) ??
    (parsedAfter && !parsedAfter.ok
      ? `Right JSON: ${parsedAfter.error}`
      : null);

  const added = changes.filter((change) => change.type === 'added').length;
  const removed = changes.filter((change) => change.type === 'removed').length;
  const changed = changes.filter((change) => change.type === 'changed').length;
  const output = bothValid ? prettyJson(changes) : '';

  return (
    <div className="space-y-4">
      <ToolLayout>
        <Panel title="Documents">
          <div className="space-y-3">
            <Field
              error={
                parsedBefore && !parsedBefore.ok
                  ? parsedBefore.error
                  : undefined
              }
              hint={`${beforeText.length.toLocaleString()} characters`}
              htmlFor="json-diff-before"
              label="Original JSON"
            >
              <Textarea
                className="min-h-[160px]"
                id="json-diff-before"
                onChange={(event) => setBeforeText(event.target.value)}
                placeholder="Paste the original JSON here…"
                spellCheck={false}
                value={beforeText}
              />
            </Field>
            <Field
              error={
                parsedAfter && !parsedAfter.ok ? parsedAfter.error : undefined
              }
              hint={`${afterText.length.toLocaleString()} characters`}
              htmlFor="json-diff-after"
              label="Updated JSON"
            >
              <Textarea
                className="min-h-[160px]"
                id="json-diff-after"
                onChange={(event) => setAfterText(event.target.value)}
                placeholder="Paste the updated JSON here…"
                spellCheck={false}
                value={afterText}
              />
            </Field>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              onClick={() => {
                setBeforeText(beforeSample);
                setAfterText(afterSample);
              }}
              size="sm"
              variant="ghost"
            >
              <FlaskConical aria-hidden className="h-3.5 w-3.5" />
              Load example
            </Button>
            <Button
              onClick={() => {
                setBeforeText(afterText);
                setAfterText(beforeText);
              }}
              size="sm"
            >
              <ArrowLeftRight aria-hidden className="h-3.5 w-3.5" />
              Swap sides
            </Button>
          </div>

          {bothValid && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge variant={changes.length === 0 ? 'success' : 'accent'}>
                {changes.length === 0
                  ? 'No differences'
                  : `${changes.length} difference${changes.length === 1 ? '' : 's'}`}
              </Badge>
              {added > 0 && <Badge variant="success">{added} added</Badge>}
              {removed > 0 && <Badge variant="danger">{removed} removed</Badge>}
              {changed > 0 && (
                <Badge variant="warning">{changed} changed</Badge>
              )}
            </div>
          )}

          {error && (
            <Callout className="mt-3" title="Invalid JSON" variant="error">
              {error}
            </Callout>
          )}

          <p className="mt-3 text-xs leading-5 text-fg-muted">
            Comparison is structural: object key order is ignored, arrays are
            compared by index, and changed values list both the old and new
            value. The result is limited to 2,000 changes.
          </p>
        </Panel>

        <ResultPanel
          emptyText="Paste two JSON documents to compare them."
          error={error}
          filename="json-diff.json"
          label="Structural differences"
          mime="application/json"
          value={output}
        >
          {bothValid ? (
            changes.length === 0 ? (
              <Callout variant="success" title="Documents are equivalent">
                No structural differences were found between the two JSON
                documents.
              </Callout>
            ) : (
              <ol className="max-h-[500px] space-y-2 overflow-auto pr-1">
                {changes.map((change, index) => (
                  <li
                    className="rounded-md border border-border bg-canvas-inset/60 p-2.5"
                    key={`${change.path}-${change.type}-${index}`}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      {changeBadge(change.type)}
                      <code className="break-all text-xs text-fg">
                        {change.path}
                      </code>
                    </div>
                    <div className="mt-2 grid gap-1 text-[11px] leading-5">
                      {change.type !== 'added' && (
                        <div className="flex gap-2">
                          <span className="w-12 shrink-0 text-fg-subtle">
                            before
                          </span>
                          <code className="min-w-0 break-all text-danger">
                            {change.before === undefined
                              ? 'undefined'
                              : briefValue(change.before, 220)}
                          </code>
                        </div>
                      )}
                      {change.type !== 'removed' && (
                        <div className="flex gap-2">
                          <span className="w-12 shrink-0 text-fg-subtle">
                            after
                          </span>
                          <code className="min-w-0 break-all text-success">
                            {change.after === undefined
                              ? 'undefined'
                              : briefValue(change.after, 220)}
                          </code>
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            )
          ) : undefined}
        </ResultPanel>
      </ToolLayout>
    </div>
  );
}
