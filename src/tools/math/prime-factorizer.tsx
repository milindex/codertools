'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { ToolLayout } from '@/components/ui/ToolLayout';

const MAX_DIGITS = 20;

const trialPrimes: number[] = (() => {
  const numbers: number[] = [];
  for (let candidate = 2; candidate <= 1000; candidate += 1) {
    let prime = true;
    for (let divisor = 2; divisor * divisor <= candidate; divisor += 1) {
      if (candidate % divisor === 0) {
        prime = false;
        break;
      }
    }
    if (prime) {
      numbers.push(candidate);
    }
  }
  return numbers;
})();

const millerRabinBases = [
  2n,
  3n,
  5n,
  7n,
  11n,
  13n,
  17n,
  19n,
  23n,
  29n,
  31n,
  37n,
];

const modPow = (base: bigint, exponent: bigint, modulus: bigint): bigint => {
  let result = 1n;
  let factor = base % modulus;
  let power = exponent;

  while (power > 0n) {
    if (power & 1n) {
      result = (result * factor) % modulus;
    }
    factor = (factor * factor) % modulus;
    power >>= 1n;
  }

  return result;
};

const isPrime = (value: bigint): boolean => {
  if (value < 2n) {
    return false;
  }

  for (const candidate of trialPrimes) {
    const prime = BigInt(candidate);
    if (value === prime) {
      return true;
    }
    if (value % prime === 0n) {
      return false;
    }
  }

  let oddPart = value - 1n;
  let powerOfTwo = 0n;
  while (oddPart % 2n === 0n) {
    oddPart /= 2n;
    powerOfTwo += 1n;
  }

  for (const base of millerRabinBases) {
    if (base >= value) {
      continue;
    }

    let witness = modPow(base, oddPart, value);
    if (witness === 1n || witness === value - 1n) {
      continue;
    }

    let composite = true;
    for (let round = 1n; round < powerOfTwo; round += 1n) {
      witness = (witness * witness) % value;
      if (witness === value - 1n) {
        composite = false;
        break;
      }
    }

    if (composite) {
      return false;
    }
  }

  return true;
};

const gcd = (left: bigint, right: bigint): bigint => {
  let a = left < 0n ? -left : left;
  let b = right < 0n ? -right : right;

  while (b !== 0n) {
    const remainder = a % b;
    a = b;
    b = remainder;
  }

  return a;
};

const pollardRho = (value: bigint): bigint => {
  if (value % 2n === 0n) {
    return 2n;
  }
  if (value % 3n === 0n) {
    return 3n;
  }

  for (let constant = 1n; constant <= 50n; constant += 1n) {
    let x = 2n;
    let y = 2n;
    let divisor = 1n;
    let iterations = 0;

    const step = (current: bigint) => (current * current + constant) % value;

    while (divisor === 1n && iterations < 200000) {
      x = step(x);
      y = step(step(y));
      divisor = gcd(x - y, value);
      iterations += 1;
    }

    if (divisor > 1n && divisor < value) {
      return divisor;
    }
  }

  throw new Error('Could not factor this number with the current limits.');
};

const factorRecursive = (value: bigint, output: bigint[]): void => {
  if (value === 1n) {
    return;
  }
  if (isPrime(value)) {
    output.push(value);
    return;
  }

  const divisor = pollardRho(value);
  factorRecursive(divisor, output);
  factorRecursive(value / divisor, output);
};

const factorize = (value: bigint): bigint[] => {
  const factors: bigint[] = [];
  let remaining = value;

  for (const candidate of trialPrimes) {
    const prime = BigInt(candidate);
    while (remaining % prime === 0n) {
      factors.push(prime);
      remaining /= prime;
    }
  }

  if (remaining > 1n) {
    factorRecursive(remaining, factors);
  }

  return factors.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
};

const groupFactors = (factors: bigint[]) => {
  const groups = new Map<string, { prime: bigint; count: number }>();

  for (const factor of factors) {
    const key = factor.toString();
    const current = groups.get(key);
    if (current) {
      current.count += 1;
    } else {
      groups.set(key, { prime: factor, count: 1 });
    }
  }

  return Array.from(groups.values());
};

const formatGroupedFactors = (
  groups: Array<{ prime: bigint; count: number }>
): string =>
  groups
    .map((group) =>
      group.count === 1
        ? group.prime.toString()
        : `${group.prime.toString()}^${group.count}`
    )
    .join(' × ');

const buildDivisors = (groups: Array<{ prime: bigint; count: number }>) => {
  const divisors: bigint[] = [1n];

  for (const group of groups) {
    const existing = [...divisors];
    let power = 1n;
    for (let index = 0; index < group.count; index += 1) {
      power *= group.prime;
      for (const divisor of existing) {
        divisors.push(divisor * power);
      }
    }
  }

  return divisors.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
};

type PrimeResult = {
  value: bigint;
  isPrimeValue: boolean;
  groups: Array<{ prime: bigint; count: number }>;
  divisors: bigint[] | null;
  divisorCount: number;
  divisorSum: bigint;
};

