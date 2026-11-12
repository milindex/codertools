'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { Field } from '@/components/ui/Field';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { ToolLayout } from '@/components/ui/ToolLayout';

import { errorMessage, pluralize } from './_shared';

const CURL_EXAMPLE = `curl -X POST 'https://api.example.com/users' \\
  -H 'Content-Type: application/json' \\
  -H 'Authorization: Bearer token123' \\
  -d '{"name":"Ada","role":"admin"}'`;

const FETCH_EXAMPLE = `const response = await fetch("https://api.example.com/users", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer token123",
  },
  body: JSON.stringify({
    "name": "Ada",
    "role": "admin",
  }),
});

if (!response.ok) {
  throw new Error("HTTP " + response.status);
}

const data = await response.json();
console.log(data);`;

type Mode = 'curl' | 'fetch';
type ResponseMode = 'auto' | 'json' | 'text' | 'response';

type CurlRequest = {
  url: string;
  method: string;
  headers: Array<[string, string]>;
  bodyParts: string[];
  forms: string[];
  cookie: string;
  basicAuth: string;
  compressed: boolean;
  getMode: boolean;
  warnings: string[];
};

const tokenizeShell = (input: string) => {
  const tokens: string[] = [];
  let current = '';
  let quote: "'" | '"' | null = null;
  let started = false;

  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];

    if (quote === "'") {
      if (character === "'") {
        quote = null;
      } else {
        current += character;
      }
      started = true;
      continue;
    }

    if (quote === '"') {
      if (character === '"') {
        quote = null;
      } else if (character === '\\') {
        const next = input[index + 1];
        if (next && ['"', '\\', '$', '`', '\n'].includes(next)) {
          if (next !== '\n') {
            current += next;
          }
          index += 1;
        } else {
          current += character;
        }
      } else {
        current += character;
      }
      started = true;
      continue;
    }

    if (character === '\\') {
      const next = input[index + 1];
      if (next === '\n') {
        index += 1;
        continue;
      }
      if (next !== undefined) {
        current += next;
        index += 1;
        started = true;
        continue;
      }
    }

    if (character === "'" || character === '"') {
      quote = character;
      started = true;
      continue;
    }

    if (/\s/.test(character ?? '')) {
      if (started || current) {
        tokens.push(current);
        current = '';
        started = false;
      }
      continue;
    }

    current += character;
    started = true;
  }

  if (quote) {
    throw new Error('The curl command contains an unclosed quote.');
  }
  if (started || current) {
    tokens.push(current);
  }

  return tokens;
};

const BASE64 = (value: string) => {
  try {
    return btoa(value);
  } catch {
    return btoa(unescape(encodeURIComponent(value)));
  }
};

const CURL_VALUE_FLAGS = new Set([
  '--cacert',
  '--cert',
  '--cert-type',
  '--connect-timeout',
  '--cookie-jar',
  '--data',
  '--data-ascii',
  '--data-binary',
  '--data-raw',
  '--data-urlencode',
  '--form',
  '--form-string',
  '--header',
  '--interface',
  '--key',
  '--key-type',
  '--limit-rate',
  '--max-redirs',
  '--max-time',
  '--output',
  '--proxy',
  '--referer',
  '--request',
  '--resolve',
  '--retry',
  '--retry-delay',
  '--retry-max-time',
  '--url',
  '--user',
  '--user-agent',
  '--write-out',
]);

