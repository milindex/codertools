export type HtmlIssue = {
  severity: 'error' | 'warning';
  message: string;
  line?: number;
};

export type HtmlToken = {
  type: 'text' | 'comment' | 'doctype' | 'open' | 'close' | 'invalid';
  raw: string;
  name?: string;
  selfClosing?: boolean;
  start: number;
  end: number;
  preserve?: boolean;
};

const VOID_ELEMENTS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
]);

const RAW_TEXT_ELEMENTS = new Set(['script', 'style', 'textarea', 'title']);

const INLINE_ELEMENTS = new Set([
  'a',
  'abbr',
  'b',
  'bdi',
  'bdo',
  'br',
  'button',
  'cite',
  'code',
  'data',
  'del',
  'dfn',
  'em',
  'i',
  'img',
  'input',
  'ins',
  'kbd',
  'label',
  'mark',
  'meter',
  'output',
  'progress',
  'q',
  's',
  'samp',
  'select',
  'slot',
  'small',
  'span',
  'strong',
  'sub',
  'sup',
  'time',
  'u',
  'var',
  'wbr',
]);

const OPTIONAL_END_TAGS = new Set([
  'body',
  'caption',
  'colgroup',
  'dd',
  'dt',
  'head',
  'html',
  'li',
  'optgroup',
  'option',
  'p',
  'tbody',
  'td',
  'tfoot',
  'th',
  'thead',
  'tr',
]);

const BLOCK_ELEMENTS = new Set([
  'address',
  'article',
  'aside',
  'blockquote',
  'details',
  'dialog',
  'div',
  'dl',
  'fieldset',
  'figcaption',
  'figure',
  'footer',
  'form',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'header',
  'hgroup',
  'hr',
  'main',
  'nav',
  'ol',
  'p',
  'pre',
  'section',
  'table',
  'ul',
]);

const TABLE_ELEMENTS = new Set(['table', 'thead', 'tbody', 'tfoot']);

const INLINE_CONTAINERS = new Set([
  'caption',
  'dd',
  'dt',
  'figcaption',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'label',
  'legend',
  'li',
  'p',
  'summary',
  'td',
  'th',
]);

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const readTagEnd = (input: string, from: number): number => {
  let quote: string | null = null;
  for (let i = from; i < input.length; i += 1) {
    const char = input[i] ?? '';
    if (quote) {
      if (char === quote) {
        quote = null;
      }
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
    } else if (char === '>') {
      return i;
    }
  }
  return -1;
};

