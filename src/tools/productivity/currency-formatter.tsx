'use client';

import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Callout } from '@/components/ui/Callout';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Select } from '@/components/ui/Select';
import { ToolLayout } from '@/components/ui/ToolLayout';

type CurrencyDisplay = 'symbol' | 'code' | 'name';
type FractionOption = 'auto' | '0' | '2' | '3';

const CURRENCIES = [
  ['USD', 'US Dollar'],
  ['EUR', 'Euro'],
  ['GBP', 'British Pound'],
  ['JPY', 'Japanese Yen'],
  ['INR', 'Indian Rupee'],
  ['AUD', 'Australian Dollar'],
  ['CAD', 'Canadian Dollar'],
  ['CHF', 'Swiss Franc'],
  ['CNY', 'Chinese Yuan'],
  ['BRL', 'Brazilian Real'],
  ['MXN', 'Mexican Peso'],
  ['SEK', 'Swedish Krona'],
  ['NOK', 'Norwegian Krone'],
  ['DKK', 'Danish Krone'],
  ['PLN', 'Polish Zloty'],
  ['ZAR', 'South African Rand'],
  ['KRW', 'South Korean Won'],
  ['SGD', 'Singapore Dollar'],
  ['HKD', 'Hong Kong Dollar'],
  ['NZD', 'New Zealand Dollar'],
  ['TRY', 'Turkish Lira'],
  ['RUB', 'Russian Ruble'],
  ['AED', 'UAE Dirham'],
  ['SAR', 'Saudi Riyal'],
  ['NGN', 'Nigerian Naira'],
  ['EGP', 'Egyptian Pound'],
  ['ILS', 'Israeli New Shekel'],
  ['THB', 'Thai Baht'],
  ['IDR', 'Indonesian Rupiah'],
  ['MYR', 'Malaysian Ringgit'],
  ['PHP', 'Philippine Peso'],
  ['VND', 'Vietnamese Dong'],
  ['PKR', 'Pakistani Rupee'],
  ['BDT', 'Bangladeshi Taka'],
  ['ARS', 'Argentine Peso'],
  ['CLP', 'Chilean Peso'],
  ['COP', 'Colombian Peso'],
  ['CZK', 'Czech Koruna'],
  ['HUF', 'Hungarian Forint'],
  ['RON', 'Romanian Leu'],
] as const;

const LOCALES = [
  ['en-US', 'English (United States)'],
  ['en-GB', 'English (United Kingdom)'],
  ['en-IN', 'English (India)'],
  ['en-AU', 'English (Australia)'],
  ['en-CA', 'English (Canada)'],
  ['de-DE', 'German (Germany)'],
  ['de-CH', 'German (Switzerland)'],
  ['fr-FR', 'French (France)'],
  ['es-ES', 'Spanish (Spain)'],
  ['it-IT', 'Italian (Italy)'],
  ['pt-BR', 'Portuguese (Brazil)'],
  ['pt-PT', 'Portuguese (Portugal)'],
  ['nl-NL', 'Dutch (Netherlands)'],
  ['sv-SE', 'Swedish (Sweden)'],
  ['pl-PL', 'Polish (Poland)'],
  ['ru-RU', 'Russian (Russia)'],
  ['tr-TR', 'Turkish (Turkey)'],
  ['ar-SA', 'Arabic (Saudi Arabia)'],
  ['hi-IN', 'Hindi (India)'],
  ['ja-JP', 'Japanese (Japan)'],
  ['zh-CN', 'Chinese (China)'],
  ['ko-KR', 'Korean (South Korea)'],
] as const;

