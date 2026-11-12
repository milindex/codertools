'use client';

import { useEffect, useMemo, useState } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { CodeBlock } from '@/components/ui/CodeBlock';
import { Panel } from '@/components/ui/Panel';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { ToolLayout } from '@/components/ui/ToolLayout';

import { SliderField, ToggleField } from './shared';

const BREAKPOINTS = [480, 640, 768, 1024, 1280, 1536];

export default function MediaQueryBuilder() {
  const [mediaType, setMediaType] = useState('screen');
  const [minWidthEnabled, setMinWidthEnabled] = useState(true);
  const [minWidth, setMinWidth] = useState(768);
  const [maxWidthEnabled, setMaxWidthEnabled] = useState(false);
  const [maxWidth, setMaxWidth] = useState(1280);
  const [orientation, setOrientation] = useState('');
  const [colorScheme, setColorScheme] = useState('');
  const [reducedMotion, setReducedMotion] = useState(false);
  const [minResolutionEnabled, setMinResolutionEnabled] = useState(false);
  const [resolution, setResolution] = useState(2);
  const [content, setContent] = useState('.card {\n  display: grid;\n}');
  const [matches, setMatches] = useState<boolean | null>(null);

  const query = useMemo(() => {
    const conditions: string[] = [];

    if (minWidthEnabled) {
      conditions.push(`(min-width: ${minWidth}px)`);
    }

    if (maxWidthEnabled) {
      conditions.push(`(max-width: ${maxWidth}px)`);
    }

    if (orientation) {
      conditions.push(`(orientation: ${orientation})`);
    }

    if (colorScheme) {
      conditions.push(`(prefers-color-scheme: ${colorScheme})`);
    }

    if (reducedMotion) {
      conditions.push('(prefers-reduced-motion: reduce)');
    }

    if (minResolutionEnabled) {
      conditions.push(`(min-resolution: ${resolution}dppx)`);
    }

    const typePart = mediaType === 'all' ? '' : mediaType;

    if (typePart && conditions.length > 0) {
      return `${typePart} and ${conditions.join(' and ')}`;
    }

    if (typePart) {
      return typePart;
    }

    return conditions.length > 0 ? conditions.join(' and ') : 'all';
  }, [
    colorScheme,
    maxWidth,
    maxWidthEnabled,
    mediaType,
    minResolutionEnabled,
    minWidth,
    minWidthEnabled,
    orientation,
    reducedMotion,
    resolution,
  ]);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return;
    }

    const mediaQueryList = window.matchMedia(query);
    const update = () => setMatches(mediaQueryList.matches);

    update();
    mediaQueryList.addEventListener('change', update);

    return () => mediaQueryList.removeEventListener('change', update);
  }, [query]);

  const invalidRange =
    minWidthEnabled && maxWidthEnabled && minWidth > maxWidth;

  const body = content.trim()
    ? content
        .split('\n')
        .map((line) => `  ${line}`)
        .join('\n')
    : '  /* Styles for this breakpoint */';

  const css = `@media ${query} {\n${body}\n}`;

  return (
    <div className="space-y-6">
      <ToolLayout>
        <Panel
          description="Combine media features into a single query."
          title="Conditions"
        >
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label
                className="text-xs font-semibold text-fg"
                htmlFor="mq-type"
              >
                Media type
              </label>
              <Select
                id="mq-type"
                onChange={(event) => setMediaType(event.target.value)}
                value={mediaType}
              >
                <option value="screen">screen</option>
                <option value="print">print</option>
                <option value="all">all</option>
              </Select>
            </div>

            <div className="space-y-3 rounded-md border border-border bg-canvas-subtle p-3">
              <ToggleField
                checked={minWidthEnabled}
                hint={`${minWidth}px`}
                label="Min width"
                onChange={setMinWidthEnabled}
              />
              {minWidthEnabled && (
                <SliderField
                  label="Min width"
                  max={1920}
                  min={320}
                  onChange={setMinWidth}
                  step={1}
                  unit="px"
                  value={minWidth}
                />
              )}
            </div>

            <div className="space-y-3 rounded-md border border-border bg-canvas-subtle p-3">
              <ToggleField
                checked={maxWidthEnabled}
                hint={`${maxWidth}px`}
                label="Max width"
                onChange={setMaxWidthEnabled}
              />
              {maxWidthEnabled && (
                <SliderField
                  label="Max width"
                  max={1920}
                  min={320}
                  onChange={setMaxWidth}
                  step={1}
                  unit="px"
                  value={maxWidth}
                />
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label
                  className="text-xs font-semibold text-fg"
                  htmlFor="mq-orientation"
                >
                  Orientation
                </label>
                <Select
                  id="mq-orientation"
                  onChange={(event) => setOrientation(event.target.value)}
                  value={orientation}
                >
                  <option value="">Any</option>
                  <option value="portrait">Portrait</option>
                  <option value="landscape">Landscape</option>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label
                  className="text-xs font-semibold text-fg"
                  htmlFor="mq-color-scheme"
                >
                  Color scheme
                </label>
                <Select
                  id="mq-color-scheme"
                  onChange={(event) => setColorScheme(event.target.value)}
                  value={colorScheme}
                >
                  <option value="">Any</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </Select>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <ToggleField
                checked={reducedMotion}
                label="Prefers reduced motion"
                onChange={setReducedMotion}
              />
              <ToggleField
                checked={minResolutionEnabled}
                hint={`${resolution}dppx`}
                label="Min resolution"
                onChange={setMinResolutionEnabled}
              />
            </div>

            {minResolutionEnabled && (
              <SliderField
                label="Resolution"
                max={4}
                min={1}
                onChange={setResolution}
                step={0.5}
                unit="dppx"
                value={resolution}
              />
            )}

            <div className="space-y-1.5">
              <label
                className="text-xs font-semibold text-fg"
                htmlFor="mq-content"
              >
                Declarations inside the query
              </label>
              <Textarea
                className="min-h-[140px]"
                id="mq-content"
                onChange={(event) => setContent(event.target.value)}
                rows={5}
                value={content}
              />
            </div>

            {invalidRange && (
              <Callout variant="warning">
                Min width is larger than max width. The query will never match.
              </Callout>
            )}
          </div>
        </Panel>

        <Panel
          description="The status uses the current browser viewport."
          title="Query preview"
        >
          <div className="space-y-4">
            <div className="rounded-md border border-border bg-canvas-inset p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-fg-muted">
                  Media query
                </p>
                {matches === null ? (
                  <Badge>Checking…</Badge>
                ) : (
                  <Badge variant={matches ? 'success' : 'default'}>
                    {matches ? 'Matches viewport' : 'No match'}
                  </Badge>
                )}
              </div>
              <p className="mt-1 break-all font-mono text-xs text-fg">
                {query}
              </p>
            </div>

            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-fg-muted">
                Common breakpoints
              </p>
              <div className="flex flex-wrap gap-2">
                {BREAKPOINTS.map((breakpoint) => (
                  <Button
                    key={breakpoint}
                    onClick={() => {
                      setMinWidth(breakpoint);
                      setMinWidthEnabled(true);
                    }}
                    size="sm"
                    variant="default"
                  >
                    {breakpoint}px
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-fg-muted">
                Notes
              </p>
              <ul className="space-y-1.5 text-xs leading-5 text-fg-muted">
                <li>
                  Use <code>min-width</code> for mobile-first styles and{' '}
                  <code>max-width</code> for desktop-down overrides.
                </li>
                <li>
                  Feature conditions are combined with <code>and</code>. A
                  browser must satisfy every condition.
                </li>
                <li>
                  <code>prefers-reduced-motion</code> is a good place to disable
                  non-essential animation.
                </li>
              </ul>
            </div>
          </div>
        </Panel>
      </ToolLayout>

      <CodeBlock code={css} filename="media-query.css" language="css" />
    </div>
  );
}
