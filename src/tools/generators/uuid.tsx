'use client';

import { useState } from 'react';
import { v1, v4, v7 } from 'uuid';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { ToolLayout } from '@/components/ui/ToolLayout';
import { Checkbox } from '@/tools/generators/_controls';

type UuidVersion = 'v1' | 'v4' | 'v7';

const generators: Record<UuidVersion, () => string> = { v1, v4, v7 };

const buildUuids = (
  version: UuidVersion,
  count: number,
  uppercase: boolean,
  hyphens: boolean
) =>
  Array.from({ length: count }, () => {
    const value = generators[version]();
    const cased = uppercase ? value.toUpperCase() : value;
    return hyphens ? cased : cased.replace(/-/g, '');
  }).join('\n');

const versionNotes: Record<UuidVersion, string> = {
  v1: 'Version 1 embeds the current time and a random node identifier, so values are time-ordered but can reveal when they were created.',
  v4: 'Version 4 is 122 bits of random data from the Web Crypto API. It is the most widely supported choice.',
  v7: 'Version 7 starts with a Unix millisecond timestamp and is lexicographically sortable, which makes it friendly to database indexes.',
};

export default function UuidGenerator() {
  const [version, setVersion] = useState<UuidVersion>('v4');
  const [count, setCount] = useState('5');
  const [uppercase, setUppercase] = useState(false);
  const [hyphens, setHyphens] = useState(true);
  const [output, setOutput] = useState(() => buildUuids('v4', 5, false, true));
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
    setOutput(buildUuids(version, parsedCount, uppercase, hyphens));
  };

  return (
    <div className="space-y-4">
      <ToolLayout>
        <Panel
          actions={<Badge variant="accent">RFC 9562</Badge>}
          title="Options"
        >
          <Field hint="Choose the UUID layout to generate." label="Version">
            <SegmentedControl
              ariaLabel="UUID version"
              onChange={(value) => setVersion(value as UuidVersion)}
              options={[
                { label: 'v1', value: 'v1' },
                { label: 'v4', value: 'v4' },
                { label: 'v7', value: 'v7' },
              ]}
              value={version}
            />
          </Field>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field hint="1–100" htmlFor="uuid-count" label="How many?">
              <Input
                id="uuid-count"
                max={100}
                min={1}
                onChange={(event) => setCount(event.target.value)}
                type="number"
                value={count}
              />
            </Field>

            <div className="space-y-2.5 pt-1 sm:pt-6">
              <Checkbox
                checked={uppercase}
                id="uuid-uppercase"
                label="Uppercase"
                onChange={setUppercase}
              />
              <Checkbox
                checked={hyphens}
                id="uuid-hyphens"
                label="Include hyphens"
                onChange={setHyphens}
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button onClick={generate} variant="primary">
              Generate UUIDs
            </Button>
            <span className="text-xs text-fg-muted">One value per line.</span>
          </div>

          {error && (
            <Callout className="mt-3" variant="error">
              {error}
            </Callout>
          )}

          <Callout className="mt-4" variant="info">
            {versionNotes[version]}
          </Callout>
        </Panel>

        <ResultPanel
          emptyText="Click Generate to create UUIDs."
          filename="uuids.txt"
          label="UUIDs"
          value={output}
        />
      </ToolLayout>
    </div>
  );
}
