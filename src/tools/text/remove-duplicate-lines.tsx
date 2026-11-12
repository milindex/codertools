'use client';

import { useMemo, useState } from 'react';

import { Field } from '@/components/ui/Field';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { Textarea } from '@/components/ui/Textarea';
import { ToolLayout } from '@/components/ui/ToolLayout';

import { Checkbox } from './ui';

const deduplicate = (
  text: string,
  options: {
    caseInsensitive: boolean;
    trimLines: boolean;
    removeEmpty: boolean;
  }
): { output: string; removed: number; kept: number } => {
  if (!text) {
    return { output: '', removed: 0, kept: 0 };
  }

  const lines = text.split(/\r\n|\r|\n/u);
  const seen = new Set<string>();
  const result: string[] = [];
  let removed = 0;

  for (const original of lines) {
    const line = options.trimLines ? original.trim() : original;

    if (options.removeEmpty && line.trim() === '') {
      removed += 1;
      continue;
    }

    const key = options.caseInsensitive ? line.toLocaleLowerCase() : line;
    if (seen.has(key)) {
      removed += 1;
      continue;
    }

    seen.add(key);
    result.push(line);
  }

  return {
    output: result.join('\n'),
    removed,
    kept: result.length,
  };
};

export default function RemoveDuplicateLines() {
  const [input, setInput] = useState('');
  const [caseInsensitive, setCaseInsensitive] = useState(false);
  const [trimLines, setTrimLines] = useState(false);
  const [removeEmpty, setRemoveEmpty] = useState(false);

  const result = useMemo(
    () => deduplicate(input, { caseInsensitive, trimLines, removeEmpty }),
    [input, caseInsensitive, trimLines, removeEmpty]
  );

  return (
    <ToolLayout>
      <Panel title="Input">
        <Field
          hint={`${
            input ? input.split(/\r\n|\r|\n/u).length.toLocaleString() : 0
          } lines`}
          label="Lines"
        >
          <Textarea
            className="min-h-[340px]"
            onChange={(event) => setInput(event.target.value)}
            placeholder={'apple\nbanana\napple\ncherry'}
            value={input}
          />
        </Field>

        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
          <Checkbox
            checked={caseInsensitive}
            label="Case-insensitive"
            onChange={setCaseInsensitive}
          />
          <Checkbox
            checked={trimLines}
            label="Trim whitespace"
            onChange={setTrimLines}
          />
          <Checkbox
            checked={removeEmpty}
            label="Remove empty lines"
            onChange={setRemoveEmpty}
          />
        </div>

        <p className="mt-2 text-xs text-fg-muted">
          The first occurrence of each line is kept.
        </p>
      </Panel>

      <ResultPanel
        emptyText="Paste lines to remove duplicate entries."
        filename="deduplicated.txt"
        label="Deduplicated text"
        value={result.output}
      >
        {input ? (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-full border border-success/40 bg-success-subtle px-2 py-0.5 font-medium text-success">
                {result.kept.toLocaleString()} kept
              </span>
              <span className="rounded-full border border-danger/40 bg-danger-subtle px-2 py-0.5 font-medium text-danger">
                {result.removed.toLocaleString()} removed
              </span>
            </div>
            <pre className="max-h-[470px] min-h-[230px] overflow-auto whitespace-pre-wrap break-words rounded-md border border-border bg-canvas-inset p-3 font-mono text-[13px] leading-6 text-fg">
              {result.output}
            </pre>
          </div>
        ) : undefined}
      </ResultPanel>
    </ToolLayout>
  );
}
