export type JsonValue =
  null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

export type JsonError = {
  message: string;
  line?: number;
  column?: number;
  position?: number;
  snippet?: string;
};

export type JsonParseResult =
  { ok: true; value: JsonValue } | { ok: false; error: JsonError };

export type JsonStats = {
  type: string;
  depth: number;
  objects: number;
  arrays: number;
  keys: number;
  scalars: number;
  nodes: number;
  truncated: boolean;
};

const STAT_LIMIT = 100_000;

export const getJsonType = (value: JsonValue): string => {
  if (value === null) {
    return 'null';
  }
  if (Array.isArray(value)) {
    return 'array';
  }
  return typeof value;
};

export const byteLength = (text: string): number => {
  if (typeof TextEncoder === 'undefined') {
    return text.length;
  }
  return new TextEncoder().encode(text).length;
};

export const formatBytes = (bytes: number): string => {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 B';
  }
  if (bytes < 1024) {
    return `${Math.round(bytes)} B`;
  }
  const units = ['KB', 'MB', 'GB', 'TB'];
  let value = bytes / 1024;
  let unit = units[0]!;
  for (let index = 1; index < units.length && value >= 1024; index += 1) {
    value /= 1024;
    unit = units[index]!;
  }
  return `${value.toFixed(value >= 10 ? 1 : 2)} ${unit}`;
};

export const formatCount = (value: number): string =>
  value.toLocaleString('en-US');

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

export const lineColumnAt = (
  source: string,
  position: number
): { line: number; column: number } => {
  const target = clamp(position, 0, source.length);
  let line = 1;
  let lineStart = 0;

  for (let index = 0; index < target; index += 1) {
    const character = source[index]!;
    if (character === '\n') {
      line += 1;
      lineStart = index + 1;
    } else if (character === '\r') {
      if (source[index + 1] === '\n') {
        index += 1;
      }
      line += 1;
      lineStart = index + 1;
    }
  }

  return { line, column: target - lineStart + 1 };
};

const positionAt = (source: string, line: number, column: number): number => {
  let currentLine = 1;
  let index = 0;

  while (index < source.length && currentLine < line) {
    const character = source[index]!;
    if (character === '\n') {
      currentLine += 1;
    } else if (character === '\r') {
      if (source[index + 1] === '\n') {
        index += 1;
      }
      currentLine += 1;
    }
    index += 1;
  }

  return clamp(index + Math.max(0, column - 1), 0, source.length);
};

export const makeSnippet = (
  source: string,
  line: number,
  column: number
): string => {
  const lines = source.split(/\r\n|\r|\n/);
  const rawLine = lines[line - 1] ?? '';
  const columnIndex = Math.max(0, column - 1);
  const windowSize = 160;
  let start = 0;

  if (rawLine.length > windowSize) {
    start = Math.max(0, columnIndex - Math.floor(windowSize / 2));
    if (start > 0) {
      start = Math.max(0, start - 1);
    }
  }

  const clippedStart = start > 0;
  const clippedEnd = start + windowSize < rawLine.length;
  let preview = rawLine.slice(start, start + windowSize);

  if (clippedStart) {
    preview = `…${preview}`;
  }
  if (clippedEnd) {
    preview = `${preview}…`;
  }

  const caretPosition =
    (clippedStart ? 1 : 0) + Math.max(0, columnIndex - start);

  return `${preview}\n${' '.repeat(caretPosition)}^`;
};

const cleanJsonMessage = (message: string): string => {
  const cleaned = message
    .replace(/^JSON\.parse:\s*/i, '')
    .replace(/^JSON Parse error:\s*/i, '')
    .replace(
      /\s+in JSON at position \d+(?:\s+\(line \d+ column \d+\))?\.?$/i,
      ''
    )
    .replace(/\s+at line \d+ column \d+ of the JSON data\.?$/i, '')
    .replace(/\s+at position \d+\.?$/i, '')
    .trim();

  return cleaned || 'The JSON could not be parsed.';
};

