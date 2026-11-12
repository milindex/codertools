'use client';

import { useMemo, useState } from 'react';

import { Callout } from '@/components/ui/Callout';
import { Field } from '@/components/ui/Field';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { ToolLayout } from '@/components/ui/ToolLayout';

import { StatCard } from './ui';

type Ending = 'lf' | 'crlf' | 'cr';

const ENDINGS: Array<{ value: Ending; label: string; sequence: string }> = [
  { value: 'lf', label: 'LF (\\n) — Unix, macOS', sequence: '\n' },
  { value: 'crlf', label: 'CRLF (\\r\\n) — Windows', sequence: '\r\n' },
  { value: 'cr', label: 'CR (\\r) — Classic Mac', sequence: '\r' },
];

const countEndings = (text: string) => {
  const crlf = (text.match(/\r\n/g) ?? []).length;
  const lf = (text.match(/(?<!\r)\n/g) ?? []).length;
  const cr = (text.match(/\r(?!\n)/g) ?? []).length;

  return { crlf, lf, cr, total: crlf + lf + cr };
};

const normalise = (text: string, ending: Ending): string => {
  const target =
    ENDINGS.find((item) => item.value === ending)?.sequence ?? '\n';
  return text.replace(/\r\n|\r|\n/g, target);
};

export default function LineEndingNormalizer() {
  const [input, setInput] = useState('');
  const [ending, setEnding] = useState<Ending>('lf');

  const counts = useMemo(() => countEndings(input), [input]);
  const output = useMemo(() => normalise(input, ending), [input, ending]);

  const kindsInUse = [counts.crlf, counts.lf, counts.cr].filter(
    (count) => count > 0
  ).length;

  return (
    <ToolLayout>
      <Panel title="Input">
        <Field
          hint={`${counts.total.toLocaleString()} line ending${
            counts.total === 1 ? '' : 's'
          }`}
          label="Text"
        >
          <Textarea
            className="min-h-[300px]"
            onChange={(event) => setInput(event.target.value)}
            placeholder="Paste text with mixed line endings…"
            value={input}
          />
        </Field>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <StatCard label="CRLF" value={counts.crlf.toLocaleString()} />
          <StatCard label="LF" value={counts.lf.toLocaleString()} />
          <StatCard label="CR" value={counts.cr.toLocaleString()} />
        </div>

        {kindsInUse > 1 ? (
          <Callout className="mt-3" variant="warning">
            This text uses {kindsInUse} different line-ending styles.
            Normalizing will make them consistent.
          </Callout>
        ) : null}

        <Field className="mt-3" label="Convert to">
          <Select
            aria-label="Target line ending"
            onChange={(event) => setEnding(event.target.value as Ending)}
            value={ending}
          >
            {ENDINGS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>
      </Panel>

      <ResultPanel
        emptyText="Paste text to normalize its line endings."
        filename="line-endings-normalized.txt"
        label="Normalized text"
        value={output}
      >
        {input ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full border border-accent/40 bg-accent-subtle/50 px-2 py-0.5 font-medium text-accent">
                {ending === 'crlf' ? 'CRLF' : ending.toUpperCase()} endings
              </span>
              <span className="text-fg-muted">
                {counts.total.toLocaleString()} replaced
              </span>
            </div>
            <pre className="max-h-[470px] min-h-[230px] overflow-auto whitespace-pre-wrap break-words rounded-md border border-border bg-canvas-inset p-3 font-mono text-[13px] leading-6 text-fg">
              {output}
            </pre>
          </div>
        ) : undefined}
      </ResultPanel>
    </ToolLayout>
  );
}
