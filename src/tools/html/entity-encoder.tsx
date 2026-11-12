'use client';

import { useState } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { Field } from '@/components/ui/Field';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { ToolLayout } from '@/components/ui/ToolLayout';

import {
  countEntities,
  decodeHtmlEntities,
  encodeHtmlEntities,
  type EntityFormat,
} from './entities';

const ENCODE_SAMPLE = 'Tom & Jerry say "<hello>" — café costs €5.';
const DECODE_SAMPLE =
  '&lt;h1&gt;Hello &amp; welcome&lt;/h1&gt; &#169; 2026 &#x1F600; &mdash; caf&eacute;';

const REFERENCE: Array<[string, string, string]> = [
  ['&amp;', '&', '&#38;'],
  ['&lt;', '<', '&#60;'],
  ['&gt;', '>', '&#62;'],
  ['&quot;', '"', '&#34;'],
  ['&apos;', "'", '&#39;'],
  ['&nbsp;', '\u00a0', '&#160;'],
  ['&copy;', '©', '&#169;'],
  ['&reg;', '®', '&#174;'],
  ['&trade;', '™', '&#8482;'],
  ['&euro;', '€', '&#8364;'],
  ['&mdash;', '—', '&#8212;'],
  ['&hellip;', '…', '&#8230;'],
];

export default function HtmlEntityEncoder() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const [format, setFormat] = useState<EntityFormat>('named');
  const [encodeNonAscii, setEncodeNonAscii] = useState(true);
  const [encodeQuotes, setEncodeQuotes] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const reset = () => {
    setOutput('');
    setError(null);
    setNotice(null);
  };

  const convert = () => {
    if (!input) {
      reset();
      setError('Enter some text or entities to convert.');
      return;
    }
    setError(null);
    try {
      if (mode === 'encode') {
        const result = encodeHtmlEntities(input, {
          format,
          encodeNonAscii,
          encodeQuotes,
        });
        setOutput(result);
        setNotice(
          result === input
            ? 'Nothing needed encoding with the selected options.'
            : null
        );
      } else {
        const result = decodeHtmlEntities(input);
        setOutput(result);
        setNotice(
          countEntities(input) === 0
            ? 'No HTML entities were found in the input.'
            : null
        );
      }
    } catch {
      reset();
      setError('The input could not be converted.');
    }
  };

  const entityCount = countEntities(mode === 'encode' ? output : input);

  return (
    <div className="space-y-4">
      <ToolLayout>
        <Panel title="Input">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <SegmentedControl
              ariaLabel="Encoding direction"
              onChange={(value) => {
                setMode(value as 'encode' | 'decode');
                reset();
              }}
              options={[
                { value: 'encode', label: 'Encode' },
                { value: 'decode', label: 'Decode' },
              ]}
              value={mode}
            />
            {mode === 'encode' && (
              <div className="w-full sm:w-52">
                <Select
                  aria-label="Entity format"
                  onChange={(event) =>
                    setFormat(event.target.value as EntityFormat)
                  }
                  value={format}
                >
                  <option value="named">Named entities</option>
                  <option value="decimal">Numeric (decimal)</option>
                  <option value="hex">Numeric (hex)</option>
                </Select>
              </div>
            )}
          </div>

          <Field
            hint={`${input.length.toLocaleString()} characters`}
            htmlFor="html-entity-input"
            label={mode === 'encode' ? 'Text to encode' : 'Entities to decode'}
          >
            <Textarea
              id="html-entity-input"
              onChange={(event) => {
                setInput(event.target.value);
                reset();
              }}
              placeholder={
                mode === 'encode'
                  ? 'Tom & Jerry <hello>'
                  : '&lt;h1&gt;Hello &amp; welcome&lt;/h1&gt;'
              }
              rows={14}
              value={input}
            />
          </Field>

          {mode === 'encode' && (
            <fieldset className="mt-3">
              <legend className="text-xs font-semibold text-fg">
                Encoding options
              </legend>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <label className="flex cursor-pointer items-center gap-2 text-xs text-fg-muted">
                  <input
                    checked={encodeNonAscii}
                    className="h-4 w-4"
                    onChange={(event) =>
                      setEncodeNonAscii(event.target.checked)
                    }
                    type="checkbox"
                  />
                  Encode non-ASCII characters
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-xs text-fg-muted">
                  <input
                    checked={encodeQuotes}
                    className="h-4 w-4"
                    onChange={(event) => setEncodeQuotes(event.target.checked)}
                    type="checkbox"
                  />
                  Encode quotes
                </label>
              </div>
            </fieldset>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            <Button onClick={convert} variant="primary">
              {mode === 'encode' ? 'Encode entities' : 'Decode entities'}
            </Button>
            <Button
              onClick={() => {
                setInput(mode === 'encode' ? ENCODE_SAMPLE : DECODE_SAMPLE);
                reset();
              }}
              variant="default"
            >
              Load sample
            </Button>
            <Button
              onClick={() => {
                setInput('');
                reset();
              }}
              variant="ghost"
            >
              Clear
            </Button>
          </div>

          {notice && (
            <Callout className="mt-3" variant="warning">
              {notice}
            </Callout>
          )}
          {error && (
            <Callout className="mt-3" variant="error">
              {error}
            </Callout>
          )}
        </Panel>

        <ResultPanel
          emptyText={
            mode === 'encode'
              ? 'Encoded text will appear here.'
              : 'Decoded text will appear here.'
          }
          error={error}
          filename={mode === 'encode' ? 'encoded.txt' : 'decoded.txt'}
          label={mode === 'encode' ? 'Encoded text' : 'Decoded text'}
          value={output}
        >
          {output ? (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Badge variant="accent">
                  {entityCount} {entityCount === 1 ? 'entity' : 'entities'}
                </Badge>
                <Badge>{output.length.toLocaleString()} characters</Badge>
              </div>
              <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap break-words rounded-md border border-border bg-canvas-inset p-3 font-mono text-[13px] leading-6 text-fg">
                {output}
              </pre>
            </div>
          ) : undefined}
        </ResultPanel>
      </ToolLayout>

      <Panel
        description="A small reference of commonly used named entities."
        title="Entity reference"
      >
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {REFERENCE.map(([entity, character, numeric]) => (
            <div
              className="flex items-center justify-between gap-3 rounded-md border border-border bg-canvas-inset px-3 py-2"
              key={entity}
            >
              <code className="text-xs text-fg">{entity}</code>
              <span className="text-sm text-fg">{character}</span>
              <code className="text-[11px] text-fg-muted">{numeric}</code>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
