export type CssIssue = {
  severity: 'error' | 'warning';
  message: string;
  line?: number;
};

export type CssDeclaration = {
  property: string;
  value: string;
};

export type CssRule = {
  selector: string;
  body: string;
  atRule?: string;
};

type CssAtom = {
  type: 'ws' | 'comment' | 'string' | 'url' | 'char' | 'word';
  value: string;
};

const tokenizeCssAtoms = (input: string): CssAtom[] => {
  const atoms: CssAtom[] = [];
  let i = 0;

  while (i < input.length) {
    const char = input[i] ?? '';

    if (char === '/' && input[i + 1] === '*') {
      const close = input.indexOf('*/', i + 2);
      const end = close === -1 ? input.length : close + 2;
      atoms.push({ type: 'comment', value: input.slice(i, end) });
      i = end;
      continue;
    }

    if (char === '"' || char === "'") {
      const quote = char;
      let end = i + 1;
      while (end < input.length) {
        const current = input[end] ?? '';
        if (current === '\\') {
          end += 2;
          continue;
        }
        end += 1;
        if (current === quote) {
          break;
        }
      }
      atoms.push({ type: 'string', value: input.slice(i, end) });
      i = end;
      continue;
    }

    if (/\s/.test(char)) {
      let end = i + 1;
      while (end < input.length && /\s/.test(input[end] ?? '')) {
        end += 1;
      }
      atoms.push({ type: 'ws', value: input.slice(i, end) });
      i = end;
      continue;
    }

    if (/[a-zA-Z0-9_-]/.test(char)) {
      let end = i + 1;
      while (end < input.length && /[a-zA-Z0-9_-]/.test(input[end] ?? '')) {
        end += 1;
      }
      const word = input.slice(i, end);
      if (word.toLowerCase() === 'url' && input[end] === '(') {
        let depth = 0;
        let cursor = end;
        let quote: string | null = null;
        while (cursor < input.length) {
          const current = input[cursor] ?? '';
          if (quote) {
            if (current === '\\') {
              cursor += 2;
              continue;
            }
            if (current === quote) {
              quote = null;
            }
          } else if (current === '"' || current === "'") {
            quote = current;
          } else if (current === '(') {
            depth += 1;
          } else if (current === ')') {
            depth -= 1;
            if (depth === 0) {
              cursor += 1;
              break;
            }
          }
          cursor += 1;
        }
        atoms.push({ type: 'url', value: input.slice(i, cursor) });
        i = cursor;
        continue;
      }
      atoms.push({ type: 'word', value: word });
      i = end;
      continue;
    }

    atoms.push({ type: 'char', value: char });
    i += 1;
  }

  return atoms;
};

const significantBefore = (atoms: CssAtom[], index: number): number => {
  for (let i = index - 1; i >= 0; i -= 1) {
    if (atoms[i]!.type !== 'ws' && atoms[i]!.type !== 'comment') {
      return i;
    }
  }
  return -1;
};

const significantAfter = (atoms: CssAtom[], index: number): number => {
  for (let i = index + 1; i < atoms.length; i += 1) {
    if (atoms[i]!.type !== 'ws' && atoms[i]!.type !== 'comment') {
      return i;
    }
  }
  return -1;
};

const DROP_SPACE_BEFORE = new Set([
  '{',
  '}',
  ';',
  ',',
  '>',
  '~',
  ')',
  ']',
  '!',
]);
const DROP_SPACE_AFTER = new Set(['{', '}', ';', ',', '>', '~', '(', '[', '!']);

const colonStartsDeclaration = (
  atoms: CssAtom[],
  colonIndex: number,
  parenDepth: number
): boolean => {
  if (parenDepth > 0) {
    return true;
  }
  for (let i = colonIndex + 1; i < atoms.length; i += 1) {
    const atom = atoms[i]!;
    if (atom.type === 'ws' || atom.type === 'comment') {
      continue;
    }
    if (atom.value === '{') {
      return false;
    }
    if (atom.value === ';' || atom.value === '}') {
      return true;
    }
  }
  return true;
};

