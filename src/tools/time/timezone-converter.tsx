'use client';

import { useEffect, useMemo, useState } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { Select } from '@/components/ui/Select';
import { ToolLayout } from '@/components/ui/ToolLayout';

import {
  COMMON_TIME_ZONES,
  dateTimeInZone,
  diffDaysUtc,
  formatInZone,
  formatOffset,
  getLocalTimeZone,
  getTimeZones,
  isValidTimeZone,
  parseDateOnly,
  parseWallClock,
  pickDefaultTimeZones,
  zoneOffsetMinutes,
} from './shared';

const TARGET_LIMIT = 120;

export default function TimezoneConverter() {
  const [dateValue, setDateValue] = useState('');
  const [timeValue, setTimeValue] = useState('');
  const [sourceZone, setSourceZone] = useState('UTC');
  const [targets, setTargets] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [initialised, setInitialised] = useState(false);

  const allZones = useMemo(() => getTimeZones(), []);

  useEffect(() => {
    if (initialised) {
      return;
    }
    const local = getLocalTimeZone();
    const current = dateTimeInZone(new Date(), local);
    setSourceZone(local);
    setDateValue(current.date);
    setTimeValue(current.time.slice(0, 5));
    setTargets(pickDefaultTimeZones());
    setInitialised(true);
  }, [initialised]);

  const converted = useMemo(
    () => parseWallClock(dateValue, timeValue, sourceZone),
    [dateValue, timeValue, sourceZone]
  );

  const formError = dateValue || timeValue ? converted.error : null;

  const visibleZones = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      const base = new Set<string>([
        getLocalTimeZone(),
        ...COMMON_TIME_ZONES,
        ...targets,
      ]);
      return Array.from(base)
        .filter((zone) => isValidTimeZone(zone))
        .sort((a, b) => a.localeCompare(b));
    }
    return allZones
      .filter((zone) => zone.toLowerCase().includes(trimmed))
      .slice(0, TARGET_LIMIT);
  }, [allZones, query, targets]);

  const sourceDay = useMemo(() => parseDateOnly(dateValue), [dateValue]);

  const results = useMemo(() => {
    if (!converted.date) {
      return [];
    }
    const instant = converted.date;
    return targets.map((zone) => {
      const offset = zoneOffsetMinutes(instant, zone);
      const targetDate = dateTimeInZone(instant, zone).date;
      const targetDay = parseDateOnly(targetDate);
      const dayDelta =
        sourceDay && targetDay ? diffDaysUtc(sourceDay, targetDay) : 0;

      return {
        zone,
        offset,
        dayDelta,
        formatted: formatInZone(instant, zone, {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
      };
    });
  }, [converted.date, sourceDay, targets]);

  const output = useMemo(() => {
    if (!converted.date) {
      return '';
    }
    const header = `Source: ${dateValue} ${timeValue} ${sourceZone}`;
    const rows = results.map((result) => {
      const dayNote =
        result.dayDelta === 0
          ? ''
          : result.dayDelta > 0
            ? ` (+${result.dayDelta} day${result.dayDelta === 1 ? '' : 's'})`
            : ` (${result.dayDelta} day${result.dayDelta === -1 ? '' : 's'})`;
      return `${result.zone} (${formatOffset(result.offset)}): ${result.formatted}${dayNote}`;
    });
    return [header, '', ...rows].join('\n');
  }, [converted.date, dateValue, results, sourceZone, timeValue]);

  const toggleTarget = (zone: string) => {
    setTargets((current) =>
      current.includes(zone)
        ? current.filter((item) => item !== zone)
        : [...current, zone]
    );
  };

  const useCurrentTime = () => {
    const current = dateTimeInZone(new Date(), sourceZone);
    setDateValue(current.date);
    setTimeValue(current.time.slice(0, 5));
  };

  return (
    <div className="space-y-4">
      <ToolLayout>
        <Panel
          description="Pick a date, time and source zone. Times are converted with daylight-saving rules."
          title="Source date and time"
        >
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field htmlFor="timezone-date" label="Date">
                <Input
                  id="timezone-date"
                  onChange={(event) => setDateValue(event.target.value)}
                  type="date"
                  value={dateValue}
                />
              </Field>
              <Field htmlFor="timezone-time" label="Time">
                <Input
                  id="timezone-time"
                  onChange={(event) => setTimeValue(event.target.value)}
                  step={1}
                  type="time"
                  value={timeValue}
                />
              </Field>
            </div>

            <Field htmlFor="timezone-source" label="Source time zone">
              <Select
                id="timezone-source"
                onChange={(event) => setSourceZone(event.target.value)}
                value={sourceZone}
              >
                {allZones.map((zone) => (
                  <option key={zone} value={zone}>
                    {zone.replace(/_/g, ' ')}
                  </option>
                ))}
              </Select>
            </Field>

            <div className="flex flex-wrap gap-2">
              <Button onClick={useCurrentTime} size="sm" variant="default">
                Use current time
              </Button>
              <Button
                onClick={() => setTargets(pickDefaultTimeZones())}
                size="sm"
                variant="ghost"
              >
                Common zones
              </Button>
              <Button onClick={() => setTargets([])} size="sm" variant="ghost">
                Clear targets
              </Button>
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold text-fg">
                  Target time zones
                </span>
                <Badge variant={targets.length > 0 ? 'accent' : 'warning'}>
                  {targets.length} selected
                </Badge>
              </div>
              <Input
                aria-label="Search time zones"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search all zones, e.g. Tokyo or Europe"
                value={query}
              />
              <div className="max-h-56 overflow-auto rounded-md border border-border bg-canvas-inset">
                {visibleZones.length === 0 ? (
                  <p className="p-3 text-xs text-fg-muted">
                    No time zones match that search.
                  </p>
                ) : (
                  visibleZones.map((zone) => (
                    <label
                      className="flex cursor-pointer items-center gap-2 border-b border-border/60 px-3 py-1.5 text-xs text-fg hover:bg-surface-hover"
                      key={zone}
                    >
                      <input
                        checked={targets.includes(zone)}
                        className="h-3.5 w-3.5 accent-[var(--accent)]"
                        onChange={() => toggleTarget(zone)}
                        type="checkbox"
                      />
                      <span className="truncate">
                        {zone.replace(/_/g, ' ')}
                      </span>
                    </label>
                  ))
                )}
              </div>
              <p className="text-[11px] text-fg-muted">
                Common zones are shown by default. Search to add any IANA zone.
                {query.trim() && visibleZones.length === TARGET_LIMIT
                  ? ` Showing the first ${TARGET_LIMIT} matches.`
                  : ''}
              </p>
            </div>

            {targets.length === 0 && (
              <Callout variant="warning">
                Select at least one target time zone to see converted times.
              </Callout>
            )}

            {formError && (
              <Callout title="Invalid date or time" variant="error">
                {formError}
              </Callout>
            )}

            {converted.nonexistent && (
              <Callout title="Daylight-saving gap" variant="warning">
                {timeValue} does not exist on {dateValue} in {sourceZone}
                because the clocks move forward. The nearest valid instant is
                shown.
              </Callout>
            )}
          </div>
        </Panel>

        <ResultPanel
          emptyText="Choose a date, a time and at least one target zone."
          error={formError}
          filename="timezone-conversion.txt"
          label="Converted times"
          value={output}
        >
          {converted.date ? (
            <div className="space-y-3">
              <div className="rounded-md border border-accent/40 bg-accent-subtle/30 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-fg-muted">
                    Source
                  </p>
                  <Badge variant="accent">
                    {formatOffset(
                      zoneOffsetMinutes(converted.date, sourceZone)
                    )}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-fg">
                  {formatInZone(converted.date, sourceZone, {
                    dateStyle: 'full',
                    timeStyle: 'long',
                  })}
                </p>
                <p className="mt-1 break-all font-mono text-xs text-fg-muted">
                  {sourceZone} · UTC {converted.date.toISOString()}
                </p>
              </div>

              {results.length === 0 ? (
                <p className="rounded-md border border-dashed border-border p-4 text-center text-sm text-fg-muted">
                  Add a target time zone to convert this instant.
                </p>
              ) : (
                <div className="space-y-2">
                  {results.map((result) => (
                    <div
                      className="rounded-md border border-border bg-canvas-inset p-3"
                      key={result.zone}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="min-w-0 break-words text-xs font-semibold text-fg">
                          {result.zone.replace(/_/g, ' ')}
                        </p>
                        <div className="flex items-center gap-1.5">
                          {result.dayDelta !== 0 && (
                            <Badge
                              variant={
                                result.dayDelta > 0 ? 'success' : 'warning'
                              }
                            >
                              {result.dayDelta > 0 ? '+' : ''}
                              {result.dayDelta} day
                              {Math.abs(result.dayDelta) === 1 ? '' : 's'}
                            </Badge>
                          )}
                          <Badge>{formatOffset(result.offset)}</Badge>
                        </div>
                      </div>
                      <p className="mt-1 text-sm text-fg">{result.formatted}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : undefined}
        </ResultPanel>
      </ToolLayout>
    </div>
  );
}
