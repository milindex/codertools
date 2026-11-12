'use client';

import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { CodeBlock } from '@/components/ui/CodeBlock';
import { DownloadButton } from '@/components/ui/DownloadButton';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Panel } from '@/components/ui/Panel';
import { ToolLayout } from '@/components/ui/ToolLayout';

import { formatBytes, Stat, StatGrid } from './shared';

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const escapeXml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const svgToDataUri = (svg: string) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

export default function PlaceholderImage() {
  const [width, setWidth] = useState('1200');
  const [height, setHeight] = useState('630');
  const [background, setBackground] = useState('#0d1117');
  const [color, setColor] = useState('#e6edf3');
  const [fontSize, setFontSize] = useState('');
  const [text, setText] = useState('');
  const [textTouched, setTextTouched] = useState(false);

  const output = useMemo(() => {
    const outputWidth = clamp(Math.round(Number(width) || 1200), 1, 4096);
    const outputHeight = clamp(Math.round(Number(height) || 630), 1, 4096);
    const autoFont = Math.max(
      12,
      Math.round(Math.min(outputWidth, outputHeight) / 6)
    );
    const fontSizeValue = fontSize.trim()
      ? clamp(Math.round(Number(fontSize) || autoFont), 1, 1024)
      : autoFont;
    const label = textTouched ? text : `${outputWidth} × ${outputHeight}`;
    const labelMarkup = label
      ? `<text x="50%" y="50%" fill="${color}" font-family="ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Arial, sans-serif" font-size="${fontSizeValue}" font-weight="700" text-anchor="middle" dominant-baseline="central">${escapeXml(
          label.slice(0, 500)
        )}</text>`
      : '';

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${outputWidth}" height="${outputHeight}" viewBox="0 0 ${outputWidth} ${outputHeight}">
  <rect width="${outputWidth}" height="${outputHeight}" fill="${background}" />
  ${labelMarkup}
</svg>`;

    return {
      svg,
      dataUri: svgToDataUri(svg),
      width: outputWidth,
      height: outputHeight,
      bytes: new TextEncoder().encode(svg).length,
      label,
    };
  }, [width, height, background, color, fontSize, text, textTouched]);

  return (
    <div className="space-y-4">
      <ToolLayout>
        <Panel title="Placeholder settings">
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                hint="1–4096"
                htmlFor="placeholder-width"
                label="Width (px)"
              >
                <Input
                  id="placeholder-width"
                  max={4096}
                  min={1}
                  onChange={(event) => setWidth(event.target.value)}
                  type="number"
                  value={width}
                />
              </Field>
              <Field
                hint="1–4096"
                htmlFor="placeholder-height"
                label="Height (px)"
              >
                <Input
                  id="placeholder-height"
                  max={4096}
                  min={1}
                  onChange={(event) => setHeight(event.target.value)}
                  type="number"
                  value={height}
                />
              </Field>
            </div>

            <Field
              hint="Leave empty to hide the text"
              htmlFor="placeholder-text"
              label="Text"
            >
              <Input
                id="placeholder-text"
                onChange={(event) => {
                  setText(event.target.value);
                  setTextTouched(true);
                }}
                placeholder={output.label}
                value={text}
              />
            </Field>

            <div className="flex flex-wrap items-center gap-4">
              <Field htmlFor="placeholder-font-size" label="Font size (px)">
                <Input
                  className="w-28"
                  id="placeholder-font-size"
                  min={1}
                  onChange={(event) => setFontSize(event.target.value)}
                  placeholder="auto"
                  type="number"
                  value={fontSize}
                />
              </Field>
              <Button
                onClick={() => {
                  setText('');
                  setTextTouched(false);
                }}
                size="sm"
                variant="ghost"
              >
                Show dimensions
              </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field htmlFor="placeholder-background" label="Background">
                <div className="flex items-center gap-2">
                  <input
                    aria-label="Background colour"
                    className="h-8 w-14 cursor-pointer rounded-md border border-border bg-canvas-inset p-1"
                    id="placeholder-background"
                    onChange={(event) => setBackground(event.target.value)}
                    type="color"
                    value={background}
                  />
                  <span className="font-mono text-xs text-fg-muted">
                    {background}
                  </span>
                </div>
              </Field>
              <Field htmlFor="placeholder-color" label="Text colour">
                <div className="flex items-center gap-2">
                  <input
                    aria-label="Text colour"
                    className="h-8 w-14 cursor-pointer rounded-md border border-border bg-canvas-inset p-1"
                    id="placeholder-color"
                    onChange={(event) => setColor(event.target.value)}
                    type="color"
                    value={color}
                  />
                  <span className="font-mono text-xs text-fg-muted">
                    {color}
                  </span>
                </div>
              </Field>
            </div>
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel
            actions={
              <DownloadButton
                filename={`placeholder-${output.width}x${output.height}.svg`}
                label="Download SVG"
                mime="image/svg+xml"
                value={output.svg}
              />
            }
            title="Preview"
          >
            <div className="flex items-center justify-center overflow-hidden rounded-md border border-border bg-canvas-subtle p-3">
              {}
              <img
                alt={`Placeholder ${output.width}×${output.height}`}
                className="h-auto max-h-[320px] w-auto max-w-full"
                src={output.dataUri}
              />
            </div>
            <div className="mt-3">
              <StatGrid>
                <Stat
                  label="Dimensions"
                  value={`${output.width}×${output.height}`}
                />
                <Stat label="SVG size" value={formatBytes(output.bytes)} />
                <Stat label="Text" value={output.label || 'none'} />
                <Stat
                  label="Aspect"
                  value={(output.width / output.height).toFixed(2)}
                />
              </StatGrid>
            </div>
          </Panel>

          <Panel title="SVG data URI">
            <CodeBlock
              code={output.dataUri}
              filename="placeholder-data-uri.txt"
            />
            <p className="mt-2 text-xs text-fg-muted">
              Use the copy button above, or paste this data URI into an{' '}
              <code>img</code> tag or CSS <code>background-image</code>. SVG
              scales without losing quality.
            </p>
          </Panel>
        </div>
      </ToolLayout>
    </div>
  );
}
