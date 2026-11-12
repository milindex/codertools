'use client';

import { useMemo, useState } from 'react';

import { Callout } from '@/components/ui/Callout';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Textarea } from '@/components/ui/Textarea';
import { ToolLayout } from '@/components/ui/ToolLayout';

import { Checkbox } from './ui';

type Direction = 'tabs-to-spaces' | 'spaces-to-tabs';

const convertLeading = (
  text: string,
  direction: Direction,
  width: number
): string =>
  text.replace(/^[ \t]+/gm, (whitespace) => {
    if (direction === 'tabs-to-spaces') {
      return whitespace.replace(/\t/g, ' '.repeat(width));
    }

    let tabs = 0;
    let spaces = 0;

    for (const character of whitespace) {
      if (character === '\t') {
        tabs += 1;
      } else {
        spaces += 1;
      }
    }

    return (
      '\t'.repeat(tabs + Math.floor(spaces / width)) +
      ' '.repeat(spaces % width)
    );
  });

const convert = (
  text: string,
  direction: Direction,
  width: number,
  leadingOnly: boolean
): string => {
  if (!text) {
    return '';
  }

  if (leadingOnly) {
    return convertLeading(text, direction, width);
  }

  if (direction === 'tabs-to-spaces') {
    return text.replace(/\t/g, ' '.repeat(width));
  }

  return text.replace(new RegExp(` {${width}}`, 'g'), '\t');
};

export default function TabsSpaces() {
  const [input, setInput] = useState('');
  const [direction, setDirection] = useState<Direction>('tabs-to-spaces');
  const [tabWidth, setTabWidth] = useState('4');
  const [leadingOnly, setLeadingOnly] = useState(true);

  const parsedWidth = Number.parseInt(tabWidth, 10);
  const width =
    Number.isFinite(parsedWidth) && parsedWidth >= 1 && parsedWidth <= 16
      ? parsedWidth
      : 4;
  const widthIsValid =
    Number.isFinite(parsedWidth) && parsedWidth >= 1 && parsedWidth <= 16;

  const output = useMemo(
    () => convert(input, direction, width, leadingOnly),
    [input, direction, width, leadingOnly]
  );

  const tabCount = (input.match(/\t/g) ?? []).length;

  return (
    <ToolLayout>
      <Panel title="Input">
        <Field
          hint={`${tabCount.toLocaleString()} tab${
            tabCount === 1 ? '' : 's'
          } · ${(input ? input.split('\n').length : 0).toLocaleString()} lines`}
          label="Text"
        >
          <Textarea
            className="min-h-[300px]"
            onChange={(event) => setInput(event.target.value)}
            placeholder={'function example() {\n\treturn true;\n}'}
            value={input}
          />
        </Field>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <SegmentedControl
            ariaLabel="Conversion direction"
            onChange={(value) => setDirection(value as Direction)}
            options={[
              { value: 'tabs-to-spaces', label: 'Tabs → spaces' },
              { value: 'spaces-to-tabs', label: 'Spaces → tabs' },
            ]}
            value={direction}
          />

          <Field className="w-28" label="Tab width">
            <Input
              aria-label="Tab width"
              max={16}
              min={1}
              onChange={(event) => setTabWidth(event.target.value)}
              type="number"
              value={tabWidth}
            />
          </Field>
        </div>

        <div className="mt-3">
          <Checkbox
            checked={leadingOnly}
            label="Only convert leading indentation"
            onChange={setLeadingOnly}
          />
        </div>

        {!widthIsValid ? (
          <Callout className="mt-3" variant="warning">
            Tab width must be a whole number between 1 and 16. Using 4.
          </Callout>
        ) : null}
      </Panel>

      <ResultPanel
        emptyText="Paste indented text to convert tabs and spaces."
        filename="tabs-spaces.txt"
        label="Converted text"
        value={output}
      >
        {input ? (
          <pre className="max-h-[470px] min-h-[230px] overflow-auto whitespace-pre rounded-md border border-border bg-canvas-inset p-3 font-mono text-[13px] leading-6 text-fg">
            {output}
          </pre>
        ) : undefined}
      </ResultPanel>
    </ToolLayout>
  );
}
