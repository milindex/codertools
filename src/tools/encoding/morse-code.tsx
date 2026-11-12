'use client';

import { Play } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { Field } from '@/components/ui/Field';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { ToolLayout } from '@/components/ui/ToolLayout';

type Mode = 'encode' | 'decode';
type WordSeparator = '/' | '|';

const MORSE_MAP: Record<string, string> = {
  A: '.-',
  B: '-...',
  C: '-.-.',
  D: '-..',
  E: '.',
  F: '..-.',
  G: '--.',
  H: '....',
  I: '..',
  J: '.---',
  K: '-.-',
  L: '.-..',
  M: '--',
  N: '-.',
  O: '---',
  P: '.--.',
  Q: '--.-',
  R: '.-.',
  S: '...',
  T: '-',
  U: '..-',
  V: '...-',
  W: '.--',
  X: '-..-',
  Y: '-.--',
  Z: '--..',
  '0': '-----',
  '1': '.----',
  '2': '..---',
  '3': '...--',
  '4': '....-',
  '5': '.....',
  '6': '-....',
  '7': '--...',
  '8': '---..',
  '9': '----.',
  '.': '.-.-.-',
  ',': '--..--',
  '?': '..--..',
  "'": '.----.',
  '!': '-.-.--',
  '/': '-..-.',
  '(': '-.--.',
  ')': '-.--.-',
  '&': '.-...',
  ':': '---...',
  ';': '-.-.-.',
  '=': '-...-',
  '+': '.-.-.',
  '-': '-....-',
  _: '..--.-',
  '"': '.-..-.',
  $: '...-..-',
  '@': '.--.-.',
};

const TEXT_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(MORSE_MAP).map(([character, code]) => [code, character])
);

function textToMorse(value: string, wordSeparator: WordSeparator): string {
  const words = value.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return '';
  }

  return words
    .map((word) =>
      Array.from(word.toUpperCase())
        .map((character) => {
          const code = MORSE_MAP[character];
          if (!code) {
            throw new Error(
              `Unsupported character "${character}". Morse code supports A–Z, 0–9 and common punctuation.`
            );
          }
          return code;
        })
        .join(' ')
    )
    .join(` ${wordSeparator} `);
}

function morseToText(value: string): string {
  const normalized = value
    .replace(/\r\n?/g, '\n')
    .replace(/\|/g, '/')
    .replace(/[ \t]{3,}/g, ' / ')
    .trim();

  if (!normalized) {
    return '';
  }
  if (/[^.\-/\s]/.test(normalized)) {
    throw new Error(
      'Morse input can only contain dots, dashes, spaces and / or | word separators.'
    );
  }

  const words = normalized.split(/\s*\/\s*/);
  return words
    .map((word) =>
      word
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((code) => {
          const character = TEXT_MAP[code];
          if (!character) {
            throw new Error(`Unknown Morse code "${code}".`);
          }
          return character;
        })
        .join('')
    )
    .filter(Boolean)
    .join(' ');
}