export const tokenizeHtml = (input: string): HtmlToken[] => {
  const tokens: HtmlToken[] = [];
  let i = 0;
  let preDepth = 0;

  while (i < input.length) {
    if (input[i] !== '<') {
      let end = input.indexOf('<', i);
      if (end === -1) {
        end = input.length;
      }
      tokens.push({
        type: 'text',
        raw: input.slice(i, end),
        start: i,
        end,
        preserve: preDepth > 0,
      });
      i = end;
      continue;
    }

    if (input.startsWith('<!--', i)) {
      const close = input.indexOf('-->', i + 4);
      if (close === -1) {
        tokens.push({
          type: 'invalid',
          raw: input.slice(i),
          start: i,
          end: input.length,
        });
        break;
      }
      const end = close + 3;
      tokens.push({ type: 'comment', raw: input.slice(i, end), start: i, end });
      i = end;
      continue;
    }

    if (input.startsWith('<![CDATA[', i)) {
      const close = input.indexOf(']]>', i + 9);
      const end = close === -1 ? input.length : close + 3;
      tokens.push({ type: 'text', raw: input.slice(i, end), start: i, end });
      i = end;
      continue;
    }

    if (input[i + 1] === '!' || input[i + 1] === '?') {
      const close = readTagEnd(input, i + 2);
      if (close === -1) {
        tokens.push({
          type: 'invalid',
          raw: input.slice(i),
          start: i,
          end: input.length,
        });
        break;
      }
      const end = close + 1;
      tokens.push({
        type: input[i + 1] === '!' ? 'doctype' : 'comment',
        raw: input.slice(i, end),
        start: i,
        end,
      });
      i = end;
      continue;
    }

    const closing = input[i + 1] === '/';
    const nameStart = i + (closing ? 2 : 1);
    if (!/[a-zA-Z]/.test(input[nameStart] ?? '')) {
      tokens.push({ type: 'text', raw: '<', start: i, end: i + 1 });
      i += 1;
      continue;
    }

    const close = readTagEnd(input, nameStart);
    if (close === -1) {
      tokens.push({
        type: 'invalid',
        raw: input.slice(i),
        start: i,
        end: input.length,
      });
      break;
    }

    const end = close + 1;
    const raw = input.slice(i, end);
    const nameMatch = /^<\/?([a-zA-Z][^\s/>]*)/.exec(raw);
    const name = (nameMatch?.[1] ?? '').toLowerCase();
    const selfClosing = !closing && /\/\s*>$/.test(raw);

    tokens.push({
      type: closing ? 'close' : 'open',
      raw,
      name,
      selfClosing,
      start: i,
      end,
    });
    i = end;

    if (closing) {
      if (name === 'pre') {
        preDepth = Math.max(0, preDepth - 1);
      }
    } else if (name === 'pre' && !selfClosing) {
      preDepth += 1;
    }

    if (!closing && !selfClosing && RAW_TEXT_ELEMENTS.has(name)) {
      const closePattern = new RegExp(`</\\s*${escapeRegExp(name)}\\s*>`, 'i');
      const match = closePattern.exec(input.slice(i));
      if (match && match.index !== undefined) {
        const rawEnd = i + match.index;
        if (rawEnd > i) {
          tokens.push({
            type: 'text',
            raw: input.slice(i, rawEnd),
            start: i,
            end: rawEnd,
            preserve: true,
          });
        }
        i = rawEnd;
      } else {
        if (i < input.length) {
          tokens.push({
            type: 'text',
            raw: input.slice(i),
            start: i,
            end: input.length,
            preserve: true,
          });
        }
        i = input.length;
      }
    }
  }

  return tokens;
};

export const isVoidElement = (name: string) => VOID_ELEMENTS.has(name);

type ElementNode = {
  kind: 'element';
  name: string;
  open: string;
  close: string;
  closed: boolean;
  selfClosing: boolean;
  children: HtmlNode[];
};

type TextNode = {
  kind: 'text';
  value: string;
  preserve: boolean;
};

type CommentNode = {
  kind: 'comment';
  value: string;
};

type DoctypeNode = {
  kind: 'doctype';
  value: string;
};

type RawNode = CommentNode | DoctypeNode;

type HtmlNode = ElementNode | TextNode | RawNode;

const buildTree = (tokens: HtmlToken[]): HtmlNode[] => {
  const root: HtmlNode[] = [];
  const stack: ElementNode[] = [];

  const container = () =>
    stack.length > 0 ? stack[stack.length - 1]!.children : root;

  for (const token of tokens) {
    if (token.type === 'text') {
      if (token.raw) {
        container().push({
          kind: 'text',
          value: token.raw,
          preserve: Boolean(token.preserve),
        });
      }
      continue;
    }

    if (token.type === 'comment') {
      container().push({ kind: 'comment', value: token.raw });
      continue;
    }

    if (token.type === 'doctype') {
      container().push({ kind: 'doctype', value: token.raw });
      continue;
    }

    if (token.type === 'invalid') {
      container().push({ kind: 'text', value: token.raw, preserve: true });
      continue;
    }

    const name = token.name ?? '';
    if (token.type === 'open') {
      const node: ElementNode = {
        kind: 'element',
        name,
        open: token.raw,
        close: `</${name}>`,
        closed: false,
        selfClosing: Boolean(token.selfClosing) || VOID_ELEMENTS.has(name),
        children: [],
      };
      container().push(node);
      if (!node.selfClosing) {
        stack.push(node);
      }
      continue;
    }

    const closeIndex = [...stack].map((node) => node.name).lastIndexOf(name);
    if (closeIndex === -1) {
      container().push({ kind: 'text', value: token.raw, preserve: true });
      continue;
    }

    stack[closeIndex]!.closed = true;
    stack.splice(closeIndex);
  }

  return root;
};

