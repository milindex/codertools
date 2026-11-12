'use client';

import { useMemo, useState } from 'react';

import { Callout } from '@/components/ui/Callout';
import { Field } from '@/components/ui/Field';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { Textarea } from '@/components/ui/Textarea';

import { Checkbox } from './ui';

const NAMED_CHARACTERS: Record<number, string> = {
  0: 'NULL',
  7: 'BELL',
  8: 'BACKSPACE',
  9: 'CHARACTER TABULATION',
  10: 'LINE FEED',
  11: 'LINE TABULATION',
  12: 'FORM FEED',
  13: 'CARRIAGE RETURN',
  27: 'ESCAPE',
  32: 'SPACE',
  127: 'DELETE',
  160: 'NO-BREAK SPACE',
  0x200b: 'ZERO WIDTH SPACE',
  0x200c: 'ZERO WIDTH NON-JOINER',
  0x200d: 'ZERO WIDTH JOINER',
  0xfeff: 'ZERO WIDTH NO-BREAK SPACE',
};

const CATEGORY_RULES: Array<[RegExp, string]> = [
  [/\p{Extended_Pictographic}/u, 'Emoji / pictograph'],
  [/\p{Lu}/u, 'Letter, uppercase'],
  [/\p{Ll}/u, 'Letter, lowercase'],
  [/\p{Lt}/u, 'Letter, titlecase'],
  [/\p{Lm}/u, 'Letter, modifier'],
  [/\p{Lo}/u, 'Letter, other'],
  [/\p{Mn}/u, 'Mark, nonspacing'],
  [/\p{Mc}/u, 'Mark, spacing combining'],
  [/\p{Me}/u, 'Mark, enclosing'],
  [/\p{Nd}/u, 'Number, decimal digit'],
  [/\p{Nl}/u, 'Number, letter'],
  [/\p{No}/u, 'Number, other'],
  [/\p{Pc}/u, 'Punctuation, connector'],
  [/\p{Pd}/u, 'Punctuation, dash'],
  [/\p{Ps}/u, 'Punctuation, open'],
  [/\p{Pe}/u, 'Punctuation, close'],
  [/\p{Pi}/u, 'Punctuation, initial quote'],
  [/\p{Pf}/u, 'Punctuation, final quote'],
  [/\p{Po}/u, 'Punctuation, other'],
  [/\p{Sm}/u, 'Symbol, math'],
  [/\p{Sc}/u, 'Symbol, currency'],
  [/\p{Sk}/u, 'Symbol, modifier'],
  [/\p{So}/u, 'Symbol, other'],
  [/\p{Zs}/u, 'Separator, space'],
  [/\p{Zl}/u, 'Separator, line'],
  [/\p{Zp}/u, 'Separator, paragraph'],
  [/\p{Cc}/u, 'Control'],
  [/\p{Cf}/u, 'Format'],
  [/\p{Cs}/u, 'Surrogate'],
  [/\p{Co}/u, 'Private use'],
  [/\p{Cn}/u, 'Unassigned'],
];

const categoryFor = (character: string): string => {
  for (const [pattern, label] of CATEGORY_RULES) {
    if (pattern.test(character)) {
      return label;
    }
  }
  return 'Unknown';
};

const displayCharacter = (character: string, codePoint: number): string => {
  if (codePoint === 9) return '\\t';
  if (codePoint === 10) return '\\n';
  if (codePoint === 13) return '\\r';
  if (codePoint === 32) return '␠';
  if (codePoint === 0xa0) return '⍽';
  if (codePoint === 0) return '\\0';
  if (codePoint === 127) return 'DEL';
  if (codePoint < 32) {
    return `\\x${codePoint.toString(16).toUpperCase().padStart(2, '0')}`;
  }
  if (codePoint === 0x200b || codePoint === 0x200c || codePoint === 0x200d) {
    return codePoint === 0x200b
      ? 'ZWSP'
      : codePoint === 0x200c
        ? 'ZWNJ'
        : 'ZWJ';
  }
  if (codePoint === 0xfeff) {
    return 'BOM';
  }
  if (categoryFor(character).startsWith('Mark')) {
    return `◌${character}`;
  }
  return character;
};

const bytesToHex = (bytes: Uint8Array): string =>
  Array.from(bytes)
    .map((byte) => byte.toString(16).toUpperCase().padStart(2, '0'))
    .join(' ');

const codeUnitsToHex = (character: string): string => {
  const units: string[] = [];
  for (let index = 0; index < character.length; index += 1) {
    units.push(
      character.charCodeAt(index).toString(16).toUpperCase().padStart(4, '0')
    );
  }
  return units.join(' ');
};

const buildGraphemeIndex = (text: string) => {
  const indexByCodePoint = new Map<number, number>();
  let count = 0;

  if (typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function') {
    const segmenter = new Intl.Segmenter(undefined, {
      granularity: 'grapheme',
    });
    let codePointIndex = 0;

    for (const segment of segmenter.segment(text)) {
      count += 1;
      for (const _character of segment.segment) {
        indexByCodePoint.set(codePointIndex, count);
        codePointIndex += 1;
      }
    }

    return { indexByCodePoint, count };
  }

  for (const _character of text) {
    count += 1;
    indexByCodePoint.set(count - 1, count);
  }

  return { indexByCodePoint, count };
};

type Entry = {
  character: string;
  codePoint: number;
  codePointLabel: string;
  name: string;
  display: string;
  utf8: string;
  utf16: string;
  grapheme: number;
};

