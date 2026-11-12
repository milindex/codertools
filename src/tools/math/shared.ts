export type ParseBigIntResult =
  { ok: true; value: bigint } | { ok: false; error: string };

const prefixes: Record<number, string> = {
  2: '0b',
  8: '0o',
  16: '0x',
};

/** Parse an integer in a base from 2 to 36 without using Number precision. */
export const parseBigIntInBase = (
  raw: string,
  base: number,
  allowSign = true
): ParseBigIntResult => {
  let text = raw.trim().replace(/[\s_]/g, '');

  if (!text) {
    return { ok: false, error: 'Enter a number.' };
  }

  let negative = false;
  if (text.startsWith('-') || text.startsWith('+')) {
    negative = text.startsWith('-');
    text = text.slice(1);
  }

  if (!allowSign && negative) {
    return { ok: false, error: 'This value must be zero or greater.' };
  }

  const prefix = prefixes[base];
  if (prefix && text.toLowerCase().startsWith(prefix)) {
    text = text.slice(2);
  }

  if (!text) {
    return { ok: false, error: 'Enter at least one digit.' };
  }

  if (text.startsWith('-') || text.startsWith('+')) {
    return { ok: false, error: 'Use a single leading sign.' };
  }

  const radix = BigInt(base);
  let value = 0n;

  for (const character of text.toLowerCase()) {
    const code = character.charCodeAt(0);
    let digit = -1;

    if (code >= 48 && code <= 57) {
      digit = code - 48;
    } else if (code >= 97 && code <= 122) {
      digit = code - 87;
    }

    if (digit < 0 || digit >= base) {
      return {
        ok: false,
        error: `“${character}” is not a valid base-${base} digit.`,
      };
    }

    value = value * radix + BigInt(digit);
  }

  return { ok: true, value: negative ? -value : value };
};

/** Render a BigInt in a base, optionally with a 0b/0o/0x prefix. */
export const toBaseString = (
  value: bigint,
  base: number,
  withPrefix = false,
  uppercase = false
): string => {
  const negative = value < 0n;
  const digits = (negative ? -value : value).toString(base);
  const body = uppercase && base > 10 ? digits.toUpperCase() : digits;
  const prefix = withPrefix ? (prefixes[base] ?? '') : '';

  return `${negative ? '-' : ''}${prefix}${body}`;
};

/** Group the integer part with thousands separators. */
export const groupDigits = (value: bigint): string => {
  const negative = value < 0n;
  const digits = (negative ? -value : value).toString();
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  return `${negative ? '-' : ''}${grouped}`;
};

/** Format a finite number for display without unnecessary trailing zeros. */
export const formatNumber = (value: number, significantDigits = 12): string => {
  if (Number.isNaN(value)) {
    return 'NaN';
  }

  if (!Number.isFinite(value)) {
    return value > 0 ? '∞' : '-∞';
  }

  if (Object.is(value, -0) || value === 0) {
    return '0';
  }

  if (Math.abs(value) >= 1e15 || Math.abs(value) < 1e-9) {
    return value.toExponential(8);
  }

  return new Intl.NumberFormat('en-US', {
    maximumSignificantDigits: significantDigits,
  }).format(value);
};

export const gcdNumber = (a: number, b: number): number => {
  let left = Math.abs(a);
  let right = Math.abs(b);

  while (right > 0) {
    const remainder = left % right;
    left = right;
    right = remainder;
  }

  return left;
};

export const trimDimension = (value: number): string => {
  if (!Number.isFinite(value)) {
    return '—';
  }

  const rounded = Math.round(value * 1e6) / 1e6;
  return formatNumber(rounded, 14);
};
