'use client';

import { CronExpressionParser } from 'cron-parser';
import cronstrue from 'cronstrue';
import { useEffect, useMemo, useState } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { CodeBlock } from '@/components/ui/CodeBlock';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { Select } from '@/components/ui/Select';
import { ToolLayout } from '@/components/ui/ToolLayout';

import {
  formatInZone,
  formatOffset,
  formatRelativeTime,
  getLocalTimeZone,
  getTimeZones,
  zoneOffsetMinutes,
} from './shared';

type Frequency =
  'minutes' | 'hours' | 'daily' | 'weekly' | 'monthly' | 'yearly';

const WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const EXAMPLES = [
  { label: 'Every 15 minutes', value: '*/15 * * * *' },
  { label: 'Weekdays at 09:00', value: '0 9 * * 1-5' },
  { label: 'First of the month', value: '0 0 1 * *' },
  { label: 'Sundays at 02:30', value: '30 2 * * 0' },
  { label: 'Every 6 hours', value: '0 */6 * * *' },
  { label: '@daily', value: '@daily' },
];

const clamp = (value: number, min: number, max: number): number => {
  if (!Number.isFinite(value)) {
    return min;
  }
  return Math.min(max, Math.max(min, Math.trunc(value)));
};

const numberFrom = (value: string, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

type BuilderState = {
  frequency: Frequency;
  interval: number;
  minute: number;
  hour: number;
  weekday: number;
  dayOfMonth: number;
  month: number;
};

function buildExpression(state: BuilderState): string {
  const minute = clamp(state.minute, 0, 59);
  const hour = clamp(state.hour, 0, 23);
  const interval = clamp(state.interval, 1, 59);
  const weekday = clamp(state.weekday, 0, 6);
  const dayOfMonth = clamp(state.dayOfMonth, 1, 31);
  const month = clamp(state.month, 1, 12);

  switch (state.frequency) {
    case 'minutes':
      return interval === 1 ? '* * * * *' : `*/${interval} * * * *`;
    case 'hours':
      return interval === 1
        ? `${minute} * * * *`
        : `${minute} */${interval} * * *`;
    case 'weekly':
      return `${minute} ${hour} * * ${weekday}`;
    case 'monthly':
      return `${minute} ${hour} ${dayOfMonth} * *`;
    case 'yearly':
      return `${minute} ${hour} ${dayOfMonth} ${month} *`;
    case 'daily':
    default:
      return `${minute} ${hour} * * *`;
  }
}

type Validation = {
  error: string | null;
  description: string;
  runs: Array<{
    date: Date;
    formatted: string;
    relative: string;
    offset: number;
  }>;
  now: Date;
};

export default function CronParser() {
  const [expression, setExpression] = useState('*/15 * * * *');
  const [timeZone, setTimeZone] = useState('UTC');
  const [refreshKey, setRefreshKey] = useState(0);

  const [frequency, setFrequency] = useState<Frequency>('daily');
  const [interval, setIntervalValue] = useState(15);
  const [minute, setMinute] = useState(0);
  const [hour, setHour] = useState(9);
  const [weekday, setWeekday] = useState(1);
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const [month, setMonth] = useState(1);

  useEffect(() => {
    setTimeZone(getLocalTimeZone());
  }, []);

  const allZones = useMemo(() => getTimeZones(), []);

  const validation = useMemo<Validation>(() => {
    const now = new Date();
    // refreshKey intentionally forces a refresh of the next-run list.
    void refreshKey;
    const value = expression.trim();

    if (!value) {
      return {
        error: null,
        description: '',
        runs: [],
        now,
      };
    }

    const isAlias = value.startsWith('@');
    const fieldCount = value.split(/\s+/).filter(Boolean).length;
    if (!isAlias && fieldCount !== 5 && fieldCount !== 6) {
      return {
        error: `Cron expressions need 5 or 6 fields (this one has ${fieldCount}). Use 5 fields for minute-level schedules or 6 to include seconds.`,
        description: '',
        runs: [],
        now,
      };
    }

    let description = '';
    try {
      description = cronstrue.toString(value, {
        throwExceptionOnParseError: true,
        use24HourTimeFormat: true,
      });
    } catch {
      description =
        'No plain-English description is available for this expression.';
    }

    try {
      const parsed = CronExpressionParser.parse(value, {
        currentDate: now,
        tz: timeZone,
      });
      const runs = parsed.take(10).map((entry) => {
        const date = entry.toDate();
        return {
          date,
          offset: zoneOffsetMinutes(date, timeZone),
          formatted: formatInZone(date, timeZone, {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }),
          relative: formatRelativeTime(date.getTime(), now.getTime()),
        };
      });
      return { error: null, description, runs, now };
    } catch (caught) {
      return {
        error:
          caught instanceof Error
            ? caught.message
            : 'That cron expression is not valid.',
        description,
        runs: [],
        now,
      };
    }
  }, [expression, refreshKey, timeZone]);

  const builderState: BuilderState = {
    frequency,
    interval,
    minute,
    hour,
    weekday,
    dayOfMonth,
    month,
  };
  const generated = buildExpression(builderState);

  const output = useMemo(() => {
    if (validation.error || !validation.description) {
      return '';
    }
    const lines = [
      `Expression: ${expression.trim()}`,
      `Time zone: ${timeZone}`,
      `Description: ${validation.description}`,
      '',
      'Next 10 runs:',
      ...validation.runs.map(
        (run, index) =>
          `${String(index + 1).padStart(2, ' ')}. ${run.formatted} (${run.relative})`
      ),
    ];
    return lines.join('\n');
  }, [expression, timeZone, validation]);

  const hasExpression = expression.trim().length > 0;

  return (
    <div className="space-y-4">
      <ToolLayout>
        <Panel
          description="Five fields are minute, hour, day of month, month and day of week. Six fields add seconds."
          title="Cron expression"
        >
          <div className="space-y-3">
            <Field
              hint="Supports *, ranges, lists, steps, L and #."
              htmlFor="cron-expression"
              label="Expression"
            >
              <Input
                className="font-mono"
                id="cron-expression"
                onChange={(event) => setExpression(event.target.value)}
                placeholder="0 9 * * 1-5"
                spellCheck={false}
                value={expression}
              />
            </Field>

            <Field htmlFor="cron-timezone" label="Time zone for next runs">
              <Select
                id="cron-timezone"
                onChange={(event) => setTimeZone(event.target.value)}
                value={timeZone}
              >
                {allZones.map((zone) => (
                  <option key={zone} value={zone}>
                    {zone.replace(/_/g, ' ')}
                  </option>
                ))}
              </Select>
            </Field>

            <div className="flex flex-wrap gap-1.5">
              {EXAMPLES.map((example) => (
                <Button
                  key={example.value}
                  onClick={() => setExpression(example.value)}
                  size="sm"
                  variant="ghost"
                >
                  {example.label}
                </Button>
              ))}
            </div>

            {validation.error && (
              <Callout title="Invalid cron expression" variant="error">
                {validation.error}
              </Callout>
            )}

            {!validation.error && hasExpression && (
              <Callout variant="success" title="Valid expression">
                {validation.description}
              </Callout>
            )}
          </div>
        </Panel>

        <ResultPanel
          emptyText="Enter a cron expression to validate it and preview its next runs."
          error={hasExpression ? validation.error : null}
          filename="cron-schedule.txt"
          label="Schedule"
          value={output}
        >
          {!validation.error && hasExpression ? (
            <div className="space-y-3">
              <div className="rounded-md border border-accent/40 bg-accent-subtle/30 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-fg-muted">
                    Description
                  </p>
                  <Badge variant="success">Valid</Badge>
                </div>
                <p className="mt-1 text-sm leading-6 text-fg">
                  {validation.description}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold text-fg">Next 10 runs</p>
                  <p className="text-[11px] text-fg-muted">
                    {timeZone.replace(/_/g, ' ')} ·{' '}
                    {formatOffset(zoneOffsetMinutes(validation.now, timeZone))}
                  </p>
                </div>
                <Button
                  onClick={() => setRefreshKey((value) => value + 1)}
                  size="sm"
                  variant="ghost"
                >
                  Refresh
                </Button>
              </div>

              <div className="overflow-hidden rounded-md border border-border">
                <ol className="divide-y divide-border">
                  {validation.runs.map((run, index) => (
                    <li
                      className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-3 py-2 text-xs"
                      key={`${run.date.toISOString()}-${index}`}
                    >
                      <span className="w-6 shrink-0 text-right font-mono text-fg-subtle">
                        {index + 1}.
                      </span>
                      <span className="min-w-0 flex-1 break-words font-mono text-fg">
                        {run.formatted}
                      </span>
                      <span className="text-fg-muted">{run.relative}</span>
                      <span className="font-mono text-[11px] text-fg-subtle">
                        {formatOffset(run.offset)}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          ) : undefined}
        </ResultPanel>
      </ToolLayout>

      <Panel
        description="Build a common schedule without writing cron syntax by hand."
        title="Schedule builder"
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field htmlFor="builder-frequency" label="Frequency">
            <Select
              id="builder-frequency"
              onChange={(event) =>
                setFrequency(event.target.value as Frequency)
              }
              value={frequency}
            >
              <option value="minutes">Every N minutes</option>
              <option value="hours">Every N hours</option>
              <option value="daily">Every day at a time</option>
              <option value="weekly">Every week on a day</option>
              <option value="monthly">Every month on a day</option>
              <option value="yearly">Every year on a date</option>
            </Select>
          </Field>

          {(frequency === 'minutes' || frequency === 'hours') && (
            <Field
              hint={frequency === 'minutes' ? '1–59' : '1–23'}
              htmlFor="builder-interval"
              label="Interval"
            >
              <Input
                id="builder-interval"
                max={frequency === 'minutes' ? 59 : 23}
                min={1}
                onChange={(event) =>
                  setIntervalValue(numberFrom(event.target.value, 1))
                }
                type="number"
                value={interval}
              />
            </Field>
          )}

          {frequency !== 'minutes' && (
            <Field hint="0–59" htmlFor="builder-minute" label="Minute">
              <Input
                id="builder-minute"
                max={59}
                min={0}
                onChange={(event) =>
                  setMinute(numberFrom(event.target.value, 0))
                }
                type="number"
                value={minute}
              />
            </Field>
          )}

          {frequency !== 'minutes' && frequency !== 'hours' && (
            <Field hint="0–23" htmlFor="builder-hour" label="Hour">
              <Input
                id="builder-hour"
                max={23}
                min={0}
                onChange={(event) => setHour(numberFrom(event.target.value, 0))}
                type="number"
                value={hour}
              />
            </Field>
          )}

          {frequency === 'weekly' && (
            <Field htmlFor="builder-weekday" label="Day of week">
              <Select
                id="builder-weekday"
                onChange={(event) => setWeekday(Number(event.target.value))}
                value={weekday}
              >
                {WEEKDAYS.map((label, index) => (
                  <option key={label} value={index}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>
          )}

          {(frequency === 'monthly' || frequency === 'yearly') && (
            <Field hint="1–31" htmlFor="builder-dom" label="Day of month">
              <Input
                id="builder-dom"
                max={31}
                min={1}
                onChange={(event) =>
                  setDayOfMonth(numberFrom(event.target.value, 1))
                }
                type="number"
                value={dayOfMonth}
              />
            </Field>
          )}

          {frequency === 'yearly' && (
            <Field htmlFor="builder-month" label="Month">
              <Select
                id="builder-month"
                onChange={(event) => setMonth(Number(event.target.value))}
                value={month}
              >
                {MONTHS.map((label, index) => (
                  <option key={label} value={index + 1}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>
          )}
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
          <CodeBlock code={generated} filename="Generated cron expression" />
          <Button onClick={() => setExpression(generated)} variant="primary">
            Use this expression
          </Button>
        </div>
      </Panel>
    </div>
  );
}
