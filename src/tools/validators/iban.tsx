'use client';

import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { ToolLayout } from '@/components/ui/ToolLayout';

import { DetailList, Examples, ReasonList, Verdict } from './shared';

const IBAN_LENGTHS: Record<string, number> = {
  AD: 24,
  AE: 23,
  AL: 28,
  AT: 20,
  AZ: 28,
  BA: 20,
  BE: 16,
  BG: 22,
  BH: 22,
  BR: 29,
  BY: 28,
  CH: 21,
  CR: 22,
  CY: 28,
  CZ: 24,
  DE: 22,
  DK: 18,
  DO: 28,
  EE: 20,
  EG: 29,
  ES: 24,
  FI: 18,
  FO: 18,
  FR: 27,
  GB: 22,
  GE: 22,
  GI: 23,
  GL: 18,
  GR: 27,
  GT: 28,
  HR: 21,
  HU: 28,
  IE: 22,
  IL: 23,
  IQ: 23,
  IS: 26,
  IT: 27,
  JO: 30,
  KZ: 20,
  KW: 30,
  LB: 28,
  LC: 32,
  LI: 21,
  LT: 20,
  LU: 20,
  LV: 21,
  LY: 25,
  MC: 27,
  MD: 24,
  ME: 22,
  MK: 19,
  MN: 20,
  MR: 27,
  MT: 31,
  MU: 30,
  NL: 18,
  NO: 15,
  PK: 24,
  PL: 28,
  PS: 29,
  PT: 25,
  QA: 29,
  RO: 24,
  RS: 22,
  SA: 24,
  SC: 31,
  SD: 18,
  SE: 24,
  SI: 19,
  SK: 24,
  SM: 27,
  SO: 23,
  ST: 25,
  SV: 28,
  TL: 23,
  TN: 24,
  TR: 26,
  UA: 29,
  VA: 22,
  VG: 24,
  XK: 20,
};

type Segment = { label: string; length: number };

const STRUCTURES: Record<string, Segment[]> = {
  AE: [
    { label: 'Bank code', length: 3 },
    { label: 'Account number', length: 16 },
  ],
  AL: [
    { label: 'Bank code', length: 3 },
    { label: 'Branch code', length: 4 },
    { label: 'National check digit', length: 1 },
    { label: 'Account number', length: 16 },
  ],
  AT: [
    { label: 'Bank code', length: 5 },
    { label: 'Account number', length: 11 },
  ],
  AZ: [
    { label: 'Bank code', length: 4 },
    { label: 'Account number', length: 20 },
  ],
  BA: [
    { label: 'Bank code', length: 3 },
    { label: 'Branch code', length: 3 },
    { label: 'Account number', length: 8 },
    { label: 'National check digits', length: 2 },
  ],
  BE: [
    { label: 'Bank code', length: 3 },
    { label: 'Account number', length: 7 },
    { label: 'National check digits', length: 2 },
  ],
  CH: [
    { label: 'Bank code', length: 5 },
    { label: 'Account number', length: 12 },
  ],
  CY: [
    { label: 'Bank code', length: 3 },
    { label: 'Branch code', length: 5 },
    { label: 'Account number', length: 16 },
  ],
  CZ: [
    { label: 'Bank code', length: 4 },
    { label: 'Account prefix', length: 6 },
    { label: 'Account number', length: 10 },
  ],
  DE: [
    { label: 'Bank code', length: 8 },
    { label: 'Account number', length: 10 },
  ],
  DK: [
    { label: 'Bank code', length: 4 },
    { label: 'Account number', length: 9 },
    { label: 'National check digit', length: 1 },
  ],
  EE: [
    { label: 'Bank code', length: 2 },
    { label: 'Branch code', length: 2 },
    { label: 'Account number', length: 11 },
    { label: 'National check digit', length: 1 },
  ],
  ES: [
    { label: 'Bank code', length: 4 },
    { label: 'Branch code', length: 4 },
    { label: 'National check digits', length: 2 },
    { label: 'Account number', length: 10 },
  ],
  FI: [
    { label: 'Bank code', length: 6 },
    { label: 'Account number', length: 7 },
    { label: 'National check digit', length: 1 },
  ],
  FR: [
    { label: 'Bank code', length: 5 },
    { label: 'Branch code', length: 5 },
    { label: 'Account number', length: 11 },
    { label: 'RIB key', length: 2 },
  ],
  GB: [
    { label: 'Bank code', length: 4 },
    { label: 'Sort code', length: 6 },
    { label: 'Account number', length: 8 },
  ],
  GE: [
    { label: 'Bank code', length: 2 },
    { label: 'Account number', length: 16 },
  ],
  GR: [
    { label: 'Bank code', length: 3 },
    { label: 'Branch code', length: 4 },
    { label: 'Account number', length: 16 },
  ],
  HR: [
    { label: 'Bank code', length: 7 },
    { label: 'Account number', length: 10 },
  ],
  IE: [
    { label: 'Bank code', length: 4 },
    { label: 'Sort code', length: 6 },
    { label: 'Account number', length: 8 },
  ],
  IL: [
    { label: 'Bank code', length: 3 },
    { label: 'Branch code', length: 3 },
    { label: 'Account number', length: 13 },
  ],
  IT: [
    { label: 'National check digit', length: 1 },
    { label: 'Bank code', length: 5 },
    { label: 'Branch code', length: 5 },
    { label: 'Account number', length: 12 },
  ],
  KZ: [
    { label: 'Bank code', length: 3 },
    { label: 'Account number', length: 13 },
  ],
  LT: [
    { label: 'Bank code', length: 5 },
    { label: 'Account number', length: 11 },
  ],
  LU: [
    { label: 'Bank code', length: 3 },
    { label: 'Account number', length: 13 },
  ],
  LV: [
    { label: 'Bank code', length: 4 },
    { label: 'Account number', length: 13 },
  ],
  MD: [
    { label: 'Bank code', length: 2 },
    { label: 'Account number', length: 18 },
  ],
  MK: [
    { label: 'Bank code', length: 3 },
    { label: 'Account number', length: 10 },
    { label: 'National check digits', length: 2 },
  ],
  MT: [
    { label: 'Bank code', length: 4 },
    { label: 'Branch code', length: 5 },
    { label: 'Account number', length: 18 },
  ],
  NL: [
    { label: 'Bank code', length: 4 },
    { label: 'Account number', length: 10 },
  ],
  NO: [
    { label: 'Bank code', length: 4 },
    { label: 'Account number', length: 6 },
    { label: 'National check digit', length: 1 },
  ],
  PL: [
    { label: 'Bank code', length: 8 },
    { label: 'Account number', length: 16 },
  ],
  PT: [
    { label: 'Bank code', length: 4 },
    { label: 'Branch code', length: 4 },
    { label: 'Account number', length: 11 },
    { label: 'National check digits', length: 2 },
  ],
  RO: [
    { label: 'Bank code', length: 4 },
    { label: 'Account number', length: 16 },
  ],
  SA: [
    { label: 'Bank code', length: 2 },
    { label: 'Account number', length: 18 },
  ],
  SE: [
    { label: 'Bank code', length: 3 },
    { label: 'Account number', length: 17 },
  ],
  SI: [
    { label: 'Bank code', length: 5 },
    { label: 'Account number', length: 8 },
    { label: 'National check digits', length: 2 },
  ],
  SK: [
    { label: 'Bank code', length: 4 },
    { label: 'Account prefix', length: 6 },
    { label: 'Account number', length: 10 },
  ],
  TR: [
    { label: 'Bank code', length: 5 },
    { label: 'Reserved digit', length: 1 },
    { label: 'Account number', length: 16 },
  ],
  UA: [
    { label: 'Bank code', length: 6 },
    { label: 'Account number', length: 19 },
  ],
};