type JsonExpectation =
  | 'value'
  | 'objectFirstKey'
  | 'objectKey'
  | 'colon'
  | 'objectCommaOrEnd'
  | 'arrayFirstValue'
  | 'arrayValue'
  | 'arrayCommaOrEnd'
  | 'done';

type JsonSyntaxError = {
  position: number;
  message: string;
};

const findJsonSyntaxError = (source: string): JsonSyntaxError | null => {
  let index = 0;
  const stack: Array<'object' | 'array'> = [];
  let expectation: JsonExpectation = 'value';

  const fail = (position: number, message: string): JsonSyntaxError => ({
    position: clamp(position, 0, source.length),
    message,
  });

  const skipWhitespace = () => {
    while (index < source.length) {
      const character = source[index]!;
      if (
        character === ' ' ||
        character === '\t' ||
        character === '\n' ||
        character === '\r'
      ) {
        index += 1;
      } else {
        break;
      }
    }
  };

  const afterValue = (): JsonExpectation => {
    const parent = stack[stack.length - 1];
    if (!parent) {
      return 'done';
    }
    return parent === 'object' ? 'objectCommaOrEnd' : 'arrayCommaOrEnd';
  };

  const scanString = (): JsonSyntaxError | null => {
    index += 1;

    while (index < source.length) {
      const character = source[index]!;

      if (character === '"') {
        index += 1;
        return null;
      }

      if (character === '\\') {
        index += 1;
        if (index >= source.length) {
          return fail(index, 'Unterminated escape sequence in string.');
        }

        const escaped = source[index]!;
        if (escaped === 'u') {
          const hex = source.slice(index + 1, index + 5);
          if (hex.length !== 4 || !/^[0-9a-fA-F]{4}$/.test(hex)) {
            return fail(
              index,
              'Invalid Unicode escape: expected four hexadecimal digits after "\\u".'
            );
          }
          index += 5;
          continue;
        }

        if (!'"\\/bfnrt'.includes(escaped)) {
          return fail(
            index,
            `Invalid escape sequence "\\${escaped}" in string.`
          );
        }

        index += 1;
        continue;
      }

      if (character.charCodeAt(0) < 0x20) {
        return fail(index, 'Unescaped control character in string.');
      }

      index += 1;
    }

    return fail(index, 'Unterminated string literal.');
  };

  const scanNumber = (): JsonSyntaxError | null => {
    const start = index;

    if (source[index] === '-') {
      index += 1;
    }

    if (index >= source.length) {
      return fail(start, 'Incomplete number.');
    }

    if (source[index] === '0') {
      index += 1;
      if (index < source.length && /[0-9]/.test(source[index]!)) {
        return fail(index, 'Leading zeros are not allowed in JSON numbers.');
      }
    } else if (/[1-9]/.test(source[index]!)) {
      index += 1;
      while (index < source.length && /[0-9]/.test(source[index]!)) {
        index += 1;
      }
    } else {
      return fail(index, 'Expected a digit after the minus sign.');
    }

    if (source[index] === '.') {
      index += 1;
      if (!/[0-9]/.test(source[index] ?? '')) {
        return fail(index, 'Expected a digit after the decimal point.');
      }
      while (/[0-9]/.test(source[index] ?? '')) {
        index += 1;
      }
    }

    if (source[index] === 'e' || source[index] === 'E') {
      index += 1;
      if (source[index] === '+' || source[index] === '-') {
        index += 1;
      }
      if (!/[0-9]/.test(source[index] ?? '')) {
        return fail(index, 'Expected a digit in the exponent.');
      }
      while (/[0-9]/.test(source[index] ?? '')) {
        index += 1;
      }
    }

    return null;
  };

  while (true) {
    if (expectation === 'done') {
      skipWhitespace();
      if (index < source.length) {
        return fail(
          index,
          `Unexpected content after the JSON value: "${source[index]}".`
        );
      }
      return null;
    }

    skipWhitespace();

    if (index >= source.length) {
      switch (expectation) {
        case 'value':
          return fail(index, 'Unexpected end of input; expected a JSON value.');
        case 'objectFirstKey':
        case 'objectKey':
          return fail(
            index,
            'Unexpected end of input; expected a property name or "}".'
          );
        case 'colon':
          return fail(index, 'Unexpected end of input; expected ":".');
        case 'arrayFirstValue':
        case 'arrayValue':
          return fail(
            index,
            'Unexpected end of input; expected a value or "]".'
          );
        case 'objectCommaOrEnd':
          return fail(index, 'Unexpected end of input; expected "," or "}".');
        case 'arrayCommaOrEnd':
          return fail(index, 'Unexpected end of input; expected "," or "]".');
        default:
          return fail(index, 'Unexpected end of input.');
      }
    }

    const character = source[index]!;

    switch (expectation) {
      case 'value':
      case 'arrayFirstValue':
      case 'arrayValue': {
        if (character === ']' && expectation === 'arrayFirstValue') {
          index += 1;
          stack.pop();
          expectation = afterValue();
          continue;
        }

        if (character === ']' && expectation === 'arrayValue') {
          return fail(index, 'Trailing commas are not allowed in JSON arrays.');
        }

        if (character === '{') {
          stack.push('object');
          index += 1;
          expectation = 'objectFirstKey';
          continue;
        }

        if (character === '[') {
          stack.push('array');
          index += 1;
          expectation = 'arrayFirstValue';
          continue;
        }

        if (character === '"') {
          const stringError = scanString();
          if (stringError) {
            return stringError;
          }
          expectation = afterValue();
          continue;
        }

        if (character === '-' || /[0-9]/.test(character)) {
          const numberError = scanNumber();
          if (numberError) {
            return numberError;
          }
          expectation = afterValue();
          continue;
        }

        if (character === 't') {
          if (source.startsWith('true', index)) {
            index += 4;
            expectation = afterValue();
            continue;
          }
          return fail(index, 'Unexpected token; expected "true".');
        }

        if (character === 'f') {
          if (source.startsWith('false', index)) {
            index += 5;
            expectation = afterValue();
            continue;
          }
          return fail(index, 'Unexpected token; expected "false".');
        }

        if (character === 'n') {
          if (source.startsWith('null', index)) {
            index += 4;
            expectation = afterValue();
            continue;
          }
          return fail(index, 'Unexpected token; expected "null".');
        }

        return fail(
          index,
          `Unexpected token "${character}"; expected a JSON value.`
        );
      }

      case 'objectFirstKey':
      case 'objectKey': {
        if (character === '}' && expectation === 'objectFirstKey') {
          index += 1;
          stack.pop();
          expectation = afterValue();
          continue;
        }

        if (character === '}' && expectation === 'objectKey') {
          return fail(
            index,
            'Trailing commas are not allowed in JSON objects.'
          );
        }

        if (character !== '"') {
          return fail(index, 'Expected a double-quoted property name.');
        }

        const keyError = scanString();
        if (keyError) {
          return keyError;
        }
        expectation = 'colon';
        continue;
      }

      case 'colon': {
        if (character !== ':') {
          return fail(index, 'Expected ":" after the property name.');
        }
        index += 1;
        expectation = 'value';
        continue;
      }

      case 'objectCommaOrEnd': {
        if (character === ',') {
          index += 1;
          expectation = 'objectKey';
          continue;
        }
        if (character === '}') {
          index += 1;
          stack.pop();
          expectation = afterValue();
          continue;
        }
        return fail(index, 'Expected "," or "}" after the object value.');
      }

      case 'arrayCommaOrEnd': {
        if (character === ',') {
          index += 1;
          expectation = 'arrayValue';
          continue;
        }
        if (character === ']') {
          index += 1;
          stack.pop();
          expectation = afterValue();
          continue;
        }
        return fail(index, 'Expected "," or "]" after the array value.');
      }

      default:
        return fail(index, 'Unexpected character.');
    }
  }
};

