'use client';

import { useMemo, useState } from 'react';

import { Field } from '@/components/ui/Field';
import { Panel } from '@/components/ui/Panel';
import { Textarea } from '@/components/ui/Textarea';
import { ToolLayout } from '@/components/ui/ToolLayout';

import { StatCard } from './ui';

const countWords = (text: string): number => {
  if (!text.trim()) {
    return 0;
  }

  if (typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function') {
    const segmenter = new Intl.Segmenter(undefined, { granularity: 'word' });
    let words = 0;
    for (const segment of segmenter.segment(text)) {
      if (segment.isWordLike) {
        words += 1;
      }
    }
    return words;
  }

  return text.trim().split(/\s+/u).filter(Boolean).length;
};

const countGraphemes = (text: string): number => {
  if (!text) {
    return 0;
  }

  if (typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function') {
    const segmenter = new Intl.Segmenter(undefined, {
      granularity: 'grapheme',
    });
    let graphemes = 0;
    for (const _segment of segmenter.segment(text)) {
      graphemes += 1;
    }
    return graphemes;
  }

  return Array.from(text).length;
};

const countSentences = (text: string): number => {
  const trimmed = text.trim();
  if (!trimmed) {
    return 0;
  }

  const matches = trimmed.match(/[^.!?…\n]+[.!?…]+|[^.!?…\n]+$/gu);
  return matches ? matches.filter((part) => part.trim()).length : 0;
};

const countParagraphs = (text: string): number => {
  if (!text.trim()) {
    return 0;
  }

  return text.split(/\n\s*\n/u).filter((part) => part.trim()).length;
};

const countLines = (text: string): number => {
  if (!text) {
    return 0;
  }

  return text.split(/\r\n|\r|\n/u).length;
};

const formatReadingTime = (words: number): string => {
  if (words === 0) {
    return '0 sec';
  }

  const seconds = Math.ceil((words / 200) * 60);
  if (seconds < 60) {
    return `${seconds} sec`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return remainder === 0 ? `${minutes} min` : `${minutes} min ${remainder} sec`;
};

const formatBytes = (bytes: number): string =>
  `${bytes.toLocaleString()} ${bytes === 1 ? 'byte' : 'bytes'}`;

export default function TextCounter() {
  const [input, setInput] = useState('');

  const stats = useMemo(() => {
    const words = countWords(input);
    const characters = Array.from(input).length;
    const charactersNoSpaces = Array.from(input.replace(/\s/gu, '')).length;
    const bytes = new TextEncoder().encode(input).length;

    return {
      words,
      characters,
      charactersNoSpaces,
      lines: countLines(input),
      sentences: countSentences(input),
      paragraphs: countParagraphs(input),
      graphemes: countGraphemes(input),
      bytes,
      readingTime: formatReadingTime(words),
    };
  }, [input]);

  return (
    <ToolLayout>
      <Panel title="Input">
        <Field
          hint={`${stats.graphemes.toLocaleString()} graphemes`}
          label="Text"
        >
          <Textarea
            className="min-h-[340px]"
            onChange={(event) => setInput(event.target.value)}
            placeholder="Paste or type text to count words, characters and more…"
            value={input}
          />
        </Field>
      </Panel>

      <Panel
        description="Counts update as you type. Words and graphemes use Intl.Segmenter where available."
        title="Statistics"
      >
        <div className="grid grid-cols-2 gap-2.5">
          <StatCard label="Words" value={stats.words.toLocaleString()} />
          <StatCard
            hint="including spaces"
            label="Characters"
            value={stats.characters.toLocaleString()}
          />
          <StatCard
            hint="spaces removed"
            label="Characters"
            value={stats.charactersNoSpaces.toLocaleString()}
          />
          <StatCard label="Lines" value={stats.lines.toLocaleString()} />
          <StatCard
            label="Sentences"
            value={stats.sentences.toLocaleString()}
          />
          <StatCard
            label="Paragraphs"
            value={stats.paragraphs.toLocaleString()}
          />
          <StatCard
            hint="UTF-8 encoded"
            label="Bytes"
            value={formatBytes(stats.bytes)}
          />
          <StatCard
            hint={input ? undefined : 'about 200 words per minute'}
            label="Reading time"
            value={stats.readingTime}
          />
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2.5">
          <StatCard
            hint="user-perceived characters"
            label="Graphemes"
            value={stats.graphemes.toLocaleString()}
          />
          <StatCard
            hint="approximate"
            label="Words / sentence"
            value={
              stats.sentences > 0
                ? (stats.words / stats.sentences).toFixed(1)
                : '0.0'
            }
          />
        </div>
      </Panel>
    </ToolLayout>
  );
}