const isInlineNode = (node: HtmlNode): boolean => {
  if (node.kind === 'text') {
    return true;
  }
  if (node.kind !== 'element') {
    return false;
  }
  if (!INLINE_ELEMENTS.has(node.name)) {
    return false;
  }
  return node.children.every((child) => {
    if (child.kind === 'text') {
      return true;
    }
    if (child.kind === 'element') {
      return isInlineNode(child);
    }
    return false;
  });
};

const serializeInlineChildren = (node: ElementNode): string =>
  node.children
    .map((child) => {
      if (child.kind === 'text') {
        return child.preserve ? child.value : child.value.replace(/\s+/g, ' ');
      }
      if (child.kind === 'element') {
        return serializeInline(child);
      }
      return child.value;
    })
    .join('');

const serializeInline = (node: ElementNode): string => {
  const open = node.open.replace(/\s+/g, ' ');
  const closing = node.closed && !node.selfClosing ? node.close : '';
  return `${open}${serializeInlineChildren(node)}${closing}`;
};

const splitRawLines = (value: string): string[] =>
  value.replace(/\r\n?/g, '\n').split('\n');

export const formatHtmlFallback = (
  input: string,
  indentSize = 2,
  useTabs = false
): string => {
  const indentUnit = useTabs ? '\t' : ' '.repeat(Math.max(0, indentSize));
  const tree = buildTree(tokenizeHtml(input));
  const lines: string[] = [];

  const serializeNode = (node: HtmlNode, level: number): void => {
    const indent = indentUnit.repeat(level);

    if (node.kind === 'text') {
      if (node.preserve) {
        const value = node.value.replace(/\r\n?/g, '\n').trim();
        if (value) {
          for (const line of splitRawLines(value)) {
            lines.push(line);
          }
        }
        return;
      }
      const value = node.value.replace(/\s+/g, ' ').trim();
      if (value) {
        lines.push(`${indent}${value}`);
      }
      return;
    }

    if (node.kind === 'comment' || node.kind === 'doctype') {
      if (node.kind === 'comment') {
        const value = node.value.replace(/\r\n?/g, '\n');
        for (const line of value.split('\n')) {
          lines.push(`${indent}${line.trim()}`);
        }
      } else {
        lines.push(`${indent}${node.value.trim()}`);
      }
      return;
    }

    if (node.selfClosing) {
      lines.push(`${indent}${node.open.replace(/\s+/g, ' ').trim()}`);
      return;
    }

    if (isInlineNode(node)) {
      lines.push(`${indent}${serializeInline(node).trim()}`);
      return;
    }

    const verbatim =
      node.name === 'pre' ||
      node.name === 'textarea' ||
      node.name === 'script' ||
      node.name === 'style';

    const phraseInline =
      !verbatim &&
      INLINE_CONTAINERS.has(node.name) &&
      node.children.every(
        (child) =>
          child.kind === 'text' ||
          (child.kind === 'element' && isInlineNode(child))
      );

    if (phraseInline) {
      const inner = serializeInlineChildren(node);
      const closing = node.closed ? node.close : '';
      lines.push(
        `${indent}${node.open.replace(/\s+/g, ' ').trim()}${inner}${closing}`
      );
      return;
    }

    lines.push(`${indent}${node.open.replace(/\s+/g, ' ').trim()}`);

    if (verbatim) {
      const textOnly = node.children.every((child) => child.kind === 'text');
      const rawText = node.children
        .map((child) => (child.kind === 'text' ? child.value : ''))
        .join('');
      const closing = node.closed ? node.close : '';

      if (textOnly && !/[\r\n]/.test(rawText)) {
        lines.pop();
        lines.push(
          `${indent}${node.open.replace(/\s+/g, ' ').trim()}${rawText}${closing}`
        );
        return;
      }

      for (const child of node.children) {
        if (child.kind === 'text') {
          const value = child.value.replace(/\r\n?/g, '\n').replace(/\s+$/, '');
          if (value) {
            lines.push(value);
          }
        } else {
          serializeNode(child, level + 1);
        }
      }
    } else {
      for (const child of node.children) {
        serializeNode(child, level + 1);
      }
    }

    if (node.closed) {
      lines.push(`${indent}${node.close}`);
    }
  };

  for (const node of tree) {
    serializeNode(node, 0);
  }

  return lines.join('\n');
};

