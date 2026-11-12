'use client';

import { useMemo, useState } from 'react';

import { Field } from '@/components/ui/Field';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { ToolLayout } from '@/components/ui/ToolLayout';

const MODES = [
  { value: 'camel', label: 'camelCase' },
  { value: 'pascal', label: 'PascalCase' },
  { value: 'snake', label: 'snake_case' },
  { value: 'kebab', label: 'kebab-case' },
  { value: 'constant', label: 'CONSTANT_CASE' },
  { value: 'title', label: 'Title Case' },
  { value: 'sentence', label: 'Sentence case' },
  { value: 'lower', label: 'lowercase' },
  { value: 'upper', label: 'UPPERCASE' },
] as const;

type CaseMode = (typeof MODES)[number]['value'];

const splitWords = (value: string): string[] => {
  const normalised = value
    .replace(/([\p{Ll}\p{N}])(\p{Lu})/gu, '$1 $2')
    .replace(/(\p{Lu}+)(\p{Lu}\p{Ll})/gu, '$1 $2')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();

  if (!normalised) {
    return [];
  }

  return normalised.split(/\s+/u).filter(Boolean);
};

const capitalise = (word: string): string =>
  word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();

const convert = (input: string, mode: CaseMode): string => {
  if (!input) {
    return '';
  }

  const words = splitWords(input);

  switch (mode) {
    case 'camel': {
      if (words.length === 0) {
        return '';
      }
      const [first = '', ...rest] = words;
      return first.toLowerCase() + rest.map(capitalise).join('');
    }
    case 'pascal':
      return words.map(capitalise).join('');
    case 'snake':
      return words.map((word) => word.toLowerCase()).join('_');
    case 'kebab':
      return words.map((word) => word.toLowerCase()).join('-');
    case 'constant':
      return words.map((word) => word.toUpperCase()).join('_');
    case 'title':
      return words.map(capitalise).join(' ');
    case 'sentence': {
      const lower = input.toLowerCase();
      return lower.replace(
        /(^|[.!?]\s+)(\p{L})/gu,
        (_match, prefix: string, letter: string) =>
          prefix + letter.toUpperCase()
      );
    }
    case 'lower':
      return input.toLowerCase();
    case 'upper':
      return input.toUpperCase();
    default:
      return input;
  }
};

export default function CaseConverter() {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<CaseMode>('camel');

  const output = useMemo(() => convert(input, mode), [input, mode]);
  const activeMode = MODES.find((item) => item.value === mode);

  return (
    <ToolLayout>
      <Panel title="Input">
        <Field
          hint={`${input.length.toLocaleString()} characters`}
          label="Text"
        >
          <Textarea
            onChange={(event) => setInput(event.target.value)}
            placeholder="Paste text here, e.g. “hello world example”…"
            value={input}
          />
        </Field>

        <Field
          className="mt-3"
          hint={activeMode ? activeMode.label : undefined}
          label="Convert to"
        >
          <Select
            aria-label="Target case"
            onChange={(event) => setMode(event.target.value as CaseMode)}
            value={mode}
          >
            {MODES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>

        <p className="mt-3 text-xs leading-5 text-fg-muted">
          Words are detected across spaces, hyphens, underscores, dots and
          existing camelCase boundaries.
        </p>
      </Panel>

      <ResultPanel
        filename={`case-converted-${mode}.txt`}
        label="Converted text"
        value={output}
      />
    </ToolLayout>
  );
}