const groupInFours = (value: string): string =>
  value.replace(/(.{4})/g, '$1 ').trim();

const mod97 = (iban: string): number => {
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  let remainder = 0;

  for (const character of rearranged) {
    const code = character.charCodeAt(0);
    let value: string;

    if (code >= 48 && code <= 57) {
      value = character;
    } else if (code >= 65 && code <= 90) {
      value = String(code - 55);
    } else {
      return -1;
    }

    for (const digit of value) {
      remainder = (remainder * 10 + Number(digit)) % 97;
    }
  }

  return remainder;
};

const regionName = (code: string): string => {
  try {
    return new Intl.DisplayNames(['en'], { type: 'region' }).of(code) ?? code;
  } catch {
    return code;
  }
};

export default function IbanValidator() {
  const [input, setInput] = useState('');

  const analysis = useMemo(() => {
    const raw = input.trim();
    if (!raw) {
      return null;
    }

    const errors: string[] = [];
    const normalized = raw.replace(/\s+/g, '').toUpperCase();

    if (!/^[A-Za-z0-9\s]+$/.test(raw)) {
      errors.push('An IBAN can only contain letters, digits and spaces.');
    }

    const countryCode = normalized.slice(0, 2);
    const expectedLength = IBAN_LENGTHS[countryCode];
    const country = regionName(countryCode);

    if (normalized.length < 4) {
      errors.push(
        'An IBAN must contain at least a two-letter country code and two check digits.'
      );
    }

    if (!/^[A-Z]{2}$/.test(countryCode)) {
      errors.push(
        'The first two characters must be a two-letter ISO country code.'
      );
    } else if (!expectedLength) {
      errors.push(
        `Country code ${countryCode} is not in the supported IBAN country table.`
      );
    }

    if (!/^\d{2}$/.test(normalized.slice(2, 4))) {
      errors.push('Characters 3 and 4 must be the two numeric check digits.');
    }

    if (expectedLength && normalized.length !== expectedLength) {
      errors.push(
        `An IBAN from ${country} is ${expectedLength} characters long; this one has ${normalized.length}.`
      );
    }

    const remainder =
      normalized.length >= 4 && /^[A-Z0-9]+$/.test(normalized)
        ? mod97(normalized)
        : -1;

    if (remainder !== -1 && remainder !== 1) {
      errors.push(
        `The international mod-97 check failed (remainder ${remainder}, expected 1).`
      );
    }

    const bban = normalized.slice(4);
    const structure = STRUCTURES[countryCode];
    const structureFits =
      structure?.reduce((total, segment) => total + segment.length, 0) ===
      bban.length;
    let offset = 0;
    const segments = structureFits
      ? structure?.map((segment) => {
          const value = bban.slice(offset, offset + segment.length);
          offset += segment.length;
          return { label: segment.label, value };
        })
      : null;

    return {
      valid: errors.length === 0,
      errors,
      normalized,
      formatted: groupInFours(normalized),
      countryCode,
      country,
      expectedLength,
      bban,
      bbanFormatted: groupInFours(bban),
      checkDigits: normalized.slice(2, 4),
      remainder,
      segments: segments ?? null,
    };
  }, [input]);

  return (
    <ToolLayout>
      <Panel
        description="Normalizes the number, checks its country length and verifies the ISO 13616 mod-97 checksum."
        title="IBAN"
      >
        <Field hint="Spaces and case are ignored" label="IBAN to validate">
          <Input
            aria-label="IBAN to validate"
            autoCapitalize="characters"
            autoComplete="off"
            onChange={(event) => setInput(event.target.value)}
            placeholder="DE89 3704 0044 0532 0130 00"
            spellCheck={false}
            type="text"
            value={input}
          />
        </Field>
        <Examples
          items={[
            'DE89 3704 0044 0532 0130 00',
            'GB82 WEST 1234 5698 7654 32',
            'FR14 2004 1010 0505 0001 3M02 606',
            'NL91 ABNA 0417 1643 00',
          ]}
          onPick={setInput}
        />
      </Panel>

      <ResultPanel
        emptyText="Enter an IBAN to see its country, BBAN and checksum result."
        label="Validation result"
        value={analysis?.valid ? analysis.formatted : ''}
      >
        {analysis && (
          <div className="space-y-3">
            <Verdict
              title={analysis.valid ? 'Valid IBAN' : 'Invalid IBAN'}
              valid={analysis.valid}
            >
              {analysis.valid ? (
                <span>
                  Passes the country length and mod-97 checks for{' '}
                  {analysis.country}.
                </span>
              ) : (
                <ReasonList items={analysis.errors} />
              )}
            </Verdict>

            <div className="flex flex-wrap gap-1.5">
              <Badge variant={analysis.valid ? 'success' : 'danger'}>
                {analysis.valid ? 'mod-97 passes' : 'mod-97 fails'}
              </Badge>
              <Badge>
                {analysis.countryCode || '??'} · {analysis.country}
              </Badge>
              <Badge>
                {analysis.normalized.length}
                {analysis.expectedLength
                  ? ` / ${analysis.expectedLength}`
                  : ''}{' '}
                characters
              </Badge>
            </div>

            <DetailList
              details={[
                {
                  label: 'IBAN in groups of four',
                  value: analysis.formatted || '—',
                  mono: true,
                  wide: true,
                  breakAll: true,
                },
                {
                  label: 'Country',
                  value: `${analysis.country} (${analysis.countryCode || '—'})`,
                },
                {
                  label: 'Check digits',
                  value: analysis.checkDigits || '—',
                  mono: true,
                },
                {
                  label: 'BBAN',
                  value: analysis.bbanFormatted || '—',
                  mono: true,
                  wide: true,
                  breakAll: true,
                },
                {
                  label: 'Mod-97 remainder',
                  value:
                    analysis.remainder === -1
                      ? 'Could not be calculated'
                      : `${analysis.remainder} (expected 1)`,
                },
                {
                  label: 'Length',
                  value: analysis.expectedLength
                    ? `${analysis.normalized.length} of ${analysis.expectedLength} characters`
                    : `${analysis.normalized.length} characters`,
                },
              ]}
            />

            {analysis.segments && analysis.segments.length > 0 && (
              <div className="overflow-hidden rounded-md border border-border">
                <div className="border-b border-border bg-canvas-subtle/60 px-3 py-2 text-xs font-semibold text-fg">
                  BBAN breakdown · {analysis.countryCode}
                </div>
                <div className="divide-y divide-border">
                  {analysis.segments.map((segment) => (
                    <div
                      className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5"
                      key={segment.label}
                    >
                      <span className="text-xs text-fg-muted">
                        {segment.label}
                      </span>
                      <span className="break-all font-mono text-xs text-fg">
                        {segment.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p className="text-xs leading-5 text-fg-muted">
              Only the international mod-97 checksum is verified. National check
              digits inside some BBANs are not recalculated, so this confirms
              the number structure rather than the existence of the bank
              account.
            </p>
          </div>
        )}
      </ResultPanel>
    </ToolLayout>
  );
}
