'use client';

import { useMemo, useState } from 'react';

import { Callout } from '@/components/ui/Callout';
import { Field } from '@/components/ui/Field';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Textarea } from '@/components/ui/Textarea';
import { ToolLayout } from '@/components/ui/ToolLayout';

import { errorMessage } from './codec';

type Mode = 'to-url-safe' | 'to-standard';

function addPadding(value: string, padding: boolean): string {
  if (!padding) {
    return value;
  }
  return value + '='.repeat((4 - (value.length % 4)) % 4);
}

function toUrlSafe(value: string, padding: boolean): string {
  const cleaned = value.replace(/\s+/g, '');
  const core = cleaned.replace(/=+$/, '');
  if (!core) {
    return '';
  }
  if (!/^[A-Za-z0-9+/]*$/.test(core)) {
    throw new Error(
      'Input is not valid standard Base64. Only A–Z, a–z, 0–9, + and / are allowed.'
    );
  }
  if (core.length % 4 === 1) {
    throw new Error('Input has an invalid Base64 length.');
  }
  const converted = core.replace(/\+/g, '-').replace(/\//g, '_');
  return addPadding(converted, padding);
}

function toStandard(value: string, padding: boolean): string {
  const cleaned = value.replace(/\s+/g, '');
  const core = cleaned.replace(/=+$/, '');
  if (!core) {
    return '';
  }
  if (!/^[A-Za-z0-9\-_]*$/.test(core)) {
    throw new Error(
      'Input is not valid URL-safe Base64. Only A–Z, a–z, 0–9, - and _ are allowed.'
    );
  }
  if (core.length % 4 === 1) {
    throw new Error('Input has an invalid Base64 length.');
  }
  const converted = core.replace(/-/g, '+').replace(/_/g, '/');
  return addPadding(converted, padding);
}

export default function Base64UrlSafeTool() {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<Mode>('to-url-safe');
  const [padding, setPadding] = useState(true);

  const result = useMemo(() => {
    if (!input.trim()) {
      return { value: '', error: null as string | null };
    }
    try {
      return {
        value:
          mode === 'to-url-safe'
            ? toUrlSafe(input, padding)
            : toStandard(input, padding),
        error: null as string | null,
      };
    } catch (error) {
      return { value: '', error: errorMessage(error) };
    }
  }, [input, mode, padding]);

  const urlSafe = mode === 'to-url-safe';

  return (
    <div className="space-y-4">
      <ToolLayout>
        <Panel
          actions={
            <SegmentedControl
              ariaLabel="Conversion direction"
              onChange={(value) => setMode(value as Mode)}
              options={[
                { value: 'to-url-safe', label: 'To URL-safe' },
                { value: 'to-standard', label: 'To standard' },
              ]}
              value={mode}
            />
          }
          title="Input"
        >
          <Field
            hint={urlSafe ? 'Standard Base64' : 'URL-safe Base64'}
            htmlFor="base64-url-safe-input"
            label={urlSafe ? 'Standard Base64' : 'URL-safe Base64'}
          >
            <Textarea
              id="base64-url-safe-input"
              onChange={(event) => setInput(event.target.value)}
              placeholder={
                urlSafe
                  ? 'Paste standard Base64 (for example SGVsbG8+)…'
                  : 'Paste URL-safe Base64 (for example SGVsbG8-)…'
              }
              value={input}
            />
          </Field>

          <label className="mt-3 flex cursor-pointer items-center gap-2 text-xs text-fg-muted">
            <input
              checked={padding}
              className="h-4 w-4"
              onChange={(event) => setPadding(event.target.checked)}
              type="checkbox"
            />
            Include = padding
          </label>

          <Callout className="mt-3" variant="info">
            {urlSafe
              ? 'Standard Base64 uses + and /. URL-safe Base64 (RFC 4648 §5) replaces them with - and _ so the value can be used in URLs and filenames.'
              : 'URL-safe Base64 uses - and _. This converts it back to standard Base64 with + and /.'}
          </Callout>
        </Panel>

        <ResultPanel
          emptyText="The converted Base64 value will appear here."
          error={result.error}
          filename={urlSafe ? 'base64-url-safe.txt' : 'base64-standard.txt'}
          label={urlSafe ? 'URL-safe Base64' : 'Standard Base64'}
          value={result.value}
        />
      </ToolLayout>
    </div>
  );
}
