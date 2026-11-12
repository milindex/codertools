'use client';

import { useState } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { ToolLayout } from '@/components/ui/ToolLayout';
import { Checkbox } from '@/tools/generators/_controls';
import { randomChar, shuffle, uniqueChars } from '@/tools/generators/_random';

type CharacterClass = 'lowercase' | 'uppercase' | 'digits' | 'symbols';

const CLASSES: Record<CharacterClass, { label: string; chars: string }> = {
  lowercase: {
    label: 'Lowercase letters (a–z)',
    chars: 'abcdefghijklmnopqrstuvwxyz',
  },
  uppercase: {
    label: 'Uppercase letters (A–Z)',
    chars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  },
  digits: {
    label: 'Digits (0–9)',
    chars: '0123456789',
  },
  symbols: {
    label: 'Symbols (!@#$%…)',
    chars: '!@#$%^&*()-_=+[]{};:,.<>?/',
  },
};

const AMBIGUOUS = new Set(Array.from('0O1lI|'));

const sanitize = (chars: string, excludeAmbiguous: boolean) =>
  excludeAmbiguous
    ? Array.from(chars)
        .filter((character) => !AMBIGUOUS.has(character))
        .join('')
    : chars;

const buildPassword = (length: number, pools: string[]) => {
  const required = pools.map((pool) => randomChar(pool));
  const combined = uniqueChars(pools.join(''));
  const remaining = Array.from(
    { length: Math.max(0, length - required.length) },
    () => randomChar(combined)
  );

  return shuffle([...required, ...remaining]).join('');
};

const strengthFor = (bits: number) => {
  if (bits < 50) {
    return { label: 'Weak', variant: 'danger' as const };
  }
  if (bits < 80) {
    return { label: 'Fair', variant: 'warning' as const };
  }
  if (bits < 128) {
    return { label: 'Strong', variant: 'success' as const };
  }
  return { label: 'Very strong', variant: 'done' as const };
};

export default function PasswordGenerator() {
  const [length, setLength] = useState('20');
  const [count, setCount] = useState('1');
  const [classes, setClasses] = useState<Record<CharacterClass, boolean>>({
    lowercase: true,
    uppercase: true,
    digits: true,
    symbols: true,
  });
  const [excludeAmbiguous, setExcludeAmbiguous] = useState(true);
  const [output, setOutput] = useState(() => {
    const pools = Object.values(CLASSES)
      .map((entry) => sanitize(entry.chars, true))
      .filter(Boolean);
    return buildPassword(20, pools);
  });
  const [error, setError] = useState<string | null>(null);

  const selectedClasses = (Object.keys(CLASSES) as CharacterClass[]).filter(
    (key) => classes[key]
  );
  const pools = selectedClasses.map((key) =>
    sanitize(CLASSES[key].chars, excludeAmbiguous)
  );
  const combinedPool = uniqueChars(pools.join(''));
  const entropy =
    combinedPool.length > 1
      ? Math.round(Number(length) * Math.log2(combinedPool.length))
      : 0;
  const strength = strengthFor(entropy);

  const generate = () => {
    const parsedLength = Number(length);
    const parsedCount = Number(count);

    if (
      !Number.isInteger(parsedLength) ||
      parsedLength < 4 ||
      parsedLength > 256
    ) {
      setError('Length must be a whole number between 4 and 256.');
      return;
    }

    if (!Number.isInteger(parsedCount) || parsedCount < 1 || parsedCount > 50) {
      setError('Count must be a whole number between 1 and 50.');
      return;
    }

    if (pools.length === 0) {
      setError('Select at least one character class.');
      return;
    }

    if (parsedLength < pools.length) {
      setError(
        `Length must be at least ${pools.length} to include one character from every selected class.`
      );
      return;
    }

    if (parsedLength * parsedCount > 12_800) {
      setError('Reduce the length or count (12,800 characters maximum).');
      return;
    }

    setError(null);
    setOutput(
      Array.from({ length: parsedCount }, () =>
        buildPassword(parsedLength, pools)
      ).join('\n')
    );
  };

  return (
    <div className="space-y-4">
      <ToolLayout>
        <Panel
          actions={<Badge variant={strength.variant}>{strength.label}</Badge>}
          title="Password rules"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field hint="4–256" htmlFor="password-length" label="Length">
              <Input
                id="password-length"
                max={256}
                min={4}
                onChange={(event) => setLength(event.target.value)}
                type="number"
                value={length}
              />
            </Field>
            <Field hint="1–50" htmlFor="password-count" label="How many?">
              <Input
                id="password-count"
                max={50}
                min={1}
                onChange={(event) => setCount(event.target.value)}
                type="number"
                value={count}
              />
            </Field>
          </div>

          <fieldset className="mt-4">
            <legend className="text-xs font-semibold text-fg">
              Character classes
            </legend>
            <div className="mt-2 grid gap-2.5 sm:grid-cols-2">
              {(Object.keys(CLASSES) as CharacterClass[]).map((key) => (
                <Checkbox
                  checked={classes[key]}
                  id={`password-${key}`}
                  key={key}
                  label={CLASSES[key].label}
                  onChange={(checked) =>
                    setClasses((previous) => ({
                      ...previous,
                      [key]: checked,
                    }))
                  }
                />
              ))}
            </div>
          </fieldset>

          <div className="mt-3">
            <Checkbox
              checked={excludeAmbiguous}
              id="password-ambiguous"
              label="Exclude ambiguous characters (0 O 1 l I |)"
              onChange={setExcludeAmbiguous}
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button onClick={generate} variant="primary">
              Generate passwords
            </Button>
            <span className="text-xs text-fg-muted">
              {combinedPool.length} character pool · ≈ {entropy} bits estimated
              entropy
            </span>
          </div>

          {error && (
            <Callout className="mt-3" variant="error">
              {error}
            </Callout>
          )}

          <Callout className="mt-4" variant="info">
            Every generated password contains at least one character from each
            selected class, and the result is shuffled. Entropy is an estimate
            based on the pool size; enabling class requirements slightly reduces
            it.
          </Callout>
        </Panel>

        <ResultPanel
          emptyText="Click Generate to create passwords."
          filename="passwords.txt"
          label="Passwords"
          value={output}
        />
      </ToolLayout>
    </div>
  );
}