const autoClosesOnOpen = (openName: string, newName: string): boolean => {
  if (openName === 'li' && newName === 'li') {
    return true;
  }
  if (openName === 'p' && (BLOCK_ELEMENTS.has(newName) || newName === 'p')) {
    return true;
  }
  if (openName === 'dt' && (newName === 'dt' || newName === 'dd')) {
    return true;
  }
  if (openName === 'dd' && (newName === 'dt' || newName === 'dd')) {
    return true;
  }
  if (
    openName === 'option' &&
    (newName === 'option' || newName === 'optgroup')
  ) {
    return true;
  }
  if (openName === 'optgroup' && newName === 'optgroup') {
    return true;
  }
  if (openName === 'tr' && newName === 'tr') {
    return true;
  }
  if (openName === 'td' && (newName === 'td' || newName === 'th')) {
    return true;
  }
  if (openName === 'th' && (newName === 'td' || newName === 'th')) {
    return true;
  }
  if (openName === 'thead' && (newName === 'tbody' || newName === 'tfoot')) {
    return true;
  }
  return false;
};

const hasAncestor = (
  stack: Array<{ name: string }>,
  names: string[]
): boolean => stack.some((entry) => names.includes(entry.name));

type Attribute = { name: string; value: string | null };

const parseAttributes = (rawTag: string): Attribute[] => {
  const inner = rawTag
    .replace(/^<\s*\/?\s*[a-zA-Z][^\s/>]*/, '')
    .replace(/\/?\s*>$/, '');
  const regex = /([^\s=/>]+)(?:\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  const attributes: Attribute[] = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(inner)) !== null) {
    if (!match[0]) {
      break;
    }
    attributes.push({
      name: (match[1] ?? '').toLowerCase(),
      value: match[3] ?? match[4] ?? match[5] ?? null,
    });
  }

  return attributes;
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

