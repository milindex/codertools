'use client';

import { useState } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { CopyButton } from '@/components/ui/CopyButton';
import { Field } from '@/components/ui/Field';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { Textarea } from '@/components/ui/Textarea';
import { ToolLayout } from '@/components/ui/ToolLayout';

import { convertCssToTailwind, type TailwindConversion } from './tailwind';

const SAMPLE = `.card {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  background-color: #ffffff;
  border: 1px solid #d0d7de;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgb(0 0 0 / 0.1);
}

.card__title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  line-height: 1.25;
  color: #1f2328;
  letter-spacing: -0.025em;
}

.card__body {
  color: #57606a;
  font-size: 14px;
  max-width: 65ch;
}

@media (min-width: 768px) {
  .card {
    flex-direction: row;
    align-items: center;
  }
}

.card:hover {
  border-color: #0969da;
  transform: translateY(-2px);
  transition: all 150ms ease;
}`;

export default function CssToTailwind() {
  const [input, setInput] = useState('');
  const [conversion, setConversion] = useState<TailwindConversion | null>(null);
  const [error, setError] = useState<string | null>(null);

  const convert = () => {
    if (!input.trim()) {
      setConversion(null);
      setError('Paste some CSS to convert.');
      return;
    }
    setError(null);
    try {
      const result = convertCssToTailwind(input);
      if (result.rules.length === 0) {
        setConversion(null);
        setError(
          'No CSS rules were found. Include at least one selector block, such as .card { display: flex; }.'
        );
        return;
      }
      setConversion(result);
    } catch {
      setConversion(null);
      setError('The CSS could not be converted.');
    }
  };

  return (
    <ToolLayout>
      <Panel title="Input">
        <Field
          hint={`${input.length.toLocaleString()} characters`}
          htmlFor="css-tailwind-input"
          label="CSS source"
        >
          <Textarea
            id="css-tailwind-input"
            onChange={(event) => {
              setInput(event.target.value);
              setConversion(null);
              setError(null);
            }}
            placeholder={'.card {\n  display: flex;\n  padding: 16px;\n}'}
            rows={16}
            value={input}
          />
        </Field>

        <div className="mt-3 flex flex-wrap gap-2">
          <Button onClick={convert} variant="primary">
            Convert to Tailwind
          </Button>
          <Button
            onClick={() => {
              setInput(SAMPLE);
              setConversion(null);
              setError(null);
            }}
            variant="default"
          >
            Load sample
          </Button>
          <Button
            onClick={() => {
              setInput('');
              setConversion(null);
              setError(null);
            }}
            variant="ghost"
          >
            Clear
          </Button>
        </div>

        <Callout className="mt-3" variant="info">
          Common declarations are translated to Tailwind utilities. Values that
          are not on the default scale become arbitrary values, and anything
          without a direct equivalent is listed as unmapped. Responsive prefixes
          are not inferred from <code>@media</code> blocks.
        </Callout>

        {error && (
          <Callout className="mt-3" variant="error">
            {error}
          </Callout>
        )}
      </Panel>

      <ResultPanel
        emptyText="Tailwind utility classes will appear here."
        error={error}
        filename="tailwind-classes.txt"
        label="Tailwind classes"
        value={conversion?.text ?? ''}
      >
        {conversion ? (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge variant="success">
                {conversion.mappedCount} declarations mapped
              </Badge>
              <Badge
                variant={conversion.unmappedCount > 0 ? 'warning' : 'default'}
              >
                {conversion.unmappedCount} unmapped
              </Badge>
              <Badge>{conversion.rules.length} rules</Badge>
            </div>

            {conversion.atRules.length > 0 && (
              <Callout variant="warning" title="At-rules found">
                {conversion.atRules.join(', ')}. Declarations nested in{' '}
                <code>@media</code> are converted without a responsive prefix,
                so add the matching prefix (for example <code>md:</code>{' '}
                yourself). Other at-rules such as <code>@font-face</code> and{' '}
                <code>@keyframes</code> are not converted.
              </Callout>
            )}

            <div className="space-y-3">
              {conversion.rules.map((rule, index) => {
                const classLine =
                  rule.classes.length > 0
                    ? rule.classes.join(' ')
                    : 'No Tailwind classes generated.';
                return (
                  <div
                    className="rounded-md border border-border bg-canvas-inset p-3"
                    key={`${rule.selector}-${index}`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <code className="break-all text-xs text-fg">
                        {rule.atRule
                          ? `${rule.atRule} → ${rule.selector}`
                          : rule.selector}
                      </code>
                      {rule.classes.length > 0 && (
                        <CopyButton label="Copy classes" value={classLine} />
                      )}
                    </div>

                    <p className="mt-2 break-words font-mono text-[13px] leading-6 text-fg">
                      {classLine}
                    </p>

                    {rule.notes.map((note) => (
                      <p className="mt-1 text-xs text-attention" key={note}>
                        {note}
                      </p>
                    ))}

                    {rule.unmapped.length > 0 && (
                      <div className="mt-2 border-t border-border pt-2">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-fg-muted">
                          Unmapped declarations
                        </p>
                        <ul className="mt-1 space-y-0.5">
                          {rule.unmapped.map(
                            (declaration, declarationIndex) => (
                              <li
                                className="break-all font-mono text-xs text-fg-muted"
                                key={`${declaration.property}-${declarationIndex}`}
                              >
                                {declaration.property}: {declaration.value}
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : undefined}
      </ResultPanel>
    </ToolLayout>
  );
}
