'use client';

import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Callout } from '@/components/ui/Callout';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { ToolLayout } from '@/components/ui/ToolLayout';

import { DetailList, Examples, ReasonList, Verdict } from './shared';

const checkDigit10 = (firstNine: string): string => {
  let sum = 0;
  for (let index = 0; index < 9; index += 1) {
    sum += (10 - index) * Number(firstNine[index] ?? 0);
  }
  const check = (11 - (sum % 11)) % 11;
  return check === 10 ? 'X' : String(check);
};

const checkDigit13 = (firstTwelve: string): string => {
  let sum = 0;
  for (let index = 0; index < 12; index += 1) {
    sum += Number(firstTwelve[index] ?? 0) * (index % 2 === 0 ? 1 : 3);
  }
  return String((10 - (sum % 10)) % 10);
};

const detectGroup = (
  digits: string,
  is979 = false
): { group: string; rest: string } => {
  if (is979) {
    const two = digits.slice(0, 2);
    if (['10', '11', '12', '13'].includes(two)) {
      return { group: two, rest: digits.slice(2) };
    }
    if (digits.startsWith('8')) {
      return { group: '8', rest: digits.slice(1) };
    }
  }

  const five = digits.slice(0, 5);
  if (/^999\d{2}$/.test(five)) {
    return { group: five, rest: digits.slice(5) };
  }

  const four = digits.slice(0, 4);
  if (/^99[0-8]\d$/.test(four)) {
    return { group: four, rest: digits.slice(4) };
  }

  const three = digits.slice(0, 3);
  if (/^9[0-8]\d$/.test(three) || /^6\d{2}$/.test(three)) {
    return { group: three, rest: digits.slice(3) };
  }

  const two = digits.slice(0, 2);
  if (/^(?:8\d|9[0-4])$/.test(two)) {
    return { group: two, rest: digits.slice(2) };
  }

  if (/^[0-57]/.test(digits)) {
    return { group: digits.slice(0, 1), rest: digits.slice(1) };
  }

  return { group: digits.slice(0, 3), rest: digits.slice(3) };
};

const registrantLength = (rest: string, group: string): number => {
  const two = Number(rest.slice(0, 2));
  const three = Number(rest.slice(0, 3));
  const four = Number(rest.slice(0, 4));
  const five = Number(rest.slice(0, 5));
  const six = Number(rest.slice(0, 6));

  if (group === '1') {
    if (rest.length >= 2 && two <= 9) {
      return 2;
    }
    if (rest.length >= 3 && three >= 100 && three <= 399) {
      return 3;
    }
    if (rest.length >= 4 && four >= 4000 && four <= 5499) {
      return 4;
    }
    if (rest.length >= 5 && five >= 55000 && five <= 86979) {
      return 5;
    }
    if (rest.length >= 6 && six >= 869800 && six <= 998999) {
      return 6;
    }
    return Math.min(7, rest.length);
  }

  if (rest.length >= 2 && two <= 19) {
    return 2;
  }
  if (rest.length >= 3 && three >= 200 && three <= 699) {
    return 3;
  }
  if (rest.length >= 4 && four >= 7000 && four <= 8499) {
    return 4;
  }
  if (rest.length >= 5 && five >= 85000 && five <= 89999) {
    return 5;
  }
  if (rest.length >= 6 && six >= 900000 && six <= 949999) {
    return 6;
  }
  return Math.min(7, rest.length);
};

const hyphenate10 = (isbn10: string): string => {
  const body = isbn10.slice(0, 9);
  const { group, rest } = detectGroup(body);
  const registrant = registrantLength(rest, group);
  return [
    group,
    rest.slice(0, registrant),
    rest.slice(registrant),
    isbn10.slice(-1),
  ]
    .filter((part) => part.length > 0)
    .join('-');
};

const hyphenate13 = (isbn13: string): string => {
  const prefix = isbn13.slice(0, 3);
  const body = isbn13.slice(3, 12);
  const { group, rest } = detectGroup(body, prefix === '979');
  const registrant = registrantLength(rest, group);
  return [
    prefix,
    group,
    rest.slice(0, registrant),
    rest.slice(registrant),
    isbn13.slice(-1),
  ]
    .filter((part) => part.length > 0)
    .join('-');
};