export const validateHtml = (
  input: string
): { issues: HtmlIssue[]; tagCount: number; idCount: number } => {
  const tokens = tokenizeHtml(input);
  const lineAt = buildLineLocator(input);
  const issues: HtmlIssue[] = [];
  const stack: Array<{ name: string; line: number }> = [];
  const ids = new Map<string, number>();
  let tagCount = 0;
  let idCount = 0;

  const report = (
    severity: HtmlIssue['severity'],
    message: string,
    line?: number
  ) => {
    issues.push({ severity, message, line });
  };

  for (const token of tokens) {
    if (token.type === 'invalid') {
      report(
        'error',
        token.raw.startsWith('<!--')
          ? 'Comment is not closed with "-->"'
          : 'Tag is not closed with ">"',
        lineAt(token.start)
      );
      continue;
    }

    if (token.type === 'open') {
      tagCount += 1;
      const name = token.name ?? '';
      const line = lineAt(token.start);
      const attributes = parseAttributes(token.raw);

      const idAttributes = attributes.filter(
        (attribute) => attribute.name === 'id'
      );
      for (const attribute of idAttributes) {
        const id = (attribute.value ?? '').trim();
        if (!id) {
          continue;
        }
        idCount += 1;
        if (/\s/.test(id)) {
          report('warning', `The id "${id}" contains whitespace.`, line);
        }
        const firstLine = ids.get(id);
        if (firstLine !== undefined) {
          report(
            'warning',
            `Duplicate id "${id}". First used on line ${firstLine}.`,
            line
          );
        } else {
          ids.set(id, line);
        }
      }

      const seenAttributes = new Set<string>();
      for (const attribute of attributes) {
        if (seenAttributes.has(attribute.name)) {
          report(
            'warning',
            `Duplicate attribute "${attribute.name}" on <${name}>.`,
            line
          );
        }
        seenAttributes.add(attribute.name);
      }

      const nestedSameTag = ['a', 'button', 'form', 'label'];
      if (nestedSameTag.includes(name) && hasAncestor(stack, [name])) {
        report(
          'error',
          `<${name}> elements cannot be nested inside another <${name}>.`,
          line
        );
      }

      const wasInsideParagraph = hasAncestor(stack, ['p']);
      while (
        stack.length > 0 &&
        autoClosesOnOpen(stack[stack.length - 1]!.name, name)
      ) {
        stack.pop();
      }

      if (wasInsideParagraph && BLOCK_ELEMENTS.has(name)) {
        report(
          'warning',
          `A <${name}> element cannot be nested inside <p>; the paragraph is closed implicitly.`,
          line
        );
      }

      if (name === 'li' && !hasAncestor(stack, ['ul', 'ol', 'menu'])) {
        report(
          'warning',
          '<li> should be inside a <ul>, <ol> or <menu> element.',
          line
        );
      }
      if ((name === 'td' || name === 'th') && !hasAncestor(stack, ['tr'])) {
        report('warning', `<${name}> should be inside a <tr> element.`, line);
      }
      if (name === 'tr' && !hasAncestor(stack, [...TABLE_ELEMENTS])) {
        report('warning', '<tr> should be inside a <table> section.', line);
      }
      if (name === 'thead' || name === 'tbody' || name === 'tfoot') {
        if (!hasAncestor(stack, ['table'])) {
          report('warning', `<${name}> should be inside a <table>.`, line);
        }
      }

      if (!token.selfClosing && !VOID_ELEMENTS.has(name)) {
        stack.push({ name, line });
      }
      continue;
    }

    if (token.type !== 'close') {
      continue;
    }

    const name = token.name ?? '';
    const line = lineAt(token.start);
    tagCount += 1;

    if (stack.length === 0) {
      if (VOID_ELEMENTS.has(name)) {
        report(
          'warning',
          `Void element <${name}> must not have a closing tag.`,
          line
        );
      } else {
        report(
          'error',
          `Closing tag </${name}> does not have a matching opening tag.`,
          line
        );
      }
      continue;
    }

    const matchIndex = [...stack].map((entry) => entry.name).lastIndexOf(name);

    if (matchIndex === -1) {
      report(
        VOID_ELEMENTS.has(name) ? 'warning' : 'error',
        VOID_ELEMENTS.has(name)
          ? `Void element <${name}> must not have a closing tag.`
          : `Closing tag </${name}> does not match the open <${stack[stack.length - 1]!.name}>.`,
        line
      );
      continue;
    }

    for (let index = stack.length - 1; index > matchIndex; index -= 1) {
      const open = stack[index]!;
      if (!OPTIONAL_END_TAGS.has(open.name)) {
        report(
          'error',
          `<${open.name}> opened on line ${open.line} is not closed before </${name}>.`,
          open.line
        );
      }
    }
    stack.splice(matchIndex);
  }

  for (const open of stack) {
    if (!OPTIONAL_END_TAGS.has(open.name)) {
      report(
        'error',
        `<${open.name}> opened on line ${open.line} is never closed.`,
        open.line
      );
    }
  }

  const hasDoctype = tokens.some(
    (token) => token.type === 'doctype' && /^<!doctype\s+html/i.test(token.raw)
  );
  if (input.trim() && !hasDoctype) {
    report(
      'warning',
      'No <!DOCTYPE html> declaration; browsers may render the page in quirks mode.'
    );
  }

  issues.sort((a, b) => (a.line ?? 0) - (b.line ?? 0));

  return { issues, tagCount, idCount };
};