const analyze = (value: bigint): PrimeResult => {
  if (value === 0n) {
    return {
      value,
      isPrimeValue: false,
      groups: [],
      divisors: null,
      divisorCount: 0,
      divisorSum: 0n,
    };
  }

  if (value === 1n) {
    return {
      value,
      isPrimeValue: false,
      groups: [],
      divisors: [1n],
      divisorCount: 1,
      divisorSum: 1n,
    };
  }

  const factors = factorize(value);
  const groups = groupFactors(factors);
  const divisorCount = groups.reduce(
    (total, group) => total * (group.count + 1),
    1
  );

  const divisorSum = groups.reduce((total, group) => {
    const numerator = group.prime ** BigInt(group.count + 1) - 1n;
    return total * (numerator / (group.prime - 1n));
  }, 1n);

  const divisors = divisorCount <= 5000 ? buildDivisors(groups) : null;

  return {
    value,
    isPrimeValue: isPrime(value),
    groups,
    divisors,
    divisorCount,
    divisorSum,
  };
};

export default function PrimeFactorizer() {
  const [input, setInput] = useState('360');
  const [result, setResult] = useState<PrimeResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = () => {
    const text = input.trim().replace(/[\s,]/g, '');
    if (!text) {
      setError('Enter a whole number.');
      setResult(null);
      return;
    }
    if (!/^\d+$/.test(text)) {
      setError('Enter a non-negative whole number using digits only.');
      setResult(null);
      return;
    }

    const value = BigInt(text);
    if (value.toString().length > MAX_DIGITS) {
      setError(
        `This tool handles up to ${MAX_DIGITS} digits. That number has ${value.toString().length}.`
      );
      setResult(null);
      return;
    }

    try {
      setError(null);
      setResult(analyze(value));
    } catch (caught) {
      setResult(null);
      setError(
        caught instanceof Error
          ? caught.message
          : 'This number could not be factorized.'
      );
    }
  };

  const output = (() => {
    if (!result) {
      return '';
    }

    if (result.value === 0n) {
      return [
        'Number: 0',
        'Status: neither prime nor composite',
        'Factorization: 0',
        '',
        'Every positive integer divides zero, so a finite divisor list is not meaningful.',
      ].join('\n');
    }

    if (result.value === 1n) {
      return [
        'Number: 1',
        'Status: neither prime nor composite',
        'Factorization: 1',
        'Divisor count: 1',
        'Divisors: 1',
      ].join('\n');
    }

    const factorText =
      result.groups.length > 0
        ? formatGroupedFactors(result.groups)
        : result.value.toString();
    const divisorText =
      result.divisors !== null
        ? result.divisors.join(', ')
        : `Too many divisors to list (${result.divisorCount.toLocaleString()}).`;

    return [
      `Number: ${result.value.toString()}`,
      `Status: ${result.isPrimeValue ? 'prime' : 'composite'}`,
      `Factorization: ${result.value.toString()} = ${factorText}`,
      `Distinct prime factors: ${result.groups.map((group) => group.prime.toString()).join(', ')}`,
      '',
      `Divisor count: ${result.divisorCount.toLocaleString()}`,
      `Sum of divisors: ${result.divisorSum.toString()}`,
      '',
      'Divisors:',
      divisorText,
    ].join('\n');
  })();

  return (
    <ToolLayout>
      <Panel
        description="Deterministic Miller–Rabin primality testing and Pollard rho factorization for numbers up to 20 digits."
        title="Number"
      >
        <div className="space-y-3">
          <Field
            hint={`Up to ${MAX_DIGITS} digits. Commas and spaces are ignored.`}
            label="Whole number"
          >
            <Input
              aria-label="Number to factorize"
              autoComplete="off"
              className="font-mono"
              onChange={(event) => {
                setInput(event.target.value);
                setResult(null);
                setError(null);
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  run();
                }
              }}
              placeholder="360"
              spellCheck={false}
              value={input}
            />
          </Field>

          <div className="flex flex-wrap gap-2">
            <Button onClick={run} variant="primary">
              Factorize
            </Button>
            <Button
              onClick={() => {
                setInput('360');
                setResult(null);
                setError(null);
              }}
              variant="ghost"
            >
              Reset
            </Button>
          </div>

          {result && (
            <Callout variant={result.isPrimeValue ? 'success' : 'info'}>
              {result.value > 1n
                ? result.isPrimeValue
                  ? `${result.value.toString()} is prime.`
                  : `${result.value.toString()} is composite.`
                : '0 and 1 are special cases, not prime or composite.'}
            </Callout>
          )}

          <div className="rounded-md border border-border bg-canvas-inset p-3 text-xs leading-6 text-fg-muted">
            <p>
              Prime testing uses Miller–Rabin with fixed bases that are
              deterministic in this range. Composite inputs are split with
              Pollard’s rho algorithm.
            </p>
          </div>
        </div>
      </Panel>

      <ResultPanel
        emptyText="Enter a number and choose Factorize."
        error={error}
        filename="prime-factorization.txt"
        label="Factorization"
        value={output}
      />
    </ToolLayout>
  );
}
