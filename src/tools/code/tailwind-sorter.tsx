'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { Field } from '@/components/ui/Field';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { Textarea } from '@/components/ui/Textarea';
import { ToolLayout } from '@/components/ui/ToolLayout';

import { pluralize } from './_shared';

const EXAMPLE = `hover:bg-blue-600 p-4 flex items-center gap-2 text-sm font-semibold text-white bg-blue-500 rounded-lg shadow-sm w-full max-w-md sm:px-6 dark:bg-blue-700 focus:outline-none focus:ring-2 md:grid md:grid-cols-2 h-[calc(100%-2rem)]`;

const DISPLAY_VALUES = new Set([
  'block',
  'contents',
  'flex',
  'flow-root',
  'grid',
  'hidden',
  'inline',
  'inline-block',
  'inline-flex',
  'inline-grid',
  'inline-table',
  'list-item',
  'table',
  'table-caption',
  'table-cell',
  'table-column',
  'table-column-group',
  'table-footer-group',
  'table-header-group',
  'table-row',
  'table-row-group',
]);

const TYPOGRAPHY_VALUES = new Set([
  'capitalize',
  'line-through',
  'lowercase',
  'no-underline',
  'normal-case',
  'ordinal',
  'overline',
  'slashed-zero',
  'truncate',
  'underline',
  'uppercase',
  'antialiased',
  'subpixel-antialiased',
  'italic',
  'not-italic',
]);

const hasPrefix = (base: string, prefix: string) =>
  base === prefix || base.startsWith(`${prefix}-`);

