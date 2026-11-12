'use client';

import type { CountryCode } from 'libphonenumber-js';
import {
  getCountries,
  getCountryCallingCode,
  parsePhoneNumberFromString,
  validatePhoneNumberLength,
} from 'libphonenumber-js';
import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Callout } from '@/components/ui/Callout';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { Select } from '@/components/ui/Select';
import { ToolLayout } from '@/components/ui/ToolLayout';

import { DetailList, Examples, ReasonList, Verdict } from './shared';

const TYPE_LABELS: Record<string, string> = {
  MOBILE: 'Mobile',
  FIXED_LINE: 'Fixed line',
  FIXED_LINE_OR_MOBILE: 'Fixed line or mobile',
  TOLL_FREE: 'Toll free',
  PREMIUM_RATE: 'Premium rate',
  SHARED_COST: 'Shared cost',
  VOIP: 'VoIP',
  PERSONAL_NUMBER: 'Personal number',
  PAGER: 'Pager',
  UAN: 'Universal access number',
  VOICEMAIL: 'Voicemail',
};

const LENGTH_MESSAGES: Record<string, string> = {
  TOO_SHORT: 'The number has too few digits for the selected country.',
  TOO_LONG: 'The number has too many digits for the selected country.',
  NOT_A_NUMBER: 'The input does not look like a phone number.',
  INVALID_COUNTRY: 'The country calling code is not recognised.',
  INVALID_LENGTH: 'The number length is not valid for this numbering plan.',
};

const regionName = (code: string): string => {
  try {
    return new Intl.DisplayNames(['en'], { type: 'region' }).of(code) ?? code;
  } catch {
    return code;
  }
};

