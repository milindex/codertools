'use client';

import { XMLBuilder, XMLParser, XMLValidator } from 'fast-xml-parser';
import { CheckCircle2, FlaskConical, XCircle } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { Field } from '@/components/ui/Field';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { ToolLayout } from '@/components/ui/ToolLayout';

import { errorMessage } from './_shared';

const sample = `<?xml version="1.0" encoding="UTF-8"?><catalog><book id="bk-101"><title>The Pragmatic Programmer</title><authors><author>Andrew Hunt</author><author>David Thomas</author></authors><price currency="USD">49.95</price><available>true</available></book><book id="bk-102"><title>Refactoring</title><authors><author>Martin Fowler</author></authors><price currency="USD">54.99</price><available>false</available></book></catalog>`;

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

function formatXml(input: string, indent: string, selfClose: boolean) {
  const validation = XMLValidator.validate(input);
  if (validation !== true) {
    return { output: '', error: validationErrorText(validation) };
  }

  const parser = new XMLParser({
    allowBooleanAttributes: true,
    attributeNamePrefix: '@_',
    cdataPropName: '#cdata',
    commentPropName: '#comment',
    ignoreAttributes: false,
    preserveOrder: true,
    processEntities: true,
    textNodeName: '#text',
    trimValues: false,
  });
  const parsed = parser.parse(input) as unknown;
  const builder = new XMLBuilder({
    attributeNamePrefix: '@_',
    cdataPropName: '#cdata',
    commentPropName: '#comment',
    format: true,
    ignoreAttributes: false,
    indentBy: indent,
    preserveOrder: true,
    suppressEmptyNode: selfClose,
    textNodeName: '#text',
  });
  return {
    output: builder.build(parsed) as string,
    error: null as string | null,
  };
}

export default function XmlFormatterTool() {
  const [input, setInput] = useState(sample);
  const [indent, setIndent] = useState('  ');
  const [selfClose, setSelfClose] = useState(false);

  const result = useMemo(() => {
    if (!input.trim()) {
      return { output: '', error: null as string | null };
    }
    try {
      return formatXml(input, indent, selfClose);
    } catch (error) {
      return { output: '', error: errorMessage(error) };
    }
  }, [indent, input, selfClose]);

  const hasInput = input.trim().length > 0;
  const valid = hasInput && !result.error;
  const outputLines = result.output ? result.output.split('\n').length : 0;

  return (
    <div className="space-y-4">
      <ToolLayout>
        <Panel title="XML input">
          <Field
            hint={`${input.length.toLocaleString()} characters`}
            htmlFor="xml-formatter-input"
            label="XML document"
          >
            <Textarea
              id="xml-formatter-input"
              onChange={(event) => setInput(event.target.value)}
              placeholder="Paste XML here…"
              spellCheck={false}
              value={input}
            />
          </Field>

          <div className="mt-3 flex flex-wrap items-end gap-3">
            <Field
              className="w-36"
              htmlFor="xml-formatter-indent"
              label="Indent"
            >
              <Select
                id="xml-formatter-indent"
                onChange={(event) => setIndent(event.target.value)}
                value={indent}
              >
                <option value="  ">2 spaces</option>
                <option value="    ">4 spaces</option>
                <option value={'\t'}>Tab</option>
              </Select>
            </Field>
            <label className="flex h-8 items-center gap-2 text-xs text-fg-muted">
              <input
                checked={selfClose}
                className="h-3.5 w-3.5 accent-[var(--accent)]"
                onChange={(event) => setSelfClose(event.target.checked)}
                type="checkbox"
              />
              Self-close empty elements
            </label>
            <Button onClick={() => setInput(sample)} size="sm" variant="ghost">
              <FlaskConical aria-hidden className="h-3.5 w-3.5" />
              Load example
            </Button>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {hasInput ? (
              <Badge variant={valid ? 'success' : 'danger'}>
                {valid ? (
                  <CheckCircle2 aria-hidden className="mr-1 h-3 w-3" />
                ) : (
                  <XCircle aria-hidden className="mr-1 h-3 w-3" />
                )}
                {valid ? 'Valid XML' : 'Invalid XML'}
              </Badge>
            ) : (
              <Badge>Waiting for input</Badge>
            )}
            {valid && (
              <Badge>
                {outputLines.toLocaleString()} formatted line
                {outputLines === 1 ? '' : 's'}
              </Badge>
            )}
          </div>

          {result.error && (
            <Callout className="mt-3" title="XML error" variant="error">
              <pre className="whitespace-pre-wrap break-words text-xs leading-5">
                {result.error}
              </pre>
            </Callout>
          )}

          {valid && (
            <Callout className="mt-3" variant="success" title="Well-formed XML">
              Tags, attributes, comments and CDATA sections were preserved. Use
              the output panel to copy or download the formatted document.
            </Callout>
          )}

          <p className="mt-3 text-xs leading-5 text-fg-muted">
            Formatting parses the document and rebuilds it with indentation.
            Mixed content may be reflowed across lines, but text and markup are
            preserved.
          </p>
        </Panel>

        <ResultPanel
          emptyText="Paste XML to format and validate it."
          error={result.error}
          filename="formatted.xml"
          label="Formatted XML"
          mime="application/xml"
          value={result.output}
        />
      </ToolLayout>
    </div>
  );
}
