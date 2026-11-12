'use client';

import { useMemo, useState } from 'react';
import type { AST } from 'regexpp';
import { RegExpParser } from 'regexpp';

import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';

type NodeDescription = {
  label: string;
  detail: string;
  raw: string;
  children: NodeDescription[];
};

type TreeRow = {
  label: string;
  detail: string;
  raw: string;
  depth: number;
};

const describeNode = (node: AST.Node): NodeDescription => {
  switch (node.type) {
    case 'Pattern':
      return {
        label: 'Pattern',
        detail: `${node.alternatives.length} top-level alternative${
          node.alternatives.length === 1 ? '' : 's'
        }`,
        raw: '',
        children: node.alternatives.map(describeNode),
      };

    case 'Alternative':
      return {
        label: 'Sequence',
        detail:
          node.elements.length === 0
            ? 'empty sequence'
            : `${node.elements.length} element${
                node.elements.length === 1 ? '' : 's'
              }`,
        raw: '',
        children: node.elements.map(describeNode),
      };

    case 'CapturingGroup':
      return {
        label: 'Capturing group',
        detail: node.name
          ? `named group “${node.name}”`
          : 'numbered capture group',
        raw: node.raw,
        children: node.alternatives.map(describeNode),
      };

    case 'Group':
      return {
        label: 'Non-capturing group',
        detail: 'groups elements without capturing',
        raw: node.raw,
        children: node.alternatives.map(describeNode),
      };

    case 'Quantifier':
      return {
        label: 'Quantifier',
        detail: `min ${node.min}, max ${
          node.max === Number.POSITIVE_INFINITY ? '∞' : node.max
        } · ${node.greedy ? 'greedy' : 'lazy'}`,
        raw: node.raw,
        children: [describeNode(node.element)],
      };

    case 'CharacterClass':
      return {
        label: node.negate ? 'Negated character class' : 'Character class',
        detail: `${node.elements.length} element${
          node.elements.length === 1 ? '' : 's'
        }`,
        raw: node.raw,
        children: node.elements.map(describeNode),
      };

    case 'CharacterClassRange':
      return {
        label: 'Range',
        detail: `U+${node.min.value
          .toString(16)
          .toUpperCase()
          .padStart(4, '0')} – U+${node.max.value
          .toString(16)
          .toUpperCase()
          .padStart(4, '0')}`,
        raw: node.raw,
        children: [],
      };

    case 'Character': {
      const printable =
        node.value === 32
          ? 'space'
          : node.value > 32 && node.value !== 127
            ? String.fromCodePoint(node.value)
            : '';
      return {
        label: 'Character',
        detail: `U+${node.value
          .toString(16)
          .toUpperCase()
          .padStart(4, '0')}${printable ? ` “${printable}”` : ''}`,
        raw: node.raw,
        children: [],
      };
    }

    case 'CharacterSet': {
      if (node.kind === 'any') {
        return {
          label: 'Any character',
          detail: 'matches any character (newlines only with the s flag)',
          raw: node.raw,
          children: [],
        };
      }

      if (node.kind === 'property') {
        return {
          label: 'Unicode property',
          detail: `${node.key}${node.value ? `=${node.value}` : ''}${
            node.negate ? ' (negated)' : ''
          }`,
          raw: node.raw,
          children: [],
        };
      }

      const setLabel =
        node.kind === 'digit'
          ? 'Digit'
          : node.kind === 'space'
            ? 'Whitespace'
            : 'Word character';
      const setRaw =
        node.kind === 'digit'
          ? node.negate
            ? '\\D'
            : '\\d'
          : node.kind === 'space'
            ? node.negate
              ? '\\S'
              : '\\s'
            : node.negate
              ? '\\W'
              : '\\w';

      return {
        label: setLabel,
        detail: `${setRaw}${node.negate ? ' (negated)' : ''}`,
        raw: node.raw,
        children: [],
      };
    }

    case 'Backreference':
      return {
        label: 'Backreference',
        detail: `refers to ${node.ref}`,
        raw: node.raw,
        children: [],
      };

    case 'Assertion': {
      if (node.kind === 'lookahead' || node.kind === 'lookbehind') {
        return {
          label: `${node.negate ? 'Negative' : 'Positive'} ${node.kind}`,
          detail: 'zero-width assertion',
          raw: node.raw,
          children: node.alternatives.map(describeNode),
        };
      }

      let assertionDetail: string;
      if (node.kind === 'word') {
        assertionDetail = `word boundary (${node.negate ? '\\B' : '\\b'})`;
      } else if (node.kind === 'start') {
        assertionDetail = 'start of input (or line with m flag)';
      } else {
        assertionDetail = 'end of input (or line with m flag)';
      }

      return {
        label: 'Assertion',
        detail: assertionDetail,
        raw: node.raw,
        children: [],
      };
    }

    default: {
      const unknown = node as AST.Node;
      return {
        label: unknown.type,
        detail: 'unrecognised token',
        raw: unknown.raw,
        children: [],
      };
    }
  }
};

