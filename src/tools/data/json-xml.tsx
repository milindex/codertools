'use client';

import { XMLBuilder, XMLParser, XMLValidator } from 'fast-xml-parser';
import { ArrowLeftRight, FlaskConical } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Textarea } from '@/components/ui/Textarea';
import { ToolLayout } from '@/components/ui/ToolLayout';

import { errorMessage, parseJsonText } from './_shared';

type Mode = 'json-to-xml' | 'xml-to-json';

const jsonSample = `{
  "book": {
    "id": "bk-101",
    "title": "The Pragmatic Programmer",
    "authors": ["Andrew Hunt", "David Thomas"],
    "price": 49.95,
    "available": true
  }
}`;

const xmlSample = `<?xml version="1.0" encoding="UTF-8"?>
<book id="bk-101">
  <title>The Pragmatic Programmer</title>
  <authors>
    <author>Andrew Hunt</author>
    <author>David Thomas</author>
  </authors>
  <price>49.95</price>
  <available>true</available>
</book>`;

function validationErrorText(error: unknown): string {
  if (
    typeof error === 'object' &&
    error !== null &&
    'err' in error &&
    typeof (error as { err?: unknown }).err === 'object' &&
    (error as { err?: unknown }).err !== null
  ) {
    const detail = (
      error as { err: { msg?: string; line?: number; col?: number } }
    ).err;
    return `${detail.msg ?? 'Invalid XML'}${
      detail.line ? ` (line ${detail.line}, column ${detail.col ?? 1})` : ''
    }`;
  }
  return errorMessage(error);
}

export default function JsonXmlTool() {
  const [mode, setMode] = useState<Mode>('json-to-xml');
  const [input, setInput] = useState(jsonSample);
  const [rootName, setRootName] = useState('root');

  const result = useMemo(() => {
    if (!input.trim()) {
      return { output: '', error: null as string | null };
    }

    try {
      if (mode === 'json-to-xml') {
        if (!/^[A-Za-z_][A-Za-z0-9_.:-]*$/.test(rootName.trim())) {
          return {
            output: '',
            error: 'Enter a valid XML element name for the root element.',
          };
        }
        const parsed = parseJsonText(input);
        if (!parsed.ok) {
          return { output: '', error: parsed.error };
        }
        const builder = new XMLBuilder({
          attributeNamePrefix: '@_',
          format: true,
          ignoreAttributes: false,
          indentBy: '  ',
          suppressEmptyNode: false,
          textNodeName: '#text',
        });
        return {
          output: builder.build({ [rootName.trim()]: parsed.value }),
          error: null,
        };
      }

      const validation = XMLValidator.validate(input);
      if (validation !== true) {
        return { output: '', error: validationErrorText(validation) };
      }
      const parser = new XMLParser({
        allowBooleanAttributes: true,
        attributeNamePrefix: '@_',
        ignoreAttributes: false,
        parseAttributeValue: true,
        parseTagValue: true,
        textNodeName: '#text',
        trimValues: true,
      });
      const parsed = parser.parse(input) as unknown;
      return {
        output: JSON.stringify(parsed, null, 2),
        error: null,
      };
    } catch (error) {
      return { output: '', error: errorMessage(error) };
    }
  }, [input, mode, rootName]);

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
                { label: 'JSON → XML', value: 'json-to-xml' },
                { label: 'XML → JSON', value: 'xml-to-json' },
              ]}
              value={mode}
            />
          }
          title="Input"
        >
          <Field
            hint={`${input.length.toLocaleString()} characters`}
            htmlFor="json-xml-input"
            label={mode === 'json-to-xml' ? 'JSON' : 'XML'}
          >
            <Textarea
              id="json-xml-input"
              onChange={(event) => setInput(event.target.value)}
              placeholder={
                mode === 'json-to-xml' ? 'Paste JSON here…' : 'Paste XML here…'
              }
              spellCheck={false}
              value={input}
            />
          </Field>

          <div className="mt-3 flex flex-wrap items-end gap-3">
            {mode === 'json-to-xml' && (
              <Field
                className="w-44"
                hint="Wraps the document"
                htmlFor="json-xml-root"
                label="Root element"
              >
                <Input
                  id="json-xml-root"
                  onChange={(event) => setRootName(event.target.value)}
                  placeholder="root"
                  value={rootName}
                />
              </Field>
            )}
            <Button
              onClick={() =>
                setInput(mode === 'json-to-xml' ? jsonSample : xmlSample)
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
                    mode === 'json-to-xml' ? 'xml-to-json' : 'json-to-xml'
                  );
                }
              }}
              size="sm"
            >
              <ArrowLeftRight aria-hidden className="h-3.5 w-3.5" />
              Use output as input
            </Button>
          </div>

          <p className="mt-3 text-xs leading-5 text-fg-muted">
            {mode === 'json-to-xml'
              ? 'Keys prefixed with @_ become attributes and #text becomes element text. Arrays become repeated elements.'
              : 'Attributes are converted to @_ properties and element text to #text when mixed with attributes.'}
          </p>
        </Panel>

        <ResultPanel
          emptyText="Paste JSON or XML to see the converted output."
          error={result.error}
          filename={mode === 'json-to-xml' ? 'converted.xml' : 'converted.json'}
          label={mode === 'json-to-xml' ? 'XML output' : 'JSON output'}
          value={result.output}
        />
      </ToolLayout>
    </div>
  );
}
