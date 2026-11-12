/**
 * Shared date/time helpers for the Time & Date tools.
 *
 * Everything here uses the native Date API and Intl so the tools stay
 * dependency free and run entirely in the browser.
 */

export const FALLBACK_TIME_ZONES = [
  'UTC',
  'Africa/Cairo',
  'Africa/Johannesburg',
  'Africa/Lagos',
  'Africa/Nairobi',
  'America/Anchorage',
  'America/Argentina/Buenos_Aires',
  'America/Bogota',
  'America/Chicago',
  'America/Denver',
  'America/Halifax',
  'America/Los_Angeles',
  'America/Mexico_City',
  'America/New_York',
  'America/Phoenix',
  'America/Sao_Paulo',
  'America/St_Johns',
  'America/Toronto',
  'America/Vancouver',
  'Asia/Bangkok',
  'Asia/Dhaka',
  'Asia/Dubai',
  'Asia/Hong_Kong',
  'Asia/Jakarta',
  'Asia/Jerusalem',
  'Asia/Karachi',
  'Asia/Kathmandu',
  'Asia/Kolkata',
  'Asia/Kuala_Lumpur',
  'Asia/Manila',
  'Asia/Riyadh',
  'Asia/Seoul',
  'Asia/Shanghai',
  'Asia/Singapore',
  'Asia/Taipei',
  'Asia/Tehran',
  'Asia/Tokyo',
  'Australia/Adelaide',
  'Australia/Brisbane',
  'Australia/Melbourne',
  'Australia/Perth',
  'Australia/Sydney',
  'Europe/Amsterdam',
  'Europe/Athens',
  'Europe/Berlin',
  'Europe/Brussels',
  'Europe/Bucharest',
  'Europe/Dublin',
  'Europe/Helsinki',
  'Europe/Istanbul',
  'Europe/Lisbon',
  'Europe/London',
  'Europe/Madrid',
  'Europe/Moscow',
  'Europe/Oslo',
  'Europe/Paris',
  'Europe/Prague',
  'Europe/Rome',
  'Europe/Stockholm',
  'Europe/Vienna',
  'Europe/Warsaw',
  'Europe/Zurich',
  'Pacific/Auckland',
  'Pacific/Fiji',
  'Pacific/Honolulu',
];

export const COMMON_TIME_ZONES = [
  'UTC',
  'America/Los_Angeles',
  'America/Denver',
  'America/Chicago',
  'America/New_York',
  'America/Sao_Paulo',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Moscow',
  'Africa/Cairo',
  'Africa/Johannesburg',
  'Asia/Dubai',
  'Asia/Karachi',
  'Asia/Kolkata',
  'Asia/Dhaka',
  'Asia/Bangkok',
  'Asia/Shanghai',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Australia/Perth',
  'Australia/Sydney',
  'Pacific/Auckland',
  'Pacific/Honolulu',
];

let cachedTimeZones: string[] | null = null;

export const pad = (value: number, length = 2): string =>
  String(value).padStart(length, '0');

export function getLocalTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