export type CssMinifyOptions = {
  keepImportantComments: boolean;
};

export const minifyCss = (
  input: string,
  options: CssMinifyOptions = { keepImportantComments: true }
): string => {
  const atoms = tokenizeCssAtoms(input);
  let output = '';
  let parenDepth = 0;
  let braceDepth = 0;

  for (let index = 0; index < atoms.length; index += 1) {
    const atom = atoms[index]!;

    if (atom.type === 'comment') {
      if (
        options.keepImportantComments &&
        atom.value.startsWith('/*!') &&
        atom.value.endsWith('*/')
      ) {
        output += atom.value;
      }
      continue;
    }

    if (atom.type === 'ws') {
      const previous = significantBefore(atoms, index);
      const next = significantAfter(atoms, index);
      if (previous === -1 || next === -1) {
        continue;
      }

      const previousAtom = atoms[previous]!;
      const nextAtom = atoms[next]!;
      const previousValue = previousAtom.value;
      const nextValue = nextAtom.value;

      if (
        DROP_SPACE_AFTER.has(previousValue) ||
        DROP_SPACE_BEFORE.has(nextValue)
      ) {
        continue;
      }

      if (
        previousAtom.type === 'char' &&
        previousValue === ':' &&
        colonStartsDeclaration(atoms, previous, parenDepth)
      ) {
        continue;
      }

      if (
        nextAtom.type === 'char' &&
        nextValue === ':' &&
        colonStartsDeclaration(atoms, next, parenDepth)
      ) {
        continue;
      }

      output += ' ';
      continue;
    }

    if (atom.type === 'char') {
      if (atom.value === '(') {
        parenDepth += 1;
      } else if (atom.value === ')') {
        parenDepth = Math.max(0, parenDepth - 1);
      } else if (atom.value === '{') {
        braceDepth += 1;
      } else if (atom.value === '}') {
        braceDepth = Math.max(0, braceDepth - 1);
      } else if (atom.value === ';') {
        const next = significantAfter(atoms, index);
        const previous = significantBefore(atoms, index);
        if (next === -1) {
          if (braceDepth > 0) {
            continue;
          }
        } else if (
          atoms[next]!.value === '}' ||
          previous === -1 ||
          atoms[previous]!.value === '{' ||
          atoms[previous]!.value === ';'
        ) {
          continue;
        }
      }
    }

    output += atom.value;
  }

  return output.trim();
};

export const formatCssFallback = (
  input: string,
  indentSize = 2,
  useTabs = false
): string => {
  const indentUnit = useTabs ? '\t' : ' '.repeat(Math.max(0, indentSize));
  const lines: string[] = [];
  let level = 0;
  let buffer = '';
  let parenDepth = 0;
  let i = 0;

  const pushIndented = (text: string) => {
    const trimmed = text.trim();
    if (trimmed) {
      lines.push(`${indentUnit.repeat(Math.max(0, level))}${trimmed}`);
    }
  };

  const flushDeclaration = () => {
    const text = buffer.replace(/\s+/g, ' ').trim();
    buffer = '';
    if (!text) {
      return;
    }
    pushIndented(text.endsWith(';') ? text : `${text};`);
  };

  while (i < input.length) {
    const char = input[i] ?? '';

    if (char === '/' && input[i + 1] === '*') {
      const close = input.indexOf('*/', i + 2);
      const end = close === -1 ? input.length : close + 2;
      const value = input.slice(i, end);
      if (buffer.trim()) {
        buffer += ' ';
        buffer += value;
      } else {
        for (const line of value.split(/\r?\n/)) {
          pushIndented(line);
        }
      }
      i = end;
      continue;
    }

    if (char === '"' || char === "'") {
      const quote = char;
      let end = i + 1;
      while (end < input.length) {
        const current = input[end] ?? '';
        if (current === '\\') {
          end += 2;
          continue;
        }
        end += 1;
        if (current === quote) {
          break;
        }
      }
      buffer += input.slice(i, end);
      i = end;
      continue;
    }

    if (char === '{') {
      const header = buffer.replace(/\s+/g, ' ').trim();
      buffer = '';
      if (header) {
        lines.push(`${indentUnit.repeat(Math.max(0, level))}${header} {`);
      } else {
        pushIndented('{');
      }
      level += 1;
      i += 1;
      continue;
    }

    if (char === '}') {
      flushDeclaration();
      level = Math.max(0, level - 1);
      pushIndented('}');
      i += 1;
      continue;
    }

    if (char === ';' && parenDepth === 0) {
      flushDeclaration();
      i += 1;
      continue;
    }

    if (char === '(') {
      parenDepth += 1;
      buffer += char;
      i += 1;
      continue;
    }

    if (char === ')') {
      parenDepth = Math.max(0, parenDepth - 1);
      buffer += char;
      i += 1;
      continue;
    }

    if (/\s/.test(char)) {
      buffer += ' ';
      i += 1;
      continue;
    }

    buffer += char;
    i += 1;
  }

  if (buffer.trim()) {
    pushIndented(buffer);
  }

  return lines.join('\n');
};