const parseCurl = (command: string): CurlRequest => {
  const tokens = tokenizeShell(command);

  if (!tokens[0] || !/^curl(?:\.exe)?$/i.test(tokens[0])) {
    throw new Error('The command must start with `curl`.');
  }

  const request: CurlRequest = {
    url: '',
    method: '',
    headers: [],
    bodyParts: [],
    forms: [],
    cookie: '',
    basicAuth: '',
    compressed: false,
    getMode: false,
    warnings: [],
  };

  const addHeader = (header: string) => {
    if (header.startsWith('@')) {
      request.warnings.push(
        'Header files (`-H @file`) are not read in the browser and were skipped.'
      );
      return;
    }
    request.headers.push([header, '']);
  };

  for (let index = 1; index < tokens.length; index += 1) {
    const token = tokens[index] ?? '';

    if (token === '--') {
      const next = tokens[index + 1];
      if (next && !request.url) {
        request.url = next;
        index += 1;
      }
      continue;
    }

    if (token.startsWith('--')) {
      const equalsIndex = token.indexOf('=');
      const flag = equalsIndex === -1 ? token : token.slice(0, equalsIndex);
      const inlineValue =
        equalsIndex === -1 ? undefined : token.slice(equalsIndex + 1);

      const takeValue = () => {
        if (inlineValue !== undefined) {
          return inlineValue;
        }
        index += 1;
        return tokens[index] ?? '';
      };

      switch (flag) {
        case '--request':
          request.method = takeValue().toUpperCase();
          break;
        case '--url':
          request.url = takeValue();
          break;
        case '--header':
          addHeader(takeValue());
          break;
        case '--data':
        case '--data-ascii':
        case '--data-binary':
        case '--data-raw':
          request.bodyParts.push(takeValue());
          break;
        case '--data-urlencode': {
          const value = takeValue();
          const split = value.indexOf('=');
          request.bodyParts.push(
            split === -1
              ? encodeURIComponent(value)
              : `${value.slice(0, split)}=${encodeURIComponent(
                  value.slice(split + 1)
                )}`
          );
          break;
        }
        case '--json': {
          const value = takeValue();
          request.bodyParts.push(value);
          request.headers.push(['Content-Type', 'application/json']);
          request.headers.push(['Accept', 'application/json']);
          if (!request.method) {
            request.method = 'POST';
          }
          break;
        }
        case '--form':
        case '--form-string':
          request.forms.push(takeValue());
          break;
        case '--user':
          request.basicAuth = takeValue();
          break;
        case '--cookie':
          request.cookie = takeValue();
          break;
        case '--user-agent':
          request.headers.push(['User-Agent', takeValue()]);
          break;
        case '--referer':
          request.headers.push(['Referer', takeValue()]);
          break;
        case '--compressed':
          request.compressed = true;
          break;
        case '--get':
          request.getMode = true;
          break;
        case '--head':
          request.method = 'HEAD';
          break;
        case '--location':
          request.warnings.push(
            'Redirects are followed by fetch by default, so `--location` was not added.'
          );
          break;
        case '--insecure':
          request.warnings.push(
            'TLS certificate verification cannot be disabled in browser fetch. `--insecure` was ignored.'
          );
          break;
        case '--output':
          takeValue();
          request.warnings.push(
            '`--output` was ignored because fetch returns a Response object.'
          );
          break;
        default:
          if (CURL_VALUE_FLAGS.has(flag)) {
            takeValue();
          }
          request.warnings.push(
            `Unsupported curl option \`${flag}\` was ignored.`
          );
      }
      continue;
    }

    if (token.startsWith('-') && token.length > 1) {
      let cursor = 1;

      while (cursor < token.length) {
        const flag = token[cursor] ?? '';
        const rest = token.slice(cursor + 1);
        const takeShortValue = () => {
          if (rest) {
            cursor = token.length;
            return rest;
          }
          cursor = token.length;
          index += 1;
          return tokens[index] ?? '';
        };

        switch (flag) {
          case 'X':
            request.method = takeShortValue().toUpperCase();
            break;
          case 'H':
            addHeader(takeShortValue());
            break;
          case 'd':
            request.bodyParts.push(takeShortValue());
            break;
          case 'F':
            request.forms.push(takeShortValue());
            break;
          case 'u':
            request.basicAuth = takeShortValue();
            break;
          case 'b':
            request.cookie = takeShortValue();
            break;
          case 'A':
            request.headers.push(['User-Agent', takeShortValue()]);
            break;
          case 'e':
            request.headers.push(['Referer', takeShortValue()]);
            break;
          case 'o':
            takeShortValue();
            break;
          case 'I':
            request.method = 'HEAD';
            break;
          case 'G':
            request.getMode = true;
            break;
          case 'k':
            request.warnings.push(
              'TLS certificate verification cannot be disabled in browser fetch.'
            );
            break;
          case 'L':
            break;
          case 's':
          case 'S':
          case 'v':
          case 'i':
            break;
          default:
            if (CURL_VALUE_FLAGS.has(`-${flag}`)) {
              takeShortValue();
            }
            request.warnings.push(
              `Unsupported curl option \`-${flag}\` was ignored.`
            );
        }

        cursor += 1;
      }
      continue;
    }

    if (!request.url) {
      request.url = token;
    } else {
      request.warnings.push(
        `Extra positional argument \`${token}\` was ignored.`
      );
    }
  }

  if (!request.url) {
    throw new Error('No URL was found in the curl command.');
  }

  if (request.cookie && request.cookie.startsWith('@')) {
    request.warnings.push(
      'Cookie files are not read in the browser. Only inline cookie values are supported.'
    );
    request.cookie = '';
  }

  if (request.getMode && request.bodyParts.length > 0) {
    const query = request.bodyParts.join('&');
    request.url += `${request.url.includes('?') ? '&' : '?'}${query}`;
    request.bodyParts = [];
  }

  return request;
};