const parseAmount = (raw: string) => {
  let value = raw
    .trim()
    .replace(/[\s\u00a0]/g, '')
    .replace(/[^\d.,-]/g, '');

  if (!value) {
    return Number.NaN;
  }

  const lastComma = value.lastIndexOf(',');
  const lastDot = value.lastIndexOf('.');

  if (lastComma > -1 && lastDot > -1) {
    if (lastComma > lastDot) {
      value = value.replace(/\./g, '').replace(/,/g, '.');
    } else {
      value = value.replace(/,/g, '');
    }
  } else if (lastComma > -1) {
    const parts = value.split(',');
    const lastPart = parts[parts.length - 1] ?? '';
    if (parts.length === 2 && lastPart.length > 0 && lastPart.length <= 2) {
      value = value.replace(',', '.');
    } else {
      value = value.replace(/,/g, '');
    }
  }

  return Number(value);
};

const safeNumberFormat = (
  locale: string,
  currency: string,
  display: CurrencyDisplay,
  fraction: FractionOption
) => {
  const options: Intl.NumberFormatOptions = {
    style: 'currency',
    currency,
    currencyDisplay: display,
  };
  if (fraction !== 'auto') {
    const digits = Number(fraction);
    options.minimumFractionDigits = digits;
    options.maximumFractionDigits = digits;
  }
  return new Intl.NumberFormat(locale, options);
};

