'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { Field } from '@/components/ui/Field';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { Spinner } from '@/components/ui/Spinner';
import { Textarea } from '@/components/ui/Textarea';
import { ToolLayout } from '@/components/ui/ToolLayout';

import { errorMessage } from './_shared';

const EXAMPLE = `$brand = #2f81f7
$radius = 8px

card($padding = 1rem)
  padding $padding
  border 1px solid rgba($brand, .25)
  border-radius $radius

.card
  card(1.25rem)
  background lighten($brand, 44%)

  &__title
    color darken($brand, 12%)
    font-weight 600

  &:hover
    border-color $brand`;

type CssDeclaration = { name: string; value: string };
type CssBlock = {
  selector: string;
  declarations: CssDeclaration[];
  children: CssBlock[];
};

type StylusExport = {
  render: (
    input: string,
    options: Record<string, unknown>,
    callback: (error: Error | null, css?: string) => void
  ) => void;
};

type StylusError = {
  message?: string;
  lineno?: number;
  column?: number;
};

const CSS_PROPERTIES = new Set([
  'align-content',
  'align-items',
  'align-self',
  'animation',
  'animation-delay',
  'animation-duration',
  'animation-name',
  'appearance',
  'aspect-ratio',
  'backdrop-filter',
  'background',
  'background-attachment',
  'background-clip',
  'background-color',
  'background-image',
  'background-position',
  'background-repeat',
  'background-size',
  'border',
  'border-bottom',
  'border-collapse',
  'border-color',
  'border-left',
  'border-radius',
  'border-right',
  'border-style',
  'border-top',
  'border-width',
  'bottom',
  'box-shadow',
  'box-sizing',
  'color',
  'column-gap',
  'columns',
  'content',
  'cursor',
  'display',
  'filter',
  'flex',
  'flex-basis',
  'flex-direction',
  'flex-grow',
  'flex-shrink',
  'flex-wrap',
  'float',
  'font',
  'font-family',
  'font-size',
  'font-style',
  'font-weight',
  'gap',
  'grid',
  'grid-area',
  'grid-column',
  'grid-row',
  'grid-template-columns',
  'grid-template-rows',
  'height',
  'inset',
  'justify-content',
  'justify-items',
  'justify-self',
  'left',
  'letter-spacing',
  'line-height',
  'list-style',
  'margin',
  'max-height',
  'max-width',
  'min-height',
  'min-width',
  'object-fit',
  'object-position',
  'opacity',
  'order',
  'outline',
  'overflow',
  'overflow-x',
  'overflow-y',
  'padding',
  'pointer-events',
  'position',
  'resize',
  'right',
  'rotate',
  'scale',
  'text-align',
  'text-decoration',
  'text-overflow',
  'text-transform',
  'top',
  'transform',
  'transition',
  'translate',
  'user-select',
  'vertical-align',
  'visibility',
  'white-space',
  'width',
  'word-break',
  'z-index',
]);

const isKnownProperty = (name: string) => {
  const normalized = name.toLowerCase();
  return (
    CSS_PROPERTIES.has(normalized) ||
    normalized.startsWith('--') ||
    /^(margin|padding|border|grid|flex|font|background|transition|animation)-/.test(
      normalized
    ) ||
    /^-[a-z]+-/.test(normalized)
  );
};

const countIndent = (line: string) => {
  let width = 0;
  for (const character of line) {
    if (character === ' ') {
      width += 1;
    } else if (character === '\t') {
      width += 2;
    } else {
      break;
    }
  }
  return width;
};

const stripLineComment = (line: string) => {
  let quote: string | null = null;
  let depth = 0;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];

    if (quote) {
      if (character === '\\') {
        index += 1;
      } else if (character === quote) {
        quote = null;
      }
      continue;
    }

    if (character === '"' || character === "'") {
      quote = character;
      continue;
    }

    if (character === '(') {
      depth += 1;
      continue;
    }

    if (character === ')') {
      depth = Math.max(0, depth - 1);
      continue;
    }

    if (
      character === '/' &&
      line[index + 1] === '/' &&
      depth === 0 &&
      (index === 0 || /\s/.test(line[index - 1] ?? ''))
    ) {
      return line.slice(0, index);
    }
  }

  return line;
};

const splitSelectorList = (selector: string) => {
  const parts: string[] = [];
  let current = '';
  let depth = 0;
  let quote: string | null = null;

  for (let index = 0; index < selector.length; index += 1) {
    const character = selector[index];

    if (quote) {
      current += character;
      if (character === '\\') {
        const next = selector[index + 1];
        if (next) {
          current += next;
          index += 1;
        }
      } else if (character === quote) {
        quote = null;
      }
      continue;
    }

    if (character === '"' || character === "'") {
      quote = character;
      current += character;
      continue;
    }

    if (character === '(' || character === '[') {
      depth += 1;
    } else if (character === ')' || character === ']') {
      depth = Math.max(0, depth - 1);
    }

    if (character === ',' && depth === 0) {
      if (current.trim()) {
        parts.push(current.trim());
      }
      current = '';
    } else {
      current += character;
    }
  }

  if (current.trim()) {
    parts.push(current.trim());
  }

  return parts;
};