const normalizeHeaders = (request: CurlRequest) => {
  const headers = new Map<string, [string, string]>();

  const setHeader = (name: string, value: string) => {
    if (!name) {
      return;
    }
    headers.set(name.toLowerCase(), [name, value]);
  };

  for (const [rawName, rawValue] of request.headers) {
    if (!rawValue && rawName.includes(':')) {
      const separator = rawName.indexOf(':');
      setHeader(
        rawName.slice(0, separator).trim(),
        rawName.slice(separator + 1).trim()
      );
    } else {
      setHeader(rawName, rawValue);
    }
  }

  if (request.basicAuth) {
    setHeader('Authorization', `Basic ${BASE64(request.basicAuth)}`);
  }

  if (request.cookie) {
    setHeader('Cookie', request.cookie);
  }

  return [...headers.values()];
};

const stripTrailingCommas = (value: string) => {
  let output = '';
  let quote: string | null = null;

  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];

    if (quote) {
      output += character;
      if (character === '\\') {
        const next = value[index + 1];
        if (next) {
          output += next;
          index += 1;
        }
      } else if (character === quote) {
        quote = null;
      }
      continue;
    }

    if (character === '"' || character === "'") {
      quote = character;
      output += character;
      continue;
    }

    if (character === ',') {
      let next = index + 1;
      while (next < value.length && /\s/.test(value[next] ?? '')) {
        next += 1;
      }
      if (value[next] === '}' || value[next] === ']') {
        continue;
      }
    }

    output += character;
  }

  return output;
};

const parseJsonLoose = (
  value: string
): { ok: true; value: unknown } | { ok: false } => {
  try {
    return { ok: true, value: JSON.parse(value) };
  } catch {
    try {
      return { ok: true, value: JSON.parse(stripTrailingCommas(value)) };
    } catch {
      return { ok: false };
    }
  }
};

const tryPrettyJson = (value: string) => {
  const parsed = parseJsonLoose(value);
  return parsed.ok ? JSON.stringify(parsed.value, null, 2) : null;
};

const jsString = (value: string) => JSON.stringify(value);