export function isValidTimeZone(timeZone: string): boolean {
  if (!timeZone) {
    return false;
  }
  try {
    new Intl.DateTimeFormat('en-US', { timeZone }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

export function getTimeZones(): string[] {
  if (cachedTimeZones) {
    return cachedTimeZones;
  }

  let values: string[] = [];
  try {
    const intl = Intl as typeof Intl & {
      supportedValuesOf?: (key: string) => string[];
    };
    values = intl.supportedValuesOf?.('timeZone') ?? [];
  } catch {
    values = [];
  }

  const zones = new Set<string>(
    values.length > 0 ? values : FALLBACK_TIME_ZONES
  );
  // Keep common aliases such as Asia/Kolkata available even when the runtime
  // reports only the canonical ICU spelling (Asia/Calcutta).
  for (const zone of COMMON_TIME_ZONES) {
    zones.add(zone);
  }
  zones.add('UTC');
  const local = getLocalTimeZone();
  if (isValidTimeZone(local)) {
    zones.add(local);
  }

  cachedTimeZones = Array.from(zones).sort((a, b) => a.localeCompare(b));
  return cachedTimeZones;
}

export function pickDefaultTimeZones(limit = 6): string[] {
  const zones = [getLocalTimeZone(), ...COMMON_TIME_ZONES];
  const result: string[] = [];
  for (const zone of zones) {
    if (!result.includes(zone) && isValidTimeZone(zone)) {
      result.push(zone);
    }
    if (result.length >= limit) {
      break;
    }
  }
  return result;
}

type ZonedParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

function getZonedParts(date: Date, timeZone: string): ZonedParts | null {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).formatToParts(date);

    const values: Record<string, string> = {};
    for (const part of parts) {
      if (part.type !== 'literal') {
        values[part.type] = part.value;
      }
    }

    const year = Number(values.year);
    const month = Number(values.month);
    const day = Number(values.day);
    const hour = Number(values.hour);
    const minute = Number(values.minute);
    const second = Number(values.second);

    if (
      [year, month, day, hour, minute, second].every((value) =>
        Number.isFinite(value)
      )
    ) {
      return { year, month, day, hour, minute, second };
    }
  } catch {
    // Fall through to null.
  }
  return null;
}

/** Offset of an IANA zone from UTC, in minutes, at the given instant. */
export function zoneOffsetMinutes(date: Date, timeZone: string): number {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      timeZoneName: 'longOffset',
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).formatToParts(date);

    const name = parts.find((part) => part.type === 'timeZoneName')?.value;
    if (name) {
      if (name === 'GMT' || name === 'UTC') {
        return 0;
      }
      const match = /GMT([+-])(\d{1,2})(?::(\d{2}))?/.exec(name);
      if (match) {
        const [, sign = '+', hours = '0', minutes = '0'] = match;
        return (sign === '-' ? -1 : 1) * (Number(hours) * 60 + Number(minutes));
      }
    }

    const zoned = getZonedParts(date, timeZone);
    if (zoned) {
      const wall = Date.UTC(
        zoned.year,
        zoned.month - 1,
        zoned.day,
        zoned.hour,
        zoned.minute,
        zoned.second
      );
      const truncated = date.getTime() - date.getMilliseconds();
      return Math.round((wall - truncated) / 60000);
    }
  } catch {
    // Unknown zone or unsupported formatter.
  }
  return 0;
}

export function formatOffset(minutes: number): string {
  const sign = minutes >= 0 ? '+' : '-';
  const absolute = Math.abs(minutes);
  const hours = Math.floor(absolute / 60);
  const rest = absolute % 60;
  return `UTC${sign}${pad(hours)}:${pad(rest)}`;
}

export function formatZoneLabel(timeZone: string, date: Date): string {
  return `${timeZone.replace(/_/g, ' ')} (${formatOffset(
    zoneOffsetMinutes(date, timeZone)
  )})`;
}

export function formatInZone(
  date: Date,
  timeZone: string,
  options: Intl.DateTimeFormatOptions = {}
): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      hourCycle: 'h23',
      ...options,
      timeZone,
    }).format(date);
  } catch {
    return new Intl.DateTimeFormat('en-US', {
      hourCycle: 'h23',
      ...options,
      timeZone: 'UTC',
    }).format(date);
  }
}

export function dateTimeInZone(
  date: Date,
  timeZone: string
): { date: string; time: string } {
  const parts = getZonedParts(date, timeZone);
  if (!parts) {
    return { date: '', time: '' };
  }
  return {
    date: `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`,
    time: `${pad(parts.hour)}:${pad(parts.minute)}:${pad(parts.second)}`,
  };
}

export type WallClockResult = {
  date: Date | null;
  error: string | null;
  /** True when the wall-clock time was skipped by a DST change. */
  nonexistent: boolean;
};

/**
 * Convert a date + time that is expressed in a specific IANA zone into a
 * concrete Date. The offset is resolved twice so DST transitions are handled.
 */