export default function MorseCodeTool() {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<Mode>('encode');
  const [separator, setSeparator] = useState<WordSeparator>('/');
  const [audioError, setAudioError] = useState<string | null>(null);

  const result = useMemo(() => {
    const isEmpty = mode === 'encode' ? input.length === 0 : !input.trim();
    if (isEmpty) {
      return { value: '', error: null as string | null };
    }
    try {
      return {
        value:
          mode === 'encode'
            ? textToMorse(input, separator)
            : morseToText(input),
        error: null as string | null,
      };
    } catch (error) {
      return {
        value: '',
        error: error instanceof Error ? error.message : 'Conversion failed.',
      };
    }
  }, [input, mode, separator]);

  const audioMorse = useMemo(() => {
    if (result.error) {
      return '';
    }
    try {
      if (mode === 'encode') {
        return input.trim() ? textToMorse(input, '/') : '';
      }
      return result.value ? textToMorse(result.value, '/') : '';
    } catch {
      return '';
    }
  }, [input, mode, result]);

  const play = () => {
    const AudioContextClass = window.AudioContext;
    if (!AudioContextClass) {
      setAudioError('Audio playback is not supported by this browser.');
      return;
    }

    setAudioError(null);
    try {
      const context = new AudioContextClass();
      const unit = 0.09;
      const events: Array<{ start: number; duration: number }> = [];
      const words = audioMorse.split(' / ');
      let time = context.currentTime + 0.08;

      words.forEach((word, wordIndex) => {
        const codes = word.trim().split(/\s+/).filter(Boolean);
        codes.forEach((code, codeIndex) => {
          for (const symbol of code) {
            const duration = symbol === '-' ? unit * 3 : unit;
            events.push({ start: time, duration });
            time += duration + unit;
          }
          if (codeIndex < codes.length - 1) {
            time += unit * 2;
          }
        });
        if (wordIndex < words.length - 1) {
          time += unit * 6;
        }
      });

      if (events.length === 0) {
        void context.close();
        return;
      }

      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = 620;
      gain.gain.setValueAtTime(0, context.currentTime);
      for (const event of events) {
        gain.gain.setValueAtTime(1, event.start);
        gain.gain.setValueAtTime(0, event.start + event.duration);
      }
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      oscillator.stop(time + 0.1);
      oscillator.onended = () => {
        void context.close();
      };
    } catch {
      setAudioError('Audio playback failed.');
    }
  };

  return (
    <div className="space-y-4">
      <ToolLayout>
        <Panel
          actions={
            <SegmentedControl
              ariaLabel="Conversion direction"
              onChange={(value) => setMode(value as Mode)}
              options={[
                { value: 'encode', label: 'Text → Morse' },
                { value: 'decode', label: 'Morse → text' },
              ]}
              value={mode}
            />
          }
          title="Input"
        >
          <Field
            hint={
              mode === 'encode'
                ? `${input.length} characters`
                : 'Dots, dashes, spaces and word separators'
            }
            htmlFor="morse-input"
            label={mode === 'encode' ? 'Text' : 'Morse code'}
          >
            <Textarea
              id="morse-input"
              onChange={(event) => {
                setInput(event.target.value);
                setAudioError(null);
              }}
              placeholder={
                mode === 'encode'
                  ? 'Type text such as SOS…'
                  : 'Paste Morse such as ... --- ...…'
              }
              value={input}
            />
          </Field>

          {mode === 'encode' && (
            <Field
              className="mt-3"
              htmlFor="morse-separator"
              label="Word separator"
            >
              <Select
                id="morse-separator"
                onChange={(event) =>
                  setSeparator(event.target.value as WordSeparator)
                }
                value={separator}
              >
                <option value="/">Slash ( / )</option>
                <option value="|">Pipe ( | )</option>
              </Select>
            </Field>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button disabled={!audioMorse} onClick={play} variant="primary">
              <Play aria-hidden className="h-3.5 w-3.5" />
              Play audio
            </Button>
            <span className="text-xs text-fg-muted">
              Uses the Web Audio API. A dot is 1 unit, a dash is 3 units.
            </span>
          </div>

          {audioError && (
            <p className="mt-2 text-xs text-danger">{audioError}</p>
          )}

          <Callout className="mt-3" variant="info">
            Letters are separated by one space and words by <code>/</code> or{' '}
            <code>|</code>. Punctuation is supported. Audio playback is
            generated locally in your browser.
          </Callout>
        </Panel>

        <ResultPanel
          emptyText="Morse code or decoded text will appear here."
          error={result.error}
          filename={mode === 'encode' ? 'morse.txt' : 'morse-decoded.txt'}
          label={mode === 'encode' ? 'Morse code' : 'Decoded text'}
          value={result.value}
        />
      </ToolLayout>
    </div>
  );
}
