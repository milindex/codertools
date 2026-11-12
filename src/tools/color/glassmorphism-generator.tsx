'use client';

import { useState } from 'react';

import { Callout } from '@/components/ui/Callout';
import { CodeBlock } from '@/components/ui/CodeBlock';
import { Panel } from '@/components/ui/Panel';
import { ToolLayout } from '@/components/ui/ToolLayout';

import {
  ColorField,
  isValidColor,
  PreviewSurface,
  rgba,
  SliderField,
  visibleColor,
} from './shared';

export default function GlassmorphismGenerator() {
  const [tint, setTint] = useState('#ffffff');
  const [backgroundFrom, setBackgroundFrom] = useState('#4f46e5');
  const [backgroundTo, setBackgroundTo] = useState('#db2777');
  const [blur, setBlur] = useState(18);
  const [transparency, setTransparency] = useState(22);
  const [saturation, setSaturation] = useState(150);
  const [radius, setRadius] = useState(20);
  const [borderAlpha, setBorderAlpha] = useState(35);
  const [shadowBlur, setShadowBlur] = useState(40);
  const [shadowAlpha, setShadowAlpha] = useState(22);

  const glassBackground = rgba(tint, transparency / 100);
  const glassBorder = rgba(tint, borderAlpha / 100);
  const glassShadow = rgba('#000000', shadowAlpha / 100);
  const backdrop = `blur(${blur}px) saturate(${saturation}%)`;
  const safeFrom = visibleColor(backgroundFrom, '#4f46e5');
  const safeTo = visibleColor(backgroundTo, '#db2777');
  const invalidColors =
    !isValidColor(tint) ||
    !isValidColor(backgroundFrom) ||
    !isValidColor(backgroundTo);

  const css = `.glass-card {
  background: ${glassBackground};
  backdrop-filter: ${backdrop};
  -webkit-backdrop-filter: ${backdrop};
  border: 1px solid ${glassBorder};
  border-radius: ${radius}px;
  box-shadow: 0 8px ${shadowBlur}px ${glassShadow};
}`;

  return (
    <div className="space-y-6">
      <ToolLayout>
        <Panel
          description="Tune the tint, blur and border to build a frosted-glass surface."
          title="Glass controls"
        >
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <ColorField label="Tint color" onChange={setTint} value={tint} />
              <ColorField
                label="Background from"
                onChange={setBackgroundFrom}
                value={backgroundFrom}
              />
              <ColorField
                className="sm:col-span-2"
                label="Background to"
                onChange={setBackgroundTo}
                value={backgroundTo}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <SliderField
                label="Blur"
                max={40}
                min={0}
                onChange={setBlur}
                unit="px"
                value={blur}
              />
              <SliderField
                label="Tint opacity"
                max={100}
                min={0}
                onChange={setTransparency}
                unit="%"
                value={transparency}
              />
              <SliderField
                label="Saturation"
                max={200}
                min={50}
                onChange={setSaturation}
                unit="%"
                value={saturation}
              />
              <SliderField
                label="Corner radius"
                max={64}
                min={0}
                onChange={setRadius}
                unit="px"
                value={radius}
              />
              <SliderField
                label="Border opacity"
                max={100}
                min={0}
                onChange={setBorderAlpha}
                unit="%"
                value={borderAlpha}
              />
              <SliderField
                label="Shadow blur"
                max={100}
                min={0}
                onChange={setShadowBlur}
                unit="px"
                value={shadowBlur}
              />
              <SliderField
                className="sm:col-span-2"
                label="Shadow opacity"
                max={100}
                min={0}
                onChange={setShadowAlpha}
                unit="%"
                value={shadowAlpha}
              />
            </div>

            {invalidColors && (
              <Callout variant="warning">
                One or more colors are invalid. The preview uses fallback colors
                for the tint or background.
              </Callout>
            )}
          </div>
        </Panel>

        <Panel title="Preview">
          <PreviewSurface
            className="min-h-[360px]"
            style={{
              backgroundImage: `linear-gradient(135deg, ${safeFrom} 0%, ${safeTo} 100%)`,
            }}
          >
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <div className="absolute -left-8 top-6 h-40 w-40 rounded-full bg-white/30 blur-2xl" />
              <div className="absolute bottom-0 right-0 h-48 w-48 rounded-full bg-black/20 blur-2xl" />
            </div>
            <div
              className="relative z-10 w-full max-w-sm px-6 py-6 text-white"
              style={{
                backgroundColor: glassBackground,
                backdropFilter: backdrop,
                WebkitBackdropFilter: backdrop,
                border: `1px solid ${glassBorder}`,
                borderRadius: `${radius}px`,
                boxShadow: `0 8px ${shadowBlur}px ${glassShadow}`,
              }}
            >
              <p className="text-lg font-semibold">Frosted glass</p>
              <p className="mt-2 text-sm leading-6 text-white/85">
                This panel uses a translucent tint, a blurred backdrop and a
                subtle light border to sit above the colorful background.
              </p>
            </div>
          </PreviewSurface>
        </Panel>
      </ToolLayout>

      <CodeBlock code={css} filename="glassmorphism.css" language="css" />
    </div>
  );
}