const GROUP_MATCHERS: Array<(base: string) => boolean> = [
  // Layout and display
  (base) =>
    base === 'container' ||
    base === 'sr-only' ||
    base === 'not-sr-only' ||
    DISPLAY_VALUES.has(base),
  // Position and stacking
  (base) =>
    /^(static|fixed|absolute|relative|sticky)$/.test(base) ||
    hasPrefix(base, 'inset') ||
    /^(top|right|bottom|left|start|end)$/.test(base) ||
    /^(top|right|bottom|left|start|end)-/.test(base) ||
    hasPrefix(base, 'z') ||
    hasPrefix(base, 'order'),
  // Flexbox and grid
  (base) =>
    hasPrefix(base, 'flex') ||
    hasPrefix(base, 'grid') ||
    hasPrefix(base, 'col') ||
    hasPrefix(base, 'row') ||
    hasPrefix(base, 'gap') ||
    hasPrefix(base, 'justify') ||
    hasPrefix(base, 'items') ||
    hasPrefix(base, 'content') ||
    hasPrefix(base, 'self') ||
    hasPrefix(base, 'place') ||
    hasPrefix(base, 'space'),
  // Spacing
  (base) =>
    /^(p|px|py|pt|pr|pb|pl|ps|pe|m|mx|my|mt|mr|mb|ml|ms|me)-/.test(base),
  // Sizing
  (base) =>
    hasPrefix(base, 'w') ||
    hasPrefix(base, 'h') ||
    hasPrefix(base, 'size') ||
    hasPrefix(base, 'min-w') ||
    hasPrefix(base, 'max-w') ||
    hasPrefix(base, 'min-h') ||
    hasPrefix(base, 'max-h') ||
    hasPrefix(base, 'aspect'),
  // Typography
  (base) =>
    hasPrefix(base, 'font') ||
    hasPrefix(base, 'text') ||
    hasPrefix(base, 'leading') ||
    hasPrefix(base, 'tracking') ||
    hasPrefix(base, 'list') ||
    hasPrefix(base, 'placeholder') ||
    hasPrefix(base, 'align') ||
    hasPrefix(base, 'whitespace') ||
    hasPrefix(base, 'break') ||
    hasPrefix(base, 'hyphens') ||
    hasPrefix(base, 'indent') ||
    hasPrefix(base, 'line-clamp') ||
    hasPrefix(base, 'decoration') ||
    hasPrefix(base, 'underline-offset') ||
    TYPOGRAPHY_VALUES.has(base),
  // Backgrounds and gradients
  (base) =>
    (hasPrefix(base, 'bg') && !hasPrefix(base, 'bg-blend')) ||
    hasPrefix(base, 'from') ||
    hasPrefix(base, 'via') ||
    hasPrefix(base, 'to'),
  // Borders
  (base) =>
    hasPrefix(base, 'rounded') ||
    hasPrefix(base, 'border') ||
    hasPrefix(base, 'divide') ||
    hasPrefix(base, 'outline') ||
    hasPrefix(base, 'ring'),
  // Effects
  (base) =>
    hasPrefix(base, 'shadow') ||
    hasPrefix(base, 'opacity') ||
    hasPrefix(base, 'mix-blend') ||
    hasPrefix(base, 'bg-blend'),
  // Filters and backdrop filters
  (base) =>
    hasPrefix(base, 'blur') ||
    hasPrefix(base, 'brightness') ||
    hasPrefix(base, 'contrast') ||
    hasPrefix(base, 'drop-shadow') ||
    base === 'grayscale' ||
    hasPrefix(base, 'grayscale') ||
    hasPrefix(base, 'hue-rotate') ||
    base === 'invert' ||
    hasPrefix(base, 'invert') ||
    hasPrefix(base, 'saturate') ||
    base === 'sepia' ||
    hasPrefix(base, 'sepia') ||
    hasPrefix(base, 'backdrop'),
  // Tables
  (base) =>
    base === 'border-collapse' ||
    base === 'border-separate' ||
    hasPrefix(base, 'table') ||
    hasPrefix(base, 'caption'),
  // Transitions and animation
  (base) =>
    hasPrefix(base, 'transition') ||
    hasPrefix(base, 'duration') ||
    hasPrefix(base, 'ease') ||
    hasPrefix(base, 'delay') ||
    hasPrefix(base, 'animate'),
  // Transforms
  (base) =>
    hasPrefix(base, 'scale') ||
    hasPrefix(base, 'rotate') ||
    hasPrefix(base, 'translate') ||
    hasPrefix(base, 'skew') ||
    hasPrefix(base, 'origin') ||
    base === 'transform' ||
    hasPrefix(base, 'transform'),
  // Interactivity
  (base) =>
    hasPrefix(base, 'accent') ||
    hasPrefix(base, 'appearance') ||
    hasPrefix(base, 'cursor') ||
    hasPrefix(base, 'caret') ||
    hasPrefix(base, 'pointer-events') ||
    hasPrefix(base, 'resize') ||
    hasPrefix(base, 'scroll') ||
    hasPrefix(base, 'snap') ||
    hasPrefix(base, 'touch') ||
    hasPrefix(base, 'select') ||
    hasPrefix(base, 'will-change'),
  // SVG
  (base) => hasPrefix(base, 'fill') || hasPrefix(base, 'stroke'),
  // Accessibility
  (base) => hasPrefix(base, 'forced-color-adjust'),
];

const RESPONSIVE_VARIANTS = ['sm', 'md', 'lg', 'xl', '2xl'] as const;

const STATE_VARIANT_ORDER = [
  'first',
  'last',
  'only',
  'odd',
  'even',
  'first-of-type',
  'last-of-type',
  'only-of-type',
  'visited',
  'target',
  'open',
  'default',
  'checked',
  'indeterminate',
  'placeholder-shown',
  'autofill',
  'optional',
  'required',
  'valid',
  'invalid',
  'in-range',
  'out-of-range',
  'read-only',
  'empty',
  'focus-within',
  'hover',
  'focus',
  'focus-visible',
  'active',
  'enabled',
  'disabled',
  'group-hover',
  'group-focus',
  'peer-hover',
  'peer-focus',
  'peer-checked',
] as const;

const responsiveVariantIndex = (variant: string) => {
  const direct = RESPONSIVE_VARIANTS.indexOf(
    variant as (typeof RESPONSIVE_VARIANTS)[number]
  );
  if (direct !== -1) {
    return direct;
  }
  const ranged = variant.match(/^(?:max|min)-(sm|md|lg|xl|2xl)$/);
  return ranged?.[1]
    ? RESPONSIVE_VARIANTS.indexOf(
        ranged[1] as (typeof RESPONSIVE_VARIANTS)[number]
      )
    : -1;
};