export const describeJsonError = (
  source: string,
  error: unknown
): JsonError => {
  const syntaxError = findJsonSyntaxError(source);
  if (syntaxError) {
    const location = lineColumnAt(source, syntaxError.position);
    return {
      message: syntaxError.message,
      position: syntaxError.position,
      line: location.line,
      column: location.column,
      snippet: makeSnippet(source, location.line, location.column),
    };
  }

  const rawMessage = error instanceof Error ? error.message : String(error);

  let position: number | undefined;
  let line: number | undefined;
  let column: number | undefined;

  const positionMatch = /\bposition\s+(\d+)/i.exec(rawMessage);
  if (positionMatch?.[1]) {
    position = Number(positionMatch[1]);
  }

  const lineColumnMatch = /\bline\s+(\d+)\s+column\s+(\d+)/i.exec(rawMessage);
  if (lineColumnMatch?.[1] && lineColumnMatch[2]) {
    line = Number(lineColumnMatch[1]);
    column = Number(lineColumnMatch[2]);
  } else if (position !== undefined) {
    const location = lineColumnAt(source, position);
    line = location.line;
    column = location.column;
  }

  if (position === undefined && line !== undefined && column !== undefined) {
    position = positionAt(source, line, column);
  }

  return {
    message: cleanJsonMessage(rawMessage),
    line,
    column,
    position,
    snippet:
      line !== undefined && column !== undefined
        ? makeSnippet(source, line, column)
        : undefined,
  };
};

