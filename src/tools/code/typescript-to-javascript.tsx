'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { Field } from '@/components/ui/Field';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import { Textarea } from '@/components/ui/Textarea';
import { ToolLayout } from '@/components/ui/ToolLayout';

import { errorMessage } from './_shared';

const EXAMPLE = `type User = {
  id: string;
  name: string;
  role?: 'admin' | 'member';
};

interface ApiResponse<T> {
  data: T;
  error: string | null;
}

export async function getUser(id: string): Promise<User | null> {
  const response = await fetch(\`/api/users/\${id}\`);
  const payload: ApiResponse<User> = await response.json();
  return payload.error ? null : payload.data;
}`;

const TARGETS = ['ES5', 'ES2015', 'ES2020', 'ES2022', 'ESNext'] as const;
const MODULES = ['None', 'CommonJS', 'ES2015', 'ES2020', 'ESNext'] as const;
const JSX_MODES = ['Preserve', 'React', 'ReactJSX', 'ReactJSXDev'] as const;

type Target = (typeof TARGETS)[number];
type ModuleKind = (typeof MODULES)[number];
type JsxMode = (typeof JSX_MODES)[number];
type InputLanguage = 'ts' | 'tsx';

export default function TypescriptToJavascriptTool() {
  const [input, setInput] = useState('');
  const [target, setTarget] = useState<Target>('ES2020');
  const [moduleKind, setModuleKind] = useState<ModuleKind>('ESNext');
  const [jsx, setJsx] = useState<JsxMode>('ReactJSX');
  const [inputLanguage, setInputLanguage] = useState<InputLanguage>('ts');
  const [removeComments, setRemoveComments] = useState(false);
  const [output, setOutput] = useState('');
  const [diagnostics, setDiagnostics] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const transpile = async () => {
    if (!input.trim()) {
      setOutput('');
      setDiagnostics([]);
      setError('Paste TypeScript or TSX code to transpile.');
      return;
    }

    setBusy(true);
    setError(null);
    setDiagnostics([]);

    try {
      const imported = await import('typescript');
      const ts = ((imported as unknown as { default?: typeof imported })
        .default ?? imported) as typeof imported;
      const compilerOptions = {
        target: (ts.ScriptTarget as unknown as Record<string, number>)[target],
        module: (ts.ModuleKind as unknown as Record<string, number>)[
          moduleKind
        ],
        jsx: (ts.JsxEmit as unknown as Record<string, number>)[jsx],
        removeComments,
        esModuleInterop: true,
        isolatedModules: true,
        sourceMap: false,
        inlineSourceMap: false,
      };

      const result = ts.transpileModule(input, {
        compilerOptions,
        fileName: inputLanguage === 'tsx' ? 'input.tsx' : 'input.ts',
        reportDiagnostics: true,
      });

      const messages = (result.diagnostics ?? [])
        .filter(
          (diagnostic) =>
            diagnostic.category === ts.DiagnosticCategory.Error ||
            diagnostic.category === ts.DiagnosticCategory.Warning
        )
        .map((diagnostic) => {
          const message = ts.flattenDiagnosticMessageText(
            diagnostic.messageText,
            '\n'
          );
          if (diagnostic.file && diagnostic.start !== undefined) {
            const position = diagnostic.file.getLineAndCharacterOfPosition(
              diagnostic.start
            );
            return `${message} (line ${position.line + 1}, column ${
              position.character + 1
            })`;
          }
          return message;
        });

      setOutput(result.outputText);
      setDiagnostics(messages);
    } catch (transpileError) {
      setOutput('');
      setError(errorMessage(transpileError));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ToolLayout>
      <Panel
        description="Uses the TypeScript compiler's transpile-only mode. Types are erased without type checking, so diagnostics are syntax-level only."
        title="TypeScript input"
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Input syntax">
            <Select
              aria-label="Input syntax"
              onChange={(event) =>
                setInputLanguage(event.target.value as InputLanguage)
              }
              value={inputLanguage}
            >
              <option value="ts">TypeScript (.ts)</option>
              <option value="tsx">TSX (.tsx)</option>
            </Select>
          </Field>

          <Field label="Target">
            <Select
              aria-label="JavaScript target"
              onChange={(event) => setTarget(event.target.value as Target)}
              value={target}
            >
              {TARGETS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Module">
            <Select
              aria-label="Module system"
              onChange={(event) =>
                setModuleKind(event.target.value as ModuleKind)
              }
              value={moduleKind}
            >
              {MODULES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="JSX">
            <Select
              aria-label="JSX transform"
              onChange={(event) => setJsx(event.target.value as JsxMode)}
              value={jsx}
            >
              {JSX_MODES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <label className="mt-3 flex w-fit cursor-pointer items-center gap-2 text-xs font-medium text-fg-muted">
          <input
            checked={removeComments}
            className="h-3.5 w-3.5 cursor-pointer"
            onChange={(event) => setRemoveComments(event.target.checked)}
            style={{ accentColor: 'var(--accent)' }}
            type="checkbox"
          />
          Remove comments
        </label>

        <div className="mt-3">
          <Field
            hint={`${input.length.toLocaleString()} characters`}
            label={inputLanguage === 'tsx' ? 'TSX' : 'TypeScript'}
          >
            <Textarea
              aria-label="TypeScript or TSX source"
              className="min-h-[340px]"
              onChange={(event) => {
                setInput(event.target.value);
                setError(null);
              }}
              placeholder={EXAMPLE}
              value={input}
            />
          </Field>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button disabled={busy} onClick={transpile} variant="primary">
            {busy && <Spinner className="h-3.5 w-3.5" />}
            Transpile to JavaScript
          </Button>
          <Button onClick={() => setInput(EXAMPLE)}>Load example</Button>
          <Button
            onClick={() => {
              setInput('');
              setOutput('');
              setDiagnostics([]);
              setError(null);
            }}
            variant="ghost"
          >
            Clear
          </Button>
        </div>

        {error && (
          <Callout className="mt-3" variant="error">
            {error}
          </Callout>
        )}

        {diagnostics.length > 0 && (
          <Callout
            className="mt-3"
            title="Compiler diagnostics"
            variant="warning"
          >
            <ul className="list-disc space-y-1 pl-4">
              {diagnostics.slice(0, 8).map((message) => (
                <li key={message}>{message}</li>
              ))}
              {diagnostics.length > 8 && (
                <li>{diagnostics.length - 8} more diagnostic(s) not shown.</li>
              )}
            </ul>
          </Callout>
        )}
      </Panel>

      <ResultPanel
        emptyText="Transpiled JavaScript will appear here."
        filename={
          jsx === 'Preserve' && inputLanguage === 'tsx'
            ? 'output.jsx'
            : 'output.js'
        }
        label="JavaScript output"
        mime="text/javascript;charset=utf-8"
        value={output}
      />
    </ToolLayout>
  );
}