export function parseWallClock(
  dateValue: string,
  timeValue: string,
  timeZone: string
): WallClockResult {
  if (!dateValue) {
    return { date: null, error: 'Choose a date.', nonexistent: false };
  }
  if (!timeValue) {
    return { date: null, error: 'Choose a time.', nonexistent: false };
  }
  if (!isValidTimeZone(timeZone)) {
    return {
      date: null,
      error: 'Choose a valid time zone.',
      nonexistent: false,
    };
  }

  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateValue.trim());
  if (!dateMatch) {
    return { date: null, error: 'Enter a valid date.', nonexistent: false };
  }
  const timeMatch = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(timeValue.trim());
  if (!timeMatch) {
    return { date: null, error: 'Enter a valid time.', nonexistent: false };
  }

  const [, yearText = '', monthText = '', dayText = ''] = dateMatch;
  const [, hourText = '', minuteText = '', secondText = '0'] = timeMatch;

  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const second = Number(secondText);

  if (
    !Number.isInteger(year) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return { date: null, error: 'Enter a valid date.', nonexistent: false };
  }
  if (
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59 ||
    second < 0 ||
    second > 59
  ) {
    return { date: null, error: 'Enter a valid time.', nonexistent: false };
  }

  const naive = Date.UTC(year, month - 1, day, hour, minute, second);
  const validation = new Date(naive);
  if (
    validation.getUTCFullYear() !== year ||
    validation.getUTCMonth() !== month - 1 ||
    validation.getUTCDate() !== day
  ) {
    return {
      date: null,
      error: 'That date does not exist.',
      nonexistent: false,
    };
  }

  const firstOffset = zoneOffsetMinutes(validation, timeZone);
  let timestamp = naive - firstOffset * 60000;
  const secondOffset = zoneOffsetMinutes(new Date(timestamp), timeZone);
  if (secondOffset !== firstOffset) {
    timestamp = naive - secondOffset * 60000;
  }

  const result = new Date(timestamp);
  if (Number.isNaN(result.getTime())) {
    return {
      date: null,
      error: 'Could not convert that date.',
      nonexistent: false,
    };
  }

  const parts = getZonedParts(result, timeZone);
  const nonexistent = Boolean(
    parts &&
    (parts.year !== year ||
      parts.month !== month ||
      parts.day !== day ||
      parts.hour !== hour ||
      parts.minute !== minute)
  );

  return { date: result, error: null, nonexistent };
}

export function parseDateOnly(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) {
    return null;
  }
  const [, yearText = '', monthText = '', dayText = ''] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  if (
    !Number.isInteger(year) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return null;
  }
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return date;
}

export function toDateInputValue(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}`;
}

export function toUtcInputValue(date: Date): string {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(
    date.getUTCDate()
  )}`;
}

export function formatDateOnly(
  date: Date,
  style: 'short' | 'medium' | 'long' | 'full' = 'long'
): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: 'UTC',
      dateStyle: style,
    }).format(date);
  } catch {
    return toUtcInputValue(date);
  }
}

export const MS_PER_DAY = 86400000;

export function diffDaysUtc(start: Date, end: Date): number {
  return Math.round((end.getTime() - start.getTime()) / MS_PER_DAY);
}

export function addDaysUtc(date: Date, days: number): Date {
  return new Date(date.getTime() + days * MS_PER_DAY);
}

export function addMonthsClamped(date: Date, months: number): Date {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + months;
  const day = date.getUTCDate();
  const target = new Date(Date.UTC(year, month, 1));
  const daysInMonth = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)
  ).getUTCDate();
  target.setUTCDate(Math.min(day, daysInMonth));
  return target;
}

export type CalendarDifference = {
  years: number;
  months: number;
  days: number;
};

/** Calendar difference from start to end (end must be on or after start). */
export function calendarDifference(start: Date, end: Date): CalendarDifference {
  if (end.getTime() <= start.getTime()) {
    return { years: 0, months: 0, days: 0 };
  }

  let years = 0;
  while (addMonthsClamped(start, (years + 1) * 12).getTime() <= end.getTime()) {
    years += 1;
  }

  const base = addMonthsClamped(start, years * 12);
  let months = 0;
  let cursor = base;
  while (addMonthsClamped(cursor, 1).getTime() <= end.getTime()) {
    cursor = addMonthsClamped(cursor, 1);
    months += 1;
  }

  const days = diffDaysUtc(cursor, end);
  return { years, months, days };
}

export function isWeekendDay(date: Date, weekendDays: number[]): boolean {
  return weekendDays.includes(date.getUTCDay());
}

/**
 * Number of weekdays (Mon–Fri) in [start, endExclusive). Uses arithmetic
 * instead of looping, so very long ranges are instant.
 */
export function countWeekdays(start: Date, endExclusive: Date): number {
  const days = diffDaysUtc(start, endExclusive);
  if (days <= 0) {
    return 0;
  }

  const fullWeeks = Math.floor(days / 7);
  let count = fullWeeks * 5;
  const remainder = days % 7;
  const startDay = start.getUTCDay();
  for (let index = 0; index < remainder; index += 1) {
    const day = (startDay + index) % 7;
    if (day !== 0 && day !== 6) {
      count += 1;
    }
  }
  return count;
}

export function formatNumber(value: number, maximumFractionDigits = 2): string {
  try {
    return new Intl.NumberFormat('en-US', {
      maximumFractionDigits,
    }).format(value);
  } catch {
    return String(value);
  }
}

