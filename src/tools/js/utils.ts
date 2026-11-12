export const formatBytes = (bytes: number): string => {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 B';
  }
  if (bytes < 1024) {
    return `${Math.round(bytes)} B`;
  }
  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let unit = units[0]!;
  for (let index = 1; index < units.length && value >= 1024; index += 1) {
    value /= 1024;
    unit = units[index]!;
  }
  return `${value.toFixed(value >= 10 ? 1 : 2)} ${unit}`;
};

export const byteLength = (text: string): number => {
  if (typeof TextEncoder === 'undefined') {
    return text.length;
  }
  return new TextEncoder().encode(text).length;
};

export const countLines = (text: string): number => {
  if (!text) {
    return 0;
  }
  return text.split(/\r\n|\r|\n/).length;
};

export const toErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Unknown error.';
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

export const stripStringsAndComments = (source: string): string => {
  let output = '';
  let index = 0;

  while (index < source.length) {
    const character = source[index]!;
    const next = source[index + 1];

    if (character === '/' && next === '/') {
      while (index < source.length && source[index] !== '\n') {
        index += 1;
      }
      continue;
    }

    if (character === '/' && next === '*') {
      index += 2;
      while (
        index < source.length &&
        !(source[index] === '*' && source[index + 1] === '/')
      ) {
        if (source[index] === '\n') {
          output += '\n';
        }
        index += 1;
      }
      index += 2;
      continue;
    }

    if (character === '"' || character === "'" || character === '`') {
      const quote = character;
      index += 1;
      while (index < source.length) {
        const current = source[index]!;
        if (current === '\\') {
          index += 2;
          continue;
        }
        if (current === quote) {
          index += 1;
          break;
        }
        if (current === '\n') {
          output += '\n';
        }
        index += 1;
      }
      continue;
    }

    output += character;
    index += 1;
  }

  return output;
};
