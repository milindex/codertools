'use client';

import type { CSSProperties } from 'react';
import { useState } from 'react';

import { CodeBlock } from '@/components/ui/CodeBlock';
import { Panel } from '@/components/ui/Panel';
import { Select } from '@/components/ui/Select';
import { ToolLayout } from '@/components/ui/ToolLayout';

import { PreviewSurface, SliderField } from './shared';

const DIRECTION_OPTIONS = [
  { label: 'Row', value: 'row' },
  { label: 'Row reverse', value: 'row-reverse' },
  { label: 'Column', value: 'column' },
  { label: 'Column reverse', value: 'column-reverse' },
];

const WRAP_OPTIONS = [
  { label: 'No wrap', value: 'nowrap' },
  { label: 'Wrap', value: 'wrap' },
  { label: 'Wrap reverse', value: 'wrap-reverse' },
];

const JUSTIFY_OPTIONS = [
  { label: 'Flex start', value: 'flex-start' },
  { label: 'Flex end', value: 'flex-end' },
  { label: 'Center', value: 'center' },
  { label: 'Space between', value: 'space-between' },
  { label: 'Space around', value: 'space-around' },
  { label: 'Space evenly', value: 'space-evenly' },
];

const ALIGN_ITEMS_OPTIONS = [
  { label: 'Stretch', value: 'stretch' },
  { label: 'Flex start', value: 'flex-start' },
  { label: 'Flex end', value: 'flex-end' },
  { label: 'Center', value: 'center' },
  { label: 'Baseline', value: 'baseline' },
];

const ALIGN_CONTENT_OPTIONS = [
  { label: 'Normal', value: 'normal' },
  { label: 'Flex start', value: 'flex-start' },
  { label: 'Flex end', value: 'flex-end' },
  { label: 'Center', value: 'center' },
  { label: 'Space between', value: 'space-between' },
  { label: 'Space around', value: 'space-around' },
  { label: 'Space evenly', value: 'space-evenly' },
  { label: 'Stretch', value: 'stretch' },
];

export default function FlexboxPlayground() {
  const [direction, setDirection] = useState('row');
  const [wrap, setWrap] = useState('nowrap');
  const [justify, setJustify] = useState('flex-start');
  const [alignItems, setAlignItems] = useState('center');
  const [alignContent, setAlignContent] = useState('normal');
  const [gap, setGap] = useState(12);
  const [children, setChildren] = useState(4);
  const [itemWidth, setItemWidth] = useState(80);
  const [itemHeight, setItemHeight] = useState(64);
  const [grow, setGrow] = useState(0);

  const css = `.flex-container {
  display: flex;
  flex-direction: ${direction};
  flex-wrap: ${wrap};
  justify-content: ${justify};
  align-items: ${alignItems};
  align-content: ${alignContent};
  gap: ${gap}px;
}

.flex-item {
  flex: ${grow} 1 ${itemWidth}px;
  min-height: ${itemHeight}px;
}`;

  return (
    <div className="space-y-6">
      <ToolLayout>
        <Panel
          description="Change the container and item settings to see how Flexbox distributes the children."
          title="Flex container"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label
                className="text-xs font-semibold text-fg"
                htmlFor="flex-direction"
              >
                Direction
              </label>
              <Select
                id="flex-direction"
                onChange={(event) => setDirection(event.target.value)}
                value={direction}
              >
                {DIRECTION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-1.5">
              <label
                className="text-xs font-semibold text-fg"
                htmlFor="flex-wrap"
              >
                Wrap
              </label>
              <Select
                id="flex-wrap"
                onChange={(event) => setWrap(event.target.value)}
                value={wrap}
              >
                {WRAP_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-1.5">
              <label
                className="text-xs font-semibold text-fg"
                htmlFor="flex-justify"
              >
                Justify content
              </label>
              <Select
                id="flex-justify"
                onChange={(event) => setJustify(event.target.value)}
                value={justify}
              >
                {JUSTIFY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-1.5">
              <label
                className="text-xs font-semibold text-fg"
                htmlFor="flex-align-items"
              >
                Align items
              </label>
              <Select
                id="flex-align-items"
                onChange={(event) => setAlignItems(event.target.value)}
                value={alignItems}
              >
                {ALIGN_ITEMS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label
                className="text-xs font-semibold text-fg"
                htmlFor="flex-align-content"
              >
                Align content
              </label>
              <Select
                id="flex-align-content"
                onChange={(event) => setAlignContent(event.target.value)}
                value={alignContent}
              >
                {ALIGN_CONTENT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>

            <SliderField
              label="Gap"
              max={48}
              min={0}
              onChange={setGap}
              unit="px"
              value={gap}
            />
            <SliderField
              label="Children"
              max={8}
              min={1}
              onChange={(value) => setChildren(Math.round(value))}
              value={children}
            />
            <SliderField
              label="Item width"
              max={200}
              min={24}
              onChange={setItemWidth}
              unit="px"
              value={itemWidth}
            />
            <SliderField
              label="Item min height"
              max={160}
              min={24}
              onChange={setItemHeight}
              unit="px"
              value={itemHeight}
            />
            <SliderField
              className="sm:col-span-2"
              hint={`flex: ${grow} 1 ${itemWidth}px`}
              label="Flex grow"
              max={3}
              min={0}
              onChange={setGrow}
              step={0.1}
              value={grow}
            />
          </div>
        </Panel>

        <Panel title="Preview">
          <PreviewSurface className="min-h-[360px] items-stretch bg-canvas-subtle">
            <div
              className="w-full rounded-md border border-dashed border-fg-subtle/70 bg-canvas-inset p-3"
              style={{
                alignContent,
                alignItems,
                display: 'flex',
                flexDirection: direction as CSSProperties['flexDirection'],
                flexWrap: wrap as CSSProperties['flexWrap'],
                gap: `${gap}px`,
                justifyContent: justify,
                minHeight: 300,
              }}
            >
              {Array.from({ length: children }, (_, index) => (
                <div
                  className="flex items-center justify-center rounded-md border border-white/20 font-mono text-sm font-semibold text-white shadow-sm"
                  key={index}
                  style={{
                    backgroundColor: `hsl(${(index * 47 + 200) % 360} 70% 55%)`,
                    flex: `${grow} 1 ${itemWidth}px`,
                    minHeight: `${itemHeight}px`,
                  }}
                >
                  {index + 1}
                </div>
              ))}
            </div>
          </PreviewSurface>
        </Panel>
      </ToolLayout>

      <CodeBlock code={css} filename="flexbox.css" language="css" />
    </div>
  );
}
