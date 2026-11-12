'use client';

import { useState } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { Field } from '@/components/ui/Field';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { Textarea } from '@/components/ui/Textarea';
import { ToolLayout } from '@/components/ui/ToolLayout';

import { issueReportText, validateHtml } from './html-utils';

const SAMPLE = `<!doctype html>
<html lang="en">
  <head>
    <title>Validation demo</title>
  </head>
  <body>
    <div id="main">
      <p>This paragraph is never closed.
      <img src="photo.jpg">
      <span>Nested <b>markup</b></span>
    </div>
    <div id="main">Duplicate id</div>
    <p><div>Block inside a paragraph</div></p>
  </body>
</html>`;

type Report = ReturnType<typeof validateHtml>;

export default function HtmlValidator() {
  const [input, setInput] = useState('');
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validate = () => {
    if (!input.trim()) {
      setReport(null);
      setError('Paste some HTML to validate.');
      return;
    }
    setError(null);
    try {
      setReport(validateHtml(input));
    } catch {
      setReport(null);
      setError('The HTML could not be analyzed.');
    }
  };

  const errors =
    report?.issues.filter((issue) => issue.severity === 'error') ?? [];
  const warnings =
    report?.issues.filter((issue) => issue.severity === 'warning') ?? [];

  return (
    <ToolLayout>
      <Panel title="Input">
        <Field
          hint={`${input.length.toLocaleString()} characters`}
          htmlFor="html-validator-input"
          label="HTML source"
        >
          <Textarea
            id="html-validator-input"
            onChange={(event) => {
              setInput(event.target.value);
              setReport(null);
              setError(null);
            }}
            placeholder="<!doctype html>…"
            rows={16}
            value={input}
          />
        </Field>

        <div className="mt-3 flex flex-wrap gap-2">
          <Button onClick={validate} variant="primary">
            Validate HTML
          </Button>
          <Button
            onClick={() => {
              setInput(SAMPLE);
              setReport(null);
              setError(null);
            }}
            variant="default"
          >
            Load demo
          </Button>
          <Button
            onClick={() => {
              setInput('');
              setReport(null);
              setError(null);
            }}
            variant="ghost"
          >
            Clear
          </Button>
        </div>

        <Callout className="mt-3" variant="info">
          This is a structural linter, not the official W3C validator. It checks
          tag balance, duplicate ids, malformed attributes and a few nesting
          rules. It does not validate against an HTML specification.
        </Callout>

        {error && (
          <Callout className="mt-3" variant="error">
            {error}
          </Callout>
        )}
      </Panel>

      <ResultPanel
        emptyText="Run the validator to see structural issues."
        error={error}
        filename="html-validation.txt"
        label="Validation report"
        value={report ? issueReportText(report.issues) : ''}
      >
        {report ? (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge variant={errors.length > 0 ? 'danger' : 'success'}>
                {errors.length} error{errors.length === 1 ? '' : 's'}
              </Badge>
              <Badge variant={warnings.length > 0 ? 'warning' : 'default'}>
                {warnings.length} warning{warnings.length === 1 ? '' : 's'}
              </Badge>
              <Badge>{report.tagCount} tags checked</Badge>
              <Badge>{report.idCount} ids</Badge>
            </div>

            {report.issues.length === 0 ? (
              <Callout variant="success" title="No structural issues found">
                Tag balance, ids and the basic nesting checks look clean. This
                does not guarantee that the document is valid HTML.
              </Callout>
            ) : (
              <ul className="space-y-2">
                {report.issues.map((issue, index) => (
                  <li
                    className="rounded-md border border-border bg-canvas-inset p-3"
                    key={`${issue.line ?? 0}-${index}-${issue.message}`}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant={
                          issue.severity === 'error' ? 'danger' : 'warning'
                        }
                      >
                        {issue.severity}
                      </Badge>
                      {issue.line !== undefined && (
                        <span className="text-xs text-fg-muted">
                          Line {issue.line}
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 text-sm leading-6 text-fg">
                      {issue.message}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : undefined}
      </ResultPanel>
    </ToolLayout>
  );
}
