'use client';

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
  byteLength,
  countLines,
  formatBytes,
  makeSnippet,
  stripStringsAndComments,
  toErrorMessage,
} from './utils';

type MinifyResult = {
  output: string;
  originalBytes: number;
  outputBytes: number;
};

type MinifyError = {
  message: string;
  snippet?: string;
};

const looksLikeModule = (source: string): boolean => {
  const stripped = stripStringsAndComments(source);
  return /(^|[\n;])\s*(?:import|export)\b/.test(stripped);
};

export default function JsMinifier() {
  const [source, setSource] = useState('');
  const [compress, setCompress] = useState(true);
  const [mangle, setMangle] = useState(true);
  const [dropConsole, setDropConsole] = useState(false);
  const [dropDebugger, setDropDebugger] = useState(false);
  const [result, setResult] = useState<MinifyResult | null>(null);
  const [error, setError] = useState<MinifyError | null>(null);
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setResult(null);
    setError(null);
  };

  const minifySource = async () => {
    if (!source.trim()) {
      setResult(null);
      setError({ message: 'Enter some JavaScript to minify.' });
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const { minify } = await import('terser');

      if (typeof minify !== 'function') {
        throw new Error('Terser could not be loaded.');
      }

      const minified = await minify(source, {
        compress: compress
          ? {
              passes: 2,
              drop_console: dropConsole,
              drop_debugger: dropDebugger,
            }
          : false,
        mangle,
        format: {
          comments: false,
        },
        ecma: 2020,
        module: looksLikeModule(source),
      });

      if (!minified.code) {
        throw new Error('Terser returned no output.');
      }

      setResult({
        output: minified.code,
        originalBytes: byteLength(source),
        outputBytes: byteLength(minified.code),
      });
    } catch (minifyError) {
      const candidate = minifyError as {
        message?: unknown;
        line?: unknown;
        col?: unknown;
      };
      const line =
        typeof candidate.line === 'number' ? candidate.line : undefined;
      const column =
        typeof candidate.col === 'number' ? candidate.col + 1 : undefined;
      const message = toErrorMessage(minifyError);

      setError({
        message:
          line !== undefined && column !== undefined
            ? `${message.replace(/\s*\(line:.*$/i, '')} (line ${line}, column ${column})`
            : message,
        snippet:
          line !== undefined && column !== undefined
            ? makeSnippet(source, line, column)
            : undefined,
      });
    } finally {
      setBusy(false);
    }
  };

  const savings = result
    ? result.originalBytes > 0
      ? ((result.originalBytes - result.outputBytes) / result.originalBytes) *
        100
      : 0
    : 0;

  return (
    <div className="space-y-4">
      <ToolLayout>
        <Panel title="JavaScript">
          <Field
            hint={`${source.length.toLocaleString('en-US')} characters · ${countLines(
              source
            ).toLocaleString('en-US')} lines`}
            label="Source code"
          >
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

          <fieldset className="mt-4">
            <legend className="text-xs font-semibold text-fg">
              Minification options
            </legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {[
                {
                  checked: compress,
                  label: 'Compress',
                  setter: setCompress,
                },
                {
                  checked: mangle,
                  label: 'Mangle names',
                  setter: setMangle,
                },
                {
                  checked: dropConsole,
                  label: 'Drop console calls',
                  setter: setDropConsole,
                },
                {
                  checked: dropDebugger,
                  label: 'Drop debugger',
                  setter: setDropDebugger,
                },
              ].map((option) => (
                <label
                  className="flex w-fit cursor-pointer items-center gap-2 text-xs font-medium text-fg-muted"
                  key={option.label}
                >
                  <input
                    checked={option.checked}
                    className="h-3.5 w-3.5 accent-[var(--accent)]"
                    onChange={(event) => {
                      option.setter(event.target.checked);
                      reset();
                    }}
                    type="checkbox"
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              disabled={busy}
              onClick={minifySource}
              size="md"
              variant="primary"
            >
              {busy && <Spinner className="text-white" />}
              {busy ? 'Minifying…' : 'Minify JavaScript'}
            </Button>
            <Button
              disabled={!source && !result && !error}
              onClick={() => {
                setSource('');
                reset();
              }}
              variant="default"
            >
              Clear
            </Button>
          </div>

          {error && (
            <div className="mt-3 space-y-3">
              <Callout title="Could not minify" variant="error">
                {error.message}
              </Callout>
              {error.snippet && (
                <pre className="overflow-auto rounded-md border border-border bg-canvas-inset p-3 text-[12px] leading-5 text-fg">
                  {error.snippet}
                </pre>
              )}
            </div>
          )}

          {result && (
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge
                variant={
                  result.outputBytes <= result.originalBytes
                    ? 'success'
                    : 'warning'
                }
              >
                {savings >= 0 ? '−' : '+'}
                {Math.abs(savings).toFixed(1)}%
              </Badge>
              <Badge>
                {formatBytes(result.originalBytes)} →{' '}
                {formatBytes(result.outputBytes)}
              </Badge>
              <Badge>{countLines(result.output)} lines</Badge>
            </div>
          )}
        </Panel>

        <ResultPanel
          emptyText="Minified JavaScript will appear here."
          filename="minified.js"
          label="Minified JavaScript"
          mime="text/javascript;charset=utf-8"
          value={result?.output ?? ''}
        />
      </ToolLayout>
    </div>
  );
}
