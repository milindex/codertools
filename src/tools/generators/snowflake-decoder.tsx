'use client';

import { useState } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Textarea } from '@/components/ui/Textarea';
import { ToolLayout } from '@/components/ui/ToolLayout';

type Mode = 'decode' | 'generate';

const DISCORD_EPOCH = 1_420_070_400_000n;
const MAX_SNOWFLAKE = 18_446_744_073_709_551_615n;
const MAX_TIMESTAMP = DISCORD_EPOCH + (1n << 42n) - 1n;
const DISCORD_EPOCH_MS = Number(DISCORD_EPOCH);
const MAX_TIMESTAMP_MS = Number(MAX_TIMESTAMP);

type DecodedSnowflake = {
  id: bigint;
  timestamp: number;
  worker: number;
  process: number;
  increment: number;
};

const decodeSnowflake = (raw: string): DecodedSnowflake | null => {
  const value = raw.trim();

  if (!/^\d{1,20}$/.test(value)) {
    return null;
  }

  const id = BigInt(value);
  if (id > MAX_SNOWFLAKE) {
    return null;
  }

  return {
    id,
    timestamp: Number((id >> 22n) + DISCORD_EPOCH),
    worker: Number((id >> 17n) & 0x1fn),
    process: Number((id >> 12n) & 0x1fn),
    increment: Number(id & 0xfffn),
  };
};

const formatDecoded = (decoded: DecodedSnowflake) => {
  const iso = new Date(decoded.timestamp).toISOString();

  return [
    `Snowflake:  ${decoded.id}`,
    `Timestamp:  ${decoded.timestamp} ms`,
    `ISO date:   ${iso}`,
    `Worker ID:  ${decoded.worker} (5 bits)`,
    `Process ID: ${decoded.process} (5 bits)`,
    `Increment:  ${decoded.increment} (12 bits)`,
  ].join('\n');
};

const encodeSnowflake = (
  timestamp: number,
  worker: number,
  process: number,
  increment: number
) =>
  ((BigInt(timestamp) - DISCORD_EPOCH) << 22n) |
  (BigInt(worker) << 17n) |
  (BigInt(process) << 12n) |
  BigInt(increment);