const buildLineLocator = (input: string) => {
  const starts = [0];
  for (let i = 0; i < input.length; i += 1) {
    if (input[i] === '\n') {
      starts.push(i + 1);
    }
  }
  return (offset: number): number => {
    let low = 0;
    let high = starts.length - 1;
    while (low < high) {
      const mid = Math.ceil((low + high) / 2);
      if ((starts[mid] ?? 0) <= offset) {
        low = mid;
      } else {
        high = mid - 1;
      }
    }
    return low + 1;
  };
};

const KNOWN_AT_RULES = new Set([
  'charset',
  'container',
  'counter-style',
  'custom-media',
  'custom-selector',
  'document',
  'else',
  'font-face',
  'font-feature-values',
  'font-palette-values',
  'import',
  'keyframes',
  'layer',
  'media',
  'namespace',
  'nest',
  'page',
  'property',
  'scope',
  'starting-style',
  'supports',
  'tailwind',
  'viewport',
  'when',
]);

const stripVendorPrefix = (name: string) =>
  name.replace(/^-(webkit|moz|ms|o)-/, '');

const analyzeDeclarations = (
  input: string,
  start: number,
  end: number,
  lineAt: (offset: number) => number,
  report: (
    severity: CssIssue['severity'],
    message: string,
    line?: number
  ) => void
) => {
  let chunkStart = start;
  let i = start;
  let parenDepth = 0;
  let bracketDepth = 0;
  const seenProperties = new Set<string>();

  const analyzeChunk = (chunkStartOffset: number, chunkEndOffset: number) => {
    const rawChunk = input.slice(chunkStartOffset, chunkEndOffset);
    const withoutComments = rawChunk.replace(/\/\*[\s\S]*?(?:\*\/|$)/g, ' ');
    const text = withoutComments.trim();
    if (!text || text.startsWith('@')) {
      return;
    }

    let depth = 0;
    let colonIndex = -1;
    let quote: string | null = null;
    for (let cursor = 0; cursor < text.length; cursor += 1) {
      const char = text[cursor] ?? '';
      if (quote) {
        if (char === '\\') {
          cursor += 1;
        } else if (char === quote) {
          quote = null;
        }
        continue;
      }
      if (char === '"' || char === "'") {
        quote = char;
      } else if (char === '(' || char === '[') {
        depth += 1;
      } else if (char === ')' || char === ']') {
        depth = Math.max(0, depth - 1);
      } else if (char === ':' && depth === 0) {
        colonIndex = cursor;
        break;
      }
    }

    const line = lineAt(chunkStartOffset);
    if (colonIndex === -1) {
      report(
        'warning',
        `Declaration "${text.slice(0, 60)}" is missing a ":".`,
        line
      );
      return;
    }

    const property = text.slice(0, colonIndex).trim();
    const value = text.slice(colonIndex + 1).trim();

    if (!/^(--[\w-]+|-?[a-zA-Z][\w-]*)$/.test(property)) {
      report(
        'warning',
        `"${property.slice(0, 40)}" is not a valid CSS property name.`,
        line
      );
    }
    if (!value) {
      report('warning', `Property "${property}" has no value.`, line);
    }

    const propertyKey = property.toLowerCase();
    if (!propertyKey.startsWith('--')) {
      if (seenProperties.has(propertyKey)) {
        report(
          'warning',
          `Property "${property}" is declared more than once in this block; the last value wins (intentional fallbacks are fine).`,
          line
        );
      } else {
        seenProperties.add(propertyKey);
      }
    }
  };

  while (i < end) {
    const char = input[i] ?? '';

    if (char === '/' && input[i + 1] === '*') {
      const close = input.indexOf('*/', i + 2);
      i = close === -1 || close >= end ? end : close + 2;
      continue;
    }

    if (char === '"' || char === "'") {
      const quote = char;
      let cursor = i + 1;
      while (cursor < end) {
        const current = input[cursor] ?? '';
        if (current === '\\') {
          cursor += 2;
          continue;
        }
        if (current === quote) {
          cursor += 1;
          break;
        }
        cursor += 1;
      }
      i = cursor;
      continue;
    }

    if (char === '(') {
      parenDepth += 1;
      i += 1;
      continue;
    }
    if (char === ')') {
      parenDepth = Math.max(0, parenDepth - 1);
      i += 1;
      continue;
    }
    if (char === '[') {
      bracketDepth += 1;
      i += 1;
      continue;
    }
    if (char === ']') {
      bracketDepth = Math.max(0, bracketDepth - 1);
      i += 1;
      continue;
    }

    if (char === '{' && parenDepth === 0 && bracketDepth === 0) {
      let depth = 0;
      let cursor = i;
      while (cursor < end) {
        const current = input[cursor] ?? '';
        if (current === '/' && input[cursor + 1] === '*') {
          const close = input.indexOf('*/', cursor + 2);
          cursor = close === -1 || close >= end ? end : close + 2;
          continue;
        }
        if (current === '"' || current === "'") {
          const quote = current;
          cursor += 1;
          while (cursor < end) {
            const inner = input[cursor] ?? '';
            if (inner === '\\') {
              cursor += 2;
              continue;
            }
            cursor += 1;
            if (inner === quote) {
              break;
            }
          }
          continue;
        }
        if (current === '{') {
          depth += 1;
        } else if (current === '}') {
          depth -= 1;
          if (depth === 0) {
            cursor += 1;
            break;
          }
        }
        cursor += 1;
      }
      chunkStart = cursor;
      i = cursor;
      continue;
    }

    if (char === ';' && parenDepth === 0 && bracketDepth === 0) {
      if (i > chunkStart) {
        analyzeChunk(chunkStart, i);
      }
      chunkStart = i + 1;
      i += 1;
      continue;
    }

    i += 1;
  }

  if (chunkStart < end) {
    analyzeChunk(chunkStart, end);
  }
};

