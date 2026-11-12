import type { CategoryModule } from '@/components/tools/types';

import BorderRadiusGenerator from './border-radius-generator';
import BoxShadowGenerator from './box-shadow-generator';
import ClipPathGenerator from './clip-path-generator';
import ColorBlindnessSimulator from './color-blindness-simulator';
import ColorConverter from './color-converter';
import ContrastChecker from './contrast-checker';
import CubicBezier from './cubic-bezier';
import FlexboxPlayground from './flexbox-playground';
import GlassmorphismGenerator from './glassmorphism-generator';
import GradientGenerator from './gradient-generator';
import GridGenerator from './grid-generator';
import KeyframesBuilder from './keyframes-builder';
import MediaQueryBuilder from './media-query-builder';
import PaletteGenerator from './palette-generator';
import TailwindColorScale from './tailwind-color-scale';
import TextShadowGenerator from './text-shadow-generator';

export const components: CategoryModule['components'] = {
  'color-converter': ColorConverter,
  'contrast-checker': ContrastChecker,
  'palette-generator': PaletteGenerator,
  'tailwind-color-scale': TailwindColorScale,
  'color-blindness-simulator': ColorBlindnessSimulator,
  'gradient-generator': GradientGenerator,
  'box-shadow-generator': BoxShadowGenerator,
  'text-shadow-generator': TextShadowGenerator,
  'border-radius-generator': BorderRadiusGenerator,
  'glassmorphism-generator': GlassmorphismGenerator,
  'clip-path-generator': ClipPathGenerator,
  'cubic-bezier': CubicBezier,
  'keyframes-builder': KeyframesBuilder,
  'flexbox-playground': FlexboxPlayground,
  'grid-generator': GridGenerator,
  'media-query-builder': MediaQueryBuilder,
};
