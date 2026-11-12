'use client';

import { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { ToolLayout } from '@/components/ui/ToolLayout';

import {
  formatInZone,
  formatOffset,
  formatRelativeTime,
  getLocalTimeZone,
  pad,
  zoneOffsetMinutes,
} from './shared';

type Mode = 'auto' | 'seconds' | 'milliseconds';

type ParsedTimestamp = {
  date: Date | null;
  error: string | null;
};

const NUMERIC = /^[-+]?\d+(?:\.\d+)?$/;

function parseTimestamp(raw: string, mode: Mode): ParsedTimestamp {
  const value = raw.trim();
  if (!value) {
    return { date: null, error: null };
  }

  if (mode !== 'auto' || NUMERIC.test(value)) {
    if (!NUMERIC.test(value)) {
      return {
        date: null,
        error:
          mode === 'seconds'
            ? 'Enter a numeric Unix timestamp in seconds.'
            : 'Enter a numeric Unix timestamp in milliseconds.',
      };
    }

    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return { date: null, error: 'That timestamp is not a valid number.' };
    }

    let milliseconds: number;
    if (mode === 'seconds') {
      milliseconds = numeric * 1000;
    } else if (mode === 'milliseconds') {
      milliseconds = numeric;
    } else {
      const absolute = Math.abs(numeric);
      const looksLikeMilliseconds = absolute >= 100_000_000_000;
      milliseconds = looksLikeMilliseconds ? numeric : numeric * 1000;
    }

    if (Math.abs(milliseconds) > 8.64e15) {
      return {
        date: null,
        error:
          'That timestamp is outside the range supported by JavaScript dates.',
      };
    }

    const date = new Date(milliseconds);
    if (Number.isNaN(date.getTime())) {
      return { date: null, error: 'That timestamp could not be parsed.' };
    }
    return { date, error: null };
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return {
      date: null,
      error:
        'Enter a Unix timestamp or a recognised date such as 2026-01-01T12:00:00Z.',
    };
  }
  return { date: parsed, error: null };
}

