'use client';

import { useEffect, useMemo, useState } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { ToolLayout } from '@/components/ui/ToolLayout';

import {
  addDaysUtc,
  calendarDifference,
  countWeekdays,
  diffDaysUtc,
  formatDateOnly,
  formatNumber,
  parseDateOnly,
  toDateInputValue,
} from './shared';

type Difference = {
  error: string | null;
  reversed: boolean;
  years: number;
  months: number;
  days: number;
  totalDays: number;
  businessDays: number;
  start: Date | null;
  end: Date | null;
};

export default function DateDifference() {
  const [startValue, setStartValue] = useState('');
  const [endValue, setEndValue] = useState('');
  const [businessOnly, setBusinessOnly] = useState(false);
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
    setEndValue(toDateInputValue(addDaysUtc(start, 7)));
    setInitialised(true);
  }, [initialised]);

  const difference = useMemo<Difference>(() => {
    if (!startValue || !endValue) {
      return {
        error: null,
        reversed: false,
        years: 0,
        months: 0,
        days: 0,
        totalDays: 0,
        businessDays: 0,
        start: null,
        end: null,
      };
    }

    const start = parseDateOnly(startValue);
    const end = parseDateOnly(endValue);
    if (!start || !end) {
      return {
        error: 'Enter two valid dates in YYYY-MM-DD format.',
        reversed: false,
        years: 0,
        months: 0,
        days: 0,
        totalDays: 0,
        businessDays: 0,
        start: null,
        end: null,
      };
    }

    const reversed = end.getTime() < start.getTime();
    const earlier = reversed ? end : start;
    const later = reversed ? start : end;
    const calendar = calendarDifference(earlier, later);
    const totalDays = diffDaysUtc(earlier, later);

    return {
      error: null,
      reversed,
      years: calendar.years,
      months: calendar.months,
      days: calendar.days,
      totalDays,
      businessDays: countWeekdays(earlier, later),
      start,
      end,
    };
  }, [startValue, endValue]);

  const countingDays = businessOnly
    ? difference.businessDays
    : difference.totalDays;

  const totals = useMemo(() => {
    const sign = difference.reversed ? -1 : 1;
    const days = sign * countingDays;
    return [
      { label: 'Total days', value: formatNumber(days) },
      {
        label: 'Total weeks',
        value: formatNumber(days / 7, 3),
      },
      { label: 'Total hours', value: formatNumber(days * 24) },
      { label: 'Total minutes', value: formatNumber(days * 1440) },
      { label: 'Total seconds', value: formatNumber(days * 86400) },
    ];
  }, [countingDays, difference.reversed]);

  const calendarLabel = `${difference.years} ${
    difference.years === 1 ? 'year' : 'years'
  }, ${difference.months} ${
    difference.months === 1 ? 'month' : 'months'
  }, ${difference.days} ${difference.days === 1 ? 'day' : 'days'}`;

  const output = useMemo(() => {
    if (!difference.start || !difference.end) {
      return '';
    }
    const sign = difference.reversed ? -1 : 1;
    const totalDays = sign * difference.totalDays;
    return [
      `Start: ${formatDateOnly(difference.start, 'full')}`,
      `End: ${formatDateOnly(difference.end, 'full')}`,
      difference.reversed
        ? 'Note: end is before start; absolute values are shown.'
        : '',
      '',
      `Calendar difference: ${calendarLabel}`,
      `Total days: ${formatNumber(totalDays)}`,
      `Business days (Mon–Fri): ${formatNumber(
        sign * difference.businessDays
      )}`,
      `Weeks: ${formatNumber(totalDays / 7, 3)}`,
      `Hours: ${formatNumber(totalDays * 24)}`,
      `Minutes: ${formatNumber(totalDays * 1440)}`,
      `Seconds: ${formatNumber(totalDays * 86400)}`,
    ]
      .filter((line) => line !== '')
      .join('\n');
  }, [calendarLabel, difference]);

  const swap = () => {
    setStartValue(endValue);
    setEndValue(startValue);
  };

  const setToday = () => {
    const today = new Date();
    setStartValue(
      toDateInputValue(
        new Date(
          Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
        )
      )
    );
  };

  return (
    <div className="space-y-4">
      <ToolLayout>
        <Panel
          description="The end date is exclusive for total days, so the same date is a zero-day difference."
          title="Dates"
        >
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                hint={
                  difference.start
                    ? formatDateOnly(difference.start, 'short')
                    : undefined
                }
                htmlFor="difference-start"
                label="Start date"
              >
                <Input
                  id="difference-start"
                  onChange={(event) => setStartValue(event.target.value)}
                  type="date"
                  value={startValue}
                />
              </Field>
              <Field
                hint={
                  difference.end
                    ? formatDateOnly(difference.end, 'short')
                    : undefined
                }
                htmlFor="difference-end"
                label="End date"
              >
                <Input
                  id="difference-end"
                  onChange={(event) => setEndValue(event.target.value)}
                  type="date"
                  value={endValue}
                />
              </Field>
            </div>

            <label className="flex cursor-pointer items-center gap-2 text-xs text-fg">
              <input
                checked={businessOnly}
                className="h-3.5 w-3.5 accent-[var(--accent)]"
                onChange={(event) => setBusinessOnly(event.target.checked)}
                type="checkbox"
              />
              Count only business days (Mon–Fri) in the totals
            </label>

            <div className="flex flex-wrap gap-2">
              <Button onClick={setToday} size="sm" variant="default">
                Start today
              </Button>
              <Button onClick={swap} size="sm" variant="ghost">
                Swap dates
              </Button>
            </div>

            {difference.reversed && (
              <Callout variant="warning">
                The end date is before the start date. The absolute difference
                is shown with a negative sign on totals.
              </Callout>
            )}

            {difference.error && (
              <Callout title="Invalid dates" variant="error">
                {difference.error}
              </Callout>
            )}
          </div>
        </Panel>

        <ResultPanel
          emptyText="Choose a start and end date."
          error={difference.error}
          filename="date-difference.txt"
          label="Difference"
          value={output}
        >
          {difference.start && difference.end ? (
            <div className="space-y-4">
              <div className="rounded-md border border-accent/40 bg-accent-subtle/30 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-fg-muted">
                    Calendar difference
                  </p>
                  <Badge variant={difference.reversed ? 'warning' : 'accent'}>
                    {difference.reversed ? 'Reversed' : 'Start → end'}
                  </Badge>
                </div>
                <p className="mt-2 font-mono text-lg text-fg">
                  {calendarLabel}
                </p>
                <p className="mt-1 text-xs text-fg-muted">
                  {formatDateOnly(difference.start, 'long')} →{' '}
                  {formatDateOnly(difference.end, 'long')}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Years', value: difference.years },
                  { label: 'Months', value: difference.months },
                  { label: 'Days', value: difference.days },
                ].map((item) => (
                  <div
                    className="rounded-md border border-border bg-canvas-inset p-3 text-center"
                    key={item.label}
                  >
                    <p className="font-mono text-xl text-fg">{item.value}</p>
                    <p className="mt-1 text-[11px] uppercase tracking-wide text-fg-muted">
                      {item.label}
                    </p>
                  </div>
                ))}
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <div className="rounded-md border border-success/40 bg-success-subtle/40 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-fg-muted">
                    Business days (Mon–Fri)
                  </p>
                  <p className="mt-1 font-mono text-lg text-fg">
                    {formatNumber(
                      difference.reversed
                        ? -difference.businessDays
                        : difference.businessDays
                    )}
                  </p>
                </div>
                {totals.map((item) => (
                  <div
                    className="rounded-md border border-border bg-canvas-inset p-3"
                    key={item.label}
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-fg-muted">
                      {item.label}
                    </p>
                    <p className="mt-1 font-mono text-sm text-fg">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              <p className="text-[11px] text-fg-muted">
                {businessOnly
                  ? 'Totals currently count weekdays only; weekend days are excluded.'
                  : 'Totals currently count every calendar day. Enable the checkbox to switch to business days.'}
              </p>
            </div>
          ) : undefined}
        </ResultPanel>
      </ToolLayout>
    </div>
  );
}
