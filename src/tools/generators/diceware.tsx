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
import { Select } from '@/components/ui/Select';
import { ToolLayout } from '@/components/ui/ToolLayout';
import { Checkbox } from '@/tools/generators/_controls';
import { randomInt } from '@/tools/generators/_random';

/**
 * A small embedded word list. It has exactly 256 entries, so every word adds
 * log2(256) = 8 bits of entropy. The official Diceware list has 7,776 words
 * (~12.9 bits each), but embedding it would add a large data file to the site.
 * Keeping the list here means passphrases never require a network request.
 */
const WORDS =
  'able adapt agile alert amber ankle arch argue ash autumn axe bait band basket bead beaver belt bird blanket blimp boat bonus box bread bright buckle build bus cabin camel candle cap carpet cash cedar chalk cherry chili cider clamp clear cloud coal coffee compass copy couch cover crane creek crop cube cycle desk dime dollar door dress dune easel egg elk enjoy escape face family fence fig fish flash flock foam food frame front fur garden gem giraffe glove goose grape green guide gym hall hare hazel height hint hold hook host hub hut igloo insect ivory jam jelly joke july jury keep kid kiwi koala lamb lap late learn lens lily lip llama lobster lotus lunar lyric maize mammal march mast melon merit middle mine mist mold moose motel mouse mud mushroom nature need news node nose oak oil opera organ owl page panel parrot paw pear pencil petal pig pink plain plume point pool pose power pride prize pump purple quart quiet rabbit raft ram ray reed rice ring roast rocket root royal ruler safe salmon sash saw score search secret send shade sharp shine shore sign sing six skin sleep slope snake sofa solid soul space speed spike sport sprout stack stand stay step sting store strand strike style sun sweet sword tale tape team tent thank think three tight tip toe top tough track tram trend trip truth tunnel twin under usage vase verse view violet vote walk wand water weasel west when wide window wise word wrap yard yield zesty'.split(
    ' '
  );

type Separator = 'hyphen' | 'space' | 'dot' | 'underscore' | 'none';

const SEPARATORS: Record<Separator, string> = {
  hyphen: '-',
  space: ' ',
  dot: '.',
  underscore: '_',
  none: '',
};

const buildPassphrase = (
  wordCount: number,
  separator: Separator,
  capitalize: boolean
) =>
  Array.from({ length: wordCount }, () => {
    const word = WORDS[randomInt(WORDS.length)]!;
    return capitalize ? word.charAt(0).toUpperCase() + word.slice(1) : word;
  }).join(SEPARATORS[separator]);

export default function DicewareGenerator() {
  const [wordCount, setWordCount] = useState('6');
  const [count, setCount] = useState('1');
  const [separator, setSeparator] = useState<Separator>('hyphen');
  const [capitalize, setCapitalize] = useState(false);
  const [output, setOutput] = useState(() =>
    buildPassphrase(6, 'hyphen', false)
  );
  const [error, setError] = useState<string | null>(null);

  const entropy = Number(wordCount) * Math.log2(WORDS.length);

  const generate = () => {
    const parsedWordCount = Number(wordCount);
    const parsedCount = Number(count);

    if (
      !Number.isInteger(parsedWordCount) ||
      parsedWordCount < 4 ||
      parsedWordCount > 8
    ) {
      setError('Choose between 4 and 8 words per passphrase.');
      return;
    }

    if (!Number.isInteger(parsedCount) || parsedCount < 1 || parsedCount > 20) {
      setError('Count must be a whole number between 1 and 20.');
      return;
    }

    setError(null);
    setOutput(
      Array.from({ length: parsedCount }, () =>
        buildPassphrase(parsedWordCount, separator, capitalize)
      ).join('\n')
    );
  };

  return (
    <div className="space-y-4">
      <ToolLayout>
        <Panel
          actions={
            <Badge variant="accent">
              ≈ {Number.isFinite(entropy) ? entropy.toFixed(0) : 0} bits
            </Badge>
          }
          title="Passphrase options"
        >
          <Field
            hint="Longer passphrases are stronger."
            label="Words per passphrase"
          >
            <SegmentedControl
              ariaLabel="Words per passphrase"
              onChange={setWordCount}
              options={[
                { label: '4', value: '4' },
                { label: '5', value: '5' },
                { label: '6', value: '6' },
                { label: '7', value: '7' },
                { label: '8', value: '8' },
              ]}
              value={wordCount}
            />
          </Field>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field htmlFor="diceware-count" hint="1–20" label="How many?">
              <Input
                id="diceware-count"
                max={20}
                min={1}
                onChange={(event) => setCount(event.target.value)}
                type="number"
                value={count}
              />
            </Field>
            <Field htmlFor="diceware-separator" label="Separator">
              <Select
                id="diceware-separator"
                onChange={(event) =>
                  setSeparator(event.target.value as Separator)
                }
                value={separator}
              >
                <option value="hyphen">Hyphen (-)</option>
                <option value="space">Space</option>
                <option value="dot">Dot (.)</option>
                <option value="underscore">Underscore (_)</option>
                <option value="none">None</option>
              </Select>
            </Field>
          </div>

          <div className="mt-3">
            <Checkbox
              checked={capitalize}
              id="diceware-capitalize"
              label="Capitalize each word"
              onChange={setCapitalize}
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button onClick={generate} variant="primary">
              Generate passphrases
            </Button>
            <span className="text-xs text-fg-muted">
              {wordCount} words × 8 bits ={' '}
              {Number.isFinite(entropy) ? entropy.toFixed(0) : 0} bits
            </span>
          </div>

          {error && (
            <Callout className="mt-3" variant="error">
              {error}
            </Callout>
          )}

          <Callout className="mt-4" variant="info" title="About the entropy">
            This tool embeds a 256-word list, so each word contributes 8 bits of
            entropy: 6 words ≈ 48 bits and 8 words ≈ 64 bits. The official
            Diceware list has 7,776 words (~12.9 bits per word), which is
            stronger; this compact list keeps the tool fully offline. Words are
            selected with{' '}
            <code className="rounded bg-canvas-inset px-1">
              crypto.getRandomValues
            </code>
            .
          </Callout>
        </Panel>

        <ResultPanel
          emptyText="Click Generate to create passphrases."
          filename="diceware.txt"
          label="Passphrases"
          value={output}
        />
      </ToolLayout>
    </div>
  );
}