export default function SnowflakeDecoder() {
  const [mode, setMode] = useState<Mode>('decode');
  const [input, setInput] = useState('');
  const [timestamp, setTimestamp] = useState(() => String(Date.now()));
  const [worker, setWorker] = useState('0');
  const [process, setProcess] = useState('0');
  const [increment, setIncrement] = useState('0');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const changeMode = (nextMode: Mode) => {
    setMode(nextMode);
    setError(null);
  };

  const decode = () => {
    const parts = input
      .split(/[\s,]+/)
      .map((part) => part.trim())
      .filter(Boolean);

    if (parts.length === 0) {
      setError('Paste at least one snowflake ID to decode.');
      return;
    }

    if (parts.length > 100) {
      setError('Decode at most 100 IDs at a time.');
      return;
    }

    const decoded: DecodedSnowflake[] = [];
    const invalid: string[] = [];

    for (const part of parts) {
      const result = decodeSnowflake(part);
      if (result) {
        decoded.push(result);
      } else {
        invalid.push(part);
      }
    }

    if (decoded.length === 0) {
      setError(
        'No valid snowflake IDs found. Snowflakes are decimal integers up to 20 digits long.'
      );
      return;
    }

    setError(
      invalid.length > 0
        ? `Skipped ${invalid.length} invalid ${
            invalid.length === 1 ? 'value' : 'values'
          }: ${invalid.slice(0, 5).join(', ')}${invalid.length > 5 ? '…' : ''}`
        : null
    );
    setOutput(decoded.map(formatDecoded).join('\n\n'));
  };

  const generate = () => {
    const parsedTimestamp = Number(timestamp);
    const parsedWorker = Number(worker);
    const parsedProcess = Number(process);
    const parsedIncrement = Number(increment);

    if (
      !Number.isSafeInteger(parsedTimestamp) ||
      parsedTimestamp < DISCORD_EPOCH_MS ||
      parsedTimestamp > MAX_TIMESTAMP_MS
    ) {
      setError(
        'Timestamp must be a whole number of milliseconds between the Discord epoch (2015-01-01) and the year 2154.'
      );
      return;
    }

    if (
      !Number.isInteger(parsedWorker) ||
      parsedWorker < 0 ||
      parsedWorker > 31
    ) {
      setError('Worker ID must be a whole number from 0 to 31.');
      return;
    }

    if (
      !Number.isInteger(parsedProcess) ||
      parsedProcess < 0 ||
      parsedProcess > 31
    ) {
      setError('Process ID must be a whole number from 0 to 31.');
      return;
    }

    if (
      !Number.isInteger(parsedIncrement) ||
      parsedIncrement < 0 ||
      parsedIncrement > 4095
    ) {
      setError('Increment must be a whole number from 0 to 4095.');
      return;
    }

    setError(null);
    setOutput(
      formatDecoded({
        id: encodeSnowflake(
          parsedTimestamp,
          parsedWorker,
          parsedProcess,
          parsedIncrement
        ),
        timestamp: parsedTimestamp,
        worker: parsedWorker,
        process: parsedProcess,
        increment: parsedIncrement,
      })
    );
  };

  return (
    <div className="space-y-4">
      <ToolLayout>
        <Panel
          actions={<Badge variant="accent">Discord format</Badge>}
          title="Snowflake"
        >
          <SegmentedControl
            ariaLabel="Snowflake mode"
            onChange={(value) => changeMode(value as Mode)}
            options={[
              { label: 'Decode', value: 'decode' },
              { label: 'Generate', value: 'generate' },
            ]}
            value={mode}
          />

          {mode === 'decode' ? (
            <div className="mt-4">
              <Field
                hint="One per line, or separated by commas"
                htmlFor="snowflake-input"
                label="Snowflake IDs"
              >
                <Textarea
                  className="min-h-[140px]"
                  id="snowflake-input"
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="175928847299117063"
                  value={input}
                />
              </Field>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button onClick={decode} variant="primary">
                  Decode
                </Button>
                <span className="text-xs text-fg-muted">
                  Timestamp = (ID ÷ 4,194,304) + 1,420,070,400,000
                </span>
              </div>
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              <Field
                hint="Unix time in milliseconds"
                htmlFor="snowflake-timestamp"
                label="Timestamp"
              >
                <div className="flex gap-2">
                  <Input
                    id="snowflake-timestamp"
                    onChange={(event) => setTimestamp(event.target.value)}
                    type="number"
                    value={timestamp}
                  />
                  <Button
                    onClick={() => setTimestamp(String(Date.now()))}
                    size="sm"
                  >
                    Now
                  </Button>
                </div>
              </Field>

              <div className="grid gap-4 sm:grid-cols-3">
                <Field hint="0–31" htmlFor="snowflake-worker" label="Worker">
                  <Input
                    id="snowflake-worker"
                    max={31}
                    min={0}
                    onChange={(event) => setWorker(event.target.value)}
                    type="number"
                    value={worker}
                  />
                </Field>
                <Field hint="0–31" htmlFor="snowflake-process" label="Process">
                  <Input
                    id="snowflake-process"
                    max={31}
                    min={0}
                    onChange={(event) => setProcess(event.target.value)}
                    type="number"
                    value={process}
                  />
                </Field>
                <Field
                  hint="0–4095"
                  htmlFor="snowflake-increment"
                  label="Increment"
                >
                  <Input
                    id="snowflake-increment"
                    max={4095}
                    min={0}
                    onChange={(event) => setIncrement(event.target.value)}
                    type="number"
                    value={increment}
                  />
                </Field>
              </div>

              <Button onClick={generate} variant="primary">
                Generate snowflake
              </Button>
            </div>
          )}

          {error && (
            <Callout className="mt-3" variant="error">
              {error}
            </Callout>
          )}

          <Callout className="mt-4" variant="info">
            A snowflake packs a 41-bit millisecond timestamp, a 5-bit worker ID,
            a 5-bit process ID and a 12-bit increment. Decoding is shared by
            Discord and other Twitter-derived snowflake formats.
          </Callout>
        </Panel>

        <ResultPanel
          emptyText="Decode an ID or generate a snowflake to see its parts."
          filename="snowflake.txt"
          label="Decoded snowflake"
          value={output}
        />
      </ToolLayout>
    </div>
  );
}
