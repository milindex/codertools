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

const EXAMPLE = `$brand: #2f81f7;
$radius: 8px;

@mixin card($padding: 1rem) {
  padding: $padding;
  border: 1px solid rgba($brand, 0.25);
  border-radius: $radius;
}

.card {
  @include card(1.25rem);
  background: lighten($brand, 44%);

  &__title {
    color: darken($brand, 12%);
    font-weight: 600;
  }

  &:hover {
    border-color: $brand;
  }
}`;

type OutputStyle = 'expanded' | 'compressed';

type SassError = {
  sassMessage?: string;
  message?: string;
  span?: {
    start?: { line?: number; column?: number };
  };
};

export default function ScssCompilerTool() {
  const [input, setInput] = useState('');
  const [style, setStyle] = useState<OutputStyle>('expanded');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const compile = async () => {
    if (!input.trim()) {
      setOutput('');
      setError('Paste some SCSS to compile.');
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const sassModule = await import('sass');
      const sass = ((sassModule as unknown as { default?: typeof sassModule })
        .default ?? sassModule) as typeof sassModule;
      const result = sass.compileString(input, {
        style,
        syntax: 'scss',
        sourceMap: false,
      });
      setOutput(result.css);
    } catch (compileError) {
      const sassError = compileError as SassError;
      const start = sassError.span?.start;
      const message = sassError.sassMessage ?? sassError.message;
      setOutput('');
      setError(
        start?.line !== undefined
          ? `${message ?? errorMessage(compileError)} (line ${
              start.line + 1
            }, column ${(start.column ?? 0) + 1})`
          : (message ?? errorMessage(compileError))
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <ToolLayout>
      <Panel
        description="Dart Sass runs locally in the browser. Imports from remote URLs or the filesystem are not available."
        title="SCSS input"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Output style">
            <Select
              aria-label="SCSS output style"
              onChange={(event) => setStyle(event.target.value as OutputStyle)}
              value={style}
            >
              <option value="expanded">Expanded (readable)</option>
              <option value="compressed">Compressed</option>
            </Select>
          </Field>
          <div className="flex items-end">
            <p className="text-xs leading-5 text-fg-muted">
              Supports variables, nesting, mixins, functions, <code>@use</code>{' '}
              and <code>@forward</code> within this single file.
            </p>
          </div>
        </div>

        <div className="mt-3">
          <Field
            hint={`${input.length.toLocaleString()} characters`}
            label="SCSS"
          >
            <Textarea
              aria-label="SCSS source"
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
          <Button disabled={busy} onClick={compile} variant="primary">
            {busy && <Spinner className="h-3.5 w-3.5" />}
            Compile SCSS
          </Button>
          <Button onClick={() => setInput(EXAMPLE)}>Load example</Button>
          <Button
            onClick={() => {
              setInput('');
              setOutput('');
              setError(null);
            }}
            variant="ghost"
          >
            Clear
          </Button>
        </div>

        {error && (
          <Callout className="mt-3" title="SCSS compile error" variant="error">
            <span className="whitespace-pre-wrap">{error}</span>
          </Callout>
        )}
      </Panel>

      <ResultPanel
        emptyText="Compiled CSS will appear here."
        filename="styles.css"
        label="CSS output"
        mime="text/css;charset=utf-8"
        value={output}
      />
    </ToolLayout>
  );
}