export default function IsbnValidator() {
  const [input, setInput] = useState('');

  const analysis = useMemo(() => {
    const raw = input.trim();
    if (!raw) {
      return null;
    }

    const cleaned = raw.replace(/[-\s]/g, '').toUpperCase();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!/^[0-9Xx\s-]+$/.test(raw)) {
      errors.push(
        'An ISBN can only contain digits, hyphens, spaces and a final X (ISBN-10 only).'
      );
    }

    let kind: 'ISBN-10' | 'ISBN-13' | null = null;
    let isbn10: string | null = null;
    let isbn13: string | null = null;
    let checkProvided = '';
    let checkExpected = '';
    let hyphenated = '';
    let group = '';

    if (cleaned.length === 10) {
      kind = 'ISBN-10';
      if (!/^\d{9}[\dX]$/.test(cleaned)) {
        errors.push(
          'An ISBN-10 must have nine digits followed by a digit or X (for example 0-306-40615-2).'
        );
      } else {
        checkProvided = cleaned.slice(-1);
        checkExpected = checkDigit10(cleaned.slice(0, 9));
        if (checkProvided !== checkExpected) {
          errors.push(
            `The ISBN-10 check digit is ${checkProvided}, but the other nine digits produce ${checkExpected}.`
          );
        }
        isbn10 = cleaned;
        isbn13 = `978${cleaned.slice(0, 9)}${checkDigit13(`978${cleaned.slice(0, 9)}`)}`;
        hyphenated = hyphenate10(cleaned);
        group = detectGroup(cleaned.slice(0, 9)).group;
      }
    } else if (cleaned.length === 13) {
      kind = 'ISBN-13';
      if (!/^\d{13}$/.test(cleaned)) {
        errors.push(
          'An ISBN-13 must contain exactly 13 digits (hyphens and spaces are ignored).'
        );
      } else {
        const prefix = cleaned.slice(0, 3);
        if (prefix !== '978' && prefix !== '979') {
          errors.push(
            `The 978 or 979 EAN prefix is required for an ISBN-13; this number starts with ${prefix}.`
          );
        }
        checkProvided = cleaned.slice(-1);
        checkExpected = checkDigit13(cleaned.slice(0, 12));
        if (checkProvided !== checkExpected) {
          errors.push(
            `The ISBN-13 check digit is ${checkProvided}, but the first twelve digits produce ${checkExpected}.`
          );
        }
        isbn13 = cleaned;
        if (prefix === '978') {
          const firstNine = cleaned.slice(3, 12);
          isbn10 = `${firstNine}${checkDigit10(firstNine)}`;
        } else {
          warnings.push(
            'ISBN-13 values beginning with 979 have no ISBN-10 equivalent and cannot be converted.'
          );
        }
        hyphenated = hyphenate13(cleaned);
        group = detectGroup(cleaned.slice(3, 12), prefix === '979').group;
      }
    } else {
      errors.push(
        `An ISBN has 10 or 13 characters after hyphens and spaces are removed; this input has ${cleaned.length}.`
      );
    }

    if (group && group !== '0' && group !== '1') {
      warnings.push(
        `The hyphenated display uses a best-effort split for registration group ${group}; the normalized digits are the authoritative form.`
      );
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      cleaned,
      kind,
      isbn10,
      isbn13,
      checkProvided,
      checkExpected,
      hyphenated,
      group,
    };
  }, [input]);

  return (
    <ToolLayout>
      <Panel
        description="Checks ISBN-10 and ISBN-13 check digits, shows a hyphenated form and converts between the two formats."
        title="ISBN"
      >
        <Field hint="Hyphens and spaces are ignored" label="ISBN to validate">
          <Input
            aria-label="ISBN to validate"
            autoComplete="off"
            onChange={(event) => setInput(event.target.value)}
            placeholder="978-0-306-40615-7"
            spellCheck={false}
            type="text"
            value={input}
          />
        </Field>
        <Examples
          items={[
            '978-0-306-40615-7',
            '0-306-40615-2',
            '978-0-13-235088-4',
            '978-1-4028-9462-6',
          ]}
          onPick={setInput}
        />
      </Panel>

      <ResultPanel
        emptyText="Enter an ISBN-10 or ISBN-13 to verify its check digit."
        label="Validation result"
        value={analysis?.valid ? (analysis.isbn13 ?? analysis.cleaned) : ''}
      >
        {analysis && (
          <div className="space-y-3">
            <Verdict
              title={analysis.valid ? 'Valid ISBN' : 'Invalid ISBN'}
              valid={analysis.valid}
            >
              {analysis.valid ? (
                <span>
                  The {analysis.kind} check digit matches the calculated value.
                </span>
              ) : (
                <ReasonList items={analysis.errors} />
              )}
            </Verdict>

            {analysis.warnings.length > 0 && (
              <Callout title="Notes" variant="warning">
                <ReasonList items={analysis.warnings} />
              </Callout>
            )}

            <div className="flex flex-wrap gap-1.5">
              <Badge variant={analysis.valid ? 'success' : 'danger'}>
                {analysis.kind ?? 'Unknown length'}
              </Badge>
              <Badge>
                {analysis.cleaned.length} characters after normalization
              </Badge>
              {analysis.group && <Badge>Group {analysis.group}</Badge>}
            </div>

            <DetailList
              details={[
                {
                  label: 'Normalized digits',
                  value: analysis.cleaned || '—',
                  mono: true,
                  wide: true,
                  breakAll: true,
                },
                {
                  label: 'Hyphenated',
                  value: analysis.hyphenated || '—',
                  mono: true,
                  wide: true,
                  breakAll: true,
                },
                {
                  label: 'ISBN-10',
                  value: analysis.isbn10 ?? 'Not available',
                  mono: true,
                },
                {
                  label: 'ISBN-13',
                  value: analysis.isbn13 ?? 'Not available',
                  mono: true,
                },
                {
                  label: 'Check digit (provided)',
                  value: analysis.checkProvided || '—',
                  mono: true,
                },
                {
                  label: 'Check digit (calculated)',
                  value: analysis.checkExpected || '—',
                  mono: true,
                },
              ]}
            />

            <p className="text-xs leading-5 text-fg-muted">
              A valid checksum only confirms that the digits are internally
              consistent. It does not prove that the book has been published or
              that the ISBN is assigned.
            </p>
          </div>
        )}
      </ResultPanel>
    </ToolLayout>
  );
}
