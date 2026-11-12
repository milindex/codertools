type RootRange = {
  start: number;
  end: number;
};

export type ObjectLiteralConversion = {
  jsonText: string;
  warnings: string[];
};

const findRootRange = (source: string): RootRange => {
  let start = -1;
  let quote: string | null = null;
  let lineComment = false;
  let blockComment = false;

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index]!;
    const next = source[index + 1];

    if (lineComment) {
      if (character === '\n' || character === '\r') {
        lineComment = false;
      }
      continue;
    }

    if (blockComment) {
      if (character === '*' && next === '/') {
        blockComment = false;
        index += 1;
      }
      continue;
    }

    if (quote) {
      if (character === '\\') {
        index += 1;
        continue;
      }
      if (character === quote) {
        quote = null;
      }
      continue;
    }

    if (character === '/' && next === '/') {
      lineComment = true;
      index += 1;
      continue;
    }
    if (character === '/' && next === '*') {
      blockComment = true;
      index += 1;
      continue;
    }
    if (character === '"' || character === "'" || character === '`') {
      quote = character;
      continue;
    }
    if (character === '{' || character === '[') {
      start = index;
      break;
    }
  }

  if (start < 0) {
    throw new Error(
      'Paste a JavaScript object or array literal, for example { name: "Ada" }.'
    );
  }

  const open = source[start]!;
  const close = open === '{' ? '}' : ']';
  let depth = 0;
  quote = null;
  lineComment = false;
  blockComment = false;

  for (let index = start; index < source.length; index += 1) {
    const character = source[index]!;
    const next = source[index + 1];

    if (lineComment) {
      if (character === '\n' || character === '\r') {
        lineComment = false;
      }
      continue;
    }

    if (blockComment) {
      if (character === '*' && next === '/') {
        blockComment = false;
        index += 1;
      }
      continue;
    }

    if (quote) {
      if (character === '\\') {
        index += 1;
        continue;
      }
      if (character === quote) {
        quote = null;
      }
      continue;
    }

    if (character === '/' && next === '/') {
      lineComment = true;
      index += 1;
      continue;
    }
    if (character === '/' && next === '*') {
      blockComment = true;
      index += 1;
      continue;
    }
    if (character === '"' || character === "'" || character === '`') {
      quote = character;
      continue;
    }
    if (character === open) {
      depth += 1;
    } else if (character === close) {
      depth -= 1;
      if (depth === 0) {
        return { start, end: index };
      }
    }
  }

  throw new Error(`Unbalanced brackets: the literal is missing a "${close}".`);
};

const readQuoted = (
  source: string,
  start: number,
  quote: string
): { value: string; next: number } => {
  let index = start + 1;
  let value = '';

  while (index < source.length) {
    const character = source[index]!;

    if (character === '\\') {
      const escaped = source[index + 1];
      if (escaped === undefined) {
        throw new Error('Unterminated escape sequence.');
      }
      index += 2;

      switch (escaped) {
        case 'n':
          value += '\n';
          break;
        case 'r':
          value += '\r';
          break;
        case 't':
          value += '\t';
          break;
        case 'b':
          value += '\b';
          break;
        case 'f':
          value += '\f';
          break;
        case 'v':
          value += '\v';
          break;
        case '0':
          value += '\0';
          break;
        case '\n':
          break;
        case '\r':
          if (source[index] === '\n') {
            index += 1;
          }
          break;
        case 'x': {
          const hex = source.slice(index, index + 2);
          if (/^[0-9a-fA-F]{2}$/.test(hex)) {
            value += String.fromCharCode(Number.parseInt(hex, 16));
            index += 2;
          } else {
            value += 'x';
          }
          break;
        }
        case 'u': {
          if (source[index] === '{') {
            const close = source.indexOf('}', index + 1);
            const hex = close >= 0 ? source.slice(index + 1, close) : '';
            if (close >= 0 && /^[0-9a-fA-F]{1,6}$/.test(hex)) {
              const codePoint = Number.parseInt(hex, 16);
              value +=
                codePoint <= 0x10ffff
                  ? String.fromCodePoint(codePoint)
                  : '\uFFFD';
              index = close + 1;
            } else {
              value += 'u';
            }
          } else {
            const hex = source.slice(index, index + 4);
            if (/^[0-9a-fA-F]{4}$/.test(hex)) {
              value += String.fromCharCode(Number.parseInt(hex, 16));
              index += 4;
            } else {
              value += 'u';
            }
          }
          break;
        }
        default:
          value += escaped;
          break;
      }
      continue;
    }

    if (quote === '`' && character === '$' && source[index + 1] === '{') {
      throw new Error(
        'Template literals with interpolation cannot be converted. Use a quoted string instead.'
      );
    }

    if (character === quote) {
      return { value, next: index + 1 };
    }

    if ((character === '\n' || character === '\r') && quote !== '`') {
      throw new Error(
        'Unterminated string literal: a newline appeared before the closing quote.'
      );
    }

    value += character;
    index += 1;
  }

  throw new Error('Unterminated string literal.');
};

