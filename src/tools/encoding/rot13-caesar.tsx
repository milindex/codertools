'use client';

import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Textarea } from '@/components/ui/Textarea';
import { ToolLayout } from '@/components/ui/ToolLayout';

type Mode = 'encode' | 'decode';

function shiftText(value: string, shift: number): string {
  let output = '';
  for (const char of value) {
    const code = char.charCodeAt(0);
    if (code >= 65 && code <= 90) {
      output += String.fromCharCode(65 + ((code - 65 + shift) % 26));
    } else if (code >= 97 && code <= 122) {
      output += String.fromCharCode(97 + ((code - 97 + shift) % 26));
    } else {
      output += char;
    }
  }
  return output;
}

export default function Rot13CaesarTool() {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<Mode>('encode');
  const [shiftInput, setShiftInput] = useState('13');

  const shift = Number(shiftInput);
  const shiftError =
    !Number.isInteger(shift) || shift < 1 || shift > 25
      ? 'Shift must be a whole number from 1 to 25.'
      : null;

  const result = useMemo(() => {
    if (!input || shiftError) {
      return { value: '', error: null as string | null };
    }
    const effectiveShift = mode === 'encode' ? shift : 26 - shift;
    return {
      value: shiftText(input, effectiveShift),
      error: null as string | null,
    };
  }, [input, mode, shift, shiftError]);

  return (
    <div className="space-y-4">
      <ToolLayout>
        <Panel
          actions={
            <SegmentedControl
              ariaLabel="Cipher direction"
              onChange={(value) => setMode(value as Mode)}
              options={[
                { value: 'encode', label: 'Encode' },
                { value: 'decode', label: 'Decode' },
              ]}
              value={mode}
            />
          }
          title="Input"
        >
          <Field
            hint={`${input.length} characters`}
            htmlFor="caesar-input"
            label="Text"
          >
            <Textarea
              id="caesar-input"
              onChange={(event) => setInput(event.target.value)}
              placeholder="Type or paste text to shift…"
              value={input}
            />
          </Field>

          <div className="mt-3 flex flex-wrap items-end gap-3">
            <Field
              className="w-32"
              hint="1–25"
              htmlFor="caesar-shift"
              label="Shift"
            >
              <Input
                id="caesar-shift"
                max={25}
                min={1}
                onChange={(event) => setShiftInput(event.target.value)}
                step={1}
                type="number"
                value={shiftInput}
              />
            </Field>
            <Button onClick={() => setShiftInput('13')}>Reset to ROT13</Button>
          </div>

          <Callout className="mt-3" variant="info">
            Letters A–Z and a–z are rotated by the shift; case is preserved.
            Digits, punctuation, spaces and non-Latin characters are unchanged.
            A shift of 13 is ROT13; decoding applies the inverse shift.
          </Callout>
        </Panel>

        <ResultPanel
          emptyText="Shifted text will appear here."
          error={shiftError}
          filename="caesar-result.txt"
          label={mode === 'encode' ? 'Shifted text' : 'Decoded text'}
          value={result.value}
        />
      </ToolLayout>
    </div>
  );
}
