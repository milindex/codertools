'use client';

import { useMemo, useState } from 'react';

import { Callout } from '@/components/ui/Callout';
import { Field } from '@/components/ui/Field';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { ToolLayout } from '@/components/ui/ToolLayout';

type Mode = 'encode' | 'decode';
type Scope = 'component' | 'url';

const STRICT_REPLACEMENTS: Record<string, string> = {
  '!': '%21',
  "'": '%27',
  '(': '%28',
  ')': '%29',
  '*': '%2A',
};

export default function UrlEncoderTool() {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<Mode>('encode');
  const [scope, setScope] = useState<Scope>('component');
  const [strict, setStrict] = useState(false);
  const [plusAsSpace, setPlusAsSpace] = useState(false);

  const result = useMemo(() => {
    if (!input) {
      return { value: '', error: null as string | null };
    }

    try {
      if (mode === 'encode') {
        let encoded =
          scope === 'component' ? encodeURIComponent(input) : encodeURI(input);
        if (strict) {
          encoded = encoded.replace(
            /[!'()*]/g,
            (character) => STRICT_REPLACEMENTS[character] ?? character
          );
        }
        return { value: encoded, error: null as string | null };
      }

      const prepared = plusAsSpace ? input.replace(/\+/g, ' ') : input;
      const decoded =
        scope === 'component'
          ? decodeURIComponent(prepared)
          : decodeURI(prepared);
      return { value: decoded, error: null as string | null };
    } catch {
      return {
        value: '',
        error:
          mode === 'decode'
            ? 'Input contains an invalid percent-encoding sequence (for example a lone %) or malformed UTF-8.'
            : 'Input contains characters that cannot be URL-encoded, such as a lone surrogate.',
      };
    }
  }, [input, mode, plusAsSpace, scope, strict]);

  return (
    <div className="space-y-4">
      <ToolLayout>
        <Panel
          actions={
            <SegmentedControl
              ariaLabel="Conversion direction"
              onChange={(value) => setMode(value as Mode)}
              options={[
                { value: 'encode', label: 'Encode' },
                { value: 'decode', label: 'Decode' },
              ]}
              value={mode}
            />
          }
          title="Input"
        >
          <Field
            hint={`${input.length} characters`}
            htmlFor="url-encoder-input"
            label={mode === 'encode' ? 'Text or URL' : 'Percent-encoded value'}
          >
            <Textarea
              id="url-encoder-input"
              onChange={(event) => setInput(event.target.value)}
              placeholder={
                mode === 'encode'
                  ? 'Paste text such as hello world / café…'
                  : 'Paste text such as hello%20world%20%2F%20caf%C3%A9…'
              }
              value={input}
            />
          </Field>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Field htmlFor="url-encoder-scope" label="Scope">
              <Select
                id="url-encoder-scope"
                onChange={(event) => setScope(event.target.value as Scope)}
                value={scope}
              >
                <option value="component">
                  Component (query, path segment)
                </option>
                <option value="url">Whole URL</option>
              </Select>
            </Field>

            <div className="flex flex-col justify-end gap-2 pb-1">
              {mode === 'encode' ? (
                <label className="flex cursor-pointer items-center gap-2 text-xs text-fg-muted">
                  <input
                    checked={strict}
                    className="h-4 w-4"
                    onChange={(event) => setStrict(event.target.checked)}
                    type="checkbox"
                  />
                  Strict RFC 3986 (also escape ! &apos; ( ) *)
                </label>
              ) : (
                <label className="flex cursor-pointer items-center gap-2 text-xs text-fg-muted">
                  <input
                    checked={plusAsSpace}
                    className="h-4 w-4"
                    onChange={(event) => setPlusAsSpace(event.target.checked)}
                    type="checkbox"
                  />
                  Treat + as a space (form encoding)
                </label>
              )}
            </div>
          </div>

          <Callout className="mt-3" variant="info">
            {scope === 'component'
              ? 'Component mode uses encodeURIComponent/decodeURIComponent, so / ? & = # and other reserved characters are encoded. Use this for a single query value or path segment.'
              : 'Whole-URL mode uses encodeURI/decodeURI, which preserves reserved characters such as : / ? & = # so an existing URL structure stays intact.'}
          </Callout>
        </Panel>

        <ResultPanel
          emptyText="Encoded or decoded text will appear here."
          error={result.error}
          filename="url-result.txt"
          label={mode === 'encode' ? 'Encoded output' : 'Decoded text'}
          value={result.value}
        />
      </ToolLayout>
    </div>
  );
}
