'use client';

import { useEffect, useMemo, useState } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { Textarea } from '@/components/ui/Textarea';
import { ToolLayout } from '@/components/ui/ToolLayout';

import {
  addDaysUtc,
  diffDaysUtc,
  formatDateOnly,
  formatNumber,
  parseDateOnly,
  toDateInputValue,
  toUtcInputValue,
} from './shared';

const WEEKDAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

const DEFAULT_WEEKENDS = [0, 6];

type HolidayInfo = {
  dates: Date[];
  invalid: string[];
};

type BusinessResult = {
  error: string | null;
  reversed: boolean;
  totalDays: number;
  weekendDays: number;
  businessDays: number;
  holidaysApplied: number;
  start: Date | null;
  end: Date | null;
  holidayRows: Array<{
    date: Date;
    inRange: boolean;
    weekend: boolean;
    applied: boolean;
  }>;
};

function countWeekendDays(
  start: Date,
  endExclusive: Date,
  weekendDays: number[]
): number {
  const days = diffDaysUtc(start, endExclusive);
  if (days <= 0 || weekendDays.length === 0) {
    return 0;
  }

  const fullWeeks = Math.floor(days / 7);
  let count = fullWeeks * weekendDays.length;
  const remainder = days % 7;
  const startDay = start.getUTCDay();
  for (let index = 0; index < remainder; index += 1) {
    if (weekendDays.includes((startDay + index) % 7)) {
      count += 1;
    }
  }
  return count;
}

const weekdayLabel = (date: Date): string =>
  new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    weekday: 'long',
  }).format(date);