export const validateCss = (
  input: string
): { issues: CssIssue[]; ruleCount: number; declarationCount: number } => {
  const lineAt = buildLineLocator(input);
  const issues: CssIssue[] = [];
  const report = (
    severity: CssIssue['severity'],
    message: string,
    line?: number
  ) => {
    issues.push({ severity, message, line });
  };

  const braceStack: Array<{ index: number; line: number }> = [];
  const blocks: Array<{ start: number; end: number }> = [];
  let i = 0;
  let declarationCount = 0;

  while (i < input.length) {
    const char = input[i] ?? '';

    if (char === '/' && input[i + 1] === '*') {
      const close = input.indexOf('*/', i + 2);
      if (close === -1) {
        report('error', 'Comment is not closed with "*/".', lineAt(i));
        break;
      }
      i = close + 2;
      continue;
    }

    if (char === '"' || char === "'") {
      const quote = char;
      const start = i;
      let cursor = i + 1;
      let terminated = false;
      while (cursor < input.length) {
        const current = input[cursor] ?? '';
        if (current === '\\') {
          cursor += 2;
          continue;
        }
        if (current === '\n') {
          break;
        }
        if (current === quote) {
          cursor += 1;
          terminated = true;
          break;
        }
        cursor += 1;
      }
      if (!terminated) {
        report(
          'error',
          'String is not closed before the end of the line.',
          lineAt(start)
        );
      }
      i = Math.max(cursor, start + 1);
      continue;
    }

    if (char === '@') {
      const match = /^@(-?[a-zA-Z][\w-]*)/.exec(input.slice(i));
      if (match) {
        const previous = input.slice(0, i).replace(/\s+$/, '').slice(-1);
        const atStatementStart =
          previous === '' ||
          previous === ';' ||
          previous === '{' ||
          previous === '}';
        if (atStatementStart) {
          const name = stripVendorPrefix((match[1] ?? '').toLowerCase());
          if (!KNOWN_AT_RULES.has(name)) {
            report('warning', `Unknown at-rule "@${match[1]}".`, lineAt(i));
          }
        }
        i += match[0].length;
        continue;
      }
    }

    if (char === '{') {
      braceStack.push({ index: i, line: lineAt(i) });
      i += 1;
      continue;
    }

    if (char === '}') {
      const open = braceStack.pop();
      if (!open) {
        report('error', 'Unexpected closing brace "}".', lineAt(i));
      } else if (input.slice(open.index + 1, i).trim() === '') {
        report('warning', 'Empty rule or block.', open.line);
      } else {
        blocks.push({ start: open.index + 1, end: i });
      }
      i += 1;
      continue;
    }

    i += 1;
  }

  for (const open of braceStack) {
    report('error', 'Opening brace "{" is never closed.', open.line);
  }

  for (const block of blocks) {
    const bodyText = input.slice(block.start, block.end);
    const declarations = bodyText.match(/:[^;{}]+;/g)?.length ?? 0;
    declarationCount += declarations;
    analyzeDeclarations(input, block.start, block.end, lineAt, report);
  }

  const propertyCount = (input.match(/[-a-zA-Z][\w-]*\s*:/g) ?? []).length;

  issues.sort((a, b) => (a.line ?? 0) - (b.line ?? 0));

  return {
    issues,
    ruleCount: blocks.length,
    declarationCount: Math.max(declarationCount, propertyCount),
  };
};