const combineSelectors = (parent: string, child: string) => {
  if (!parent) {
    return child;
  }
  if (!child) {
    return parent;
  }

  const parents = splitSelectorList(parent);
  const children = splitSelectorList(child);
  const combined: string[] = [];

  for (const parentSelector of parents) {
    for (const childSelector of children) {
      combined.push(
        childSelector.includes('&')
          ? childSelector.replace(/&/g, parentSelector)
          : `${parentSelector} ${childSelector}`
      );
    }
  }

  return combined.join(', ');
};

const compileStylusFallback = (
  source: string
): { css: string; warnings: string[] } => {
  const warnings: string[] = [];
  const variables = new Map<string, string>();
  const root: CssBlock = { selector: '', declarations: [], children: [] };
  const stack: Array<{ indent: number; block: CssBlock }> = [
    { indent: -1, block: root },
  ];

  const withoutBlockComments = source.replace(/\/\*[\s\S]*?\*\//g, (match) =>
    '\n'.repeat((match.match(/\n/g) ?? []).length)
  );
  const lines = withoutBlockComments.replace(/\r\n?/g, '\n').split('\n');

  for (let index = 0; index < lines.length; index += 1) {
    const rawLine = lines[index] ?? '';
    const line = stripLineComment(rawLine);
    const content = line.trim();

    if (!content) {
      continue;
    }

    const indent = countIndent(line);

    while (stack.length > 1) {
      const top = stack[stack.length - 1];
      if (!top || indent > top.indent) {
        break;
      }
      stack.pop();
    }

    const parent = stack[stack.length - 1]?.block ?? root;

    const assignment = content.match(/^\$?([\w-]+)\s*=\s*(.+)$/);
    if (assignment?.[1] && assignment[2]) {
      variables.set(assignment[1], assignment[2].trim());
      continue;
    }

    if (content.startsWith('@')) {
      if (
        /^@(media|supports|container|layer|keyframes|font-face|page)\b/.test(
          content
        )
      ) {
        const block: CssBlock = {
          selector: content,
          declarations: [],
          children: [],
        };
        parent.children.push(block);
        stack.push({ indent, block });
      } else {
        warnings.push(
          `Line ${index + 1}: "${content.split(/\s+/)[0]}" is not supported by the fallback compiler.`
        );
      }
      continue;
    }

    if (content.includes('{') || content.includes('}')) {
      warnings.push(
        `Line ${index + 1}: brace syntax is not supported by the fallback compiler.`
      );
      continue;
    }

    if (/^[.#]?[\w-]+\([^)]*\)\s*$/.test(content)) {
      warnings.push(
        `Line ${index + 1}: mixin or function calls are not supported by the fallback compiler.`
      );
      continue;
    }

    const startsWithSelectorToken =
      /^[&#.[:*>+~]/.test(content) ||
      content.includes(':hover') ||
      content.includes('::');

    const colonProperty = content.match(/^([-\w]+)\s*:\s*(.+)$/);
    const bareProperty = content.match(/^([-\w]+)\s+(.+)$/);
    const propertyName = colonProperty?.[1] ?? bareProperty?.[1];
    const propertyValue = colonProperty?.[2] ?? bareProperty?.[2];

    const looksLikeProperty =
      Boolean(propertyName && propertyValue) &&
      !startsWithSelectorToken &&
      (isKnownProperty(propertyName ?? '') ||
        Boolean(colonProperty && /:\s/.test(content)));

    if (looksLikeProperty && propertyName && propertyValue) {
      if (parent === root) {
        warnings.push(
          `Line ${index + 1}: a declaration outside a selector was skipped.`
        );
        continue;
      }
      const value = propertyValue
        .trim()
        .replace(/\$([\w-]+)/g, (match, name: string) => {
          return variables.get(name) ?? match;
        });
      parent.declarations.push({ name: propertyName, value });
      continue;
    }

    if (content.startsWith('@')) {
      continue;
    }

    const block: CssBlock = {
      selector: content,
      declarations: [],
      children: [],
    };
    parent.children.push(block);
    stack.push({ indent, block });
  }

  const renderBlock = (
    block: CssBlock,
    parentSelector: string,
    depth: number
  ): string => {
    const indent = '  '.repeat(depth);

    if (block.selector.startsWith('@')) {
      const lines = [`${indent}${block.selector} {`];
      const isMedia = /^@(media|supports|container|layer)\b/.test(
        block.selector
      );

      if (block.declarations.length > 0) {
        if (isMedia && parentSelector) {
          lines.push(`${indent}  ${parentSelector} {`);
          for (const declaration of block.declarations) {
            lines.push(
              `${indent}    ${declaration.name}: ${declaration.value};`
            );
          }
          lines.push(`${indent}  }`);
        } else {
          for (const declaration of block.declarations) {
            lines.push(`${indent}  ${declaration.name}: ${declaration.value};`);
          }
        }
      }

      const nestedParent = isMedia ? parentSelector : '';
      for (const child of block.children) {
        lines.push(renderBlock(child, nestedParent, depth + 1));
      }
      lines.push(`${indent}}`);
      return lines.join('\n');
    }

    const selector = combineSelectors(parentSelector, block.selector);
    const parts: string[] = [];
    const lines = [`${indent}${selector} {`];
    for (const declaration of block.declarations) {
      lines.push(`${indent}  ${declaration.name}: ${declaration.value};`);
    }
    lines.push(`${indent}}`);
    parts.push(lines.join('\n'));

    for (const child of block.children) {
      parts.push(renderBlock(child, selector, depth));
    }

    return parts.join('\n\n');
  };

  const css = root.children
    .map((block) => renderBlock(block, '', 0))
    .filter(Boolean)
    .join('\n\n');

  return { css, warnings };
};

export default function StylusCompilerTool() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const compile = async () => {
    if (!input.trim()) {
      setOutput('');
      setError('Paste some Stylus to compile.');
      setNotice(null);
      setWarnings([]);
      return;
    }

    setBusy(true);
    setError(null);
    setNotice(null);
    setWarnings([]);

    let stylus: StylusExport | null = null;

    try {
      const specifier = 'stylus';
      const stylusModule = (await import(
        /* webpackIgnore: true */ /* turbopackIgnore: true */ specifier
      )) as { default?: StylusExport } & StylusExport;
      const candidate = (stylusModule.default ?? stylusModule) as StylusExport;
      if (typeof candidate?.render === 'function') {
        stylus = candidate;
      }
    } catch {
      stylus = null;
    }

    if (stylus) {
      try {
        const css = await new Promise<string>((resolve, reject) => {
          stylus.render(input, {}, (renderError, result) => {
            if (renderError) {
              reject(renderError);
            } else {
              resolve(result ?? '');
            }
          });
        });
        setOutput(css);
        setBusy(false);
        return;
      } catch (compileError) {
        const stylusError = compileError as StylusError;
        const location =
          typeof stylusError.lineno === 'number'
            ? ` (line ${stylusError.lineno}${
                typeof stylusError.column === 'number'
                  ? `, column ${stylusError.column + 1}`
                  : ''
              })`
            : '';
        setOutput('');
        setError(
          `${stylusError.message ?? errorMessage(compileError)}${location}`
        );
        setBusy(false);
        return;
      }
    }

    try {
      const fallback = compileStylusFallback(input);
      if (!fallback.css.trim()) {
        setOutput('');
        setError(
          'The fallback compiler could not find any selectors or declarations.'
        );
      } else {
        setOutput(fallback.css);
        setNotice(
          'The full Stylus compiler is not available in this static browser build. A basic indentation-to-CSS fallback was used instead.'
        );
        setWarnings(fallback.warnings);
      }
    } catch (fallbackError) {
      setOutput('');
      setError(errorMessage(fallbackError));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ToolLayout>
      <Panel
        description="Compile indentation-based Stylus syntax to CSS. If the full compiler cannot load in this environment, a built-in fallback handles common selectors, nesting, variables, and properties."
        title="Stylus input"
      >
        <Field
          hint={`${input.length.toLocaleString()} characters`}
          label="Stylus"
        >
          <Textarea
            aria-label="Stylus source"
            className="min-h-[340px]"
            onChange={(event) => {
              setInput(event.target.value);
              setError(null);
              setNotice(null);
            }}
            placeholder={EXAMPLE}
            value={input}
          />
        </Field>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button disabled={busy} onClick={compile} variant="primary">
            {busy && <Spinner className="h-3.5 w-3.5" />}
            Compile Stylus
          </Button>
          <Button onClick={() => setInput(EXAMPLE)}>Load example</Button>
          <Button
            onClick={() => {
              setInput('');
              setOutput('');
              setError(null);
              setNotice(null);
              setWarnings([]);
            }}
            variant="ghost"
          >
            Clear
          </Button>
        </div>

        {error && (
          <Callout
            className="mt-3"
            title="Stylus compile error"
            variant="error"
          >
            <span className="whitespace-pre-wrap">{error}</span>
          </Callout>
        )}

        {notice && (
          <Callout className="mt-3" title="Fallback compiler" variant="warning">
            <p>{notice}</p>
            {warnings.length > 0 && (
              <ul className="mt-2 list-disc space-y-1 pl-4">
                {warnings.slice(0, 8).map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
                {warnings.length > 8 && (
                  <li>{warnings.length - 8} more warning(s) not shown.</li>
                )}
              </ul>
            )}
            <p className="mt-2">
              The fallback supports nesting, <code>&amp;</code> parent
              references, variables, <code>@media</code>, and standard property
              syntax, but not mixins, functions, or brace syntax.
            </p>
          </Callout>
        )}
      </Panel>

      <ResultPanel
        emptyText="Compiled CSS will appear here."
        filename="styles.css"
        label="CSS output"
        mime="text/css;charset=utf-8"
        value={output}
      />
    </ToolLayout>
  );
}
