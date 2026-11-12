'use client';

import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Callout } from '@/components/ui/Callout';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { ToolLayout } from '@/components/ui/ToolLayout';

const COMMIT_TYPES = [
  { value: 'feat', label: 'feat — a new feature' },
  { value: 'fix', label: 'fix — a bug fix' },
  { value: 'docs', label: 'docs — documentation only' },
  { value: 'style', label: 'style — formatting, no logic change' },
  { value: 'refactor', label: 'refactor — code change, no feature or fix' },
  { value: 'perf', label: 'perf — performance improvement' },
  { value: 'test', label: 'test — add or fix tests' },
  { value: 'build', label: 'build — build system or dependencies' },
  { value: 'ci', label: 'ci — CI configuration' },
  { value: 'chore', label: 'chore — maintenance work' },
  { value: 'revert', label: 'revert — revert an earlier commit' },
];

const MAX_HEADER = 72;

export default function ConventionalCommit() {
  const [type, setType] = useState('feat');
  const [scope, setScope] = useState('');
  const [description, setDescription] = useState('');
  const [body, setBody] = useState('');
  const [footer, setFooter] = useState('');
  const [breaking, setBreaking] = useState(false);
  const [breakingNote, setBreakingNote] = useState('');

  const trimmedDescription = description.trim();
  const trimmedScope = scope.trim();

  const header = useMemo(() => {
    const scopePart = trimmedScope ? `(${trimmedScope})` : '';
    const breakingMark = breaking ? '!' : '';
    return `${type}${scopePart}${breakingMark}: ${trimmedDescription}`;
  }, [type, trimmedScope, breaking, trimmedDescription]);

  const message = useMemo(() => {
    if (!trimmedDescription) {
      return '';
    }
    const sections = [header];
    if (body.trim()) {
      sections.push(body.trim());
    }
    const footers: string[] = [];
    if (breaking && breakingNote.trim()) {
      footers.push(`BREAKING CHANGE: ${breakingNote.trim()}`);
    }
    if (footer.trim()) {
      footers.push(footer.trim());
    }
    if (footers.length > 0) {
      sections.push(footers.join('\n'));
    }
    return sections.join('\n\n');
  }, [header, trimmedDescription, body, breaking, breakingNote, footer]);

  const headerTooLong = header.length > MAX_HEADER;
  const invalidScope =
    trimmedScope.length > 0 && !/^[\w./-]+$/.test(trimmedScope);

  return (
    <div className="space-y-4">
      <ToolLayout>
        <Panel
          description="Fill in the parts of a Conventional Commit. The message is generated as you type."
          title="Commit fields"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Type" htmlFor="cc-type">
              <Select
                id="cc-type"
                onChange={(event) => setType(event.target.value)}
                value={type}
              >
                {COMMIT_TYPES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </Select>
            </Field>

            <Field
              hint={
                invalidScope ? 'Use letters, numbers, ., _, / or -' : 'Optional'
              }
              htmlFor="cc-scope"
              label="Scope"
            >
              <Input
                id="cc-scope"
                onChange={(event) => setScope(event.target.value)}
                placeholder="parser, api, deps…"
                value={scope}
              />
            </Field>
          </div>

          <Field
            className="mt-4"
            error={
              headerTooLong
                ? `The header is ${header.length} characters. Keep it at ${MAX_HEADER} or fewer.`
                : undefined
            }
            hint={`${header.length}/${MAX_HEADER} characters`}
            htmlFor="cc-description"
            label="Description"
          >
            <Input
              id="cc-description"
              onChange={(event) => setDescription(event.target.value)}
              placeholder="add retry handling to the HTTP client"
              value={description}
            />
          </Field>

          <Field
            className="mt-4"
            hint="Optional — explain what and why"
            htmlFor="cc-body"
            label="Body"
          >
            <Textarea
              className="min-h-[110px]"
              id="cc-body"
              onChange={(event) => setBody(event.target.value)}
              placeholder="Requests are retried twice with exponential backoff."
              value={body}
            />
          </Field>

          <Field
            className="mt-4"
            hint="Optional — issue references, co-authors, etc."
            htmlFor="cc-footer"
            label="Footer"
          >
            <Textarea
              className="min-h-[80px]"
              id="cc-footer"
              onChange={(event) => setFooter(event.target.value)}
              placeholder="Closes #42"
              value={footer}
            />
          </Field>

          <div className="mt-4 rounded-md border border-border bg-canvas-subtle/50 p-3">
            <label className="flex cursor-pointer items-start gap-2 text-sm text-fg">
              <input
                checked={breaking}
                className="mt-1 accent-[var(--accent)]"
                onChange={(event) => setBreaking(event.target.checked)}
                type="checkbox"
              />
              <span>
                <span className="font-semibold">Breaking change</span>
                <span className="block text-xs text-fg-muted">
                  Adds <code>!</code> before the colon and a{' '}
                  <code>BREAKING CHANGE:</code> footer.
                </span>
              </span>
            </label>
            {breaking && (
              <Field
                className="mt-3"
                hint="What breaks and how to migrate"
                htmlFor="cc-breaking"
                label="Breaking change details"
              >
                <Textarea
                  className="min-h-[70px]"
                  id="cc-breaking"
                  onChange={(event) => setBreakingNote(event.target.value)}
                  placeholder="Drops support for Node 16."
                  value={breakingNote}
                />
              </Field>
            )}
          </div>

          {invalidScope && (
            <Callout className="mt-3" variant="error">
              The scope contains characters that are not recommended. Use
              letters, numbers, dots, underscores, slashes or hyphens.
            </Callout>
          )}
          {!trimmedDescription && (
            <Callout className="mt-3" variant="info">
              Add a description to generate the commit message.
            </Callout>
          )}
          {headerTooLong && (
            <Callout className="mt-3" variant="warning">
              Many projects enforce a {MAX_HEADER}-character subject line.
              Shorten the description or move detail into the body.
            </Callout>
          )}
        </Panel>

        <div className="space-y-4">
          <ResultPanel
            emptyText="Your commit message will appear here."
            filename="commit-message.txt"
            label="Commit message"
            value={message}
          />

          <Panel title="Preview">
            <div className="rounded-md border border-border bg-canvas-inset p-3">
              <p className="break-words font-mono text-sm leading-6 text-fg">
                <span className="text-done">{type}</span>
                {trimmedScope && (
                  <span className="text-accent">({trimmedScope})</span>
                )}
                {breaking && <span className="text-danger">!</span>}
                <span className="text-fg-muted">: </span>
                {trimmedDescription || (
                  <span className="text-fg-subtle">description</span>
                )}
              </p>
              {body.trim() && (
                <p className="mt-2 whitespace-pre-wrap border-t border-border pt-2 text-xs leading-5 text-fg-muted">
                  {body.trim()}
                </p>
              )}
              {(footer.trim() || (breaking && breakingNote.trim())) && (
                <div className="mt-2 space-y-1 border-t border-border pt-2 text-xs leading-5 text-fg-muted">
                  {breaking && breakingNote.trim() && (
                    <p>
                      <span className="font-semibold text-danger">
                        BREAKING CHANGE:
                      </span>{' '}
                      {breakingNote.trim()}
                    </p>
                  )}
                  {footer.trim() && (
                    <p className="whitespace-pre-wrap">{footer.trim()}</p>
                  )}
                </div>
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="accent">{type}</Badge>
              {trimmedScope && <Badge>scope: {trimmedScope}</Badge>}
              {breaking && <Badge variant="danger">breaking</Badge>}
              <Badge variant={headerTooLong ? 'warning' : 'success'}>
                {header.length} chars
              </Badge>
            </div>
          </Panel>
        </div>
      </ToolLayout>
    </div>
  );
}