function toLocalIso(date: Date): string {
  const offset = -date.getTimezoneOffset();
  const sign = offset >= 0 ? '+' : '-';
  const absolute = Math.abs(offset);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(
    date.getSeconds()
  )}.${pad(date.getMilliseconds(), 3)}${sign}${pad(
    Math.floor(absolute / 60)
  )}:${pad(absolute % 60)}`;
}

export default function TimestampConverter() {
  const [mode, setMode] = useState<Mode>('auto');
  const [input, setInput] = useState('');
  const [now, setNow] = useState(() => new Date());
  const [initialised, setInitialised] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!initialised) {
      setInput(String(Math.floor(Date.now() / 1000)));
      setInitialised(true);
    }
  }, [initialised]);

  const localZone = getLocalTimeZone();
  const parsed = useMemo(() => parseTimestamp(input, mode), [input, mode]);

  const rows = useMemo(() => {
    if (!parsed.date) {
      return [];
    }
    const date = parsed.date;
    const offset = zoneOffsetMinutes(date, localZone);

    return [
      {
        label: 'Unix timestamp (seconds)',
        value: String(Math.floor(date.getTime() / 1000)),
      },
      { label: 'Unix timestamp (milliseconds)', value: String(date.getTime()) },
      { label: 'ISO 8601 (UTC)', value: date.toISOString() },
      { label: 'ISO 8601 (local)', value: toLocalIso(date) },
      {
        label: 'UTC',
        value: date.toUTCString(),
      },
      {
        label: 'Local time',
        value: formatInZone(date, localZone, {
          dateStyle: 'full',
          timeStyle: 'long',
        }),
      },
      {
        label: 'Time zone',
        value: `${localZone.replace(/_/g, ' ')} (${formatOffset(offset)})`,
      },
      {
        label: 'Day of week',
        value: formatInZone(date, localZone, {
          weekday: 'long',
          timeZoneName: undefined,
        }),
      },
      {
        label: 'Relative to now',
        value: formatRelativeTime(date.getTime(), now.getTime()),
      },
    ];
  }, [parsed.date, localZone, now]);

  const output = useMemo(() => {
    if (!parsed.date) {
      return '';
    }
    return rows.map((row) => `${row.label}: ${row.value}`).join('\n');
  }, [parsed.date, rows]);

  const useNow = () => {
    const current = Date.now();
    if (mode === 'milliseconds') {
      setInput(String(current));
    } else {
      setInput(String(Math.floor(current / 1000)));
    }
  };

  const liveSeconds = String(Math.floor(now.getTime() / 1000));
  const liveMilliseconds = String(now.getTime());

  return (
    <div className="space-y-4">
      <ToolLayout>
        <Panel
          description="Paste a Unix timestamp, or any date string such as an ISO 8601 value."
          title="Timestamp"
        >
          <div className="space-y-3">
            <Field
              hint="Auto detects 10-digit seconds and 13-digit milliseconds."
              htmlFor="timestamp-input"
              label="Timestamp or date"
            >
              <Input
                id="timestamp-input"
                onChange={(event) => setInput(event.target.value)}
                placeholder="1763000000 or 2026-11-12T10:30:00Z"
                spellCheck={false}
                value={input}
              />
            </Field>

            <Field
              hint="Choose how numeric values are interpreted."
              label="Numeric unit"
            >
              <SegmentedControl
                ariaLabel="Timestamp unit"
                onChange={(value) => setMode(value as Mode)}
                options={[
                  { value: 'auto', label: 'Auto' },
                  { value: 'seconds', label: 'Seconds' },
                  { value: 'milliseconds', label: 'Milliseconds' },
                ]}
                value={mode}
              />
            </Field>

            <div className="flex flex-wrap gap-2">
              <Button onClick={useNow} variant="primary">
                Use current time
              </Button>
              <Button onClick={() => setInput('0')} variant="default">
                Unix epoch
              </Button>
              <Button onClick={() => setInput('')} variant="ghost">
                Clear
              </Button>
            </div>

            {parsed.error && (
              <Callout title="Invalid timestamp" variant="error">
                {parsed.error}
              </Callout>
            )}
          </div>
        </Panel>

        <ResultPanel
          emptyText="Enter a timestamp or date to see every representation."
          error={parsed.error}
          filename="timestamp-converter.txt"
          label="Converted timestamp"
          value={output}
        >
          {parsed.date ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {rows.map((row) => (
                <div
                  className="min-w-0 rounded-md border border-border bg-canvas-inset p-3"
                  key={row.label}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-fg-muted">
                    {row.label}
                  </p>
                  <p
                    aria-live="polite"
                    className="mt-1 break-all font-mono text-[13px] leading-5 text-fg"
                  >
                    {row.value}
                  </p>
                </div>
              ))}
            </div>
          ) : undefined}
        </ResultPanel>
      </ToolLayout>

      <Panel
        actions={
          <Button onClick={useNow} size="sm" variant="default">
            Copy into input
          </Button>
        }
        description="Live clock based on your system time. The values refresh every second."
        title="Current time"
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-md border border-border bg-canvas-inset p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-fg-muted">
              Unix seconds
            </p>
            <p className="mt-1 font-mono text-sm text-fg">{liveSeconds}</p>
          </div>
          <div className="rounded-md border border-border bg-canvas-inset p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-fg-muted">
              Unix milliseconds
            </p>
            <p className="mt-1 font-mono text-sm text-fg">{liveMilliseconds}</p>
          </div>
          <div className="rounded-md border border-border bg-canvas-inset p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-fg-muted">
              ISO 8601 (UTC)
            </p>
            <p className="mt-1 break-all font-mono text-sm text-fg">
              {now.toISOString()}
            </p>
          </div>
          <div className="rounded-md border border-border bg-canvas-inset p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-fg-muted">
              Local time
            </p>
            <p className="mt-1 font-mono text-sm text-fg">
              {formatInZone(now, localZone, {
                dateStyle: 'medium',
                timeStyle: 'medium',
              })}
            </p>
          </div>
        </div>
      </Panel>
    </div>
  );
}
