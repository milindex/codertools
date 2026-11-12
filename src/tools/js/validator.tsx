'use client';

import type { Plugin } from 'prettier';
import { useState } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { Field } from '@/components/ui/Field';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { Spinner } from '@/components/ui/Spinner';
import { Textarea } from '@/components/ui/Textarea';
import { ToolLayout } from '@/components/ui/ToolLayout';

import {
  countLines,
  makeSnippet,
  stripStringsAndComments,
  toErrorMessage,
} from './utils';

type ValidationResult = {
  valid: boolean;
  mode: 'script' | 'module';
  message: string;
  line?: number;
  column?: number;
  snippet?: string;
  warnings: string[];
};

type Location = {
  line?: number;
  column?: number;
};

const warningRules: Array<{ message: string; pattern: RegExp }> = [
  {
    message: 'debugger statement left in the code',
    pattern: /\bdebugger\b/g,
  },
  {
    message: 'eval() executes arbitrary code',
    pattern: /\beval\s*\(/g,
  },
  {
    message: 'new Function() compiles code at runtime',
    pattern: /\bnew\s+Function\s*\(/g,
  },
  {
    message: 'document.write() can overwrite the page',
    pattern: /\bdocument\.write\s*\(/g,
  },
  {
    message: 'loose equality (==) can trigger type coercion',
    pattern: /(^|[^=!<>])==(?!=)/g,
  },
  {
    message: 'loose inequality (!=) can trigger type coercion',
    pattern: /(^|[^=!<>])!=(?!=)/g,
  },
  {
    message: 'var declarations are function-scoped',
    pattern: /\bvar\s+[A-Za-z_$]/g,
  },
  {
    message: 'console logging left in the code',
    pattern: /\bconsole\.(?:log|debug|trace|info)\s*\(/g,
  },
  {
    message: 'with statement makes scope resolution ambiguous',
    pattern: /\bwith\s*\(/g,
  },
  {
    message: 'alert() blocks the browser UI',
    pattern: /\balert\s*\(/g,
  },
];

const collectWarnings = (source: string): string[] => {
  const stripped = stripStringsAndComments(source);
  const warnings: string[] = [];

  for (const rule of warningRules) {
    const matches = stripped.match(rule.pattern);
    if (matches && matches.length > 0) {
      warnings.push(
        matches.length > 1
          ? `${rule.message} (${matches.length} occurrences)`
          : rule.message
      );
    }
  }

  return warnings;
};

const looksLikeModule = (source: string): boolean => {
  const stripped = stripStringsAndComments(source);
  return (
    /(^|[\n;])\s*(?:import|export)\b/.test(stripped) ||
    /(^|[\n;])\s*await\b/.test(stripped)
  );
};

const locationFromError = (error: unknown, lineOffset = 0): Location => {
  if (!error || typeof error !== 'object') {
    return {};
  }

  const candidate = error as {
    column?: unknown;
    columnNumber?: unknown;
    line?: unknown;
    lineNumber?: unknown;
    loc?: {
      start?: {
        column?: unknown;
        line?: unknown;
      };
    };
    message?: unknown;
    stack?: unknown;
  };

  const location = candidate.loc?.start;
  if (
    typeof location?.line === 'number' &&
    typeof location.column === 'number'
  ) {
    return { line: location.line, column: location.column };
  }

  if (
    typeof candidate.line === 'number' &&
    typeof candidate.column === 'number'
  ) {
    return { line: candidate.line, column: candidate.column };
  }

  if (
    typeof candidate.lineNumber === 'number' &&
    typeof candidate.columnNumber === 'number'
  ) {
    return {
      line: candidate.lineNumber,
      column: candidate.columnNumber,
    };
  }

  if (typeof candidate.stack === 'string') {
    const matches = [...candidate.stack.matchAll(/<anonymous>:(\d+):(\d+)/g)];
    const match = matches[matches.length - 1];

    if (match?.[1] && match[2]) {
      const line = Number(match[1]) - lineOffset;
      if (line >= 1) {
        return { line, column: Number(match[2]) };
      }
    }

    const generic = /:(\d+):(\d+)/.exec(candidate.stack);
    if (generic?.[1] && generic[2]) {
      const line = Number(generic[1]) - lineOffset;
      if (line >= 1) {
        return { line, column: Number(generic[2]) };
      }
    }
  }

  if (typeof candidate.message === 'string') {
    const match = /line[:\s]+(\d+)(?:[,\s]+col(?:umn)?[:\s]+(\d+))?/i.exec(
      candidate.message
    );
    if (match?.[1]) {
      return {
        line: Number(match[1]),
        column: match[2] ? Number(match[2]) : undefined,
      };
    }
  }

  return {};
};

const cleanPrettierMessage = (message: string): string => {
  const firstLine = message.split('\n')[0] ?? message;
  return firstLine.replace(/\s*\(\d+:\d+\)\s*$/, '').trim() || 'Syntax error.';
};

export default function JsValidator() {
  const [source, setSource] = useState('');
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [inputError, setInputError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setResult(null);
    setInputError(null);
  };

  const validate = async () => {
    if (!source.trim()) {
      setResult(null);
      setInputError('Enter some JavaScript to validate.');
      return;
    }

    setBusy(true);
    setInputError(null);
    setResult(null);

    const warnings = collectWarnings(source);
    let scriptError: unknown = null;

    try {
      // Parse only: constructing the function compiles the source without
      // executing any of it.
      new Function(source);
    } catch (error) {
      scriptError = error;
    }

    if (!scriptError) {
      setResult({
        valid: true,
        mode: 'script',
        message:
          'The source parses as JavaScript. No code was executed during validation.',
        warnings,
      });
      setBusy(false);
      return;
    }

    try {
      const [prettier, babelPlugin, estreePlugin] = await Promise.all([
        import('prettier/standalone'),
        import('prettier/plugins/babel'),
        import('prettier/plugins/estree'),
      ]);

      await prettier.format(source, {
        parser: 'babel',
        plugins: [
          babelPlugin as unknown as Plugin,
          estreePlugin as unknown as Plugin,
        ],
        printWidth: 80,
      });

      const scriptMessage = toErrorMessage(scriptError);
      const moduleSyntaxError =
        /import statement outside a module|unexpected token 'export'|await is only valid|import\.meta|cannot use import statement/i.test(
          scriptMessage
        );

      if (looksLikeModule(source) || moduleSyntaxError) {
        setResult({
          valid: true,
          mode: 'module',
          message:
            'The source parses successfully. Module syntax was checked with Prettier, and no code was executed.',
          warnings,
        });
      } else {
        const location = locationFromError(scriptError, 2);
        setResult({
          valid: false,
          mode: 'script',
          message: scriptMessage,
          line: location.line,
          column: location.column,
          snippet:
            location.line !== undefined && location.column !== undefined
              ? makeSnippet(source, location.line, location.column)
              : undefined,
          warnings,
        });
      }
    } catch (prettierError) {
      const prettierLocation = locationFromError(prettierError);
      const scriptLocation = locationFromError(scriptError, 2);
      const hasPrettierLocation = prettierLocation.line !== undefined;
      const location = hasPrettierLocation ? prettierLocation : scriptLocation;
      const message = hasPrettierLocation
        ? cleanPrettierMessage(toErrorMessage(prettierError))
        : toErrorMessage(scriptError);

      setResult({
        valid: false,
        mode: 'script',
        message,
        line: location.line,
        column: location.column,
        snippet:
          location.line !== undefined && location.column !== undefined
            ? makeSnippet(source, location.line, location.column)
            : undefined,
        warnings,
      });
    } finally {
      setBusy(false);
    }
  };

  const report = result
    ? result.valid
      ? `Valid JavaScript${result.mode === 'module' ? ' module' : ''} syntax. No code was executed.${
          result.warnings.length > 0
            ? `\n\nPossible issues:\n${result.warnings
                .map((warning) => `- ${warning}`)
                .join('\n')}`
            : ''
        }`
      : `Syntax error: ${result.message}${
          result.line !== undefined && result.column !== undefined
            ? ` (line ${result.line}, column ${result.column})`
            : ''
        }`
    : '';

  return (
    <div className="space-y-4">
      <ToolLayout>
        <Panel title="JavaScript">
          <Field hint={`${countLines(source)} lines`} label="Source code">
            <Textarea
              aria-label="JavaScript source code"
              onChange={(event) => {
                setSource(event.target.value);
                reset();
              }}
              placeholder={'function add(a, b) {\n  return a + b;\n}'}
              spellCheck={false}
              value={source}
            />
          </Field>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              disabled={busy}
              onClick={validate}
              size="md"
              variant="primary"
            >
              {busy && <Spinner className="text-white" />}
              {busy ? 'Validating…' : 'Validate JavaScript'}
            </Button>
            <Button
              disabled={!source && !result && !inputError}
              onClick={() => {
                setSource('');
                reset();
              }}
              variant="default"
            >
              Clear
            </Button>
          </div>

          <Callout className="mt-3" variant="info">
            Validation only parses the code. Nothing is executed and nothing
            leaves your browser.
          </Callout>

          {inputError && (
            <Callout className="mt-3" variant="warning">
              {inputError}
            </Callout>
          )}
        </Panel>

        <ResultPanel
          emptyText="Validation results will appear here."
          filename="js-validation.txt"
          label="Validation result"
          value={report}
        >
          {result ? (
            <div className="space-y-3">
              {result.valid ? (
                <Callout title="Valid JavaScript" variant="success">
                  {result.message}
                </Callout>
              ) : (
                <div className="space-y-3">
                  <Callout title="Syntax error" variant="error">
                    <p>{result.message}</p>
                    {result.line !== undefined &&
                      result.column !== undefined && (
                        <p className="mt-1 text-xs">
                          Line {result.line}, column {result.column}
                        </p>
                      )}
                  </Callout>
                  {result.snippet && (
                    <pre className="overflow-auto rounded-md border border-border bg-canvas-inset p-3 text-[12px] leading-5 text-fg">
                      {result.snippet}
                    </pre>
                  )}
                </div>
              )}

              {result.warnings.length > 0 ? (
                <div className="rounded-md border border-border bg-canvas-subtle/40 p-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="warning">Review</Badge>
                    <span className="text-xs font-semibold text-fg">
                      {result.warnings.length} possible issue
                      {result.warnings.length === 1 ? '' : 's'}
                    </span>
                  </div>
                  <ul className="mt-2 space-y-1 text-xs leading-5 text-fg-muted">
                    {result.warnings.map((warning) => (
                      <li key={warning}>• {warning}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                result.valid && (
                  <p className="text-xs text-fg-muted">
                    No common code-quality issues detected.
                  </p>
                )
              )}
            </div>
          ) : undefined}
        </ResultPanel>
      </ToolLayout>
    </div>
  );
}
