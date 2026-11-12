import type { JsonValue } from '@/tools/json/utils';

export type JsQuote = "'" | '"';

export type JsWrapper = 'literal' | 'const' | 'export';

export type SerializeOptions = {
  indent: string;
  quote: JsQuote;
  trailingComma: boolean;
};

const MAX_DEPTH = 1000;

const quoteString = (value: string, quote: JsQuote): string => {
  let output = quote;

  for (const character of value) {
    const codePoint = character.codePointAt(0)!;

    if (character === '\\') {
      output += '\\\\';
    } else if (character === quote) {
      output += `\\${quote}`;
    } else if (character === '\n') {
      output += '\\n';
    } else if (character === '\r') {
      output += '\\r';
    } else if (character === '\t') {
      output += '\\t';
    } else if (character === '\b') {
      output += '\\b';
    } else if (character === '\f') {
      output += '\\f';
    } else if (character === '\v') {
      output += '\\v';
    } else if (codePoint < 0x20 || codePoint === 0x7f) {
      output += `\\u${codePoint.toString(16).padStart(4, '0')}`;
    } else if (codePoint === 0x2028 || codePoint === 0x2029) {
      output += `\\u${codePoint.toString(16)}`;
    } else if (codePoint >= 0xd800 && codePoint <= 0xdfff) {
      output += `\\u${codePoint.toString(16).padStart(4, '0')}`;
    } else {
      output += character;
    }
  }

  return `${output}${quote}`;
};

const isIdentifier = (key: string): boolean =>
  /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key);

const formatKey = (key: string, quote: JsQuote): string => {
  if (key === '__proto__') {
    return `[${quoteString(key, quote)}]`;
  }
  return isIdentifier(key) ? key : quoteString(key, quote);
};

export const serializeJsonValue = (
  value: JsonValue,
  depth: number,
  options: SerializeOptions
): string => {
  if (depth > MAX_DEPTH) {
    throw new Error(
      `This JSON is nested more than ${MAX_DEPTH} levels deep, which is too deep to render as an object literal.`
    );
  }

  if (value === null) {
    return 'null';
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return '[]';
    }

    const childIndent = options.indent.repeat(depth + 1);
    const closingIndent = options.indent.repeat(depth);
    const lines = value.map(
      (child, index) =>
        `${childIndent}${serializeJsonValue(child, depth + 1, options)}${
          index < value.length - 1 || options.trailingComma ? ',' : ''
        }`
    );

    return `[\n${lines.join('\n')}\n${closingIndent}]`;
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value);
    if (entries.length === 0) {
      return '{}';
    }

    const childIndent = options.indent.repeat(depth + 1);
    const closingIndent = options.indent.repeat(depth);
    const lines = entries.map(
      ([key, child], index) =>
        `${childIndent}${formatKey(key, options.quote)}: ${serializeJsonValue(
          child,
          depth + 1,
          options
        )}${index < entries.length - 1 || options.trailingComma ? ',' : ''}`
    );

    return `{\n${lines.join('\n')}\n${closingIndent}}`;
  }

  if (typeof value === 'string') {
    return quoteString(value, options.quote);
  }

  if (typeof value === 'number') {
    return Object.is(value, -0) ? '-0' : String(value);
  }

  return value ? 'true' : 'false';
};

export const wrapJsLiteral = (literal: string, wrapper: JsWrapper): string => {
  if (wrapper === 'const') {
    return `const data = ${literal};`;
  }
  if (wrapper === 'export') {
    return `export default ${literal};`;
  }
  return literal;
};
