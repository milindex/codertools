'use client';

import { useState } from 'react';
import { monotonicFactory, ulid } from 'ulid';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { ToolLayout } from '@/components/ui/ToolLayout';
import { Checkbox } from '@/tools/generators/_controls';

const buildUlids = (count: number, monotonic: boolean) => {
  const next = monotonic ? monotonicFactory() : ulid;

  return Array.from({ length: count }, () => next()).join('\n');
};

export default function UlidGenerator() {
  const [count, setCount] = useState('5');
  const [monotonic, setMonotonic] = useState(false);
  const [output, setOutput] = useState(() => buildUlids(5, false));
  const [error, setError] = useState<string | null>(null);

  const generate = () => {
    const parsedCount = Number(count);

    if (
      !Number.isInteger(parsedCount) ||
      parsedCount < 1 ||
      parsedCount > 100
    ) {
      setError('Enter a whole number between 1 and 100.');
      return;
    }

    setError(null);
    setOutput(buildUlids(parsedCount, monotonic));
  };

  return (
    <div className="space-y-4">
      <ToolLayout>
        <Panel
          actions={<Badge variant="accent">26 characters</Badge>}
          title="Options"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field hint="1–100" htmlFor="ulid-count" label="How many?">
              <Input
                id="ulid-count"
                max={100}
                min={1}
                onChange={(event) => setCount(event.target.value)}
                type="number"
                value={count}
              />
            </Field>

            <div className="pt-1 sm:pt-6">
              <Checkbox
                checked={monotonic}
                id="ulid-monotonic"
                label="Monotonic within the same millisecond"
                onChange={setMonotonic}
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button onClick={generate} variant="primary">
              Generate ULIDs
            </Button>
            <span className="text-xs text-fg-muted">One value per line.</span>
          </div>

          {error && (
            <Callout className="mt-3" variant="error">
              {error}
            </Callout>
          )}

          <Callout className="mt-4" variant="info">
            A ULID is 26 characters of Crockford Base32: a 48-bit millisecond
            timestamp followed by 80 random bits. Monotonic mode keeps IDs
            generated in the same millisecond in ascending order.
          </Callout>
        </Panel>

        <ResultPanel
          emptyText="Click Generate to create ULIDs."
          filename="ulids.txt"
          label="ULIDs"
          value={output}
        />
      </ToolLayout>
    </div>
  );
}