const nextSignificantIndex = (source: string, start: number): number => {
  let index = start;

  while (index < source.length) {
    const character = source[index]!;

    if (/\s/.test(character)) {
      index += 1;
      continue;
    }

    if (character === '/' && source[index + 1] === '/') {
      index += 2;
      while (index < source.length && !/[\r\n]/.test(source[index]!)) {
        index += 1;
      }
      continue;
    }

    if (character === '/' && source[index + 1] === '*') {
      const close = source.indexOf('*/', index + 2);
      index = close < 0 ? source.length : close + 2;
      continue;
    }

    break;
  }

  return index;
};

const removeTrailingComma = (parts: string[]) => {
  for (let index = parts.length - 1; index >= 0; index -= 1) {
    const part = parts[index]!;
    if (/^\s*$/.test(part)) {
      continue;
    }
    if (part === ',') {
      parts.splice(index, 1);
    }
    break;
  }
};

const convertLiteral = (
  source: string,
  range: RootRange
): ObjectLiteralConversion => {
  type Context = {
    type: 'object' | 'array';
    expectingKey: boolean;
  };

  const parts: string[] = [];
  const contexts: Context[] = [];
  const warnings = new Set<string>();
  let index = range.start;

  const current = (): Context | undefined => contexts[contexts.length - 1];

  const markValue = () => {
    const context = current();
    if (context?.type === 'object') {
      context.expectingKey = false;
    }
  };

  const push = (text: string) => {
    parts.push(text);
  };

  while (index <= range.end) {
    const character = source[index]!;
    const next = source[index + 1];

    if (/\s/.test(character)) {
      push(character);
      index += 1;
      continue;
    }

    if (character === '/' && next === '/') {
      index += 2;
      while (index <= range.end && !/[\r\n]/.test(source[index]!)) {
        index += 1;
      }
      push(' ');
      continue;
    }

    if (character === '/' && next === '*') {
      const close = source.indexOf('*/', index + 2);
      index = close < 0 ? range.end + 1 : close + 2;
      push(' ');
      continue;
    }

    if (character === "'" || character === '"' || character === '`') {
      const stringValue = readQuoted(source, index, character);
      const after = nextSignificantIndex(source, stringValue.next);
      const context = current();
      const isKey =
        context?.type === 'object' &&
        context.expectingKey &&
        source[after] === ':';

      push(JSON.stringify(stringValue.value));
      if (!isKey) {
        markValue();
      }
      index = stringValue.next;
      continue;
    }

    if (character === '{') {
      contexts.push({ type: 'object', expectingKey: true });
      push('{');
      index += 1;
      continue;
    }

    if (character === '[') {
      const context = current();
      if (context?.type === 'object' && context.expectingKey) {
        throw new Error(
          'Computed property names are not supported. Use a quoted key instead.'
        );
      }
      contexts.push({ type: 'array', expectingKey: false });
      push('[');
      index += 1;
      continue;
    }

    if (character === '}') {
      removeTrailingComma(parts);
      if (contexts.pop()?.type !== 'object') {
        throw new Error('Mismatched braces in the object literal.');
      }
      push('}');
      index += 1;
      markValue();
      continue;
    }

    if (character === ']') {
      removeTrailingComma(parts);
      if (contexts.pop()?.type !== 'array') {
        throw new Error('Mismatched brackets in the array literal.');
      }
      push(']');
      index += 1;
      markValue();
      continue;
    }

    if (character === ',') {
      push(',');
      const context = current();
      if (context?.type === 'object') {
        context.expectingKey = true;
      }
      index += 1;
      continue;
    }

    if (character === ':') {
      push(':');
      const context = current();
      if (context?.type === 'object') {
        context.expectingKey = false;
      }
      index += 1;
      continue;
    }

    if (character === ';') {
      throw new Error(
        'Semicolons inside the literal are not supported. Remove statements and paste only the object or array.'
      );
    }

    if (
      (character === '-' || character === '+') &&
      /^(?:Infinity|NaN)\b/.test(source.slice(index + 1))
    ) {
      const special = /^(?:Infinity|NaN)/.exec(source.slice(index + 1))![0];
      push('null');
      warnings.add(
        `${character}${special} was converted to null because JSON has no non-finite numbers.`
      );
      markValue();
      index += 1 + special.length;
      continue;
    }

    if (/[A-Za-z_$]/.test(character)) {
      const match = /^[A-Za-z_$][A-Za-z0-9_$]*/.exec(source.slice(index));
      if (!match) {
        throw new Error(`Unexpected character "${character}".`);
      }

      const token = match[0];
      const afterToken = index + token.length;
      const after = nextSignificantIndex(source, afterToken);
      const context = current();

      if (
        context?.type === 'object' &&
        context.expectingKey &&
        source[after] === ':'
      ) {
        push(JSON.stringify(token));
        index = afterToken;
        continue;
      }

      if (context?.type === 'object' && context.expectingKey) {
        if (
          source[after] === ',' ||
          source[after] === '}' ||
          after > range.end
        ) {
          throw new Error(
            `Property shorthand "${token}" is not supported. Write a quoted key and an explicit value.`
          );
        }
        throw new Error(
          `Unsupported object syntax near "${token}". Only JSON-compatible key/value pairs are supported.`
        );
      }

      if (token === 'true' || token === 'false' || token === 'null') {
        push(token);
        markValue();
        index = afterToken;
        continue;
      }

      if (token === 'undefined' || token === 'NaN' || token === 'Infinity') {
        push('null');
        warnings.add(
          `${token} was converted to null because JSON has no ${token} value.`
        );
        markValue();
        index = afterToken;
        continue;
      }

      throw new Error(
        `Unsupported value "${token}". Use strings, numbers, booleans, null, arrays or objects.`
      );
    }

    if (
      character === '-' ||
      character === '+' ||
      character === '.' ||
      /[0-9]/.test(character)
    ) {
      const match =
        /^[+-]?(?:0[xX][0-9a-fA-F]+|0[bB][01]+|0[oO][0-7]+|(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?)(n?)/.exec(
          source.slice(index)
        );

      if (!match) {
        throw new Error(`Unexpected character "${character}".`);
      }

      const token = match[0];
      if (token.endsWith('n')) {
        throw new Error('BigInt literals cannot be represented in JSON.');
      }

      let normalized = token;
      if (/^[+-]?(?:0[xX]|0[bB]|0[oO])/.test(token)) {
        normalized = String(Number(token));
      } else if (!/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/.test(token)) {
        const numeric = Number(token);
        if (!Number.isFinite(numeric)) {
          throw new Error(
            `The number "${token}" cannot be represented in JSON.`
          );
        }
        normalized = String(numeric);
      }

      const after = nextSignificantIndex(source, index + token.length);
      const context = current();
      const isKey =
        context?.type === 'object' &&
        context.expectingKey &&
        source[after] === ':';

      push(isKey ? JSON.stringify(normalized) : normalized);
      if (!isKey) {
        markValue();
      }
      index += token.length;
      continue;
    }

    throw new Error(
      `Unsupported character "${character}". Only JSON-compatible object literals can be converted.`
    );
  }

  const jsonText = parts.join('').trim();

  try {
    JSON.parse(jsonText);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown JSON error.';
    throw new Error(`Converted output is not valid JSON: ${message}`);
  }

  return { jsonText, warnings: [...warnings] };
};

export const convertObjectLiteral = (
  source: string
): ObjectLiteralConversion => {
  const range = findRootRange(source);
  return convertLiteral(source, range);
};
