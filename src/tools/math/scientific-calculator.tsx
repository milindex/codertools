'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { ToolLayout } from '@/components/ui/ToolLayout';

type HistoryEntry = {
  expression: string;
  result: string;
};

const keypad: string[][] = [
  ['7', '8', '9', '/'],
  ['4', '5', '6', '*'],
  ['1', '2', '3', '-'],
  ['0', '.', '^', '+'],
];

const functionKeys = [
  'sin(',
  'cos(',
  'tan(',
  'log(',
  'ln(',
  'sqrt(',
  'abs(',
  'exp(',
];

export default function ScientificCalculator() {
  const [expression, setExpression] = useState('sin(pi / 4) + 2^10');
  const [result, setResult] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const append = (token: string) => {
    setExpression((current) => `${current}${token}`);
  };

  const evaluate = async () => {
    if (!expression.trim()) {
      setError('Enter an expression first.');
      setResult('');
      return;
    }

    if (expression.length > 1000) {
      setError('Expression is too long (maximum 1,000 characters).');
      setResult('');
      return;
    }

    setBusy(true);
    setError(null);

    try {
      // Loaded on demand so the mathjs bundle stays out of the main chunk.
      const math = await import('mathjs');
      const value = math.evaluate(expression);
      const formatted = math.format(value, { precision: 14 });

      setResult(formatted);
      setHistory((current) =>
        [
          { expression: expression.trim(), result: formatted },
          ...current,
        ].slice(0, 20)
      );
    } catch (caught) {
      const message =
        caught instanceof Error
          ? caught.message
          : 'The expression could not be evaluated.';
      setError(message);
      setResult('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <ToolLayout>
        <Panel
          description="Powered by mathjs. Supports trigonometry, logarithms, constants, powers, factorials and more."
          title="Expression"
        >
          <div className="space-y-3">
            <Field
              hint="Press Enter to evaluate. Use ^ for powers and ! for factorials."
              label="Expression"
            >
              <Input
                aria-label="Scientific expression"
                autoComplete="off"
                className="font-mono"
                onChange={(event) => {
                  setExpression(event.target.value);
                  setError(null);
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    void evaluate();
                  }
                }}
                placeholder="e.g. sin(pi / 4) + 2^10"
                spellCheck={false}
                value={expression}
              />
            </Field>

            <div className="grid grid-cols-4 gap-1.5">
              {keypad.flat().map((key) => (
                <Button
                  className="font-mono text-base"
                  key={key}
                  onClick={() => append(key)}
                  size="md"
                  variant="default"
                >
                  {key}
                </Button>
              ))}
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {functionKeys.map((key) => (
                <Button
                  className="font-mono text-[11px]"
                  key={key}
                  onClick={() => append(key)}
                  size="sm"
                  variant="default"
                >
                  {key.replace('(', '')}
                </Button>
              ))}
            </div>

            <div className="grid grid-cols-5 gap-1.5">
              {['pi', 'e', '(', ')', '!'].map((key) => (
                <Button
                  className="font-mono"
                  key={key}
                  onClick={() => append(key)}
                  size="sm"
                  variant="default"
                >
                  {key}
                </Button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                disabled={busy}
                onClick={() => void evaluate()}
                variant="primary"
              >
                {busy ? 'Evaluating…' : 'Evaluate'}
              </Button>
              <Button
                onClick={() => {
                  setExpression('');
                  setResult('');
                  setError(null);
                }}
                variant="ghost"
              >
                Clear
              </Button>
              <Button
                onClick={() => setExpression((current) => current.slice(0, -1))}
                variant="ghost"
              >
                Backspace
              </Button>
            </div>

            {error && (
              <Callout title="Expression error" variant="error">
                {error}
              </Callout>
            )}
          </div>
        </Panel>

        <ResultPanel
          emptyText="Evaluate an expression to see the result."
          filename="scientific-result.txt"
          label="Result"
          value={result}
        />
      </ToolLayout>

      <Panel
        description={
          history.length > 0
            ? 'Select an entry to load it back into the expression box.'
            : 'Evaluated expressions will appear here.'
        }
        title="History"
      >
        {history.length === 0 ? (
          <p className="text-sm text-fg-muted">No calculations yet.</p>
        ) : (
          <div className="space-y-1.5">
            {history.map((entry, index) => (
              <button
                className="flex w-full flex-col gap-0.5 rounded-md border border-border bg-canvas-inset px-3 py-2 text-left transition-colors hover:border-accent sm:flex-row sm:items-center sm:justify-between"
                key={`${entry.expression}-${index}`}
                onClick={() => {
                  setExpression(entry.expression);
                  setResult(entry.result);
                  setError(null);
                }}
                type="button"
              >
                <span className="break-all font-mono text-xs text-fg-muted">
                  {entry.expression}
                </span>
                <span className="break-all font-mono text-xs font-semibold text-fg">
                  = {entry.result}
                </span>
              </button>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
