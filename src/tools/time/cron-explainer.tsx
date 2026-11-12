'use client';

import cronstrue from 'cronstrue';
import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { ToolLayout } from '@/components/ui/ToolLayout';

type FieldKind =
  'second' | 'minute' | 'hour' | 'dayOfMonth' | 'month' | 'dayOfWeek' | 'year';

type FieldDefinition = {
  kind: FieldKind;
  label: string;
  allowed: string;
};

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

const MONTH_SHORT = MONTH_NAMES.map((name) => name.slice(0, 3).toUpperCase());

const WEEKDAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

const WEEKDAY_SHORT = WEEKDAY_NAMES.map((name) =>
  name.slice(0, 3).toUpperCase()
);

const PREDEFINED: Record<string, string> = {
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

const LAYOUTS: Record<number, FieldDefinition[]> = {
  5: [
    { kind: 'minute', label: 'Minute', allowed: '0–59' },
    { kind: 'hour', label: 'Hour', allowed: '0–23' },
    { kind: 'dayOfMonth', label: 'Day of month', allowed: '1–31, L' },
    { kind: 'month', label: 'Month', allowed: '1–12, JAN–DEC' },
    { kind: 'dayOfWeek', label: 'Day of week', allowed: '0–7, SUN–SAT' },
  ],
  6: [
    { kind: 'second', label: 'Second', allowed: '0–59' },
    { kind: 'minute', label: 'Minute', allowed: '0–59' },
    { kind: 'hour', label: 'Hour', allowed: '0–23' },
    { kind: 'dayOfMonth', label: 'Day of month', allowed: '1–31, L' },
    { kind: 'month', label: 'Month', allowed: '1–12, JAN–DEC' },
    { kind: 'dayOfWeek', label: 'Day of week', allowed: '0–7, SUN–SAT' },
  ],
  7: [
    { kind: 'second', label: 'Second', allowed: '0–59' },
    { kind: 'minute', label: 'Minute', allowed: '0–59' },
    { kind: 'hour', label: 'Hour', allowed: '0–23' },
    { kind: 'dayOfMonth', label: 'Day of month', allowed: '1–31, L' },
    { kind: 'month', label: 'Month', allowed: '1–12, JAN–DEC' },
    { kind: 'dayOfWeek', label: 'Day of week', allowed: '0–7, SUN–SAT' },
    { kind: 'year', label: 'Year', allowed: '1970–2099' },
  ],
};

const EXAMPLES = [
  { label: 'Every 15 minutes', value: '*/15 * * * *' },
  { label: 'Weekdays at 09:00', value: '0 9 * * 1-5' },
  { label: 'Last day of month', value: '0 0 L * *' },
  { label: 'Second Monday', value: '0 0 * * 1#2' },
  { label: '@weekly', value: '@weekly' },
];

const ordinal = (value: number): string => {
  const mod100 = value % 100;
  if (mod100 >= 11 && mod100 <= 13) {
    return `${value}th`;
  }
  switch (value % 10) {
    case 1:
      return `${value}st`;
    case 2:
      return `${value}nd`;
    case 3:
      return `${value}rd`;
    default:
      return `${value}th`;
  }
};

const joinList = (items: string[]): string => {
  if (items.length === 0) {
    return '';
  }
  if (items.length === 1) {
    return items[0] ?? '';
  }
  if (items.length === 2) {
    return `${items[0]} and ${items[1]}`;
  }
  const last = items[items.length - 1] ?? '';
  return `${items.slice(0, -1).join(', ')} and ${last}`;
};

const parseFieldValue = (kind: FieldKind, text: string): number | null => {
  const upper = text.trim().toUpperCase();
  if (kind === 'month') {
    const index = MONTH_SHORT.indexOf(upper.slice(0, 3));
    if (index >= 0) {
      return index + 1;
    }
  }
  if (kind === 'dayOfWeek') {
    const index = WEEKDAY_SHORT.indexOf(upper.slice(0, 3));
    if (index >= 0) {
      return index;
    }
  }
  const numeric = Number(upper);
  return Number.isFinite(numeric) ? numeric : null;
};

const formatFieldValue = (kind: FieldKind, text: string): string => {
  const numeric = parseFieldValue(kind, text);
  if (numeric === null) {
    return text;
  }
  if (kind === 'month') {
    return MONTH_NAMES[(numeric - 1 + 12) % 12] ?? text;
  }
  if (kind === 'dayOfWeek') {
    return WEEKDAY_NAMES[((numeric % 7) + 7) % 7] ?? text;
  }
  if (kind === 'dayOfMonth') {
    return ordinal(numeric);
  }
  return String(numeric);
};

const unitPlural = (kind: FieldKind): string => {
  switch (kind) {
    case 'second':
      return 'seconds';
    case 'minute':
      return 'minutes';
    case 'hour':
      return 'hours';
    case 'dayOfMonth':
      return 'days of the month';
    case 'month':
      return 'months';
    case 'dayOfWeek':
      return 'days of the week';
    case 'year':
    default:
      return 'years';
  }
};

const everyLabel = (kind: FieldKind): string => {
  switch (kind) {
    case 'second':
      return 'Every second';
    case 'minute':
      return 'Every minute';
    case 'hour':
      return 'Every hour';
    case 'dayOfMonth':
      return 'Every day of the month';
    case 'month':
      return 'Every month';
    case 'dayOfWeek':
      return 'Every day of the week';
    case 'year':
    default:
      return 'Every year';
  }
};

const prefixFor = (kind: FieldKind): string => {
  if (kind === 'month' || kind === 'year') {
    return 'In';
  }
  if (kind === 'dayOfMonth' || kind === 'dayOfWeek') {
    return 'On';
  }
  return 'At';
};

const describeToken = (token: string, kind: FieldKind): string => {
  if (token === 'L') {
    return kind === 'dayOfMonth'
      ? 'the last day of the month'
      : 'the last day of the week';
  }

  const lastWeekday = /^(\d+)L$/i.exec(token);
  if (lastWeekday) {
    const [, value = '0'] = lastWeekday;
    return `the last ${formatFieldValue(kind, value)} of the month`;
  }

  const nthWeekday = /^(\d+)#(\d+)$/.exec(token);
  if (nthWeekday) {
    const [, value = '0', nth = '1'] = nthWeekday;
    return `the ${ordinal(Number(nth))} ${formatFieldValue(
      kind,
      value
    )} of the month`;
  }

  if (token.toUpperCase().startsWith('H')) {
    return 'a hash-based random value';
  }

  const range = /^([^-/]+)-([^-/]+)(?:\/(\d+))?$/.exec(token);
  if (range) {
    const [, from = '', to = '', step] = range;
    const fromLabel = formatFieldValue(kind, from);
    const toLabel = formatFieldValue(kind, to);
    if (step) {
      return `every ${step} ${unitPlural(kind)} from ${fromLabel} through ${toLabel}`;
    }
    return `${fromLabel} through ${toLabel}`;
  }

  return formatFieldValue(kind, token);
};

const explainToken = (token: string, kind: FieldKind): string => {
  if (token === '*' || token === '?') {
    return everyLabel(kind);
  }

  const stepOnly = /^\*\/(\d+)$/.exec(token);
  if (stepOnly) {
    const [, step = '1'] = stepOnly;
    return `Every ${step} ${unitPlural(kind)}`;
  }

  const stepRange = /^([^-/]+)-([^-/]+)\/(\d+)$/.exec(token);
  if (stepRange) {
    const [, from = '', to = '', step = '1'] = stepRange;
    return `Every ${step} ${unitPlural(
      kind
    )} from ${formatFieldValue(kind, from)} through ${formatFieldValue(
      kind,
      to
    )}`;
  }

  const stepFrom = /^([^/]+)\/(\d+)$/.exec(token);
  if (stepFrom && !token.toUpperCase().startsWith('H')) {
    const [, from = '', step = '1'] = stepFrom;
    return `Every ${step} ${unitPlural(
      kind
    )} starting at ${formatFieldValue(kind, from)}`;
  }

  if (token.toUpperCase().startsWith('H')) {
    return 'At a hash-based random value';
  }

  return `${prefixFor(kind)} ${describeToken(token, kind)}`;
};

const explainField = (raw: string, kind: FieldKind): string => {
  const value = raw.trim();
  if (!value) {
    return '';
  }
  if (value === '*' || value === '?') {
    return everyLabel(kind);
  }
  if (value.toUpperCase().startsWith('H')) {
    return 'At a hash-based random value';
  }

  const tokens = value.split(',');
  const simple = tokens.every(
    (token) =>
      !token.includes('/') &&
      !token.includes('#') &&
      !token.toUpperCase().includes('L') &&
      !token.toUpperCase().startsWith('H')
  );

  if (simple) {
    return `${prefixFor(kind)} ${joinList(
      tokens.map((token) => describeToken(token, kind))
    )}`;
  }

  return tokens.map((token) => explainToken(token, kind)).join('; ');
};

type ExplainerResult = {
  error: string | null;
  description: string;
  expanded: string;
  note: string | null;
  fields: Array<FieldDefinition & { raw: string; meaning: string }>;
};

export default function CronExplainer() {
  const [expression, setExpression] = useState('0 9 * * 1-5');

  const result = useMemo<ExplainerResult>(() => {
    const original = expression.trim();
    if (!original) {
      return {
        error: null,
        description: '',
        expanded: '',
        note: null,
        fields: [],
      };
    }

    const alias = PREDEFINED[original.toLowerCase()];
    const expanded = alias ?? original;
    const note = alias ? `${original} expands to ${expanded}.` : null;
    const parts = expanded.split(/\s+/).filter(Boolean);
    const layout = LAYOUTS[parts.length];

    if (!layout) {
      return {
        error: `A cron expression needs 5, 6 or 7 fields. This one has ${parts.length}.`,
        description: '',
        expanded,
        note,
        fields: [],
      };
    }

    let description = '';
    let error: string | null = null;
    try {
      description = cronstrue.toString(expanded, {
        throwExceptionOnParseError: true,
        use24HourTimeFormat: true,
      });
    } catch (caught) {
      error =
        caught instanceof Error && caught.message
          ? caught.message
          : 'This expression could not be described. Check each field below.';
      description = 'No plain-English description is available.';
    }

    const fields = layout.map((definition, index) => {
      const raw = parts[index] ?? '';
      return {
        ...definition,
        raw,
        meaning: explainField(raw, definition.kind),
      };
    });

    return { error, description, expanded, note, fields };
  }, [expression]);

  const hasExpression = expression.trim().length > 0;

  const output = useMemo(() => {
    if (!hasExpression || result.fields.length === 0) {
      return '';
    }
    return [
      `Expression: ${expression.trim()}`,
      result.note ? `Note: ${result.note}` : '',
      '',
      result.description,
      '',
      'Field breakdown:',
      ...result.fields.map(
        (field) =>
          `${field.label} (${field.raw}): ${field.meaning} — allowed ${field.allowed}`
      ),
    ]
      .filter((line) => line !== '')
      .join('\n');
  }, [expression, hasExpression, result]);

  return (
    <div className="space-y-4">
      <ToolLayout>
        <Panel
          description="Paste a cron expression to see it in plain English, field by field."
          title="Cron expression"
        >
          <div className="space-y-3">
            <Field
              hint="5, 6 or 7 fields, or a predefined @alias."
              htmlFor="cron-explainer-input"
              label="Expression"
            >
              <Input
                className="font-mono"
                id="cron-explainer-input"
                onChange={(event) => setExpression(event.target.value)}
                placeholder="0 9 * * 1-5"
                spellCheck={false}
                value={expression}
              />
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

            {result.note && <Callout variant="info">{result.note}</Callout>}

            {result.error && (
              <Callout title="Could not fully parse" variant="error">
                {result.error}
              </Callout>
            )}
          </div>
        </Panel>

        <ResultPanel
          emptyText={
            hasExpression && result.error
              ? 'Fix the expression to see a full field breakdown.'
              : 'Enter a cron expression to see what it means.'
          }
          filename="cron-explanation.txt"
          label="Explanation"
          value={output}
        >
          {hasExpression && result.fields.length > 0 ? (
            <div className="space-y-3">
              <div className="rounded-md border border-accent/40 bg-accent-subtle/30 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-fg-muted">
                    Plain English
                  </p>
                  <Badge variant={result.error ? 'warning' : 'success'}>
                    {result.error ? 'Partial' : 'Valid'}
                  </Badge>
                </div>
                <p className="mt-1 text-sm leading-6 text-fg">
                  {result.description}
                </p>
                <p className="mt-2 break-all font-mono text-[11px] text-fg-muted">
                  {result.expanded}
                </p>
              </div>

              {result.error && (
                <Callout variant="warning" title="Description unavailable">
                  {result.error}
                </Callout>
              )}

              <div className="overflow-auto rounded-md border border-border">
                <table className="w-full text-left text-xs">
                  <thead className="bg-canvas-subtle/60 text-[11px] uppercase tracking-wide text-fg-muted">
                    <tr>
                      <th className="px-3 py-2 font-semibold">Field</th>
                      <th className="px-3 py-2 font-semibold">Value</th>
                      <th className="px-3 py-2 font-semibold">Meaning</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {result.fields.map((field) => (
                      <tr key={`${field.kind}-${field.raw}`}>
                        <td className="whitespace-nowrap px-3 py-2 font-semibold text-fg">
                          {field.label}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 font-mono text-fg-muted">
                          {field.raw}
                        </td>
                        <td className="px-3 py-2 text-fg">
                          {field.meaning}
                          <span className="mt-0.5 block text-[11px] text-fg-subtle">
                            {field.allowed}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : undefined}
        </ResultPanel>
      </ToolLayout>
    </div>
  );
}