export default function BusinessDays() {
  const [startValue, setStartValue] = useState('');
  const [endValue, setEndValue] = useState('');
  const [includeEnd, setIncludeEnd] = useState(true);
  const [weekendDays, setWeekendDays] = useState<number[]>(DEFAULT_WEEKENDS);
  const [holidaysText, setHolidaysText] = useState('');
  const [initialised, setInitialised] = useState(false);

  useEffect(() => {
    if (initialised) {
      return;
    }
    const today = new Date();
    const start = new Date(
      Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
    );
    setStartValue(toDateInputValue(start));
    setEndValue(toDateInputValue(addDaysUtc(start, 30)));
    setInitialised(true);
  }, [initialised]);

  const holidays = useMemo<HolidayInfo>(() => {
    const tokens = holidaysText
      .split(/[\n,;]+/)
      .map((token) => token.trim())
      .filter(Boolean);

    const dates: Date[] = [];
    const invalid: string[] = [];
    const seen = new Set<string>();

    for (const token of tokens) {
      const parsed = parseDateOnly(token);
      if (!parsed) {
        invalid.push(token);
        continue;
      }
      const key = toUtcInputValue(parsed);
      if (!seen.has(key)) {
        seen.add(key);
        dates.push(parsed);
      }
    }

    return { dates, invalid };
  }, [holidaysText]);

  const result = useMemo<BusinessResult>(() => {
    const empty: BusinessResult = {
      error: null,
      reversed: false,
      totalDays: 0,
      weekendDays: 0,
      businessDays: 0,
      holidaysApplied: 0,
      start: null,
      end: null,
      holidayRows: [],
    };

    if (!startValue || !endValue) {
      return empty;
    }

    const start = parseDateOnly(startValue);
    const end = parseDateOnly(endValue);
    if (!start || !end) {
      return {
        ...empty,
        error: 'Enter two valid dates in YYYY-MM-DD format.',
      };
    }

    const reversed = end.getTime() < start.getTime();
    const earlier = reversed ? end : start;
    const later = reversed ? start : end;
    const endExclusive = includeEnd ? addDaysUtc(later, 1) : later;
    const totalDays = Math.max(0, diffDaysUtc(earlier, endExclusive));
    const weekendCount = countWeekendDays(earlier, endExclusive, weekendDays);
    const weekendSet = new Set(weekendDays);

    const holidayRows = holidays.dates.map((date) => {
      const inRange =
        date.getTime() >= earlier.getTime() &&
        date.getTime() < endExclusive.getTime();
      const weekend = weekendSet.has(date.getUTCDay());
      return {
        date,
        inRange,
        weekend,
        applied: inRange && !weekend,
      };
    });

    const holidaysApplied = holidayRows.filter((row) => row.applied).length;
    const businessDays = Math.max(
      0,
      totalDays - weekendCount - holidaysApplied
    );

    return {
      error: null,
      reversed,
      totalDays,
      weekendDays: weekendCount,
      businessDays,
      holidaysApplied,
      start,
      end,
      holidayRows,
    };
  }, [endValue, holidays.dates, includeEnd, startValue, weekendDays]);

  const output = useMemo(() => {
    if (!result.start || !result.end) {
      return '';
    }
    return [
      `Start: ${formatDateOnly(result.start, 'full')}`,
      `End: ${formatDateOnly(result.end, 'full')} (${
        includeEnd ? 'included' : 'excluded'
      })`,
      result.reversed ? 'Note: start and end were swapped for counting.' : '',
      '',
      `Business days: ${formatNumber(result.businessDays)}`,
      `Calendar days: ${formatNumber(result.totalDays)}`,
      `Weekend days: ${formatNumber(result.weekendDays)}`,
      `Holidays applied: ${formatNumber(result.holidaysApplied)}`,
      `Weekend days selected: ${
        weekendDays.length > 0
          ? weekendDays
              .slice()
              .sort((a, b) => a - b)
              .map((day) => WEEKDAY_NAMES[day] ?? String(day))
              .join(', ')
          : 'none'
      }`,
    ]
      .filter((line) => line !== '')
      .join('\n');
  }, [includeEnd, result, weekendDays]);

  const toggleWeekend = (day: number) => {
    setWeekendDays((current) =>
      current.includes(day)
        ? current.filter((item) => item !== day)
        : [...current, day]
    );
  };

  const applyHolidayPreset = () => {
    setHolidaysText('2026-01-01\n2026-12-25\n2027-01-01');
  };

  return (
    <div className="space-y-4">
      <ToolLayout>
        <Panel
          description="Counts days from the start date, with optional end-date inclusion, weekends and holidays."
          title="Range"
        >
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field htmlFor="business-start" label="Start date">
                <Input
                  id="business-start"
                  onChange={(event) => setStartValue(event.target.value)}
                  type="date"
                  value={startValue}
                />
              </Field>
              <Field htmlFor="business-end" label="End date">
                <Input
                  id="business-end"
                  onChange={(event) => setEndValue(event.target.value)}
                  type="date"
                  value={endValue}
                />
              </Field>
            </div>

            <label className="flex cursor-pointer items-center gap-2 text-xs text-fg">
              <input
                checked={includeEnd}
                className="h-3.5 w-3.5 accent-[var(--accent)]"
                onChange={(event) => setIncludeEnd(event.target.checked)}
                type="checkbox"
              />
              Include the end date in the count
            </label>

            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-fg">Weekend days</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                {WEEKDAY_NAMES.map((label, day) => (
                  <label
                    className="flex cursor-pointer items-center gap-1.5 text-xs text-fg"
                    key={label}
                  >
                    <input
                      checked={weekendDays.includes(day)}
                      className="h-3.5 w-3.5 accent-[var(--accent)]"
                      onChange={() => toggleWeekend(day)}
                      type="checkbox"
                    />
                    {label.slice(0, 3)}
                  </label>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                <Button
                  onClick={() => setWeekendDays([0, 6])}
                  size="sm"
                  variant="ghost"
                >
                  Sat–Sun
                </Button>
                <Button
                  onClick={() => setWeekendDays([5, 6])}
                  size="sm"
                  variant="ghost"
                >
                  Fri–Sat
                </Button>
                <Button
                  onClick={() => setWeekendDays([])}
                  size="sm"
                  variant="ghost"
                >
                  No weekends
                </Button>
              </div>
              <p className="text-[11px] text-fg-muted">
                {weekendDays.length === 0
                  ? 'No weekend days selected, so every day counts as a working day.'
                  : `Selected: ${weekendDays
                      .slice()
                      .sort((a, b) => a - b)
                      .map((day) => WEEKDAY_NAMES[day] ?? String(day))
                      .join(', ')}`}
              </p>
            </div>

            <Field
              hint="One YYYY-MM-DD date per line, or comma separated."
              htmlFor="business-holidays"
              label="Holidays (optional)"
            >
              <Textarea
                className="min-h-[100px]"
                id="business-holidays"
                onChange={(event) => setHolidaysText(event.target.value)}
                placeholder={'2026-12-25\n2027-01-01'}
                value={holidaysText}
              />
            </Field>

            <div className="flex flex-wrap gap-2">
              <Button onClick={applyHolidayPreset} size="sm" variant="ghost">
                Add example holidays
              </Button>
              <Button
                onClick={() => setHolidaysText('')}
                size="sm"
                variant="ghost"
              >
                Clear holidays
              </Button>
            </div>

            {holidays.invalid.length > 0 && (
              <Callout title="Some holidays were ignored" variant="warning">
                Use YYYY-MM-DD dates. Invalid entries:{' '}
                {holidays.invalid.slice(0, 8).join(', ')}
                {holidays.invalid.length > 8
                  ? ` and ${holidays.invalid.length - 8} more`
                  : ''}
                .
              </Callout>
            )}

            {result.reversed && (
              <Callout variant="info">
                The end date is before the start date, so the range was swapped
                for counting.
              </Callout>
            )}

            {result.error && (
              <Callout title="Invalid dates" variant="error">
                {result.error}
              </Callout>
            )}
          </div>
        </Panel>

        <ResultPanel
          emptyText="Choose a start and end date to count business days."
          error={result.error}
          filename="business-days.txt"
          label="Business days"
          value={output}
        >
          {result.start && result.end ? (
            <div className="space-y-3">
              <div className="rounded-md border border-success/40 bg-success-subtle/40 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-fg-muted">
                    Business days
                  </p>
                  <Badge variant="success">
                    {includeEnd ? 'End included' : 'End excluded'}
                  </Badge>
                </div>
                <p className="mt-1 font-mono text-3xl font-semibold text-fg">
                  {formatNumber(result.businessDays)}
                </p>
                <p className="mt-1 text-xs text-fg-muted">
                  {formatDateOnly(result.start, 'medium')} →{' '}
                  {formatDateOnly(result.end, 'medium')}
                </p>
              </div>

              <div className="grid gap-2 sm:grid-cols-3">
                <div className="rounded-md border border-border bg-canvas-inset p-3">
                  <p className="text-[11px] uppercase tracking-wide text-fg-muted">
                    Calendar days
                  </p>
                  <p className="mt-1 font-mono text-sm text-fg">
                    {formatNumber(result.totalDays)}
                  </p>
                </div>
                <div className="rounded-md border border-border bg-canvas-inset p-3">
                  <p className="text-[11px] uppercase tracking-wide text-fg-muted">
                    Weekend days
                  </p>
                  <p className="mt-1 font-mono text-sm text-fg">
                    {formatNumber(result.weekendDays)}
                  </p>
                </div>
                <div className="rounded-md border border-border bg-canvas-inset p-3">
                  <p className="text-[11px] uppercase tracking-wide text-fg-muted">
                    Holidays applied
                  </p>
                  <p className="mt-1 font-mono text-sm text-fg">
                    {formatNumber(result.holidaysApplied)}
                  </p>
                </div>
              </div>

              {result.holidayRows.length > 0 && (
                <div className="overflow-hidden rounded-md border border-border">
                  <div className="border-b border-border bg-canvas-subtle/60 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-fg-muted">
                    Holiday breakdown
                  </div>
                  <ul className="divide-y divide-border">
                    {result.holidayRows.map((row) => (
                      <li
                        className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 text-xs"
                        key={toUtcInputValue(row.date)}
                      >
                        <span className="font-mono text-fg">
                          {formatDateOnly(row.date, 'medium')}
                        </span>
                        <span className="text-fg-muted">
                          {weekdayLabel(row.date)}
                        </span>
                        <span className="ml-auto">
                          {row.applied ? (
                            <Badge variant="success">Applied</Badge>
                          ) : row.weekend ? (
                            <Badge variant="warning">Falls on weekend</Badge>
                          ) : (
                            <Badge>Outside range</Badge>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <p className="text-[11px] text-fg-muted">
                Business days are calendar days that are not selected weekend
                days and not holidays inside the range.
              </p>
            </div>
          ) : undefined}
        </ResultPanel>
      </ToolLayout>
    </div>
  );
}
