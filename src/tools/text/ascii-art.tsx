'use client';

import figlet from 'figlet';
import font3d from 'figlet/importable-fonts/3-D.js';
import bannerFont from 'figlet/importable-fonts/Banner.js';
import bigFont from 'figlet/importable-fonts/Big.js';
import doomFont from 'figlet/importable-fonts/Doom.js';
import ghostFont from 'figlet/importable-fonts/Ghost.js';
import slantFont from 'figlet/importable-fonts/Slant.js';
import smallFont from 'figlet/importable-fonts/Small.js';
import standardFont from 'figlet/importable-fonts/Standard.js';
import { useMemo, useState } from 'react';

import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { Select } from '@/components/ui/Select';
import { ToolLayout } from '@/components/ui/ToolLayout';

figlet.parseFont('Standard', standardFont);
figlet.parseFont('Big', bigFont);
figlet.parseFont('Slant', slantFont);
figlet.parseFont('Small', smallFont);
figlet.parseFont('Banner', bannerFont);
figlet.parseFont('Doom', doomFont);
figlet.parseFont('Ghost', ghostFont);
figlet.parseFont('3-D', font3d);

const FONTS = [
  { value: 'Standard', label: 'Standard' },
  { value: 'Big', label: 'Big' },
  { value: 'Slant', label: 'Slant' },
  { value: 'Small', label: 'Small' },
  { value: 'Banner', label: 'Banner' },
  { value: 'Doom', label: 'Doom' },
  { value: 'Ghost', label: 'Ghost' },
  { value: '3-D', label: '3-D' },
] as const;

type FontName = (typeof FONTS)[number]['value'];

export default function AsciiArt() {
  const [input, setInput] = useState('');
  const [font, setFont] = useState<FontName>('Standard');

  const result = useMemo(() => {
    if (!input.trim()) {
      return { text: '', error: null as string | null };
    }

    try {
      return {
        text: figlet.textSync(input, { font }),
        error: null as string | null,
      };
    } catch (error) {
      return {
        text: '',
        error:
          error instanceof Error
            ? error.message
            : 'Unable to render this text.',
      };
    }
  }, [input, font]);

  return (
    <ToolLayout>
      <Panel title="Input">
        <Field
          hint={`${input.length.toLocaleString()} / 200 characters`}
          label="Text"
        >
          <Input
            aria-label="Text to render as ASCII art"
            className="font-mono"
            maxLength={200}
            onChange={(event) => setInput(event.target.value)}
            placeholder="CoderTools"
            value={input}
          />
        </Field>

        <Field
          className="mt-3"
          hint={input.trim() ? undefined : 'Uses patorjk/figlet fonts'}
          label="Font"
        >
          <Select
            aria-label="ASCII art font"
            onChange={(event) => setFont(event.target.value as FontName)}
            value={font}
          >
            {FONTS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>

        <p className="mt-3 text-xs leading-5 text-fg-muted">
          Use a short phrase for the best results. Long strings can produce very
          wide output.
        </p>
      </Panel>

      <ResultPanel
        emptyText="Enter some text to render it as ASCII art."
        error={result.error}
        filename={`ascii-art-${font.toLowerCase()}.txt`}
        label="ASCII art"
        value={result.text}
      >
        {result.text ? (
          <pre className="max-h-[520px] min-h-[230px] overflow-auto whitespace-pre rounded-md border border-border bg-canvas-inset p-3 font-mono text-[11px] leading-[1.15] text-fg">
            {result.text}
          </pre>
        ) : undefined}
      </ResultPanel>
    </ToolLayout>
  );
}
