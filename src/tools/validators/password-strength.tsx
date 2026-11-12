'use client';

import { Eye, EyeOff } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { ToolLayout } from '@/components/ui/ToolLayout';
import { cn } from '@/utils/cn';

import { DetailList, ReasonList } from './shared';

const COMMON_PASSWORDS = new Set([
  '000000',
  '111111',
  '112233',
  '121212',
  '123123',
  '1234',
  '12345',
  '123456',
  '1234567',
  '12345678',
  '123456789',
  '1234567890',
  '1q2w3e4r',
  '654321',
  '666666',
  '696969',
  '987654321',
  'abc123',
  'access',
  'admin',
  'ashley',
  'bailey',
  'baseball',
  'batman',
  'changeme',
  'charlie',
  'computer',
  'dragon',
  'football',
  'freedom',
  'google',
  'hello',
  'hunter2',
  'iloveyou',
  'letmein',
  'letmein1',
  'login',
  'master',
  'michael',
  'monkey',
  'mustang',
  'passw0rd',
  'password',
  'password1',
  'password12',
  'password123',
  'pokemon',
  'princess',
  'qazwsx',
  'qwerty',
  'qwerty123',
  'qwertyuiop',
  'samsung',
  'secret',
  'shadow',
  'starwars',
  'sunshine',
  'superman',
  'trustno1',
  'welcome',
  'whatever',
]);

const KEYBOARD_PATTERNS = [
  'qwerty',
  'qwertyuiop',
  'asdf',
  'asdfgh',
  'zxcv',
  'zxcvbn',
  'qazwsx',
  '1qaz',
  '2wsx',
  'poiuy',
  'lkjhg',
  'mnbvc',
];

const LEET_MAP: Record<string, string> = {
  '@': 'a',
  '4': 'a',
  '0': 'o',
  '1': 'i',
  '!': 'i',
  '3': 'e',
  $: 's',
  '5': 's',
  '7': 't',
  '+': 't',
  '8': 'b',
  '9': 'g',
};

const normalize = (value: string): string =>
  [...value.toLowerCase()]
    .map((character) => LEET_MAP[character] ?? character)
    .join('')
    .replace(/[^a-z0-9]/g, '');

const hasSequentialRun = (value: string): boolean => {
  let ascending = 1;
  let descending = 1;
  for (let index = 1; index < value.length; index += 1) {
    const delta = value.charCodeAt(index) - value.charCodeAt(index - 1);
    ascending = delta === 1 ? ascending + 1 : 1;
    descending = delta === -1 ? descending + 1 : 1;
    if (ascending >= 3 || descending >= 3) {
      return true;
    }
  }
  return false;
};

const formatNumber = (value: number): string => {
  if (value >= 1000) {
    return new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 0,
    }).format(value);
  }
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 1,
  }).format(value);
};

const formatDuration = (seconds: number): string => {
  if (!Number.isFinite(seconds)) {
    return 'practically forever';
  }
  if (seconds < 1) {
    return 'instantly';
  }
  if (seconds < 60) {
    return `${formatNumber(seconds)} seconds`;
  }
  if (seconds < 3600) {
    return `${formatNumber(seconds / 60)} minutes`;
  }
  if (seconds < 86_400) {
    return `${formatNumber(seconds / 3600)} hours`;
  }
  if (seconds < 31_557_600) {
    return `${formatNumber(seconds / 86_400)} days`;
  }

  const years = seconds / 31_557_600;
  if (years > 13_800_000_000) {
    return 'longer than the age of the universe';
  }
  if (years >= 1_000_000_000) {
    return `${formatNumber(years / 1_000_000_000)} billion years`;
  }
  if (years >= 1_000_000) {
    return `${formatNumber(years / 1_000_000)} million years`;
  }
  if (years >= 1_000) {
    return `${formatNumber(years / 1_000)} thousand years`;
  }
  return `${formatNumber(years)} years`;
};

const SCORE_LABELS = [
  'Very weak',
  'Weak',
  'Fair',
  'Strong',
  'Very strong',
] as const;
const SCORE_BADGES = [
  'danger',
  'danger',
  'warning',
  'success',
  'success',
] as const;
const SCORE_BARS = [
  'bg-danger',
  'bg-danger',
  'bg-attention',
  'bg-success',
  'bg-success',
] as const;