const buildFetch = (request: CurlRequest, responseMode: ResponseMode) => {
  const warnings = [...request.warnings];
  const allHeaders = normalizeHeaders(request);
  const forbiddenHeaders = new Set([
    'connection',
    'content-length',
    'host',
    'keep-alive',
    'proxy-authorization',
    'te',
    'trailer',
    'transfer-encoding',
    'upgrade',
  ]);
  const headers = allHeaders.filter(([name]) => {
    if (forbiddenHeaders.has(name.toLowerCase())) {
      warnings.push(
        `The \`${name}\` header is controlled by the browser and was omitted from fetch.`
      );
      return false;
    }
    return true;
  });
  const contentType =
    headers.find(([name]) => name.toLowerCase() === 'content-type')?.[1] ?? '';
  const accept =
    headers.find(([name]) => name.toLowerCase() === 'accept')?.[1] ?? '';
  const wantsJson = /json/i.test(`${contentType} ${accept}`);

  let method = request.method;
  if (!method) {
    method =
      request.forms.length > 0 || request.bodyParts.length > 0 ? 'POST' : 'GET';
  }

  let body = request.bodyParts.join('&');
  let useForms = request.forms.length > 0;

  if (request.bodyParts.some((part) => part.startsWith('@'))) {
    warnings.push(
      'Reading a request body from a file (`@file`) is not available in the browser. The value was kept as text.'
    );
  }

  if (method === 'GET' || method === 'HEAD') {
    if (body || useForms) {
      warnings.push(
        `fetch does not allow a request body with ${method}. The body was omitted.`
      );
      body = '';
      useForms = false;
    }
  }

  const prettyBody = body ? tryPrettyJson(body) : null;
  if (wantsJson && body && !prettyBody) {
    warnings.push(
      'The request body does not parse as JSON. It was emitted as a raw string.'
    );
  }
  const formLines: string[] = [];
  const formFields: string[] = [];

  if (useForms) {
    formLines.push('const formData = new FormData();');
    for (const field of request.forms) {
      const separator = field.indexOf('=');
      const name = separator === -1 ? field : field.slice(0, separator);
      const value = separator === -1 ? '' : field.slice(separator + 1);

      if (value.startsWith('@') || value.startsWith('<')) {
        formLines.push(
          `// formData.append(${jsString(name)}, /* File or stream: ${value.replace(
            /\*\//g,
            '*\\/'
          )} */);`
        );
        warnings.push(
          `File upload field "${name}" needs a File or Blob object in the browser. A placeholder comment was generated.`
        );
      } else {
        formLines.push(
          `formData.append(${jsString(name)}, ${jsString(value)});`
        );
      }
      formFields.push(name);
    }
  }

  const lines: string[] = [...formLines];

  if (formLines.length > 0 && formFields.length > 0) {
    lines.push('');
  }

  lines.push(`const response = await fetch(${jsString(request.url)}, {`);
  lines.push(`  method: ${jsString(method)},`);

  if (headers.length > 0) {
    lines.push('  headers: {');
    for (const [name, value] of headers) {
      lines.push(`    ${jsString(name)}: ${jsString(value)},`);
    }
    lines.push('  },');
  }

  if (formLines.length > 0) {
    lines.push('  body: formData,');
  } else if (body) {
    if (prettyBody) {
      const indented = prettyBody.replace(/\n/g, '\n  ');
      lines.push(`  body: JSON.stringify(${indented}),`);
    } else {
      lines.push(`  body: ${jsString(body)},`);
    }
  }

  lines.push('});');

  const resolvedMode =
    responseMode === 'auto' ? (wantsJson ? 'json' : 'text') : responseMode;

  if (resolvedMode !== 'response') {
    lines.push('');
    lines.push('if (!response.ok) {');
    lines.push('  throw new Error("HTTP " + response.status);');
    lines.push('}');
    lines.push('');
    if (resolvedMode === 'json') {
      lines.push('const data = await response.json();');
      lines.push('console.log(data);');
    } else {
      lines.push('const text = await response.text();');
      lines.push('console.log(text);');
    }
  }

  return { code: `${lines.join('\n')}\n`, warnings };
};

const shellQuote = (value: string) => `'${value.replace(/'/g, "'\\''")}'`;

