'use client';

import { useState } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { CodeBlock } from '@/components/ui/CodeBlock';
import { DownloadButton } from '@/components/ui/DownloadButton';
import { Field } from '@/components/ui/Field';
import { FileDropzone } from '@/components/ui/FileDropzone';
import { Panel } from '@/components/ui/Panel';
import { Textarea } from '@/components/ui/Textarea';
import { ToolLayout } from '@/components/ui/ToolLayout';

import { formatBytes, Stat, StatGrid } from './shared';

type SvgoOptimize = (
  input: string,
  options?: { multipass?: boolean }
) => { data: string };

const SAMPLE_SVG = `<?xml version="1.0" encoding="UTF-8"?>
<!-- Generator: an old design tool -->
<svg xmlns="http://www.w3.org/2000/svg" width="240" height="160" viewBox="0 0 240 160">
  <metadata>Created by an example editor</metadata>
  <g id="Layer_1" data-name="Layer 1">
    <rect x="0" y="0" width="240" height="160" rx="16" fill="#0d1117"></rect>
    <circle cx="78" cy="80" r="42" fill="#2f81f7"></circle>
    <path d="M 130 122 L 164 46 L 198 122 Z" fill="#3fb950"></path>
  </g>
</svg>`;

const byteLength = (value: string) => new TextEncoder().encode(value).length;

const basicOptimize = (source: string) =>
  source
    .replace(/<\?xml[\s\S]*?\?>/gi, '')
    .replace(/<!DOCTYPE[\s\S]*?>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<metadata[\s\S]*?<\/metadata>/gi, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/>\s+</g, '><')
    .trim();

export default function SvgOptimizer() {
  const [input, setInput] = useState(SAMPLE_SVG);
  const [output, setOutput] = useState<string | null>(null);
  const [fallback, setFallback] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onFiles = async (files: File[]) => {
    const next = files[0];
    if (!next) {
      return;
    }
    if (
      !next.name.toLowerCase().endsWith('.svg') &&
      next.type !== 'image/svg+xml'
    ) {
      setError('Choose an .svg file or paste SVG markup.');
      return;
    }
    try {
      setInput(await next.text());
      setOutput(null);
      setError(null);
    } catch {
      setError('The SVG file could not be read.');
    }
  };

  const optimizeSvg = async () => {
    const source = input.trim();
    if (!source) {
      setError('Paste SVG markup first.');
      return;
    }
    if (!/<svg[\s>]/i.test(source)) {
      setError('The input does not contain an <svg> element.');
      return;
    }
    setBusy(true);
    setError(null);
    setOutput(null);

    try {
      let optimizeFn: SvgoOptimize | null = null;
      try {
        const svgo = await import('svgo/browser');
        optimizeFn = svgo.optimize as SvgoOptimize;
      } catch {
        optimizeFn = null;
      }

      if (optimizeFn) {
        const result = optimizeFn(source, { multipass: true });
        setOutput(result.data);
        setFallback(false);
      } else {
        setOutput(basicOptimize(source));
        setFallback(true);
      }
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'The SVG could not be optimized. Check the markup and try again.'
      );
    } finally {
      setBusy(false);
    }
  };

  const before = byteLength(input);
  const after = output ? byteLength(output) : 0;
  const savings = before > 0 && output ? ((before - after) / before) * 100 : 0;

  return (
    <div className="space-y-4">
      <ToolLayout>
        <Panel
          description="SVGO removes editor metadata, comments and redundant attributes."
          footer={
            <div className="flex flex-wrap items-center gap-2">
              <Button
                disabled={busy}
                onClick={() => void optimizeSvg()}
                variant="primary"
              >
                {busy ? 'Optimizing…' : 'Optimize SVG'}
              </Button>
              <Button
                onClick={() => {
                  setInput(SAMPLE_SVG);
                  setOutput(null);
                  setError(null);
                }}
                variant="ghost"
              >
                Load sample
              </Button>
            </div>
          }
          title="SVG input"
        >
          <FileDropzone
            accept=".svg,image/svg+xml"
            hint="Read locally as text"
            label="Drop an SVG file here, or click to browse"
            onFiles={(files) => void onFiles(files)}
          />
          <div className="mt-3">
            <Field
              hint={`${formatBytes(before)} · ${input.length.toLocaleString()} characters`}
              htmlFor="optimizer-input"
              label="SVG markup"
            >
              <Textarea
                id="optimizer-input"
                onChange={(event) => {
                  setInput(event.target.value);
                  setOutput(null);
                  setError(null);
                }}
                placeholder={'<svg xmlns="…">…</svg>'}
                spellCheck={false}
                value={input}
              />
            </Field>
          </div>
          {error && (
            <Callout className="mt-3" variant="error">
              {error}
            </Callout>
          )}
        </Panel>

        <Panel
          actions={
            output ? (
              <DownloadButton
                filename="optimized.svg"
                label="Download SVG"
                mime="image/svg+xml"
                value={output}
              />
            ) : undefined
          }
          title="Optimized SVG"
        >
          {output ? (
            <div className="space-y-3">
              <StatGrid>
                <Stat label="Before" value={formatBytes(before)} />
                <Stat label="After" value={formatBytes(after)} />
                <Stat
                  label="Savings"
                  value={
                    <span
                      className={
                        savings >= 0 ? 'text-success' : 'text-attention'
                      }
                    >
                      {savings.toFixed(1)}%
                    </span>
                  }
                />
                <Stat label="Difference" value={formatBytes(before - after)} />
              </StatGrid>

              {fallback ? (
                <Callout variant="warning" title="Basic optimizer used">
                  The SVGO browser bundle could not be loaded, so only comments,
                  metadata and extra whitespace were removed.
                </Callout>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="success">SVGO</Badge>
                  <span className="text-xs text-fg-muted">
                    Optimized in your browser with multipass mode.
                  </span>
                </div>
              )}

              {savings < 0 && (
                <Callout variant="warning">
                  The optimized output is larger than the input. Keep the
                  original if size matters.
                </Callout>
              )}

              <CodeBlock
                code={output}
                filename="optimized.svg"
                language="svg"
              />
            </div>
          ) : (
            <div className="flex min-h-[280px] items-center justify-center rounded-md border border-dashed border-border bg-canvas-inset/50 p-4 text-center text-sm text-fg-muted">
              {busy
                ? 'Optimizing…'
                : 'Run the optimizer to see byte savings and the cleaned-up markup.'}
            </div>
          )}
        </Panel>
      </ToolLayout>
    </div>
  );
}
