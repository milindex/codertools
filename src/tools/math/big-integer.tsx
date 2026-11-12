'use client';

import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { ToolLayout } from '@/components/ui/ToolLayout';
import { groupDigits, toBaseString } from '@/tools/math/shared';

const MAX_DIGITS = 50000;

class ExpressionError extends Error {}

const countDigits = (value: bigint): number => {
  const magnitude = value < 0n ? -value : value;
  return magnitude === 0n ? 1 : magnitude.toString().length;
};

const safePower = (base: bigint, exponent: bigint): bigint => {
  if (exponent < 0n) {
    throw new ExpressionError(
      'Negative exponents are not supported with integer division. Use 1 / (base ** n).'
    );
  }

  if (exponent > 10000n) {
    throw new ExpressionError('Exponent is too large (maximum 10,000).');
  }

  const baseDigits = countDigits(base);
  if (
    (base < 0n ? -base : base) > 1n &&
    baseDigits * Number(exponent) > MAX_DIGITS
  ) {
    throw new ExpressionError(
      `Result would exceed ${MAX_DIGITS.toLocaleString()} digits.`
    );
  }

  return base ** exponent;
};

class BigIntParser {
  private position = 0;

  constructor(private readonly source: string) {}

  parse(): bigint {
    const value = this.parseExpression();
    this.skipWhitespace();
    if (this.position < this.source.length) {
      throw new ExpressionError(
        `Unexpected “${this.source[this.position]}” at position ${this.position + 1}.`
      );
    }
    return value;
  }

  private peek(): string {
    return this.source[this.position] ?? '';
  }

  private skipWhitespace(): void {
    while (/\s/.test(this.peek())) {
      this.position += 1;
    }
  }

  private parseExpression(): bigint {
    let value = this.parseTerm();

    for (;;) {
      this.skipWhitespace();
      const operator = this.peek();
      if (operator !== '+' && operator !== '-') {
        break;
      }
      this.position += 1;
      const right = this.parseTerm();
      value = operator === '+' ? value + right : value - right;
    }

    return value;
  }

  private parseTerm(): bigint {
    let value = this.parseUnary();

    for (;;) {
      this.skipWhitespace();
      const operator = this.peek();
      if (operator === '*' && this.source[this.position + 1] === '*') {
        throw new ExpressionError(
          `Unexpected “**” at position ${this.position + 1}.`
        );
      }
      if (operator !== '*' && operator !== '/' && operator !== '%') {
        break;
      }
      this.position += 1;

      const right = this.parseUnary();
      if ((operator === '/' || operator === '%') && right === 0n) {
        throw new ExpressionError('Division by zero.');
      }

      if (operator === '*') {
        value *= right;
      } else if (operator === '/') {
        value /= right;
      } else {
        value %= right;
      }

      if (countDigits(value) > MAX_DIGITS) {
        throw new ExpressionError(
          `Result exceeds ${MAX_DIGITS.toLocaleString()} digits.`
        );
      }
    }

    return value;
  }

  private parseUnary(): bigint {
    this.skipWhitespace();
    const character = this.peek();

    if (character === '+' || character === '-') {
      this.position += 1;
      const value = this.parseUnary();
      return character === '-' ? -value : value;
    }

    return this.parsePower();
  }

  private parsePower(): bigint {
    const base = this.parsePrimary();
    this.skipWhitespace();

    if (this.peek() === '*' && this.source[this.position + 1] === '*') {
      this.position += 2;
      const exponent = this.parseUnary();
      return safePower(base, exponent);
    }

    return base;
  }

