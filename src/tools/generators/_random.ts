/**
 * Small shared helpers for the generator tools.
 *
 * Everything here relies on the Web Crypto API (`crypto.getRandomValues`)
 * instead of `Math.random` so generated IDs, passwords and keys are
 * cryptographically random. These helpers are only called from client-side
 * event handlers or lazy state initialisers.
 */

/** Return a uniformly random integer in the range `[0, maxExclusive)`. */
export const randomInt = (maxExclusive: number): number => {
  if (!Number.isFinite(maxExclusive) || maxExclusive <= 0) {
    throw new Error('maxExclusive must be a positive number');
  }

  const max = Math.floor(maxExclusive);
  if (max < 1) {
    throw new Error('maxExclusive must be at least 1');
  }
  if (max === 1) {
    return 0;
  }

  // Rejection sampling avoids the modulo bias of `byte % max`.
  const range = 0x1_0000_0000;
  if (max > range) {
    throw new Error('maxExclusive is too large');
  }

  const limit = Math.floor(range / max) * max;
  const buffer = new Uint32Array(1);
  let value = 0;

  do {
    crypto.getRandomValues(buffer);
    value = buffer[0] ?? 0;
  } while (value >= limit);

  return value % max;
};

/** Fill a new `Uint8Array` with cryptographically secure random bytes. */
export const randomBytes = (length: number): Uint8Array => {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
};

/** Fisher–Yates shuffle using cryptographically secure randomness. */
export const shuffle = <T>(items: T[]): T[] => {
  const result = [...items];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(index + 1);
    const current = result[index]!;
    result[index] = result[swapIndex]!;
    result[swapIndex] = current;
  }

  return result;
};

/** Encode bytes as unpadded Base64URL (RFC 4648 §5). */
export const toBase64Url = (bytes: Uint8Array): string => {
  let binary = '';

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

/** Keep the first occurrence of every character. */
export const uniqueChars = (value: string): string =>
  Array.from(new Set(Array.from(value))).join('');

/** Pick one random character from a non-empty string. */
export const randomChar = (chars: string): string =>
  chars[randomInt(chars.length)] ?? chars.charAt(0);