export const parseJson = (source: string): JsonParseResult => {
  try {
    const value = JSON.parse(source) as JsonValue;
    return { ok: true, value };
  } catch (error) {
    return { ok: false, error: describeJsonError(source, error) };
  }
};

export const stringifyJson = (
  value: JsonValue,
  indent: number | string,
  sortKeys = false
): string => {
  if (!sortKeys) {
    return JSON.stringify(value, null, indent) ?? '';
  }

  return (
    JSON.stringify(
      value,
      (_key, current: unknown) => {
        if (
          current !== null &&
          typeof current === 'object' &&
          !Array.isArray(current)
        ) {
          return Object.fromEntries(
            Object.entries(current as Record<string, JsonValue>).sort(
              ([left], [right]) => left.localeCompare(right)
            )
          );
        }
        return current;
      },
      indent
    ) ?? ''
  );
};

export const getJsonStats = (value: JsonValue): JsonStats => {
  type Frame = {
    value: JsonValue;
    depth: number;
    phase: 'enter' | 'iterate';
    index: number;
    keys?: string[];
    isArray?: boolean;
  };

  let nodes = 0;
  let objects = 0;
  let arrays = 0;
  let keys = 0;
  let scalars = 0;
  let depth = 1;
  let truncated = false;

  const frames: Frame[] = [{ value, depth: 1, phase: 'enter', index: 0 }];

  while (frames.length > 0) {
    const frame = frames[frames.length - 1]!;

    if (frame.phase === 'enter') {
      if (nodes >= STAT_LIMIT) {
        truncated = true;
        break;
      }

      nodes += 1;
      depth = Math.max(depth, frame.depth);

      if (Array.isArray(frame.value)) {
        arrays += 1;
        frame.phase = 'iterate';
        frame.index = 0;
        frame.isArray = true;
      } else if (frame.value !== null && typeof frame.value === 'object') {
        objects += 1;
        frame.phase = 'iterate';
        frame.index = 0;
        frame.isArray = false;
        frame.keys = Object.keys(frame.value);
        keys += frame.keys.length;
      } else {
        scalars += 1;
        frames.pop();
      }
      continue;
    }

    const length = frame.isArray
      ? (frame.value as JsonValue[]).length
      : (frame.keys?.length ?? 0);

    if (frame.index >= length) {
      frames.pop();
      continue;
    }

    const index = frame.index;
    frame.index += 1;

    const child = frame.isArray
      ? (frame.value as JsonValue[])[index]
      : (frame.value as Record<string, JsonValue>)[frame.keys?.[index] ?? ''];

    if (child === undefined) {
      continue;
    }

    frames.push({
      value: child,
      depth: frame.depth + 1,
      phase: 'enter',
      index: 0,
    });
  }

  return {
    type: getJsonType(value),
    depth,
    objects,
    arrays,
    keys,
    scalars,
    nodes,
    truncated,
  };
};