export default function UnicodeInspector() {
  const [input, setInput] = useState('');
  const [uniqueOnly, setUniqueOnly] = useState(false);

  const result = useMemo(() => {
    const characters = Array.from(input);
    const { indexByCodePoint, count: graphemeCount } =
      buildGraphemeIndex(input);

    const entries: Entry[] = characters.map((character, index) => {
      const codePoint = character.codePointAt(0) ?? 0;
      const category = categoryFor(character);

      return {
        character,
        codePoint,
        codePointLabel: `U+${codePoint
          .toString(16)
          .toUpperCase()
          .padStart(4, '0')}`,
        name: NAMED_CHARACTERS[codePoint] ?? category,
        display: displayCharacter(character, codePoint),
        utf8: bytesToHex(new TextEncoder().encode(character)),
        utf16: codeUnitsToHex(character),
        grapheme: indexByCodePoint.get(index) ?? 0,
      };
    });

    const seen = new Set<number>();
    const filtered = uniqueOnly
      ? entries.filter((entry) => {
          if (seen.has(entry.codePoint)) {
            return false;
          }
          seen.add(entry.codePoint);
          return true;
        })
      : entries;

    const truncated = filtered.length > 500;

    return {
      entries: filtered.slice(0, 500),
      totalCodePoints: characters.length,
      graphemeCount,
      uniqueCount: new Set(entries.map((entry) => entry.codePoint)).size,
      truncated,
    };
  }, [input, uniqueOnly]);

  const report = result.entries
    .map(
      (entry) =>
        `${entry.display}\t${entry.codePointLabel}\t${entry.name}\tUTF-8: ${entry.utf8}\tUTF-16: ${entry.utf16}`
    )
    .join('\n');

  return (
    <div className="space-y-6">
      <Panel title="Input">
        <Field
          hint={`${result.totalCodePoints.toLocaleString()} code points`}
          label="Text"
        >
          <Textarea
            className="min-h-[180px]"
            onChange={(event) => setInput(event.target.value)}
            placeholder="Paste text to inspect its characters…"
            value={input}
          />
        </Field>

        <div className="mt-3">
          <Checkbox
            checked={uniqueOnly}
            label="Show unique code points only"
            onChange={setUniqueOnly}
          />
        </div>
      </Panel>

      <ResultPanel
        emptyText="Enter text to inspect its Unicode characters."
        filename="unicode-inspection.txt"
        label="Characters"
        value={report}
      >
        {input ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div className="rounded-md border border-border bg-canvas-subtle/40 px-3 py-2">
                <p className="text-[11px] uppercase tracking-wide text-fg-muted">
                  Code points
                </p>
                <p className="text-base font-semibold tabular-nums text-fg">
                  {result.totalCodePoints.toLocaleString()}
                </p>
              </div>
              <div className="rounded-md border border-border bg-canvas-subtle/40 px-3 py-2">
                <p className="text-[11px] uppercase tracking-wide text-fg-muted">
                  Graphemes
                </p>
                <p className="text-base font-semibold tabular-nums text-fg">
                  {result.graphemeCount.toLocaleString()}
                </p>
              </div>
              <div className="rounded-md border border-border bg-canvas-subtle/40 px-3 py-2">
                <p className="text-[11px] uppercase tracking-wide text-fg-muted">
                  Unique
                </p>
                <p className="text-base font-semibold tabular-nums text-fg">
                  {result.uniqueCount.toLocaleString()}
                </p>
              </div>
              <div className="rounded-md border border-border bg-canvas-subtle/40 px-3 py-2">
                <p className="text-[11px] uppercase tracking-wide text-fg-muted">
                  UTF-16 units
                </p>
                <p className="text-base font-semibold tabular-nums text-fg">
                  {input.length.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="overflow-auto rounded-md border border-border">
              <table className="w-full min-w-[760px] border-collapse text-left text-xs">
                <thead className="bg-canvas-subtle text-[11px] uppercase tracking-wide text-fg-muted">
                  <tr>
                    <th className="px-2.5 py-2 font-semibold">Char</th>
                    <th className="px-2.5 py-2 font-semibold">Code point</th>
                    <th className="px-2.5 py-2 font-semibold">
                      Name / category
                    </th>
                    <th className="px-2.5 py-2 font-semibold">UTF-8</th>
                    <th className="px-2.5 py-2 font-semibold">UTF-16</th>
                    <th className="px-2.5 py-2 font-semibold">Grapheme</th>
                  </tr>
                </thead>
                <tbody>
                  {result.entries.map((entry, index) => (
                    <tr
                      className="border-t border-border align-top"
                      key={`${entry.codePoint}-${index}`}
                    >
                      <td className="px-2.5 py-2 font-mono text-base text-fg">
                        {entry.display}
                      </td>
                      <td className="px-2.5 py-2 font-mono text-fg">
                        {entry.codePointLabel}
                      </td>
                      <td className="px-2.5 py-2 text-fg-muted">
                        {entry.name}
                      </td>
                      <td className="px-2.5 py-2 font-mono text-fg-muted">
                        {entry.utf8}
                      </td>
                      <td className="px-2.5 py-2 font-mono text-fg-muted">
                        {entry.utf16}
                      </td>
                      <td className="px-2.5 py-2 tabular-nums text-fg-muted">
                        {entry.grapheme}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {result.truncated ? (
              <Callout variant="warning">
                Showing the first 500 code points. Select “unique only” or use a
                shorter input to inspect a smaller set.
              </Callout>
            ) : null}

            <p className="text-[11px] leading-5 text-fg-subtle">
              Browsers do not expose the full Unicode name database. Named
              controls and whitespace are listed explicitly; other characters
              show their Unicode general category. Grapheme clusters are
              measured with Intl.Segmenter where available.
            </p>
          </div>
        ) : undefined}
      </ResultPanel>
    </div>
  );
}