const findMatchingBrace = (input: string, openIndex: number): number => {
  let depth = 0;
  let i = openIndex;
  while (i < input.length) {
    const char = input[i] ?? '';
    if (char === '/' && input[i + 1] === '*') {
      const close = input.indexOf('*/', i + 2);
      i = close === -1 ? input.length : close + 2;
      continue;
    }
    if (char === '"' || char === "'") {
      const quote = char;
      i += 1;
      while (i < input.length) {
        const current = input[i] ?? '';
        if (current === '\\') {
          i += 2;
          continue;
        }
        i += 1;
        if (current === quote) {
          break;
        }
      }
      continue;
    }
    if (char === '{') {
      depth += 1;
    } else if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        return i;
      }
    }
    i += 1;
  }
  return -1;
};

const RECURSIVE_AT_RULES = new Set([
  'container',
  'document',
  'layer',
  'media',
  'scope',
  'starting-style',
  'supports',
]);

export const extractCssRules = (
  input: string
): { rules: CssRule[]; atRules: string[] } => {
  const rules: CssRule[] = [];
  const atRules: string[] = [];
  let i = 0;
  let segmentStart = 0;

  while (i < input.length) {
    const char = input[i] ?? '';

    if (char === '/' && input[i + 1] === '*') {
      const close = input.indexOf('*/', i + 2);
      i = close === -1 ? input.length : close + 2;
      continue;
    }

    if (char === '"' || char === "'") {
      const quote = char;
      i += 1;
      while (i < input.length) {
        const current = input[i] ?? '';
        if (current === '\\') {
          i += 2;
          continue;
        }
        i += 1;
        if (current === quote) {
          break;
        }
      }
      continue;
    }

    if (char === '{') {
      const header = input.slice(segmentStart, i).trim();
      const close = findMatchingBrace(input, i);
      if (close === -1) {
        break;
      }
      const body = input.slice(i + 1, close);

      if (header.startsWith('@')) {
        atRules.push(header);
        const nameMatch = /^@(-?[a-zA-Z][\w-]*)/.exec(header);
        const name = stripVendorPrefix((nameMatch?.[1] ?? '').toLowerCase());
        if (RECURSIVE_AT_RULES.has(name)) {
          const nested = extractCssRules(body);
          for (const rule of nested.rules) {
            rules.push({
              ...rule,
              atRule: rule.atRule ? `${header} > ${rule.atRule}` : header,
            });
          }
          atRules.push(...nested.atRules);
        }
      } else if (header) {
        rules.push({ selector: header.replace(/\s+/g, ' '), body });
      }

      i = close + 1;
      segmentStart = i;
      continue;
    }

    if (char === '}' || char === ';') {
      i += 1;
      segmentStart = i;
      continue;
    }

    i += 1;
  }

  return { rules, atRules };
};

