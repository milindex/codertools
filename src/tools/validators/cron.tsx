'use client';

import { CronExpressionParser } from 'cron-parser';
import { toString as describeCron } from 'cronstrue';
import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Callout } from '@/components/ui/Callout';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { ToolLayout } from '@/components/ui/ToolLayout';

import { DetailList, Examples, ReasonList, Verdict } from './shared';

type FieldKind =
  'second' | 'minute' | 'hour' | 'dayOfMonth' | 'month' | 'dayOfWeek';

type FieldConfig = {
  label: string;
  unit: string;
  plural: string;
  at: string;
};

const FIELD_CONFIG: Record<FieldKind, FieldConfig> = {
  second: {
    label: 'Second',
    unit: 'second',
    plural: 'seconds',
    at: 'At second',
  },
  minute: {
    label: 'Minute',
    unit: 'minute',
    plural: 'minutes',
    at: 'At minute',
  },
  hour: { label: 'Hour', unit: 'hour', plural: 'hours', at: 'At hour' },
  dayOfMonth: {
    label: 'Day of month',
    unit: 'day of the month',
    plural: 'days of the month',
    at: 'On day',
  },
  month: { label: 'Month', unit: 'month', plural: 'months', at: 'In' },
  dayOfWeek: {
    label: 'Day of week',
    unit: 'day of the week',
    plural: 'days of the week',
    at: 'On',
  },
};

const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

const MONTH_NAMES = [
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

const MACROS: Record<string, string> = {
  '@yearly': '0 0 1 1 *',
  '@annually': '0 0 1 1 *',
  '@monthly': '0 0 1 * *',
  '@weekly': '0 0 * * 0',
  '@daily': '0 0 * * *',
  '@midnight': '0 0 * * *',
  '@hourly': '0 * * * *',
  '@minutely': '* * * * *',
  '@secondly': '* * * * * *',
  '@weekdays': '0 0 * * 1-5',
  '@weekends': '0 0 * * 0,6',
};

const formatValue = (value: string, kind: FieldKind): string => {
  const upper = value.toUpperCase();
  if (kind === 'dayOfWeek') {
    const numeric = Number(value);
    if (Number.isInteger(numeric) && numeric >= 0 && numeric <= 7) {
      return DAY_NAMES[numeric % 7] ?? value;
    }
    const index = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].indexOf(
      upper.slice(0, 3)
    );
    if (index >= 0) {
      return DAY_NAMES[index] ?? value;
    }
  }
  if (kind === 'month') {
    const numeric = Number(value);
    if (Number.isInteger(numeric) && numeric >= 1 && numeric <= 12) {
      return MONTH_NAMES[numeric - 1] ?? value;
    }
    const index = [
      'JAN',
      'FEB',
      'MAR',
      'APR',
      'MAY',
      'JUN',
      'JUL',
      'AUG',
      'SEP',
      'OCT',
      'NOV',
      'DEC',
    ].indexOf(upper.slice(0, 3));
    if (index >= 0) {
      return MONTH_NAMES[index] ?? value;
    }
  }
  return value;
};

const explainField = (raw: string, kind: FieldKind): string => {
  const config = FIELD_CONFIG[kind];

  const explainPart = (part: string): string => {
    const [base = '', stepText] = part.split('/');
    const step = stepText ? Number(stepText) : null;

    if (base === '*' || base === '?') {
      return step ? `Every ${step} ${config.plural}` : `Every ${config.unit}`;
    }

    if (base.includes('-')) {
      const [start = '', end = ''] = base.split('-');
      const range = `${formatValue(start, kind)} through ${formatValue(end, kind)}`;
      return step ? `Every ${step} ${config.plural} from ${range}` : range;
    }

    if (base.includes('#')) {
      const [day = '', occurrence = ''] = base.split('#');
      return `${formatValue(day, kind)}, occurrence ${occurrence}`;
    }

    if (/^[LW]$/i.test(base)) {
      return `Special value ${base}`;
    }

    if (step) {
      return `Every ${step} ${config.plural} starting at ${formatValue(base, kind)}`;
    }

    return `${config.at} ${formatValue(base, kind)}`;
  };

  const parts = raw.split(',');
  const explanations = parts.map((part) => explainPart(part));

  if (explanations.length === 1) {
    return explanations[0] ?? raw;
  }
  if (explanations.length === 2) {
    return `${explanations[0]} and ${explanations[1]}`;
  }
  return `${explanations.slice(0, -1).join(', ')}, and ${explanations[explanations.length - 1]}`;
};