export type HtmlMinifyOptions = {
  removeComments: boolean;
  collapseWhitespace: boolean;
  removeAttributeQuotes: boolean;
};

const collapseTagWhitespace = (raw: string): string => {
  let out = '';
  let quote: string | null = null;
  let pendingSpace = false;

  for (let i = 0; i < raw.length; i += 1) {
    const char = raw[i] ?? '';
    if (quote) {
      out += char;
      if (char === quote && raw[i - 1] !== '\\') {
        quote = null;
      }
      continue;
    }
    if (char === '"' || char === "'") {
      if (pendingSpace && out && !out.endsWith('<') && !out.endsWith('/')) {
        out += ' ';
      }
      pendingSpace = false;
      out += char;
      quote = char;
      continue;
    }
    if (/\s/.test(char)) {
      pendingSpace = true;
      continue;
    }
    if (pendingSpace) {
      if (out && !out.endsWith('<') && !out.endsWith('/')) {
        out += ' ';
      }
      pendingSpace = false;
    }
    out += char;
  }

  return out.replace(/\s+\/>$/, '/>').replace(/\s+>$/, '>');
};

const removeSafeAttributeQuotes = (tag: string): string =>
  tag.replace(
    /(\s)([^\s=/>]+)=("([^"]*)"|'([^']*)')/g,
    (
      match: string,
      space: string,
      name: string,
      _quoted: string,
      doubleQuoted: string | undefined,
      singleQuoted: string | undefined
    ) => {
      const value = doubleQuoted ?? singleQuoted ?? '';
      if (value && /^[^\s"'`=<>]+$/.test(value)) {
        return `${space}${name}=${value}`;
      }
      return match;
    }
  );

const isInlineToken = (token: HtmlToken | undefined): boolean =>
  Boolean(
    token &&
    token.type !== 'comment' &&
    token.type !== 'doctype' &&
    token.type !== 'invalid' &&
    token.name &&
    INLINE_ELEMENTS.has(token.name)
  );

export const minifyHtml = (
  input: string,
  options: HtmlMinifyOptions
): string => {
  const tokens = tokenizeHtml(input);
  let output = '';

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index]!;

    if (token.type === 'text') {
      if (token.preserve) {
        output += token.raw;
        continue;
      }
      if (!options.collapseWhitespace) {
        output += token.raw;
        continue;
      }
      if (/^\s+$/.test(token.raw)) {
        const previous = tokens[index - 1];
        const next = tokens[index + 1];
        if (isInlineToken(previous) || isInlineToken(next)) {
          if (output && !output.endsWith(' ')) {
            output += ' ';
          }
        }
        continue;
      }
      output += token.raw.replace(/\s+/g, ' ');
      continue;
    }

    if (token.type === 'comment') {
      if (
        options.removeComments &&
        !token.raw.startsWith('<!--[if') &&
        !token.raw.startsWith('<!--<![endif]')
      ) {
        continue;
      }
      output += token.raw;
      continue;
    }

    if (token.type === 'doctype' || token.type === 'invalid') {
      output += token.raw;
      continue;
    }

    if (token.type === 'close') {
      output += `</${token.name ?? ''}>`;
      continue;
    }

    let tag = collapseTagWhitespace(token.raw);
    if (options.removeAttributeQuotes && !token.selfClosing) {
      tag = removeSafeAttributeQuotes(tag);
    }
    output += tag;
  }

  return output.replace(/^\s+/, '').replace(/\s+$/, '');
};

export const issueReportText = (issues: HtmlIssue[]): string => {
  if (issues.length === 0) {
    return 'No structural issues found.';
  }
  return issues
    .map((issue) => {
      const location = issue.line ? `Line ${issue.line}: ` : '';
      return `${location}${issue.severity}: ${issue.message}`;
    })
    .join('\n');
};