export const parseDeclarations = (body: string): CssDeclaration[] => {
  const declarations: CssDeclaration[] = [];
  let chunkStart = 0;
  let i = 0;
  let parenDepth = 0;
  let bracketDepth = 0;

  const addChunk = (end: number) => {
    const raw = body.slice(chunkStart, end);
    const text = raw.replace(/\/\*[\s\S]*?(?:\*\/|$)/g, ' ').trim();
    if (!text || text.startsWith('@')) {
      return;
    }
    let depth = 0;
    let quote: string | null = null;
    let colon = -1;
    for (let cursor = 0; cursor < text.length; cursor += 1) {
      const char = text[cursor] ?? '';
      if (quote) {
        if (char === '\\') {
          cursor += 1;
        } else if (char === quote) {
          quote = null;
        }
        continue;
      }
      if (char === '"' || char === "'") {
        quote = char;
      } else if (char === '(' || char === '[') {
        depth += 1;
      } else if (char === ')' || char === ']') {
        depth = Math.max(0, depth - 1);
      } else if (char === ':' && depth === 0) {
        colon = cursor;
        break;
      }
    }
    if (colon === -1) {
      return;
    }
    const property = text.slice(0, colon).trim();
    const value = text.slice(colon + 1).trim();
    if (property && value) {
      declarations.push({ property, value });
    }
  };

  while (i < body.length) {
    const char = body[i] ?? '';

    if (char === '/' && body[i + 1] === '*') {
      const close = body.indexOf('*/', i + 2);
      i = close === -1 ? body.length : close + 2;
      continue;
    }

    if (char === '"' || char === "'") {
      const quote = char;
      i += 1;
      while (i < body.length) {
        const current = body[i] ?? '';
        if (current === '\\') {
          i += 2;
          continue;
        }
        i += 1;
        if (current === quote) {
          break;
        }
      }
      continue;
    }

    if (char === '{') {
      let depth = 0;
      while (i < body.length) {
        const current = body[i] ?? '';
        if (current === '{') {
          depth += 1;
        } else if (current === '}') {
          depth -= 1;
          if (depth === 0) {
            i += 1;
            break;
          }
        }
        i += 1;
      }
      chunkStart = i;
      continue;
    }

    if (char === '(') {
      parenDepth += 1;
    } else if (char === ')') {
      parenDepth = Math.max(0, parenDepth - 1);
    } else if (char === '[') {
      bracketDepth += 1;
    } else if (char === ']') {
      bracketDepth = Math.max(0, bracketDepth - 1);
    } else if (char === ';' && parenDepth === 0 && bracketDepth === 0) {
      addChunk(i);
      chunkStart = i + 1;
    }

    i += 1;
  }

  addChunk(body.length);

  return declarations;
};

export const cssIssueReportText = (issues: CssIssue[]): string => {
  if (issues.length === 0) {
    return 'No CSS syntax issues found.';
  }
  return issues
    .map((issue) => {
      const location = issue.line ? `Line ${issue.line}: ` : '';
      return `${location}${issue.severity}: ${issue.message}`;
    })
    .join('\n');
};
