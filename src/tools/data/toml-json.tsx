'use client';

import { ArrowLeftRight, FlaskConical } from 'lucide-react';
import { useMemo, useState } from 'react';
import { parse, stringify, TomlError } from 'smol-toml';

import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Textarea } from '@/components/ui/Textarea';
import { ToolLayout } from '@/components/ui/ToolLayout';

import {
  errorMessage,
  isPlainObject,
  parseJsonText,
  prettyJson,
  toJsonSafe,
} from './_shared';

type Mode = 'json-to-toml' | 'toml-to-json';

const tomlSample = `title = "CoderTools"
version = "3.0.0"
private = true

[repository]
type = "git"
url = "https://example.com/codertools.git"

[scripts]
dev = "next dev"
build = "next build"

[[contributors]]
name = "Ada Lovelace"
role = "maintainer"

[[contributors]]
name = "Grace Hopper"
role = "reviewer"
`;

const jsonSample = `{
  "title": "CoderTools",
  "version": "3.0.0",
  "private": true,
  "repository": {
    "type": "git",
    "url": "https://example.com/codertools.git"
  },
  "scripts": {
    "dev": "next dev",
    "build": "next build"
  },
  "contributors": [
    { "name": "Ada Lovelace", "role": "maintainer" },
    { "name": "Grace Hopper", "role": "reviewer" }
  ]
}`;

function findUnsupportedTomlValue(value: unknown, path: string): string | null {
  if (value === null) {
    return `${path || 'root'} is null. TOML has no null value.`;
  }
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      const item = value[index];
      const issue = findUnsupportedTomlValue(item, `${path}[${index}]`);
      if (issue) {
        return issue;
      }
    }
    return null;
  }
  if (isPlainObject(value)) {
    for (const [key, item] of Object.entries(value)) {
      const issue = findUnsupportedTomlValue(
        item,
        path ? `${path}.${key}` : key
      );
      if (issue) {
        return issue;
      }
    }
  }
  return null;
}

function tomlErrorText(error: unknown): string {
  if (error instanceof TomlError) {
    return `${error.message} (line ${error.line}, column ${error.column})`;
  }
  return errorMessage(error);
}

export default function TomlJsonTool() {
  const [mode, setMode] = useState<Mode>('toml-to-json');
  const [input, setInput] = useState(tomlSample);

  const result = useMemo(() => {
    if (!input.trim()) {
      return { output: '', error: null as string | null };
    }
    try {
      if (mode === 'toml-to-json') {
        const parsed = parse(input);
        return { output: prettyJson(toJsonSafe(parsed)), error: null };
      }

      const parsed = parseJsonText(input);
      if (!parsed.ok) {
        return { output: '', error: parsed.error };
      }
      if (!isPlainObject(parsed.value)) {
        return {
          output: '',
          error:
            'The top-level JSON value must be an object. TOML documents cannot have an array or primitive root.',
        };
      }
      const unsupported = findUnsupportedTomlValue(parsed.value, '');
      if (unsupported) {
        return { output: '', error: unsupported };
      }
      return {
        output: stringify(parsed.value),
        error: null,
      };
    } catch (error) {
      return { output: '', error: tomlErrorText(error) };
    }
  }, [input, mode]);

  const switchMode = (nextMode: string) => {
    const typed = nextMode as Mode;
    if (typed === mode) {
      return;
    }
    setMode(typed);
    if (result.output && !result.error) {
      setInput(result.output);
    }
  };

  return (
    <div className="space-y-4">
      <ToolLayout>
        <Panel
          actions={
            <SegmentedControl
              ariaLabel="Conversion direction"
              onChange={switchMode}
              options={[
                { label: 'TOML → JSON', value: 'toml-to-json' },
                { label: 'JSON → TOML', value: 'json-to-toml' },
              ]}
              value={mode}
            />
          }
          title="Input"
        >
          <Field
            hint={`${input.length.toLocaleString()} characters`}
            htmlFor="toml-json-input"
            label={mode === 'toml-to-json' ? 'TOML' : 'JSON'}
          >
            <Textarea
              id="toml-json-input"
              onChange={(event) => setInput(event.target.value)}
              placeholder={
                mode === 'toml-to-json'
                  ? 'Paste TOML here…'
                  : 'Paste a JSON object here…'
              }
              spellCheck={false}
              value={input}
            />
          </Field>

          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              onClick={() =>
                setInput(mode === 'toml-to-json' ? tomlSample : jsonSample)
              }
              size="sm"
              variant="ghost"
            >
              <FlaskConical aria-hidden className="h-3.5 w-3.5" />
              Load example
            </Button>
            <Button
              disabled={!result.output || Boolean(result.error)}
              onClick={() => {
                if (result.output && !result.error) {
                  setInput(result.output);
                  setMode(
                    mode === 'toml-to-json' ? 'json-to-toml' : 'toml-to-json'
                  );
                }
              }}
              size="sm"
            >
              <ArrowLeftRight aria-hidden className="h-3.5 w-3.5" />
              Use output as input
            </Button>
          </div>

          <div className="mt-3 space-y-1 text-xs leading-5 text-fg-muted">
            {mode === 'toml-to-json' ? (
              <>
                <p>
                  TOML dates and datetimes are emitted as ISO 8601 strings.
                  Large integers that cannot be represented safely become
                  strings.
                </p>
                <p>
                  TOML tables become nested JSON objects and arrays of tables
                  become JSON arrays.
                </p>
              </>
            ) : (
              <>
                <p>
                  The top-level JSON value must be an object. TOML has no null,
                  so any <code>null</code> value blocks conversion.
                </p>
                <p>
                  Arrays of objects are emitted as arrays of tables (
                  <code>[[name]]</code>).
                </p>
              </>
            )}
          </div>
        </Panel>

        <ResultPanel
          emptyText="Paste TOML or JSON to see the converted output."
          error={result.error}
          filename={mode === 'toml-to-json' ? 'config.json' : 'config.toml'}
          label={mode === 'toml-to-json' ? 'JSON output' : 'TOML output'}
          mime={mode === 'toml-to-json' ? 'application/json' : 'text/plain'}
          value={result.output}
        />
      </ToolLayout>
    </div>
  );
}
