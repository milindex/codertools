'use client';

import { dump, load } from 'js-yaml';
import { ArrowLeftRight, FlaskConical } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { ToolLayout } from '@/components/ui/ToolLayout';

import { errorMessage, parseJsonText } from './_shared';

type Mode = 'json-to-yaml' | 'yaml-to-json';

const jsonSample = `{
  "name": "CoderTools",
  "version": "3.0.0",
  "private": true,
  "keywords": ["json", "yaml", "developer tools"],
  "repository": {
    "type": "git",
    "url": "https://example.com/codertools.git"
  },
  "scripts": {
    "dev": "next dev",
    "build": "next build"
  }
}`;

const yamlSample = `name: CoderTools
version: 3.0.0
private: true
keywords:
  - json
  - yaml
  - developer tools
repository:
  type: git
  url: https://example.com/codertools.git
scripts:
  dev: next dev
  build: next build
`;

export default function JsonYamlTool() {
  const [mode, setMode] = useState<Mode>('json-to-yaml');
  const [input, setInput] = useState(jsonSample);
  const [indent, setIndent] = useState('2');

  const result = useMemo(() => {
    if (!input.trim()) {
      return { output: '', error: null as string | null };
    }
    try {
      if (mode === 'json-to-yaml') {
        const parsed = parseJsonText(input);
        if (!parsed.ok) {
          return { output: '', error: parsed.error };
        }
        return {
          output: dump(parsed.value, {
            indent: Number(indent),
            lineWidth: -1,
            noRefs: true,
          }),
          error: null,
        };
      }

      const parsed = load(input);
      return {
        output: JSON.stringify(
          parsed === undefined ? null : parsed,
          null,
          Number(indent)
        ),
        error: null,
      };
    } catch (error) {
      return { output: '', error: errorMessage(error) };
    }
  }, [indent, input, mode]);

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
                { label: 'JSON → YAML', value: 'json-to-yaml' },
                { label: 'YAML → JSON', value: 'yaml-to-json' },
              ]}
              value={mode}
            />
          }
          title="Input"
        >
          <Field
            hint={`${input.length.toLocaleString()} characters`}
            htmlFor="json-yaml-input"
            label={mode === 'json-to-yaml' ? 'JSON' : 'YAML'}
          >
            <Textarea
              id="json-yaml-input"
              onChange={(event) => setInput(event.target.value)}
              placeholder={
                mode === 'json-to-yaml'
                  ? 'Paste JSON here…'
                  : 'Paste YAML here…'
              }
              spellCheck={false}
              value={input}
            />
          </Field>

          <div className="mt-3 flex flex-wrap items-end gap-3">
            <Field className="w-32" htmlFor="json-yaml-indent" label="Indent">
              <Select
                id="json-yaml-indent"
                onChange={(event) => setIndent(event.target.value)}
                value={indent}
              >
                <option value="2">2 spaces</option>
                <option value="4">4 spaces</option>
                <option value="8">8 spaces</option>
              </Select>
            </Field>
            <Button
              onClick={() =>
                setInput(mode === 'json-to-yaml' ? jsonSample : yamlSample)
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
                    mode === 'json-to-yaml' ? 'yaml-to-json' : 'json-to-yaml'
                  );
                }
              }}
              size="sm"
              variant="default"
            >
              <ArrowLeftRight aria-hidden className="h-3.5 w-3.5" />
              Use output as input
            </Button>
          </div>

          <p className="mt-3 text-xs leading-5 text-fg-muted">
            {mode === 'json-to-yaml'
              ? 'Comments cannot be represented in JSON, so they are not preserved. YAML anchors are expanded, not emitted.'
              : 'YAML mappings become JSON objects and sequences become arrays. Dates load as ISO date strings.'}
          </p>
        </Panel>

        <ResultPanel
          emptyText="Paste JSON or YAML to see the converted output."
          error={result.error}
          filename={
            mode === 'json-to-yaml' ? 'converted.yaml' : 'converted.json'
          }
          label={mode === 'json-to-yaml' ? 'YAML output' : 'JSON output'}
          value={result.output}
        />
      </ToolLayout>
    </div>
  );
}