const flatten = (node: NodeDescription, depth = 0): TreeRow[] => {
  const rows: TreeRow[] = [
    {
      label: node.label,
      detail: node.detail,
      raw: node.raw,
      depth,
    },
  ];

  for (const child of node.children) {
    rows.push(...flatten(child, depth + 1));
  }

  return rows;
};

export default function RegexExplainer() {
  const [pattern, setPattern] = useState('');
  const [flags, setFlags] = useState('g');

  const result = useMemo(() => {
    if (!pattern) {
      return { error: null as string | null, rows: [] as TreeRow[] };
    }

    try {
      const parser = new RegExpParser();
      const parsedFlags = parser.parseFlags(flags);
      const ast = parser.parsePattern(
        pattern,
        0,
        pattern.length,
        parsedFlags.unicode
      );

      return { error: null, rows: flatten(describeNode(ast)) };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Invalid regular expression.';
      const index = (error as { index?: number } | null)?.index;
      return {
        error:
          typeof index === 'number'
            ? `${message} (at index ${index})`
            : message,
        rows: [],
      };
    }
  }, [pattern, flags]);

  const text = result.rows
    .map((row) => {
      const indent = '  '.repeat(row.depth);
      const raw = row.raw ? ` ${row.raw}` : '';
      return `${indent}${row.label}${raw}${row.detail ? ` — ${row.detail}` : ''}`;
    })
    .join('\n');

  return (
    <div className="space-y-6">
      <Panel
        description="Parses the expression with regexpp and describes each token."
        title="Regular expression"
      >
        <div className="grid gap-3 md:grid-cols-[1fr_10rem]">
          <Field label="Pattern">
            <Input
              aria-label="Regular expression pattern"
              className="font-mono"
              onChange={(event) => setPattern(event.target.value)}
              placeholder={'e.g. ^([A-Z]\\w*)\\s(\\d{2,4})$'}
              spellCheck={false}
              value={pattern}
            />
          </Field>

          <Field hint="d g i m s u y" label="Flags">
            <Input
              aria-label="Regular expression flags"
              className="font-mono"
              onChange={(event) => setFlags(event.target.value)}
              placeholder="g"
              spellCheck={false}
              value={flags}
            />
          </Field>
        </div>
      </Panel>

      <ResultPanel
        emptyText="Enter a regular expression to see its token tree."
        error={result.error}
        filename="regex-explanation.txt"
        label="Token tree"
        value={text}
      >
        {pattern ? (
          <div className="overflow-hidden rounded-md border border-border bg-canvas-inset">
            {result.rows.map((row, index) => (
              <div
                className="border-b border-border/60 py-1.5 pr-3 last:border-b-0"
                key={`${row.depth}-${index}`}
                style={{ paddingLeft: `${8 + row.depth * 18}px` }}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-fg">
                    {row.label}
                  </span>
                  {row.raw ? (
                    <code className="rounded border border-border bg-canvas-subtle px-1.5 py-0.5 text-[11px] text-accent">
                      {row.raw}
                    </code>
                  ) : null}
                </div>
                <p className="mt-0.5 text-[11px] leading-5 text-fg-muted">
                  {row.detail}
                </p>
              </div>
            ))}
          </div>
        ) : undefined}
      </ResultPanel>
    </div>
  );
}
