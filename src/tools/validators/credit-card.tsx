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

type CardNetwork = {
  id: string;
  name: string;
  pattern: RegExp;
  lengths: number[];
  groups: number[];
};

const NETWORKS: CardNetwork[] = [
  {
    id: 'amex',
    name: 'American Express',
    pattern: /^3[47]/,
    lengths: [15],
    groups: [4, 6, 5],
  },
  {
    id: 'diners',
    name: 'Diners Club',
    pattern: /^3(?:0[0-5]|[68])/,
    lengths: [14, 16],
    groups: [4, 6, 4],
  },
  {
    id: 'jcb',
    name: 'JCB',
    pattern: /^35(?:2[89]|[3-8]\d)/,
    lengths: [16, 17, 18, 19],
    groups: [4, 4, 4, 4],
  },
  {
    id: 'mastercard',
    name: 'Mastercard',
    pattern: /^(?:5[1-5]|2(?:2(?:2[1-9]|[3-9]\d)|[3-6]\d{2}|7(?:[01]\d|20)))/,
    lengths: [16],
    groups: [4, 4, 4, 4],
  },
  {
    id: 'discover',
    name: 'Discover',
    pattern:
      /^(?:6011|65|64[4-9]|622(?:12[6-9]|1[3-9]\d|[2-8]\d{2}|9[01]\d|92[0-5]))/,
    lengths: [16, 19],
    groups: [4, 4, 4, 4],
  },
  {
    id: 'visa',
    name: 'Visa',
    pattern: /^4/,
    lengths: [13, 16, 19],
    groups: [4, 4, 4, 4],
  },
];

const luhnValid = (digits: string): boolean => {
  let sum = 0;
  let double = false;

  for (let index = digits.length - 1; index >= 0; index -= 1) {
    let value = Number(digits[index] ?? 0);
    if (double) {
      value *= 2;
      if (value > 9) {
        value -= 9;
      }
    }
    sum += value;
    double = !double;
  }

  return sum % 10 === 0;
};

const formatGroups = (digits: string, groups: number[]): string => {
  const parts: string[] = [];
  let offset = 0;

  for (const size of groups) {
    if (offset >= digits.length) {
      break;
    }
    parts.push(digits.slice(offset, offset + size));
    offset += size;
  }
  if (offset < digits.length) {
    parts.push(digits.slice(offset));
  }
  return parts.join(' ');
};

const maskNumber = (digits: string, groups: number[]): string => {
  if (digits.length === 0) {
    return '';
  }
  const visibleFrom = Math.max(0, digits.length - 4);
  const masked = [...digits]
    .map((digit, index) => (index < visibleFrom ? '•' : digit))
    .join('');
  return formatGroups(masked, groups);
};

const groupedPattern = (groups: number[], length: number): string => {
  const sizes: number[] = [];
  let remaining = length;
  for (const size of groups) {
    if (remaining <= 0) {
      break;
    }
    sizes.push(Math.min(size, remaining));
    remaining -= size;
  }
  if (remaining > 0) {
    sizes.push(remaining);
  }
  return sizes.join('-');
};