const parseJsString = (value: string) => {
  const trimmed = value.trim();
  if (trimmed.length < 2) {
    return null;
  }
  const quote = trimmed[0];
  if (
    (quote !== "'" && quote !== '"' && quote !== '`') ||
    trimmed[trimmed.length - 1] !== quote
  ) {
    return null;
  }
  const inner = trimmed.slice(1, -1);
  if (quote === '`' && inner.includes('${')) {
    return null;
  }
  if (quote === '"') {
    try {
      return JSON.parse(trimmed) as string;
    } catch {
      return inner;
    }
  }
  return inner
    .replace(/\\(['"`\\])/g, '$1')
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t');
};

const jsLiteralToJson = (input: string): string | null => {
  let index = 0;

  const skip = () => {
    while (index < input.length) {
      const character = input[index];
      if (/\s/.test(character ?? '')) {
        index += 1;
        continue;
      }
      if (character === '/' && input[index + 1] === '/') {
        index += 2;
        while (index < input.length && input[index] !== '\n') {
          index += 1;
        }
        continue;
      }
      if (character === '/' && input[index + 1] === '*') {
        index += 2;
        while (
          index < input.length &&
          !(input[index] === '*' && input[index + 1] === '/')
        ) {
          index += 1;
        }
        index += 2;
        continue;
      }
      break;
    }
  };

  const parseString = (): string | null => {
    const quote = input[index];
    if (quote !== "'" && quote !== '"' && quote !== '`') {
      return null;
    }
    index += 1;
    let value = '';

    while (index < input.length) {
      const character = input[index];
      if (character === '\\') {
        const next = input[index + 1];
        index += 2;
        if (next === 'n') {
          value += '\n';
        } else if (next === 'r') {
          value += '\r';
        } else if (next === 't') {
          value += '\t';
        } else if (next === 'b') {
          value += '\b';
        } else if (next === 'f') {
          value += '\f';
        } else if (next === 'v') {
          value += '\v';
        } else if (next === '0') {
          value += '\0';
        } else if (
          next === 'u' &&
          input.slice(index, index + 4).match(/^[0-9a-f]{4}$/i)
        ) {
          value += String.fromCharCode(
            Number.parseInt(input.slice(index, index + 4), 16)
          );
          index += 4;
        } else if (
          next === 'x' &&
          input.slice(index, index + 2).match(/^[0-9a-f]{2}$/i)
        ) {
          value += String.fromCharCode(
            Number.parseInt(input.slice(index, index + 2), 16)
          );
          index += 2;
        } else if (next === '\n') {
          // line continuation
        } else {
          value += next ?? '';
        }
        continue;
      }
      if (character === quote) {
        index += 1;
        return value;
      }
      if (quote === '`' && character === '$' && input[index + 1] === '{') {
        return null;
      }
      value += character;
      index += 1;
    }

    return null;
  };

  const parseValue = (): string | null => {
    skip();
    const character = input[index];

    if (character === '{') {
      index += 1;
      const entries: string[] = [];
      let closed = false;
      skip();
      if (input[index] === '}') {
        index += 1;
        return '{}';
      }

      while (index < input.length) {
        skip();
        let key: string | null = null;

        if (input[index] === "'" || input[index] === '"') {
          key = parseString();
        } else {
          const match = input.slice(index).match(/^[A-Za-z_$][\w$]*/);
          if (match) {
            key = match[0];
            index += match[0].length;
          }
        }

        if (key === null) {
          return null;
        }

        skip();
        if (input[index] !== ':') {
          return null;
        }
        index += 1;

        const value = parseValue();
        if (value === null) {
          return null;
        }
        entries.push(`${JSON.stringify(key)}:${value}`);

        skip();
        if (input[index] === ',') {
          index += 1;
          skip();
          if (input[index] === '}') {
            index += 1;
            closed = true;
            break;
          }
          continue;
        }
        if (input[index] === '}') {
          index += 1;
          closed = true;
          break;
        }
        return null;
      }

      return closed ? `{${entries.join(',')}}` : null;
    }

    if (character === '[') {
      index += 1;
      const items: string[] = [];
      let closed = false;
      skip();
      if (input[index] === ']') {
        index += 1;
        return '[]';
      }

      while (index < input.length) {
        const value = parseValue();
        if (value === null) {
          return null;
        }
        items.push(value);
        skip();
        if (input[index] === ',') {
          index += 1;
          skip();
          if (input[index] === ']') {
            index += 1;
            closed = true;
            break;
          }
          continue;
        }
        if (input[index] === ']') {
          index += 1;
          closed = true;
          break;
        }
        return null;
      }

      return closed ? `[${items.join(',')}]` : null;
    }

    if (character === "'" || character === '"' || character === '`') {
      const value = parseString();
      return value === null ? null : JSON.stringify(value);
    }

    if (character === '-' || /\d/.test(character ?? '')) {
      const match = input
        .slice(index)
        .match(/^-?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/);
      if (match) {
        index += match[0].length;
        return match[0];
      }
      return null;
    }

    if (input.startsWith('true', index)) {
      index += 4;
      return 'true';
    }
    if (input.startsWith('false', index)) {
      index += 5;
      return 'false';
    }
    if (input.startsWith('null', index)) {
      index += 4;
      return 'null';
    }

    return null;
  };

  const result = parseValue();
  skip();
  return result !== null && index === input.length ? result : null;
};

const findMatchingDelimiter = (
  source: string,
  openIndex: number,
  open: string,
  close: string
) => {
  let depth = 0;
  let quote: string | null = null;

  for (let index = openIndex; index < source.length; index += 1) {
    const character = source[index];

    if (quote) {
      if (character === '\\') {
        index += 1;
      } else if (character === quote) {
        quote = null;
      }
      continue;
    }

    if (character === '"' || character === "'" || character === '`') {
      quote = character;
      continue;
    }

    if (character === '/' && source[index + 1] === '/') {
      index += 2;
      while (index < source.length && source[index] !== '\n') {
        index += 1;
      }
      continue;
    }

    if (character === '/' && source[index + 1] === '*') {
      index += 2;
      while (
        index < source.length &&
        !(source[index] === '*' && source[index + 1] === '/')
      ) {
        index += 1;
      }
      index += 1;
      continue;
    }

    if (character === open) {
      depth += 1;
    } else if (character === close) {
      depth -= 1;
      if (depth === 0) {
        return index;
      }
    }
  }

  return -1;
};

const splitTopLevel = (source: string, separator: string) => {
  const parts: string[] = [];
  let current = '';
  let depth = 0;
  let quote: string | null = null;

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];

    if (quote) {
      current += character;
      if (character === '\\') {
        const next = source[index + 1];
        if (next) {
          current += next;
          index += 1;
        }
      } else if (character === quote) {
        quote = null;
      }
      continue;
    }

    if (character === '"' || character === "'" || character === '`') {
      quote = character;
      current += character;
      continue;
    }

    if (character === '(' || character === '[' || character === '{') {
      depth += 1;
    } else if (character === ')' || character === ']' || character === '}') {
      depth = Math.max(0, depth - 1);
    }

    if (character === separator && depth === 0) {
      parts.push(current);
      current = '';
    } else {
      current += character;
    }
  }

  parts.push(current);
  return parts.map((part) => part.trim()).filter(Boolean);
};

type FetchHeaders = Array<[string, string]>;

const parseHeadersObject = (source: string): FetchHeaders => {
  const trimmed = source.trim();
  const inner =
    trimmed.startsWith('{') && trimmed.endsWith('}')
      ? trimmed.slice(1, -1)
      : trimmed;

  const headers: FetchHeaders = [];

  for (const pair of splitTopLevel(inner, ',')) {
    const colon = pair.indexOf(':');
    if (colon === -1) {
      continue;
    }

    const rawName = pair.slice(0, colon).trim();
    const rawValue = pair.slice(colon + 1).trim();
    const name = parseJsString(rawName) ?? rawName.replace(/^['"]|['"]$/g, '');
    const value =
      parseJsString(rawValue) ?? rawValue.replace(/^['"]|['"]$/g, '');
    if (name && value) {
      headers.push([name, value]);
    }
  }

  return headers;
};

const parseFetch = (source: string) => {
  const warnings: string[] = [];
  const fetchMatch = /\bfetch\s*\(/.exec(source);
  if (!fetchMatch) {
    throw new Error('No fetch(...) call was found.');
  }

  const openIndex = source.indexOf('(', fetchMatch.index);
  const closeIndex = findMatchingDelimiter(source, openIndex, '(', ')');
  if (closeIndex === -1) {
    throw new Error('The fetch call has an unbalanced parenthesis.');
  }

  const args = splitTopLevel(source.slice(openIndex + 1, closeIndex), ',');
  const urlExpression = args[0] ?? '';
  let url = parseJsString(urlExpression);

  if (!url) {
    if (urlExpression.startsWith('`') && urlExpression.includes('${')) {
      warnings.push(
        'The fetch URL is a template literal with interpolation. The curl command keeps the expression as a placeholder.'
      );
      url = urlExpression;
    } else {
      warnings.push(
        `The fetch URL is not a plain string (${urlExpression || 'empty'}). Review the generated curl command.`
      );
      url = urlExpression;
    }
  }

  const optionsExpression = args[1];
  let method = 'GET';
  let headers: FetchHeaders = [];
  let body = '';
  let hasBody = false;

  if (optionsExpression) {
    const trimmedOptions = optionsExpression.trim();
    if (!trimmedOptions.startsWith('{') || !trimmedOptions.endsWith('}')) {
      warnings.push(
        'The fetch options are not an object literal and were not parsed.'
      );
    } else {
      const entries = splitTopLevel(trimmedOptions.slice(1, -1), ',');

      for (const entry of entries) {
        const colon = entry.indexOf(':');
        if (colon === -1) {
          continue;
        }
        const key = entry
          .slice(0, colon)
          .trim()
          .replace(/^['"]|['"]$/g, '');
        const value = entry.slice(colon + 1).trim();

        if (key === 'method') {
          method = (parseJsString(value) ?? value).toUpperCase();
          continue;
        }

        if (key === 'headers') {
          if (value.startsWith('{')) {
            headers = parseHeadersObject(value);
          } else if (value.startsWith('new Headers')) {
            const brace = value.indexOf('{');
            if (brace !== -1) {
              const braceEnd = findMatchingDelimiter(value, brace, '{', '}');
              if (braceEnd !== -1) {
                headers = parseHeadersObject(value.slice(brace, braceEnd + 1));
              }
            }
          } else if (value.startsWith('[')) {
            for (const pair of splitTopLevel(value.slice(1, -1), ',')) {
              const values = splitTopLevel(pair.replace(/^\[|\]$/g, ''), ',');
              const name = parseJsString(values[0] ?? '');
              const headerValue = parseJsString(values[1] ?? '');
              if (name && headerValue) {
                headers.push([name, headerValue]);
              }
            }
          } else {
            warnings.push('The fetch headers expression could not be parsed.');
          }
          continue;
        }

        if (key === 'body') {
          hasBody = true;
          const jsonStringify = value.match(
            /^JSON\.stringify\s*\(([\s\S]*)\)$/
          );
          if (jsonStringify?.[1]) {
            const stringifyArgs = splitTopLevel(jsonStringify[1], ',');
            const inner = (stringifyArgs[0] ?? '').trim();
            const parsedString = parseJsString(inner);
            if (parsedString !== null) {
              body = JSON.stringify(parsedString);
            } else if (inner.startsWith('{') || inner.startsWith('[')) {
              const parsedJson = parseJsonLoose(inner);
              if (parsedJson.ok) {
                body = JSON.stringify(parsedJson.value);
              } else {
                const converted = jsLiteralToJson(inner);
                if (converted !== null) {
                  body = converted;
                } else {
                  body = inner;
                  warnings.push(
                    'The JSON.stringify body contains JavaScript that is not valid JSON. It was copied as-is into --data-raw.'
                  );
                }
              }
            } else {
              body = inner;
              warnings.push(
                'The JSON.stringify body is an expression. It was copied as-is into --data-raw.'
              );
            }
          } else {
            const parsedBody = parseJsString(value);
            if (parsedBody !== null) {
              body = parsedBody;
            } else if (value.startsWith('new FormData')) {
              warnings.push(
                'FormData bodies cannot be converted back to curl flags automatically.'
              );
            } else if (value.startsWith('new URLSearchParams')) {
              warnings.push(
                'URLSearchParams bodies cannot be converted back to curl flags automatically.'
              );
            } else {
              body = value;
              warnings.push(
                'The fetch body expression was copied as-is into --data-raw.'
              );
            }
          }
          continue;
        }

        if (key === 'credentials') {
          const credentials = parseJsString(value);
          if (credentials === 'include') {
            warnings.push(
              'fetch credentials: "include" includes cookies automatically. Add a Cookie header to curl if needed.'
            );
          }
          continue;
        }

        if (
          [
            'mode',
            'cache',
            'redirect',
            'signal',
            'keepalive',
            'integrity',
          ].includes(key)
        ) {
          warnings.push(
            `The fetch option \`${key}\` has no direct curl equivalent.`
          );
        }
      }
    }
  }

  const lines = [`curl --request ${method}`];
  lines.push(`  --url ${shellQuote(url)}`);

  for (const [name, value] of headers) {
    lines.push(`  --header ${shellQuote(`${name}: ${value}`)}`);
  }

  if (hasBody && body) {
    lines.push(`  --data-raw ${shellQuote(body)}`);
  }

  lines.push('  --compressed');

  return { code: `${lines.join(' \\\n')}\n`, warnings };
};

export default function CurlFetchTool() {
  const [mode, setMode] = useState<Mode>('curl');
  const [responseMode, setResponseMode] = useState<ResponseMode>('auto');
  const [input, setInput] = useState(CURL_EXAMPLE);
  const [output, setOutput] = useState('');
  const [warnings, setWarnings] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const convert = () => {
    if (!input.trim()) {
      setOutput('');
      setWarnings([]);
      setError(
        mode === 'curl'
          ? 'Paste a curl command to convert to fetch.'
          : 'Paste a fetch call to convert to curl.'
      );
      return;
    }

    try {
      if (mode === 'curl') {
        const request = parseCurl(input);
        const result = buildFetch(request, responseMode);
        setOutput(result.code);
        setWarnings(result.warnings);
      } else {
        const result = parseFetch(input);
        setOutput(result.code);
        setWarnings(result.warnings);
      }
      setError(null);
    } catch (conversionError) {
      setOutput('');
      setWarnings([]);
      setError(errorMessage(conversionError));
    }
  };

  const changeMode = (nextMode: string) => {
    const resolved = nextMode as Mode;
    setMode(resolved);
    setInput(resolved === 'curl' ? CURL_EXAMPLE : FETCH_EXAMPLE);
    setOutput('');
    setWarnings([]);
    setError(null);
  };

  return (
    <ToolLayout>
      <Panel
        description="Supports the common curl flags used for JSON APIs: -X, -H, -d/--data, -F, -u, -b, --compressed, -I and -G."
        title={mode === 'curl' ? 'curl command' : 'fetch call'}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SegmentedControl
            ariaLabel="Conversion direction"
            onChange={changeMode}
            options={[
              { value: 'curl', label: 'curl → fetch' },
              { value: 'fetch', label: 'fetch → curl' },
            ]}
            value={mode}
          />
          <span className="text-xs text-fg-muted">
            {input.length} characters
          </span>
        </div>

        {mode === 'curl' && (
          <div className="mt-3 max-w-xs">
            <Field label="Response handling">
              <Select
                aria-label="Generated response handling"
                onChange={(event) =>
                  setResponseMode(event.target.value as ResponseMode)
                }
                value={responseMode}
              >
                <option value="auto">Auto-detect JSON or text</option>
                <option value="json">Parse as JSON</option>
                <option value="text">Read as text</option>
                <option value="response">Return the Response object</option>
              </Select>
            </Field>
          </div>
        )}

        <div className="mt-3">
          <Field label={mode === 'curl' ? 'curl command' : 'fetch code'}>
            <Textarea
              aria-label={mode === 'curl' ? 'curl command' : 'fetch code'}
              className="min-h-[320px]"
              onChange={(event) => {
                setInput(event.target.value);
                setError(null);
              }}
              value={input}
            />
          </Field>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button onClick={convert} variant="primary">
            Convert
          </Button>
          <Button
            onClick={() =>
              setInput(mode === 'curl' ? CURL_EXAMPLE : FETCH_EXAMPLE)
            }
          >
            Load example
          </Button>
          <Button
            onClick={() => {
              setInput('');
              setOutput('');
              setWarnings([]);
              setError(null);
            }}
            variant="ghost"
          >
            Clear
          </Button>
        </div>

        {error && (
          <Callout className="mt-3" variant="error">
            {error}
          </Callout>
        )}

        {warnings.length > 0 && (
          <Callout
            className="mt-3"
            title={`${pluralize(warnings.length, 'note')}`}
            variant="warning"
          >
            <ul className="list-disc space-y-1 pl-4">
              {[...new Set(warnings)].map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </Callout>
        )}
      </Panel>

      <ResultPanel
        emptyText={
          mode === 'curl'
            ? 'Generated fetch code will appear here.'
            : 'Generated curl command will appear here.'
        }
        filename={mode === 'curl' ? 'request.js' : 'request.sh'}
        label={mode === 'curl' ? 'fetch output' : 'curl output'}
        value={output}
      />
    </ToolLayout>
  );
}
