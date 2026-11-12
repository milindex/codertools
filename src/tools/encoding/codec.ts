const encoder = new TextEncoder();

export function textToBytes(value: string): Uint8Array {
  return encoder.encode(value);
}

export function bytesToText(bytes: Uint8Array): string {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    throw new Error(
      'The decoded bytes are not valid UTF-8 text. They may contain binary data.'
    );
  }
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return btoa(binary);
}

export function base64ToBytes(value: string): Uint8Array {
  const cleaned = value.replace(/\s+/g, '');
  if (!cleaned) {
    return new Uint8Array(0);
  }

  const core = cleaned.replace(/=+$/, '');
  if (!/^[A-Za-z0-9+/]*$/.test(core)) {
    throw new Error(
      'Input is not valid Base64. Only A–Z, a–z, 0–9, +, / and trailing = padding are allowed.'
    );
  }
  if (core.length % 4 === 1) {
    throw new Error('Base64 input has an invalid length.');
  }

  const padded = core + '='.repeat((4 - (core.length % 4)) % 4);
  let binary: string;
  try {
    binary = atob(padded);
  } catch {
    throw new Error('Could not decode this Base64 string.');
  }

  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

export function bytesToHex(bytes: Uint8Array, uppercase = false): string {
  const parts: string[] = [];
  for (const byte of bytes) {
    const hex = byte.toString(16).padStart(2, '0');
    parts.push(uppercase ? hex.toUpperCase() : hex);
  }
  return parts.join('');
}

export function hexToBytes(value: string): Uint8Array {
  const cleaned = value.replace(/0x/gi, '').replace(/[\s:;,._-]+/g, '');

  if (!cleaned) {
    return new Uint8Array(0);
  }
  if (!/^[0-9a-fA-F]+$/.test(cleaned)) {
    throw new Error(
      'Hex input contains invalid characters. Use 0–9 and A–F, optionally separated by spaces, colons or commas.'
    );
  }
  if (cleaned.length % 2 !== 0) {
    throw new Error('Hex input must contain an even number of digits.');
  }

  const bytes = new Uint8Array(cleaned.length / 2);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(cleaned.slice(index * 2, index * 2 + 2), 16);
  }
  return bytes;
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return '0 B';
  }
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  const units = ['KB', 'MB', 'GB', 'TB'];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  const precision = value >= 100 ? 0 : value >= 10 ? 1 : 2;
  return `${value.toFixed(precision)} ${units[unitIndex]}`;
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Conversion failed.';
}

const SIMPLE_ESCAPES: Record<string, string> = {
  '\\': '\\',
  '"': '"',
  "'": "'",
  '`': '`',
  '/': '/',
  n: '\n',
  r: '\r',
  t: '\t',
  b: '\b',
  f: '\f',
  v: '\v',
  a: '\u0007',
  '?': '?',
};

/**
 * Lenient unescaper that understands JavaScript, Python, C and JSON escapes,
 * including \xHH, \uXXXX, \u{...}, \UXXXXXXXX and octal escapes.
 */
export function unescapeCommon(value: string): string {
  let output = '';
  let index = 0;

  while (index < value.length) {
    const char = value[index]!;
    if (char !== '\\') {
      output += char;
      index += 1;
      continue;
    }

    const next = value[index + 1];
    if (next === undefined) {
      output += '\\';
      break;
    }

    if (next === '\n') {
      index += 2;
      continue;
    }
    if (next === '\r') {
      index += value[index + 2] === '\n' ? 3 : 2;
      continue;
    }

    if (next === 'x') {
      const hex = value.slice(index + 2, index + 4);
      if (!/^[0-9a-fA-F]{2}$/.test(hex)) {
        throw new Error(
          `Invalid hexadecimal escape at position ${index + 1}. Expected \\xHH.`
        );
      }
      output += String.fromCharCode(Number.parseInt(hex, 16));
      index += 4;
      continue;
    }

    if (next === 'u') {
      if (value[index + 2] === '{') {
        const close = value.indexOf('}', index + 3);
        if (close === -1) {
          throw new Error('Unterminated \\u{…} escape.');
        }
        const hex = value.slice(index + 3, close);
        if (!/^[0-9a-fA-F]{1,6}$/.test(hex)) {
          throw new Error(`Invalid \\u{…} escape: "${hex}".`);
        }
        const codePoint = Number.parseInt(hex, 16);
        if (codePoint > 0x10ffff) {
          throw new Error('A code point must be between U+0000 and U+10FFFF.');
        }
        output += String.fromCodePoint(codePoint);
        index = close + 1;
        continue;
      }

      const hex = value.slice(index + 2, index + 6);
      if (!/^[0-9a-fA-F]{4}$/.test(hex)) {
        throw new Error(
          `Invalid Unicode escape at position ${index + 1}. Expected \\uXXXX.`
        );
      }
      const code = Number.parseInt(hex, 16);

      if (code >= 0xd800 && code <= 0xdbff) {
        const lowHex = value.slice(index + 8, index + 12);
        if (
          value[index + 6] === '\\' &&
          value[index + 7] === 'u' &&
          /^[0-9a-fA-F]{4}$/.test(lowHex)
        ) {
          const low = Number.parseInt(lowHex, 16);
          if (low >= 0xdc00 && low <= 0xdfff) {
            output += String.fromCodePoint(
              0x10000 + ((code - 0xd800) << 10) + (low - 0xdc00)
            );
            index += 12;
            continue;
          }
        }
      }

      output += String.fromCharCode(code);
      index += 6;
      continue;
    }

    if (next === 'U') {
      const hex = value.slice(index + 2, index + 10);
      if (!/^[0-9a-fA-F]{8}$/.test(hex)) {
        throw new Error(
          `Invalid Unicode escape at position ${index + 1}. Expected \\UXXXXXXXX.`
        );
      }
      const codePoint = Number.parseInt(hex, 16);
      if (codePoint > 0x10ffff) {
        throw new Error('A code point must be between U+0000 and U+10FFFF.');
      }
      output += String.fromCodePoint(codePoint);
      index += 10;
      continue;
    }

    if (/[0-7]/.test(next)) {
      let digits = '';
      let cursor = index + 1;
      while (
        cursor < value.length &&
        digits.length < 3 &&
        /[0-7]/.test(value[cursor]!)
      ) {
        digits += value[cursor];
        cursor += 1;
      }
      output += String.fromCharCode(Number.parseInt(digits, 8));
      index = cursor;
      continue;
    }

    const replacement = SIMPLE_ESCAPES[next];
    if (replacement !== undefined) {
      output += replacement;
      index += 2;
      continue;
    }

    // Leave unknown escapes untouched rather than losing information.
    output += `\\${next}`;
    index += 2;
  }

  return output;
}
