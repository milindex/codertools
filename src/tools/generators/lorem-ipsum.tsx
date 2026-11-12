'use client';

import { useState } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { ToolLayout } from '@/components/ui/ToolLayout';
import { Checkbox } from '@/tools/generators/_controls';
import { randomInt } from '@/tools/generators/_random';

type Unit = 'paragraphs' | 'sentences' | 'words';

const LOREM_WORDS =
  'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum vestibulum curabitur pellentesque integer facilisis nullam varius nunc velit auctor laoreet'.split(
    ' '
  );

const pickWord = () => LOREM_WORDS[randomInt(LOREM_WORDS.length)]!;

const buildSentence = (wordCount: number, startWithLorem: boolean) => {
  const words = Array.from({ length: wordCount }, pickWord);

  if (startWithLorem) {
    words[0] = 'Lorem';
    if (words.length > 1) {
      words[1] = 'ipsum';
    }
  }

  const text = words.join(' ');
  return text.charAt(0).toUpperCase() + text.slice(1) + '.';
};

const buildParagraph = (startWithLorem: boolean) => {
  const sentenceCount = 3 + randomInt(4);

  return Array.from({ length: sentenceCount }, (_, index) =>
    buildSentence(8 + randomInt(9), startWithLorem && index === 0)
  ).join(' ');
};

const buildWords = (count: number, startWithLorem: boolean) => {
  const words = Array.from({ length: count }, pickWord);

  if (startWithLorem) {
    if (words.length > 0) {
      words[0] = 'Lorem';
    }
    if (words.length > 1) {
      words[1] = 'ipsum';
    }
  }

  return words.join(' ');
};

const limits: Record<
  Unit,
  { max: number; defaultAmount: string; hint: string }
> = {
  paragraphs: { max: 25, defaultAmount: '3', hint: '1–25' },
  sentences: { max: 100, defaultAmount: '5', hint: '1–100' },
  words: { max: 2000, defaultAmount: '50', hint: '1–2000' },
};

export default function LoremIpsumGenerator() {
  const [unit, setUnit] = useState<Unit>('paragraphs');
  const [amount, setAmount] = useState('3');
  const [startWithLorem, setStartWithLorem] = useState(true);
  const [output, setOutput] = useState(() =>
    Array.from({ length: 3 }, () => buildParagraph(true)).join('\n\n')
  );
  const [error, setError] = useState<string | null>(null);

  const changeUnit = (nextUnit: Unit) => {
    setUnit(nextUnit);
    setAmount(limits[nextUnit].defaultAmount);
    setError(null);
  };

  const generate = () => {
    const parsedAmount = Number(amount);

    if (
      !Number.isInteger(parsedAmount) ||
      parsedAmount < 1 ||
      parsedAmount > limits[unit].max
    ) {
      setError(
        `Enter a whole number from 1 to ${limits[unit].max} for ${unit}.`
      );
      return;
    }

    setError(null);

    if (unit === 'paragraphs') {
      setOutput(
        Array.from({ length: parsedAmount }, () =>
          buildParagraph(startWithLorem)
        ).join('\n\n')
      );
      return;
    }

    if (unit === 'sentences') {
      setOutput(
        Array.from({ length: parsedAmount }, (_, index) =>
          buildSentence(8 + randomInt(9), startWithLorem && index === 0)
        ).join(' ')
      );
      return;
    }

    setOutput(buildWords(parsedAmount, startWithLorem));
  };

  return (
    <div className="space-y-4">
      <ToolLayout>
        <Panel
          actions={<Badge variant="accent">Placeholder text</Badge>}
          title="Options"
        >
          <Field label="Unit">
            <SegmentedControl
              ariaLabel="Output unit"
              onChange={(value) => changeUnit(value as Unit)}
              options={[
                { label: 'Paragraphs', value: 'paragraphs' },
                { label: 'Sentences', value: 'sentences' },
                { label: 'Words', value: 'words' },
              ]}
              value={unit}
            />
          </Field>

          <Field
            className="mt-4"
            hint={limits[unit].hint}
            htmlFor="lorem-amount"
            label="Amount"
          >
            <Input
              id="lorem-amount"
              max={limits[unit].max}
              min={1}
              onChange={(event) => setAmount(event.target.value)}
              type="number"
              value={amount}
            />
          </Field>

          <div className="mt-3">
            <Checkbox
              checked={startWithLorem}
              id="lorem-start"
              label='Start with "Lorem ipsum"'
              onChange={setStartWithLorem}
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button onClick={generate} variant="primary">
              Generate text
            </Button>
            <span className="text-xs text-fg-muted">
              Words are drawn at random from a built-in Latin word list.
            </span>
          </div>

          {error && (
            <Callout className="mt-3" variant="error">
              {error}
            </Callout>
          )}

          <Callout className="mt-4" variant="info">
            &ldquo;Lorem ipsum&rdquo; is scrambled Latin from Cicero&apos;s De
            finibus, used as visual placeholder text since the 1960s. It has no
            meaning and is not a translation.
          </Callout>
        </Panel>

        <ResultPanel
          emptyText="Click Generate to create placeholder text."
          filename="lorem-ipsum.txt"
          label="Lorem ipsum"
          value={output}
        />
      </ToolLayout>
    </div>
  );
}