export default function PasswordStrength() {
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);

  const analysis = useMemo(() => {
    if (password.length === 0) {
      return null;
    }

    const characters = Array.from(password);
    const length = characters.length;
    let lower = 0;
    let upper = 0;
    let digits = 0;
    let symbols = 0;
    let unicode = 0;

    for (const character of characters) {
      if (/[a-z]/.test(character)) {
        lower += 1;
      } else if (/[A-Z]/.test(character)) {
        upper += 1;
      } else if (/[0-9]/.test(character)) {
        digits += 1;
      } else if (/^[\x20-\x7E]$/.test(character)) {
        symbols += 1;
      } else {
        unicode += 1;
      }
    }

    const pool =
      (lower > 0 ? 26 : 0) +
      (upper > 0 ? 26 : 0) +
      (digits > 0 ? 10 : 0) +
      (symbols > 0 ? 33 : 0) +
      (unicode > 0 ? 100 : 0);
    const rawEntropy = pool > 0 ? length * Math.log2(pool) : 0;
    const normalized = normalize(password);
    const lowerValue = password.toLowerCase();

    let maxRun = 1;
    let currentRun = 1;
    for (let index = 1; index < characters.length; index += 1) {
      if (characters[index] === characters[index - 1]) {
        currentRun += 1;
        maxRun = Math.max(maxRun, currentRun);
      } else {
        currentRun = 1;
      }
    }

    const exactCommon =
      COMMON_PASSWORDS.has(lowerValue) ||
      (normalized.length >= 4 && COMMON_PASSWORDS.has(normalized));
    const containsCommon =
      !exactCommon &&
      [...COMMON_PASSWORDS].some(
        (word) => word.length >= 4 && normalized.includes(word)
      );
    const repeatedBlock = /(.{2,})\1+/.test(lowerValue);
    const sequential = hasSequentialRun(password);
    const keyboard = KEYBOARD_PATTERNS.some((pattern) =>
      lowerValue.includes(pattern)
    );
    const containsYear = /(?:19|20)\d{2}/.test(password);
    const classCount = [lower, upper, digits, symbols, unicode].filter(
      (count) => count > 0
    ).length;

    let entropy = rawEntropy;
    const patterns: string[] = [];

    if (exactCommon) {
      entropy = Math.min(entropy, 8);
      patterns.push(
        'This is one of the most commonly used passwords or a simple variation of one.'
      );
    } else if (containsCommon) {
      entropy = Math.min(entropy, 26);
      patterns.push(
        'It contains a common password or dictionary word, even with substitutions or extra characters.'
      );
    }
    if (maxRun >= 3) {
      entropy *= 0.6;
      patterns.push(`It repeats the same character ${maxRun} times in a row.`);
    }
    if (repeatedBlock) {
      entropy *= 0.7;
      patterns.push('A block of characters is repeated more than once.');
    }
    if (sequential) {
      entropy = Math.max(0, entropy - 14);
      patterns.push('It contains a sequential run such as abc, 123 or xyz.');
    }
    if (keyboard) {
      entropy = Math.max(0, entropy - 14);
      patterns.push('It contains a keyboard pattern such as qwerty or asdf.');
    }
    if (containsYear) {
      entropy = Math.max(0, entropy - 6);
      patterns.push('It contains what looks like a year or date.');
    }
    if (classCount === 1 && length < 16) {
      entropy *= 0.85;
      patterns.push('It uses only one character class.');
    }

    entropy = Math.max(0, entropy);

    let score: 0 | 1 | 2 | 3 | 4;
    if (exactCommon || entropy < 30) {
      score = 0;
    } else if (entropy < 45) {
      score = 1;
    } else if (entropy < 60) {
      score = 2;
    } else if (entropy < 80) {
      score = 3;
    } else {
      score = 4;
    }

    const guesses = entropy <= 0 ? 1 : Math.pow(2, entropy - 1);
    const offlineSeconds = guesses / 10_000_000_000;
    const onlineSeconds = guesses / 100;

    const suggestions: string[] = [];
    if (length < 12) {
      suggestions.push(
        'Use at least 12 characters; 16 or more is better for a password you memorize.'
      );
    } else if (length < 16) {
      suggestions.push(
        'Adding a few more characters makes guessing substantially harder.'
      );
    }
    if (lower === 0) {
      suggestions.push('Add lowercase letters.');
    }
    if (upper === 0) {
      suggestions.push('Add uppercase letters.');
    }
    if (digits === 0) {
      suggestions.push('Add digits.');
    }
    if (symbols === 0 && unicode === 0) {
      suggestions.push('Add symbols, or use several unrelated words.');
    }
    if (exactCommon || containsCommon) {
      suggestions.push(
        'Avoid words, names and phrases that appear in password dictionaries.'
      );
    }
    if (maxRun >= 3 || repeatedBlock) {
      suggestions.push('Avoid repeated characters and repeated blocks.');
    }
    if (sequential || keyboard) {
      suggestions.push('Avoid alphabet, number and keyboard runs.');
    }
    if (containsYear) {
      suggestions.push('Avoid birthdays, dates and years.');
    }
    if (suggestions.length === 0) {
      suggestions.push(
        'This looks strong. Use a password manager and give every account a unique password.'
      );
    }

    const classes = [
      { label: 'Lowercase', count: lower },
      { label: 'Uppercase', count: upper },
      { label: 'Digits', count: digits },
      { label: 'Symbols', count: symbols },
      { label: 'Unicode', count: unicode },
    ];

    return {
      length,
      unique: new Set(characters).size,
      classes,
      pool,
      entropy,
      rawEntropy,
      score,
      label: SCORE_LABELS[score],
      badge: SCORE_BADGES[score],
      patterns,
      suggestions,
      offline: formatDuration(offlineSeconds),
      online: formatDuration(onlineSeconds),
    };
  }, [password]);

  return (
    <ToolLayout>
      <Panel
        description="Estimates entropy from length and character classes, then penalizes dictionary words, repeats, sequences and keyboard patterns. Everything is computed locally."
        title="Password"
      >
        <Field
          hint={`${Array.from(password).length} characters`}
          label="Password to check"
        >
          <div className="flex gap-2">
            <Input
              aria-label="Password to check"
              autoCapitalize="none"
              autoComplete="new-password"
              className="font-mono"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Type or paste a password…"
              spellCheck={false}
              type={visible ? 'text' : 'password'}
              value={password}
            />
            <Button
              aria-label={visible ? 'Hide password' : 'Show password'}
              onClick={() => setVisible((current) => !current)}
              size="icon"
              variant="default"
            >
              {visible ? (
                <EyeOff aria-hidden className="h-4 w-4" />
              ) : (
                <Eye aria-hidden className="h-4 w-4" />
              )}
            </Button>
          </div>
        </Field>

        <p className="mt-3 text-xs leading-5 text-fg-muted">
          Passwords are never stored, logged or sent over the network. Avoid
          pasting a real production password into any website you do not trust.
        </p>
      </Panel>

      <ResultPanel
        emptyText="Start typing to see the strength estimate and feedback."
        label="Strength analysis"
        value={
          analysis
            ? `${analysis.label} (${Math.round(analysis.entropy)} bits)`
            : ''
        }
      >
        {analysis && (
          <div className="space-y-3">
            <div>
              <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-semibold text-fg">
                  {analysis.label}
                </span>
                <Badge variant={analysis.badge}>
                  {Math.round(analysis.entropy)} bits estimated
                </Badge>
              </div>
              <div className="flex gap-1" aria-hidden>
                {SCORE_BARS.map((_, index) => (
                  <span
                    className={cn(
                      'h-1.5 flex-1 rounded-full',
                      index <= analysis.score
                        ? SCORE_BARS[analysis.score]
                        : 'bg-neutral-subtle'
                    )}
                    key={index}
                  />
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {analysis.classes.map((item) => (
                <Badge
                  key={item.label}
                  variant={item.count > 0 ? 'success' : 'default'}
                >
                  {item.label}
                  {item.count > 0 ? ` · ${item.count}` : ''}
                </Badge>
              ))}
            </div>

            {analysis.patterns.length > 0 && (
              <Callout title="Patterns detected" variant="warning">
                <ReasonList items={analysis.patterns} />
              </Callout>
            )}

            <DetailList
              details={[
                {
                  label: 'Length',
                  value: `${analysis.length} characters`,
                },
                {
                  label: 'Unique characters',
                  value: String(analysis.unique),
                },
                {
                  label: 'Character pool',
                  value: `${analysis.pool} possible characters`,
                },
                {
                  label: 'Estimated entropy',
                  value: `~${analysis.entropy.toFixed(1)} bits (before penalties: ${analysis.rawEntropy.toFixed(1)})`,
                },
                {
                  label: 'Offline attack estimate',
                  value: `${analysis.offline} at 10 billion guesses/second`,
                  wide: true,
                },
                {
                  label: 'Online attack estimate',
                  value: `${analysis.online} at 100 guesses/second`,
                  wide: true,
                },
              ]}
            />

            <div className="rounded-md border border-border bg-canvas-subtle/40 p-3">
              <p className="text-xs font-semibold text-fg">Suggestions</p>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm leading-5 text-fg-muted">
                {analysis.suggestions.map((suggestion) => (
                  <li key={suggestion}>{suggestion}</li>
                ))}
              </ul>
            </div>

            <p className="text-xs leading-5 text-fg-muted">
              Entropy is an estimate, not a guarantee. Attack speeds vary with
              the hashing algorithm and hardware; a unique password and a
              password manager matter more than any single complexity rule.
            </p>
          </div>
        )}
      </ResultPanel>
    </ToolLayout>
  );
}