export function formatRelativeTime(target: number, now: number): string {
  const difference = target - now;
  const absolute = Math.abs(difference);

  if (absolute < 5000) {
    return 'just now';
  }

  const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ['year', 31557600000],
    ['month', 2629800000],
    ['week', 604800000],
    ['day', 86400000],
    ['hour', 3600000],
    ['minute', 60000],
    ['second', 1000],
  ];

  for (const [unit, size] of units) {
    if (absolute >= size) {
      const value = difference / size;
      const rounded = Math.sign(value) * Math.round(Math.abs(value));
      if (rounded === 0) {
        return 'just now';
      }
      return formatter.format(rounded, unit);
    }
  }

  return 'just now';
}

export type DurationParts = {
  negative: boolean;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  milliseconds: number;
  totalMs: number;
};

export function durationParts(ms: number): DurationParts {
  const negative = ms < 0;
  let remaining = Math.abs(Math.round(ms));

  const days = Math.floor(remaining / 86400000);
  remaining -= days * 86400000;
  const hours = Math.floor(remaining / 3600000);
  remaining -= hours * 3600000;
  const minutes = Math.floor(remaining / 60000);
  remaining -= minutes * 60000;
  const seconds = Math.floor(remaining / 1000);
  const milliseconds = remaining - seconds * 1000;

  return {
    negative,
    days,
    hours,
    minutes,
    seconds,
    milliseconds,
    totalMs: Math.abs(Math.round(ms)),
  };
}

export function formatDurationCompact(ms: number): string {
  const parts = durationParts(ms);
  const chunks: string[] = [];
  if (parts.days) {
    chunks.push(`${parts.days}d`);
  }
  if (parts.hours) {
    chunks.push(`${parts.hours}h`);
  }
  if (parts.minutes) {
    chunks.push(`${parts.minutes}m`);
  }
  if (parts.seconds) {
    chunks.push(`${parts.seconds}s`);
  }
  if (parts.milliseconds) {
    chunks.push(`${parts.milliseconds}ms`);
  }
  if (chunks.length === 0) {
    return '0s';
  }
  return `${parts.negative ? '-' : ''}${chunks.join(' ')}`;
}

const unitWord = (value: number, singular: string): string =>
  `${value} ${singular}${value === 1 ? '' : 's'}`;

export function formatDurationVerbose(ms: number): string {
  const parts = durationParts(ms);
  const chunks: string[] = [];
  if (parts.days) {
    chunks.push(unitWord(parts.days, 'day'));
  }
  if (parts.hours) {
    chunks.push(unitWord(parts.hours, 'hour'));
  }
  if (parts.minutes) {
    chunks.push(unitWord(parts.minutes, 'minute'));
  }
  if (parts.seconds) {
    chunks.push(unitWord(parts.seconds, 'second'));
  }
  if (parts.milliseconds) {
    chunks.push(unitWord(parts.milliseconds, 'millisecond'));
  }
  if (chunks.length === 0) {
    return '0 seconds';
  }
  return `${parts.negative ? 'minus ' : ''}${chunks.join(', ')}`;
}

export function formatIsoDuration(ms: number): string {
  const parts = durationParts(ms);
  const sign = parts.negative ? '-' : '';

  let time = '';
  if (parts.hours) {
    time += `${parts.hours}H`;
  }
  if (parts.minutes) {
    time += `${parts.minutes}M`;
  }
  if (parts.seconds || parts.milliseconds) {
    const fraction = parts.milliseconds
      ? `.${pad(parts.milliseconds, 3).replace(/0+$/, '')}`
      : '';
    time += `${parts.seconds}${fraction}S`;
  }

  if (parts.days) {
    return `${sign}P${parts.days}D${time ? `T${time}` : ''}`;
  }
  return `${sign}PT${time || '0S'}`;
}

export function formatClock(ms: number, includeMilliseconds = true): string {
  const parts = durationParts(ms);
  const hours = parts.days * 24 + parts.hours;
  const base = `${pad(hours)}:${pad(parts.minutes)}:${pad(parts.seconds)}`;
  const fraction =
    includeMilliseconds && parts.milliseconds
      ? `.${pad(parts.milliseconds, 3)}`
      : '';
  return `${parts.negative ? '-' : ''}${base}${fraction}`;
}

export function parseNumberInput(value: string): number | null {
  const cleaned = value.replace(/[,\s_]/g, '');
  if (!cleaned || cleaned === '-' || cleaned === '+' || cleaned === '.') {
    return null;
  }
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}