export default function PhoneValidator() {
  const [input, setInput] = useState('');
  const [country, setCountry] = useState('US');

  const countries = useMemo(() => {
    let names: Intl.DisplayNames | null = null;
    try {
      names = new Intl.DisplayNames(['en'], { type: 'region' });
    } catch {
      names = null;
    }

    return getCountries()
      .map((code) => ({
        code,
        name: names?.of(code) ?? code,
        dial: getCountryCallingCode(code),
      }))
      .sort((first, second) => first.name.localeCompare(second.name));
  }, []);

  const analysis = useMemo(() => {
    const value = input.trim();
    if (!value) {
      return null;
    }

    const defaultCountry = country ? (country as CountryCode) : undefined;
    let lengthIssue: string | undefined;
    try {
      lengthIssue = validatePhoneNumberLength(value, defaultCountry);
    } catch {
      lengthIssue = undefined;
    }

    let parsed;
    try {
      parsed = parsePhoneNumberFromString(value, defaultCountry);
    } catch {
      parsed = undefined;
    }

    if (!parsed) {
      const errors: string[] = [];
      if (lengthIssue && LENGTH_MESSAGES[lengthIssue]) {
        errors.push(LENGTH_MESSAGES[lengthIssue] ?? lengthIssue);
      } else if (/[a-z]/i.test(value) && !/\bext\b/i.test(value)) {
        errors.push(
          'The input contains letters. Use digits, or a leading + for an international number.'
        );
      } else {
        errors.push(
          'The number could not be parsed. Add a country code starting with + or choose the correct country.'
        );
      }

      return {
        valid: false,
        parsed: null,
        errors,
        warnings: [],
        lengthIssue,
        international: '',
        national: '',
        e164: '',
        rfc3966: '',
        type: 'Unknown',
        resolvedCountry: '',
        resolvedCountryCode: '',
        possible: false,
      };
    }

    const errors: string[] = [];
    const warnings: string[] = [];
    const valid = parsed.isValid();
    const possible = parsed.isPossible();

    if (!valid) {
      errors.push(
        parsed.country
          ? `The number does not match the numbering plan for ${regionName(parsed.country)} (${parsed.country}).`
          : 'The number is not valid in the numbering plan it appears to use.'
      );
      if (lengthIssue && LENGTH_MESSAGES[lengthIssue]) {
        errors.push(LENGTH_MESSAGES[lengthIssue] ?? lengthIssue);
      }
    } else if (lengthIssue && LENGTH_MESSAGES[lengthIssue]) {
      warnings.push(LENGTH_MESSAGES[lengthIssue] ?? lengthIssue);
    }

    const type = parsed.getType();
    const typeLabel = type ? (TYPE_LABELS[type] ?? type) : 'Unknown';

    if (type === 'FIXED_LINE_OR_MOBILE') {
      warnings.push(
        'The numbering plan cannot tell whether this is a fixed line or a mobile number.'
      );
    }
    if (
      value.startsWith('+') &&
      country &&
      parsed.country &&
      parsed.country !== country
    ) {
      warnings.push(
        `The + prefix identified ${regionName(parsed.country)} (${parsed.country}), which overrides the selected country.`
      );
    }
    if (!valid && possible) {
      warnings.push(
        'The length is plausible, but the number is not assigned in the current numbering plan.'
      );
    }

    return {
      valid,
      parsed,
      errors,
      warnings,
      lengthIssue,
      international: parsed.formatInternational(),
      national: parsed.formatNational(),
      e164: parsed.format('E.164'),
      rfc3966: parsed.getURI(),
      type: typeLabel,
      resolvedCountry: parsed.country
        ? regionName(parsed.country)
        : 'Non-geographic',
      resolvedCountryCode: parsed.country ?? '—',
      possible,
    };
  }, [input, country]);

  return (
    <ToolLayout>
      <Panel
        description="Uses the libphonenumber metadata to check validity and produce E.164, international and national formats."
        title="Phone number"
      >
        <div className="mb-3">
          <Field
            hint="Used when the number has no + prefix"
            label="Default country"
          >
            <Select
              aria-label="Default country"
              onChange={(event) => setCountry(event.target.value)}
              value={country}
            >
              <option value="">International (detect from + prefix)</option>
              {countries.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.name} (+{item.dial}) · {item.code}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field
          hint="Spaces, parentheses and hyphens are accepted"
          label="Number"
        >
          <Input
            aria-label="Phone number to validate"
            autoComplete="off"
            inputMode="tel"
            onChange={(event) => setInput(event.target.value)}
            placeholder="+1 415 555 2671"
            spellCheck={false}
            type="tel"
            value={input}
          />
        </Field>
        <Examples
          items={[
            '+1 415 555 2671',
            '+44 20 7946 0958',
            '+49 30 901820',
            '+91 98765 43210',
          ]}
          onPick={setInput}
        />
      </Panel>

      <ResultPanel
        emptyText="Enter a phone number to validate and format it."
        label="Validation result"
        value={analysis?.valid ? analysis.e164 : ''}
      >
        {analysis && (
          <div className="space-y-3">
            <Verdict
              title={
                analysis.valid ? 'Valid phone number' : 'Invalid phone number'
              }
              valid={analysis.valid}
            >
              {analysis.valid ? (
                <span>
                  {analysis.international} is valid
                  {analysis.resolvedCountry
                    ? ` for ${analysis.resolvedCountry}`
                    : ''}
                  .
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
                {analysis.type}
              </Badge>
              <Badge variant={analysis.possible ? 'success' : 'warning'}>
                {analysis.possible ? 'Possible length' : 'Impossible length'}
              </Badge>
              {analysis.resolvedCountryCode !== '—' && (
                <Badge>{analysis.resolvedCountryCode}</Badge>
              )}
            </div>

            <DetailList
              details={[
                {
                  label: 'E.164',
                  value: analysis.e164 || '—',
                  mono: true,
                  breakAll: true,
                },
                {
                  label: 'International',
                  value: analysis.international || '—',
                  mono: true,
                },
                {
                  label: 'National',
                  value: analysis.national || '—',
                  mono: true,
                },
                {
                  label: 'RFC 3966 URI',
                  value: analysis.rfc3966 || '—',
                  mono: true,
                  wide: true,
                  breakAll: true,
                },
                {
                  label: 'Country',
                  value: `${analysis.resolvedCountry} (${analysis.resolvedCountryCode})`,
                },
                {
                  label: 'Calling code',
                  value: analysis.parsed
                    ? `+${analysis.parsed.countryCallingCode}`
                    : '—',
                  mono: true,
                },
                {
                  label: 'National number',
                  value: analysis.parsed?.nationalNumber ?? '—',
                  mono: true,
                },
                {
                  label: 'Number type',
                  value: analysis.type,
                },
                ...(analysis.parsed?.ext
                  ? [
                      {
                        label: 'Extension',
                        value: analysis.parsed.ext,
                        mono: true,
                      },
                    ]
                  : []),
              ]}
            />

            <p className="text-xs leading-5 text-fg-muted">
              Validity depends on the numbering plan, not on whether the phone
              is switched on. Ported and reassigned numbers can differ from the
              metadata.
            </p>
          </div>
        )}
      </ResultPanel>
    </ToolLayout>
  );
}