export default function CreditCardValidator() {
  const [input, setInput] = useState('');
  const analysis = useMemo(() => {
    const raw = input.trim();
    if (!raw) {
      return null;
    }

    const errors: string[] = [];
    const warnings: string[] = [];
    const digits = raw.replace(/[\s-]/g, '');

    if (!/^[\d\s-]+$/.test(raw)) {
      errors.push('A card number can only contain digits, spaces and hyphens.');
    }

    if (digits.length < 12 || digits.length > 19) {
      errors.push(
        `A payment card number normally has 12 to 19 digits; this one has ${digits.length}.`
      );
    }

    const network = NETWORKS.find((item) => item.pattern.test(digits)) ?? null;
    const lengthOk = network
      ? network.lengths.includes(digits.length)
      : digits.length >= 12 && digits.length <= 19;
    const luhnOk =
      digits.length > 0 && /^\d+$/.test(digits) && luhnValid(digits);

    if (!network) {
      errors.push(
        'The leading digits do not match a supported network (Visa, Mastercard, American Express, Discover, JCB or Diners Club).'
      );
      warnings.push(
        'Private-label and newly issued cards may use prefixes that this validator does not know about.'
      );
    } else if (!lengthOk) {
      errors.push(
        `${network.name} numbers have ${network.lengths.join(', ')} digits; this one has ${digits.length}.`
      );
    }

    if (!luhnOk) {
      errors.push(
        'The Luhn checksum does not match. One or more digits are probably mistyped.'
      );
    }

    const groups = network?.groups ?? [4, 4, 4, 4];
    const masked = maskNumber(digits, groups);
    const last4 = digits.slice(-4);

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      network,
      digits,
      last4,
      masked,
      luhnOk,
      lengthOk,
      grouping: groupedPattern(groups, digits.length),
      bin: digits.slice(0, 6),
    };
  }, [input]);

  return (
    <ToolLayout>
      <Panel
        description="Checks the Luhn checksum, issuer prefix and expected length. The full number never leaves this tab."
        title="Card number"
      >
        <Field hint="Spaces and hyphens are ignored" label="Number to validate">
          <Input
            aria-label="Credit card number to validate"
            autoComplete="off"
            inputMode="numeric"
            onChange={(event) => setInput(event.target.value)}
            placeholder="4242 4242 4242 4242"
            spellCheck={false}
            type="text"
            value={input}
          />
        </Field>
        <Examples
          items={[
            '4242 4242 4242 4242',
            '5555 5555 5555 4444',
            '3782 822463 10005',
            '3056 9309 0259 04',
          ]}
          onPick={setInput}
        />
      </Panel>

      <ResultPanel
        emptyText="Enter a card number to check its network, length and checksum."
        label="Validation result"
        value={
          analysis?.valid
            ? `${analysis.network?.name ?? 'Card'} •••• ${analysis.last4}`
            : ''
        }
      >
        {analysis && (
          <div className="space-y-3">
            <Verdict
              title={
                analysis.valid ? 'Valid card number' : 'Invalid card number'
              }
              valid={analysis.valid}
            >
              {analysis.valid ? (
                <span>
                  Passes the Luhn checksum and matches the{' '}
                  {analysis.network?.name ?? 'card'} length rules.
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
                {analysis.network?.name ?? 'Unknown network'}
              </Badge>
              <Badge variant={analysis.luhnOk ? 'success' : 'danger'}>
                {analysis.luhnOk ? 'Luhn passes' : 'Luhn fails'}
              </Badge>
              <Badge variant={analysis.lengthOk ? 'success' : 'warning'}>
                {analysis.digits.length} digits
              </Badge>
            </div>

            <DetailList
              details={[
                {
                  label: 'Masked number',
                  value: analysis.masked || '—',
                  mono: true,
                  breakAll: true,
                },
                {
                  label: 'Network',
                  value: analysis.network?.name ?? 'Not recognised',
                },
                {
                  label: 'Issuer identification number',
                  value: analysis.bin || '—',
                  mono: true,
                },
                {
                  label: 'Format',
                  value: `${analysis.grouping} (groups of digits)`,
                  mono: true,
                },
                {
                  label: 'Luhn checksum',
                  value: analysis.luhnOk ? 'Passes' : 'Fails',
                },
                {
                  label: 'Expected length',
                  value: analysis.network
                    ? `${analysis.network.lengths.join(', ')} digits`
                    : '12 to 19 digits',
                },
              ]}
            />

            <p className="text-xs leading-5 text-fg-muted">
              A Luhn-valid number is not necessarily a real, active card. This
              tool cannot check expiry dates, CVVs, account status or available
              funds.
            </p>
          </div>
        )}
      </ResultPanel>
    </ToolLayout>
  );
}
