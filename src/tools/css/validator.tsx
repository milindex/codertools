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

import { cssIssueReportText, validateCss } from './css-utils';

const SAMPLE = `@unknown-feature screen {
  .card {
    color red;
    background: #ffffff;
    padding: 16px;
  }
}

.broken {
  border: 1px solid #d0d7de;
  font-family: "Open Sans;
}

@media (min-width: 768px) {
  .broken {
    display: grid;
  }
`;

type Report = ReturnType<typeof validateCss>;

export default function CssValidator() {
  const [input, setInput] = useState('');
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validate = () => {
    if (!input.trim()) {
      setReport(null);
      setError('Paste some CSS to validate.');
      return;
    }
    setError(null);
    try {
      setReport(validateCss(input));
    } catch {
      setReport(null);
      setError('The CSS could not be analyzed.');
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
          htmlFor="css-validator-input"
          label="CSS source"
        >
          <Textarea
            id="css-validator-input"
            onChange={(event) => {
              setInput(event.target.value);
              setReport(null);
              setError(null);
            }}
            placeholder=".card { color: red; }"
            rows={16}
            value={input}
          />
        </Field>

        <div className="mt-3 flex flex-wrap gap-2">
          <Button onClick={validate} variant="primary">
            Validate CSS
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
          This is a syntax and structure checker, not the W3C CSS Validator. It
          reports brace balance, unterminated comments and strings, unknown
          at-rules, invalid declaration syntax and duplicate properties within a
          block.
        </Callout>

        {error && (
          <Callout className="mt-3" variant="error">
            {error}
          </Callout>
        )}
      </Panel>

      <ResultPanel
        emptyText="Run the validator to see CSS syntax issues."
        error={error}
        filename="css-validation.txt"
        label="Validation report"
        value={report ? cssIssueReportText(report.issues) : ''}
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
              <Badge>{report.ruleCount} blocks checked</Badge>
              <Badge>{report.declarationCount} declarations</Badge>
            </div>

            {report.issues.length === 0 ? (
              <Callout variant="success" title="No syntax issues found">
                Braces, strings, comments, at-rules and declarations look
                structurally sound. This does not guarantee that every property
                or value is valid CSS.
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