const responsiveOrder = (variants: string[]) => {
  let order = -1;
  for (const variant of variants) {
    const index = responsiveVariantIndex(variant);
    if (index !== -1) {
      order = Math.max(order, index);
    }
  }
  return order;
};

const stateOrder = (variants: string[]) => {
  let order = 100;
  for (const variant of variants) {
    const index = STATE_VARIANT_ORDER.indexOf(
      variant as (typeof STATE_VARIANT_ORDER)[number]
    );
    if (index !== -1) {
      order = Math.min(order, index);
    }
  }
  return order;
};

const splitVariants = (token: string) => {
  const parts: string[] = [];
  let current = '';
  let depth = 0;
  let quote: string | null = null;

  for (let index = 0; index < token.length; index += 1) {
    const character = token[index];

    if (quote) {
      current += character;
      if (character === '\\') {
        const next = token[index + 1];
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

    if (character === '[' || character === '(') {
      depth += 1;
    } else if (character === ']' || character === ')') {
      depth = Math.max(0, depth - 1);
    }

    if (character === ':' && depth === 0) {
      if (current) {
        parts.push(current);
      }
      current = '';
    } else {
      current += character;
    }
  }

  if (current) {
    parts.push(current);
  }

  return { base: parts.pop() ?? '', variants: parts };
};

const splitClassList = (input: string) => {
  const tokens: string[] = [];
  let current = '';
  let depth = 0;
  let quote: string | null = null;

  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];

    if (quote) {
      current += character;
      if (character === '\\') {
        const next = input[index + 1];
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

    if (character === '[' || character === '(') {
      depth += 1;
    } else if (character === ']' || character === ')') {
      depth = Math.max(0, depth - 1);
    }

    if (/\s/.test(character ?? '') && depth === 0) {
      if (current) {
        tokens.push(current);
      }
      current = '';
    } else {
      current += character;
    }
  }

  if (current) {
    tokens.push(current);
  }

  return tokens;
};

const matchableBase = (base: string) =>
  base.replace(/^!/, '').replace(/!$/, '').replace(/^-/, '');

const groupRank = (base: string) => {
  const normalized = matchableBase(base);
  for (let index = 0; index < GROUP_MATCHERS.length; index += 1) {
    if (GROUP_MATCHERS[index]?.(normalized)) {
      return index;
    }
  }
  return GROUP_MATCHERS.length;
};

const variantRank = (variants: string[]) => {
  if (variants.length === 0) {
    return 0;
  }
  if (variants.some((variant) => responsiveVariantIndex(variant) !== -1)) {
    return 3;
  }
  if (
    variants.some((variant) => /^(dark|motion|print|contrast)/.test(variant))
  ) {
    return 2;
  }
  return 1;
};

type SortedToken = {
  token: string;
  base: string;
  variants: string[];
  variantRank: number;
  variantOrder: number;
  groupRank: number;
  index: number;
};

const sortClasses = (
  input: string,
  options: { removeDuplicates: boolean; onePerLine: boolean }
) => {
  const tokens = splitClassList(input);
  const seen = new Set<string>();
  const unique: string[] = [];
  let duplicates = 0;

  for (const token of tokens) {
    if (seen.has(token)) {
      duplicates += 1;
      if (options.removeDuplicates) {
        continue;
      }
    }
    seen.add(token);
    unique.push(token);
  }

  const decorated: SortedToken[] = unique.map((token, index) => {
    const { base, variants } = splitVariants(token);
    const resolvedVariantRank = variantRank(variants);
    return {
      token,
      base,
      variants,
      variantRank: resolvedVariantRank,
      variantOrder:
        resolvedVariantRank === 3
          ? responsiveOrder(variants)
          : resolvedVariantRank === 1
            ? stateOrder(variants)
            : 0,
      groupRank: groupRank(base),
      index,
    };
  });

  decorated.sort((left, right) => {
    if (left.variantRank !== right.variantRank) {
      return left.variantRank - right.variantRank;
    }

    if (left.variantOrder !== right.variantOrder) {
      return left.variantOrder - right.variantOrder;
    }

    if (left.groupRank !== right.groupRank) {
      return left.groupRank - right.groupRank;
    }

    const leftVariants = left.variants.join(':');
    const rightVariants = right.variants.join(':');
    if (leftVariants !== rightVariants) {
      return leftVariants < rightVariants ? -1 : 1;
    }

    const leftBase = matchableBase(left.base).toLowerCase();
    const rightBase = matchableBase(right.base).toLowerCase();
    if (leftBase !== rightBase) {
      return leftBase < rightBase ? -1 : 1;
    }

    return left.index - right.index;
  });

  return {
    count: tokens.length,
    duplicates,
    output: options.onePerLine
      ? decorated.map((entry) => entry.token).join('\n')
      : decorated.map((entry) => entry.token).join(' '),
    variantCount: new Set(decorated.flatMap((entry) => entry.variants)).size,
  };
};

export default function TailwindSorterTool() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [duplicates, setDuplicates] = useState(0);
  const [variantCount, setVariantCount] = useState(0);
  const [removeDuplicates, setRemoveDuplicates] = useState(true);
  const [onePerLine, setOnePerLine] = useState(false);

  const sort = () => {
    if (!input.trim()) {
      setOutput('');
      setError('Paste a Tailwind class list to sort.');
      setDuplicates(0);
      setVariantCount(0);
      return;
    }

    try {
      const result = sortClasses(input, { removeDuplicates, onePerLine });
      setOutput(result.output);
      setDuplicates(result.duplicates);
      setVariantCount(result.variantCount);
      setError(null);
    } catch {
      setOutput('');
      setError('The class list could not be parsed.');
    }
  };

  return (
    <ToolLayout>
      <Panel
        description="Sort utilities by layout, spacing, sizing, typography, colors, effects, states and responsive variants. Arbitrary values and variants are preserved."
        title="Class list"
      >
        <Field
          hint={`${splitClassList(input).length.toLocaleString()} classes`}
          label="Tailwind classes"
        >
          <Textarea
            aria-label="Tailwind class list"
            className="min-h-[300px]"
            onChange={(event) => {
              setInput(event.target.value);
              setError(null);
            }}
            onKeyDown={(event) => {
              if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                event.preventDefault();
                sort();
              }
            }}
            placeholder={EXAMPLE}
            value={input}
          />
        </Field>

        <div className="mt-3 flex flex-wrap items-center gap-4">
          <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-fg-muted">
            <input
              checked={removeDuplicates}
              className="h-3.5 w-3.5 cursor-pointer"
              onChange={(event) => setRemoveDuplicates(event.target.checked)}
              style={{ accentColor: 'var(--accent)' }}
              type="checkbox"
            />
            Remove duplicates
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-fg-muted">
            <input
              checked={onePerLine}
              className="h-3.5 w-3.5 cursor-pointer"
              onChange={(event) => setOnePerLine(event.target.checked)}
              style={{ accentColor: 'var(--accent)' }}
              type="checkbox"
            />
            One class per line
          </label>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button onClick={sort} variant="primary">
            Sort classes
          </Button>
          <Button onClick={() => setInput(EXAMPLE)}>Load example</Button>
          <Button
            onClick={() => {
              setInput('');
              setOutput('');
              setError(null);
              setDuplicates(0);
              setVariantCount(0);
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

        {duplicates > 0 && (
          <Callout className="mt-3" variant="info">
            Found {pluralize(duplicates, 'duplicate')}
            {removeDuplicates ? ' and removed them.' : ' in the input.'}
            {variantCount > 0 && ` ${pluralize(variantCount, 'variant')} used.`}
          </Callout>
        )}
      </Panel>

      <ResultPanel
        emptyText="Sorted classes will appear here."
        filename="classes.txt"
        label="Sorted classes"
        value={output}
      />
    </ToolLayout>
  );
}