const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'Unknown parse error.';

export default function CronValidator() {
  const [input, setInput] = useState('');

  const timezone = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return 'local time';
    }
  }, []);

  const analysis = useMemo(() => {
    const raw = input.trim();
    if (!raw) {
      return null;
    }

    const macro = MACROS[raw.toLowerCase()] ? raw.toLowerCase() : null;
    const effective = macro ? (MACROS[macro] ?? raw) : raw;
    const fields = effective.split(/\s+/);
    const errors: string[] = [];
    const warnings: string[] = [];

    if (fields.length !== 5 && fields.length !== 6) {
      return {
        valid: false,
        errors: [
          `A cron expression needs 5 fields (minute hour day-of-month month day-of-week) or 6 fields with seconds at the front; this has ${fields.length}.`,
        ],
        warnings: [],
        effective,
        macro,
        description: '',
        fieldExplanations: [] as {
          label: string;
          raw: string;
          explanation: string;
        }[],
        nextRuns: [] as string[],
        hasSeconds: false,
      };
    }

    const hasSeconds = fields.length === 6;
    const kinds: FieldKind[] = hasSeconds
      ? ['second', 'minute', 'hour', 'dayOfMonth', 'month', 'dayOfWeek']
      : ['minute', 'hour', 'dayOfMonth', 'month', 'dayOfWeek'];
    const fieldExplanations = fields.map((field, index) => {
      const kind = kinds[index] ?? 'minute';
      return {
        label: FIELD_CONFIG[kind].label,
        raw: field,
        explanation: explainField(field, kind),
      };
    });

    let description = '';
    try {
      description = describeCron(effective, {
        use24HourTimeFormat: true,
        throwExceptionOnParseError: true,
      });
    } catch (error) {
      warnings.push(
        `A plain-English description could not be generated: ${errorMessage(error)}`
      );
    }

    const nextRuns: string[] = [];
    try {
      const interval = CronExpressionParser.parse(
        effective,
        timezone === 'local time'
          ? { currentDate: new Date() }
          : { currentDate: new Date(), tz: timezone }
      );
      const formatterOptions: Intl.DateTimeFormatOptions = {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZoneName: 'short',
      };
      if (timezone !== 'local time') {
        formatterOptions.timeZone = timezone;
      }
      const formatter = new Intl.DateTimeFormat('en-US', formatterOptions);

      for (let index = 0; index < 8; index += 1) {
        if (!interval.hasNext()) {
          break;
        }
        nextRuns.push(formatter.format(interval.next().toDate()));
      }

      if (nextRuns.length === 0) {
        warnings.push(
          'The expression parses, but it has no upcoming occurrence with the current calendar rules (for example, day 31 in February).'
        );
      }
    } catch (error) {
      errors.push(`The expression could not be parsed: ${errorMessage(error)}`);
    }

    const dayOfMonth = fields[hasSeconds ? 3 : 2] ?? '*';
    const dayOfWeek = fields[hasSeconds ? 5 : 4] ?? '*';
    if (
      dayOfMonth !== '*' &&
      dayOfMonth !== '?' &&
      dayOfWeek !== '*' &&
      dayOfWeek !== '?'
    ) {
      warnings.push(
        'Both day-of-month and day-of-week are restricted. Traditional cron runs the job when either field matches (OR), which can produce more runs than expected.'
      );
    }

    if (macro) {
      warnings.push(`Predefined schedule ${macro} expands to ${effective}.`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      effective,
      macro,
      description,
      fieldExplanations,
      nextRuns,
      hasSeconds,
    };
  }, [input, timezone]);

  return (
    <ToolLayout>
      <Panel
        description="Validates standard 5-field and seconds-aware 6-field cron expressions, explains each field and previews upcoming runs in your local time zone."
        title="Cron expression"
      >
        <Field
          hint={timezone === 'local time' ? 'Local time' : timezone}
          label="Expression"
        >
          <Input
            aria-label="Cron expression"
            autoCapitalize="none"
            autoComplete="off"
            className="font-mono"
            onChange={(event) => setInput(event.target.value)}
            placeholder="*/5 * * * *"
            spellCheck={false}
            type="text"
            value={input}
          />
        </Field>
        <Examples
          items={[
            '*/5 * * * *',
            '0 9 * * 1-5',
            '0 0 1 * *',
            '*/15 * * * * *',
            '@daily',
          ]}
          onPick={setInput}
        />
      </Panel>

      <ResultPanel
        emptyText="Enter a cron expression to validate it and preview its next runs."
        label="Validation result"
        value={analysis?.valid ? analysis.effective : ''}
      >
        {analysis && (
          <div className="space-y-3">
            <Verdict
              title={
                analysis.valid
                  ? 'Valid cron expression'
                  : 'Invalid cron expression'
              }
              valid={analysis.valid}
            >
              {analysis.valid ? (
                <span>
                  {analysis.description ||
                    'The expression parses successfully.'}
                </span>
              ) : (
                <ReasonList items={analysis.errors} />
              )}
            </Verdict>

            {analysis.warnings.length > 0 && (
              <Callout title="Notes" variant="warning">
                <ReasonList items={analysis.warnings} />
              </Callout>
            )}

            {analysis.valid && (
              <>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant={analysis.hasSeconds ? 'accent' : 'default'}>
                    {analysis.hasSeconds ? '6 fields · seconds' : '5 fields'}
                  </Badge>
                  <Badge>
                    {analysis.fieldExplanations.length} parsed fields
                  </Badge>
                  {analysis.macro && <Badge>Macro {analysis.macro}</Badge>}
                </div>

                <DetailList
                  details={[
                    {
                      label: 'Expanded expression',
                      value: analysis.effective,
                      mono: true,
                      wide: true,
                      breakAll: true,
                    },
                    {
                      label: 'Plain English',
                      value: analysis.description || 'Not available',
                      wide: true,
                    },
                    {
                      label: 'Time zone',
                      value: timezone,
                    },
                    {
                      label: 'Next run',
                      value: analysis.nextRuns[0] ?? 'Not available',
                      mono: true,
                    },
                  ]}
                />

                <div className="overflow-hidden rounded-md border border-border">
                  <div className="border-b border-border bg-canvas-subtle/60 px-3 py-2 text-xs font-semibold text-fg">
                    Field-by-field explanation
                  </div>
                  <div className="divide-y divide-border">
                    {analysis.fieldExplanations.map((field) => (
                      <div
                        className="flex flex-wrap items-baseline justify-between gap-2 px-3 py-2"
                        key={field.label}
                      >
                        <span className="text-xs text-fg-muted">
                          {field.label}
                        </span>
                        <span className="flex flex-wrap items-baseline gap-2">
                          <code className="rounded border border-border bg-canvas-inset px-1.5 py-0.5 font-mono text-[11px] text-fg">
                            {field.raw}
                          </code>
                          <span className="text-sm text-fg">
                            {field.explanation}
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-md border border-border bg-canvas-subtle/40 p-3">
                  <p className="text-xs font-semibold text-fg">
                    Next 8 runs · {timezone}
                  </p>
                  <ol className="mt-2 space-y-1 font-mono text-xs text-fg-muted">
                    {analysis.nextRuns.map((run, index) => (
                      <li key={`${index}-${run}`}>
                        <span className="mr-2 inline-block w-4 text-right text-fg-subtle">
                          {index + 1}.
                        </span>
                        {run}
                      </li>
                    ))}
                  </ol>
                </div>

                <p className="text-xs leading-5 text-fg-muted">
                  Uses classic cron semantics: the day-of-month and day-of-week
                  fields are ORed when both are restricted. Some schedulers
                  treat them differently, so check the target system&apos;s
                  rules.
                </p>
              </>
            )}
          </div>
        )}
      </ResultPanel>
    </ToolLayout>
  );
}