export default function CurrencyFormatter() {
  const [amount, setAmount] = useState('1234.5');
  const [currency, setCurrency] = useState('USD');
  const [locale, setLocale] = useState('en-US');
  const [display, setDisplay] = useState<CurrencyDisplay>('symbol');
  const [fraction, setFraction] = useState<FractionOption>('auto');

  const numeric = useMemo(() => parseAmount(amount), [amount]);
  const valid = amount.trim().length > 0 && Number.isFinite(numeric);

  const formatError = useMemo(() => {
    if (!valid) {
      return null;
    }
    try {
      safeNumberFormat(locale, currency, display, fraction);
      return null;
    } catch (caught) {
      return caught instanceof Error
        ? caught.message
        : 'These formatting options are not supported.';
    }
  }, [valid, locale, currency, display, fraction]);

  const formatted = useMemo(() => {
    if (!valid || formatError) {
      return '';
    }
    try {
      return safeNumberFormat(locale, currency, display, fraction).format(
        numeric
      );
    } catch {
      return '';
    }
  }, [valid, formatError, locale, currency, display, fraction, numeric]);

  const codeFormatted = useMemo(() => {
    if (!valid || formatError) {
      return '';
    }
    try {
      return safeNumberFormat(locale, currency, 'code', fraction).format(
        numeric
      );
    } catch {
      return '';
    }
  }, [valid, formatError, locale, currency, fraction, numeric]);

  const nameFormatted = useMemo(() => {
    if (!valid || formatError) {
      return '';
    }
    try {
      return safeNumberFormat(locale, currency, 'name', fraction).format(
        numeric
      );
    } catch {
      return '';
    }
  }, [valid, formatError, locale, currency, fraction, numeric]);

  const currencyName = useMemo(() => {
    try {
      if (typeof Intl.DisplayNames === 'function') {
        const displayNames = new Intl.DisplayNames([locale], {
          type: 'currency',
        });
        return displayNames.of(currency) ?? currency;
      }
    } catch {
      // Fall through to the static label below.
    }
    return CURRENCIES.find(([code]) => code === currency)?.[1] ?? currency;
  }, [locale, currency]);

  const error =
    !valid && amount.trim()
      ? 'Enter a valid amount, such as 1234.50 or 1.234,50.'
      : formatError;

  return (
    <div className="space-y-4">
      <ToolLayout>
        <Panel
          description="Format an amount using Intl.NumberFormat with your chosen currency and locale."
          title="Amount and locale"
        >
          <Field
            error={
              amount.trim() && !valid
                ? 'Use digits with an optional decimal separator.'
                : undefined
            }
            hint="Accepts 1,234.56 and 1.234,56"
            htmlFor="currency-amount"
            label="Amount"
          >
            <Input
              id="currency-amount"
              inputMode="decimal"
              onChange={(event) => setAmount(event.target.value)}
              placeholder="1234.50"
              value={amount}
            />
          </Field>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field htmlFor="currency-code" label="Currency">
              <Select
                id="currency-code"
                onChange={(event) => setCurrency(event.target.value)}
                value={currency}
              >
                {CURRENCIES.map(([code, name]) => (
                  <option key={code} value={code}>
                    {code} — {name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field htmlFor="currency-locale" label="Locale">
              <Select
                id="currency-locale"
                onChange={(event) => setLocale(event.target.value)}
                value={locale}
              >
                {LOCALES.map(([code, name]) => (
                  <option key={code} value={code}>
                    {code} — {name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <Field className="mt-4" label="Currency display">
            <SegmentedControl
              ariaLabel="Currency display"
              onChange={(value) => {
                if (
                  value === 'symbol' ||
                  value === 'code' ||
                  value === 'name'
                ) {
                  setDisplay(value);
                }
              }}
              options={[
                { value: 'symbol', label: 'Symbol' },
                { value: 'code', label: 'Code' },
                { value: 'name', label: 'Name' },
              ]}
              value={display}
            />
          </Field>

          <Field
            className="mt-4"
            htmlFor="currency-fraction"
            label="Fraction digits"
          >
            <Select
              id="currency-fraction"
              onChange={(event) =>
                setFraction(event.target.value as FractionOption)
              }
              value={fraction}
            >
              <option value="auto">Automatic (currency default)</option>
              <option value="0">0 digits</option>
              <option value="2">2 digits</option>
              <option value="3">3 digits</option>
            </Select>
          </Field>

          {error ? (
            <Callout className="mt-3" variant="error">
              {error}
            </Callout>
          ) : (
            <Callout className="mt-3" variant="success">
              Formatting uses the browser&apos;s built-in Internationalization
              API. No exchange-rate conversion is performed.
            </Callout>
          )}

          <div className="mt-4 flex flex-wrap gap-1.5">
            <Badge variant="accent">{currency}</Badge>
            <Badge>{locale}</Badge>
            <Badge>{display}</Badge>
            <Badge>
              {fraction === 'auto' ? 'auto digits' : `${fraction} digits`}
            </Badge>
          </div>
        </Panel>

        <ResultPanel
          emptyText="Enter an amount to format it."
          error={error}
          filename="currency.txt"
          label="Formatted currency"
          value={formatted}
        >
          {valid && !formatError ? (
            <div className="space-y-4">
              <div className="rounded-md border border-border bg-canvas-inset px-4 py-8 text-center">
                <p className="text-[11px] uppercase tracking-wide text-fg-muted">
                  {locale} · {currency}
                </p>
                <p className="mt-2 break-all font-mono text-3xl font-bold text-fg sm:text-4xl">
                  {formatted}
                </p>
              </div>

              <dl className="grid gap-3 rounded-md border border-border bg-canvas-subtle/40 p-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-fg-muted">Currency code</dt>
                  <dd className="mt-0.5 font-mono font-semibold text-fg">
                    {currency}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-fg-muted">Currency name</dt>
                  <dd className="mt-0.5 font-semibold text-fg">
                    {currencyName}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-fg-muted">Numeric value</dt>
                  <dd className="mt-0.5 font-mono text-fg">
                    {numeric.toLocaleString('en-US', {
                      maximumFractionDigits: 8,
                      useGrouping: false,
                    })}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-fg-muted">Locale</dt>
                  <dd className="mt-0.5 font-semibold text-fg">{locale}</dd>
                </div>
              </dl>

              <div className="rounded-md border border-border bg-canvas-inset p-3 text-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-fg-muted">
                  Alternative displays
                </p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <div>
                    <p className="text-[11px] text-fg-muted">Currency code</p>
                    <p className="mt-0.5 break-all font-mono text-fg">
                      {codeFormatted}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-fg-muted">Currency name</p>
                    <p className="mt-0.5 break-all font-mono text-fg">
                      {nameFormatted}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </ResultPanel>
      </ToolLayout>
    </div>
  );
}