  private parsePrimary(): bigint {
    this.skipWhitespace();
    const character = this.peek();

    if (character === '(') {
      this.position += 1;
      const value = this.parseExpression();
      this.skipWhitespace();
      if (this.peek() !== ')') {
        throw new ExpressionError('Missing closing parenthesis.');
      }
      this.position += 1;
      return value;
    }

    const rest = this.source.slice(this.position);
    const match = rest.match(
      /^(?:0[xX][0-9a-fA-F_]+|0[bB][01_]+|0[oO][0-7_]+|\d[\d_]*)/
    );

    if (!match) {
      throw new ExpressionError(
        character
          ? `Expected a number or “(” at position ${this.position + 1}, found “${character}”.`
          : 'Unexpected end of expression.'
      );
    }

    this.position += match[0].length;
    return BigInt(match[0].replace(/_/g, ''));
  }
}

const evaluateExpression = (expression: string): bigint => {
  if (expression.length > 2000) {
    throw new ExpressionError(
      'Expression is too long (maximum 2,000 characters).'
    );
  }

  if (!expression.trim()) {
    throw new ExpressionError('Enter an expression to evaluate.');
  }

  return new BigIntParser(expression).parse();
};

const examples = [
  '2 ** 256 - 1',
  '(2 ** 128) / 7',
  '12345678901234567890 * 98765432109876543210',
  '(10 ** 50) % 97',
  '0xFF * 0b1010',
  '-(3 + 4) * 5',
];

export default function BigInteger() {
  const [expression, setExpression] = useState('2 ** 256 - 1');

  const result = useMemo(() => {
    if (!expression.trim()) {
      return { error: null, value: '' };
    }

    try {
      const value = evaluateExpression(expression);
      const digits = countDigits(value);
      const lines = [
        `Expression: ${expression}`,
        '',
        `Result: ${value.toString()}`,
        `Grouped: ${groupDigits(value)}`,
        '',
        `Digits: ${digits.toLocaleString()}`,
        `Sign: ${value < 0n ? 'negative' : value > 0n ? 'positive' : 'zero'}`,
        `Parity: ${value % 2n === 0n ? 'even' : 'odd'}`,
      ];

      if (digits <= 2000) {
        lines.push(`Hexadecimal: ${toBaseString(value, 16, true, true)}`);
      }

      return { error: null, value: lines.join('\n') };
    } catch (error) {
      return {
        error:
          error instanceof Error
            ? error.message
            : 'The expression could not be evaluated.',
        value: '',
      };
    }
  }, [expression]);

  return (
    <ToolLayout>
      <Panel
        description="Arbitrary-precision integer arithmetic. Supports +, -, *, /, %, ** and parentheses. Division truncates toward zero."
        title="Expression"
      >
        <div className="space-y-3">
          <Field
            hint="Integer literals may be decimal, 0x hex, 0b binary or 0o octal."
            label="BigInt expression"
          >
            <Input
              aria-label="BigInt expression"
              autoComplete="off"
              className="font-mono"
              onChange={(event) => setExpression(event.target.value)}
              placeholder="2 ** 256 - 1"
              spellCheck={false}
              value={expression}
            />
          </Field>

          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setExpression('')} size="sm" variant="ghost">
              Clear
            </Button>
            <Button
              onClick={() => setExpression('2 ** 256 - 1')}
              size="sm"
              variant="default"
            >
              Reset example
            </Button>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold text-fg">Examples</p>
            <div className="flex flex-wrap gap-1.5">
              {examples.map((example) => (
                <button
                  className="cursor-pointer rounded border border-border bg-canvas-inset px-2 py-1 font-mono text-[11px] text-fg-muted transition-colors hover:border-accent hover:text-fg"
                  key={example}
                  onClick={() => setExpression(example)}
                  type="button"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>

          <Callout variant="info">
            <span className="font-mono">**</span> is right-associative, so{' '}
            <span className="font-mono">2 ** 3 ** 2</span> means{' '}
            <span className="font-mono">2 ** 9</span>. Results are capped at{' '}
            {MAX_DIGITS.toLocaleString()} digits to keep the page responsive.
          </Callout>
        </div>
      </Panel>

      <ResultPanel
        error={result.error}
        filename="big-integer-result.txt"
        label="Result"
        value={result.value}
      />
    </ToolLayout>
  );
}
