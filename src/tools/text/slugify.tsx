'use client';

import { useMemo, useState } from 'react';

import { Field } from '@/components/ui/Field';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { ToolLayout } from '@/components/ui/ToolLayout';

const TRANSLITERATION: Record<string, string> = {
  '&': ' and ',
  ß: 'ss',
  Æ: 'AE',
  æ: 'ae',
  Œ: 'OE',
  œ: 'oe',
  Ø: 'O',
  ø: 'o',
  Ł: 'L',
  ł: 'l',
  Đ: 'D',
  đ: 'd',
  Ð: 'D',
  ð: 'd',
  Þ: 'Th',
  þ: 'th',
  Ħ: 'H',
  ħ: 'h',
  ı: 'i',
  Ŋ: 'N',
  ŋ: 'n',
  ſ: 's',
  ĸ: 'k',
  Ŧ: 'T',
  ŧ: 't',
};

const SPECIAL_CHARACTERS = /[&ßÆæŒœØøŁłĐđÐðÞþĦħıŊŋſĸŦŧ]/g;

const SEPARATORS = [
  { value: '-', label: 'Hyphen ( - )' },
  { value: '_', label: 'Underscore ( _ )' },
  { value: '.', label: 'Dot ( . )' },
  { value: '~', label: 'Tilde ( ~ )' },
  { value: '', label: 'None' },
] as const;

type Separator = (typeof SEPARATORS)[number]['value'];

const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const slugify = (
  input: string,
  separator: Separator,
  lowercase: boolean,
  stripAccents: boolean
): string => {
  let value = input.replace(
    SPECIAL_CHARACTERS,
    (character) => TRANSLITERATION[character] ?? character
  );

  if (stripAccents) {
    value = value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
  }

  if (lowercase) {
    value = value.toLowerCase();
  }

  value = value.replace(/['’`]/g, '').replace(/[^\p{L}\p{N}]+/gu, separator);

  if (separator) {
    const escaped = escapeRegExp(separator);
    value = value
      .replace(new RegExp(`${escaped}{2,}`, 'g'), separator)
      .replace(new RegExp(`^${escaped}+|${escaped}+$`, 'g'), '');
  }

  return value;
};

export default function Slugify() {
  const [input, setInput] = useState('');
  const [separator, setSeparator] = useState<Separator>('-');
  const [lowercase, setLowercase] = useState(true);
  const [stripAccents, setStripAccents] = useState(true);

  const output = useMemo(
    () => slugify(input, separator, lowercase, stripAccents),
    [input, separator, lowercase, stripAccents]
  );

  return (
    <ToolLayout>
      <Panel title="Input">
        <Field
          hint={`${input.length.toLocaleString()} characters`}
          label="Text"
        >
          <Textarea
            onChange={(event) => setInput(event.target.value)}
            placeholder="e.g. Crème brûlée & déjà vu!"
            value={input}
          />
        </Field>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="Separator">
            <Select
              aria-label="Slug separator"
              onChange={(event) =>
                setSeparator(event.target.value as Separator)
              }
              value={separator}
            >
              {SEPARATORS.map((option) => (
                <option key={option.label} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Letter case">
            <Select
              aria-label="Letter case"
              onChange={(event) => setLowercase(event.target.value === 'lower')}
              value={lowercase ? 'lower' : 'preserve'}
            >
              <option value="lower">lowercase</option>
              <option value="preserve">Preserve case</option>
            </Select>
          </Field>

          <Field label="Accented characters">
            <Select
              aria-label="Accent handling"
              onChange={(event) =>
                setStripAccents(event.target.value === 'strip')
              }
              value={stripAccents ? 'strip' : 'keep'}
            >
              <option value="strip">Transliterate to ASCII</option>
              <option value="keep">Keep accents</option>
            </Select>
          </Field>
        </div>
      </Panel>

      <ResultPanel
        emptyText="Enter text to generate a URL-friendly slug."
        filename="slug.txt"
        label="Slug"
        value={output}
      />
    </ToolLayout>
  );
}
