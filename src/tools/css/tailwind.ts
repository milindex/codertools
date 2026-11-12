import {
  type CssDeclaration,
  extractCssRules,
  parseDeclarations,
} from './css-utils';

export type TailwindRuleResult = {
  selector: string;
  atRule?: string;
  classes: string[];
  unmapped: CssDeclaration[];
  notes: string[];
};

export type TailwindConversion = {
  rules: TailwindRuleResult[];
  atRules: string[];
  mappedCount: number;
  unmappedCount: number;
  text: string;
};

const arbitrary = (value: string) => value.trim().replace(/\s+/g, '_');

const parseLength = (
  value: string
): { number: number; unit: string } | null => {
  const match = /^(-?(?:\d+|\d*\.\d+))(px|rem|em|%)$/.exec(
    value.trim().toLowerCase()
  );
  if (!match) {
    return null;
  }
  const number = Number.parseFloat(match[1] ?? '');
  if (!Number.isFinite(number)) {
    return null;
  }
  return { number, unit: match[2] ?? '' };
};

const spacingClass = (prefix: string, value: string): string | null => {
  const normalized = value.trim().toLowerCase();
  if (
    normalized === '0' ||
    normalized === '0px' ||
    normalized === '0rem' ||
    normalized === '0%'
  ) {
    return `${prefix}-0`;
  }
  if (normalized === '1px') {
    return `${prefix}-px`;
  }
  const length = parseLength(normalized);
  if (!length || (length.unit !== 'px' && length.unit !== 'rem')) {
    return null;
  }
  const units = length.unit === 'px' ? length.number / 4 : length.number * 4;
  if (Math.abs(units * 2 - Math.round(units * 2)) > 1e-6) {
    return null;
  }
  const rounded = Math.round(units * 2) / 2;
  if (rounded === 0) {
    return `${prefix}-0`;
  }
  if (rounded < 0) {
    return `-${prefix}-${Math.abs(rounded)}`;
  }
  return `${prefix}-${rounded}`;
};

const spacingOrArbitrary = (prefix: string, value: string): string | null => {
  const normalized = value.trim();
  if (!normalized) {
    return null;
  }
  if (normalized.toLowerCase() === 'auto') {
    return `${prefix}-auto`;
  }
  const direct = spacingClass(prefix, normalized);
  if (direct) {
    return direct;
  }
  if (normalized.startsWith('-')) {
    return `-${prefix}-[${arbitrary(normalized.slice(1))}]`;
  }
  return `${prefix}-[${arbitrary(normalized)}]`;
};

const FRACTIONS: Array<{ percent: number; value: string }> = [
  { percent: 100 / 6, value: '1/6' },
  { percent: 100 / 3, value: '1/3' },
  { percent: 50, value: '1/2' },
  { percent: 200 / 3, value: '2/3' },
  { percent: 75, value: '3/4' },
  { percent: 100, value: 'full' },
  { percent: 25, value: '1/4' },
  { percent: 20, value: '1/5' },
  { percent: 40, value: '2/5' },
  { percent: 60, value: '3/5' },
  { percent: 80, value: '4/5' },
];

const fractionForPercent = (percent: number): string | null => {
  for (const fraction of FRACTIONS) {
    if (Math.abs(fraction.percent - percent) < 0.02) {
      return fraction.value;
    }
  }
  return null;
};

const dimensionClass = (prefix: string, value: string): string => {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'auto') {
    return `${prefix}-auto`;
  }
  if (normalized === '100%') {
    return `${prefix}-full`;
  }
  if (
    normalized === '100vw' ||
    normalized === '100vh' ||
    normalized === '100dvw' ||
    normalized === '100dvh'
  ) {
    return `${prefix}-screen`;
  }
  if (
    normalized === 'fit-content' ||
    normalized === 'min-content' ||
    normalized === 'max-content'
  ) {
    return `${prefix}-${normalized === 'fit-content' ? 'fit' : normalized === 'min-content' ? 'min' : 'max'}`;
  }
  if (normalized === 'none') {
    return `${prefix}-none`;
  }
  const length = parseLength(normalized);
  if (length && length.unit === '%') {
    const fraction = fractionForPercent(length.number);
    if (fraction) {
      return `${prefix}-${fraction}`;
    }
  }
  return spacingOrArbitrary(prefix, value) ?? `${prefix}-[${arbitrary(value)}]`;
};

const COLOR_NAMES: Record<string, string> = {
  '#000': 'black',
  '#000000': 'black',
  '#fff': 'white',
  '#ffffff': 'white',
  black: 'black',
  white: 'white',
  transparent: 'transparent',
  currentcolor: 'current',
  inherit: 'inherit',
};

const colorClass = (prefix: string, value: string): string | null => {
  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    return null;
  }
  const known = COLOR_NAMES[normalized];
  if (known) {
    return `${prefix}-${known}`;
  }
  if (
    normalized === 'unset' ||
    normalized === 'initial' ||
    normalized === 'revert'
  ) {
    return null;
  }
  return `${prefix}-[${arbitrary(value)}]`;
};

const FONT_SIZES: Record<number, string> = {
  12: 'xs',
  14: 'sm',
  16: 'base',
  18: 'lg',
  20: 'xl',
  24: '2xl',
  30: '3xl',
  36: '4xl',
  48: '5xl',
  60: '6xl',
  72: '7xl',
  96: '8xl',
  128: '9xl',
};

const fontSizeClass = (value: string): string => {
  const normalized = value.trim().toLowerCase();
  const length = parseLength(normalized);
  if (length) {
    const pixels =
      length.unit === 'px'
        ? length.number
        : length.unit === 'rem' || length.unit === 'em'
          ? length.number * 16
          : null;
    if (pixels !== null) {
      const match = FONT_SIZES[Math.round(pixels)];
      if (match) {
        return `text-${match}`;
      }
    }
  }
  return `text-[${arbitrary(value)}]`;
};

const FONT_WEIGHTS: Record<string, string> = {
  '100': 'font-thin',
  '200': 'font-extralight',
  '300': 'font-light',
  '400': 'font-normal',
  '500': 'font-medium',
  '600': 'font-semibold',
  '700': 'font-bold',
  '800': 'font-extrabold',
  '900': 'font-black',
  thin: 'font-thin',
  extralight: 'font-extralight',
  light: 'font-light',
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
  extrabold: 'font-extrabold',
  black: 'font-black',
};

const LINE_HEIGHTS: Record<string, string> = {
  '1': 'leading-none',
  '1.25': 'leading-tight',
  '1.375': 'leading-snug',
  '1.5': 'leading-normal',
  '1.625': 'leading-relaxed',
  '2': 'leading-loose',
};

const lineHeightClass = (value: string): string => {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'normal') {
    return 'leading-normal';
  }
  if (LINE_HEIGHTS[normalized]) {
    return LINE_HEIGHTS[normalized]!;
  }
  const direct = spacingClass('leading', normalized);
  if (direct) {
    return direct;
  }
  return `leading-[${arbitrary(value)}]`;
};

const LETTER_SPACINGS: Record<string, string> = {
  normal: 'tracking-normal',
  '-0.05em': 'tracking-tighter',
  '-0.025em': 'tracking-tight',
  '0em': 'tracking-normal',
  '0': 'tracking-normal',
  '0.025em': 'tracking-wide',
  '0.05em': 'tracking-wider',
  '0.1em': 'tracking-widest',
};

const ALIGN_ITEMS: Record<string, string> = {
  'flex-start': 'items-start',
  start: 'items-start',
  'flex-end': 'items-end',
  end: 'items-end',
  center: 'items-center',
  baseline: 'items-baseline',
  stretch: 'items-stretch',
};

const ALIGN_CONTENT: Record<string, string> = {
  'flex-start': 'content-start',
  start: 'content-start',
  'flex-end': 'content-end',
  end: 'content-end',
  center: 'content-center',
  'space-between': 'content-between',
  'space-around': 'content-around',
  'space-evenly': 'content-evenly',
  baseline: 'content-baseline',
  stretch: 'content-stretch',
  normal: 'content-normal',
};

const JUSTIFY_CONTENT: Record<string, string> = {
  'flex-start': 'justify-start',
  start: 'justify-start',
  'flex-end': 'justify-end',
  end: 'justify-end',
  center: 'justify-center',
  'space-between': 'justify-between',
  'space-around': 'justify-around',
  'space-evenly': 'justify-evenly',
  stretch: 'justify-stretch',
  normal: 'justify-normal',
};

const ALIGN_SELF: Record<string, string> = {
  auto: 'self-auto',
  'flex-start': 'self-start',
  start: 'self-start',
  'flex-end': 'self-end',
  end: 'self-end',
  center: 'self-center',
  stretch: 'self-stretch',
  baseline: 'self-baseline',
};

const JUSTIFY_ITEMS: Record<string, string> = {
  start: 'justify-items-start',
  end: 'justify-items-end',
  center: 'justify-items-center',
  stretch: 'justify-items-stretch',
  normal: 'justify-items-normal',
};

const JUSTIFY_SELF: Record<string, string> = {
  auto: 'justify-self-auto',
  start: 'justify-self-start',
  end: 'justify-self-end',
  center: 'justify-self-center',
  stretch: 'justify-self-stretch',
};

const DISPLAY: Record<string, string> = {
  block: 'block',
  'inline-block': 'inline-block',
  inline: 'inline',
  flex: 'flex',
  'inline-flex': 'inline-flex',
  grid: 'grid',
  'inline-grid': 'inline-grid',
  contents: 'contents',
  'flow-root': 'flow-root',
  none: 'hidden',
  table: 'table',
  'table-row': 'table-row',
  'table-cell': 'table-cell',
  'table-caption': 'table-caption',
  'table-column': 'table-column',
  'table-column-group': 'table-column-group',
  'table-footer-group': 'table-footer-group',
  'table-header-group': 'table-header-group',
  'table-row-group': 'table-row-group',
  'list-item': 'list-item',
};

const CURSORS = new Set([
  'auto',
  'default',
  'pointer',
  'wait',
  'text',
  'move',
  'help',
  'not-allowed',
  'none',
  'context-menu',
  'progress',
  'cell',
  'crosshair',
  'vertical-text',
  'alias',
  'copy',
  'no-drop',
  'grab',
  'grabbing',
  'all-scroll',
  'col-resize',
  'row-resize',
  'n-resize',
  'e-resize',
  's-resize',
  'w-resize',
  'ne-resize',
  'nw-resize',
  'se-resize',
  'sw-resize',
  'ew-resize',
  'ns-resize',
  'nesw-resize',
  'nwse-resize',
  'zoom-in',
  'zoom-out',
]);

const BORDER_WIDTHS: Record<string, string> = {
  '0': '0',
  '1px': '',
  '2px': '2',
  '4px': '4',
  '8px': '8',
};

const borderWidthClass = (prefix: string, value: string): string | null => {
  const normalized = value.trim().toLowerCase();
  const mapped = BORDER_WIDTHS[normalized];
  if (mapped !== undefined) {
    return mapped === '' ? prefix : `${prefix}-${mapped}`;
  }
  return `${prefix}-[${arbitrary(value)}]`;
};

const BORDER_SIDES: Record<string, string> = {
  'border-top-width': 'border-t',
  'border-right-width': 'border-r',
  'border-bottom-width': 'border-b',
  'border-left-width': 'border-l',
};

const BORDER_COLOR_SIDES: Record<string, string> = {
  'border-top-color': 'border-t',
  'border-right-color': 'border-r',
  'border-bottom-color': 'border-b',
  'border-left-color': 'border-l',
};

const RADIUS_VALUES: Record<string, string> = {
  '0': 'none',
  '0px': 'none',
  '2px': 'sm',
  '0.125rem': 'sm',
  '4px': '',
  '0.25rem': '',
  '6px': 'md',
  '0.375rem': 'md',
  '8px': 'lg',
  '0.5rem': 'lg',
  '12px': 'xl',
  '0.75rem': 'xl',
  '16px': '2xl',
  '1rem': '2xl',
  '24px': '3xl',
  '1.5rem': '3xl',
  '9999px': 'full',
  '9999rem': 'full',
};

const radiusClass = (prefix: string, value: string): string => {
  const normalized = value.trim().toLowerCase();
  const mapped = RADIUS_VALUES[normalized];
  if (mapped !== undefined) {
    return mapped === '' ? prefix : `${prefix}-${mapped}`;
  }
  return `${prefix}-[${arbitrary(value)}]`;
};

const SHADOW_PATTERNS: Array<{
  test: (value: string) => boolean;
  cls: string;
}> = [
  { test: (value) => value === 'none', cls: 'shadow-none' },
  { test: (value) => /^inset\b/.test(value), cls: 'shadow-inner' },
  { test: (value) => /^0\s+1px\s+2px\b/.test(value), cls: 'shadow-sm' },
  {
    test: (value) =>
      /^0\s+1px\s+3px\b/.test(value) || /^0\s+2px\s+4px\b/.test(value),
    cls: 'shadow',
  },
  { test: (value) => /^0\s+4px\s+6px\b/.test(value), cls: 'shadow-md' },
  { test: (value) => /^0\s+10px\s+15px\b/.test(value), cls: 'shadow-lg' },
  { test: (value) => /^0\s+20px\s+25px\b/.test(value), cls: 'shadow-xl' },
  { test: (value) => /^0\s+25px\s+50px\b/.test(value), cls: 'shadow-2xl' },
];

const shadowClass = (value: string): string => {
  const normalized = value.trim().toLowerCase();
  const match = SHADOW_PATTERNS.find((pattern) => pattern.test(normalized));
  if (match) {
    return match.cls;
  }
  return `shadow-[${arbitrary(value)}]`;
};

const TRANSITION_PROPERTIES: Record<string, string> = {
  all: 'transition-all',
  colors: 'transition-colors',
  'background-color': 'transition-colors',
  'border-color': 'transition-colors',
  color: 'transition-colors',
  fill: 'transition-colors',
  stroke: 'transition-colors',
  opacity: 'transition-opacity',
  'box-shadow': 'transition-shadow',
  shadow: 'transition-shadow',
  transform: 'transition-transform',
  none: 'transition-none',
};

const EASINGS: Record<string, string> = {
  linear: 'ease-linear',
  ease: 'ease',
  'ease-in': 'ease-in',
  'ease-out': 'ease-out',
  'ease-in-out': 'ease-in-out',
  'cubic-bezier(0.4, 0, 0.2, 1)': 'ease-in-out',
};

const transitionClasses = (value: string): string[] => {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'none') {
    return ['transition-none'];
  }
  const classes: string[] = [];
  const parts = normalized.split(/[\s,]+/).filter(Boolean);
  for (const part of parts) {
    if (/^\d+(?:\.\d+)?ms$/.test(part)) {
      const milliseconds = Math.round(Number.parseFloat(part));
      classes.push(
        [75, 100, 150, 200, 300, 500, 700, 1000].includes(milliseconds)
          ? `duration-${milliseconds}`
          : `duration-[${milliseconds}ms]`
      );
      continue;
    }
    if (/^\d+(?:\.\d+)?s$/.test(part)) {
      const milliseconds = Math.round(Number.parseFloat(part) * 1000);
      classes.push(
        [75, 100, 150, 200, 300, 500, 700, 1000].includes(milliseconds)
          ? `duration-${milliseconds}`
          : `duration-[${milliseconds}ms]`
      );
      continue;
    }
    if (part === 'linear' || part === 'ease' || part.startsWith('ease-')) {
      classes.push(EASINGS[part] ?? `ease-[${arbitrary(part)}]`);
      continue;
    }
    if (part.startsWith('cubic-bezier') || part.startsWith('steps')) {
      classes.push(`ease-[${arbitrary(part)}]`);
      continue;
    }
    const propertyClass = TRANSITION_PROPERTIES[part];
    if (propertyClass) {
      classes.push(propertyClass);
    }
  }
  return classes;
};

const transformClasses = (value: string): string[] | null => {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'none') {
    return ['transform-none'];
  }
  const classes: string[] = [];
  const pattern = /([a-z0-9]+)\(([^)]*)\)/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(normalized)) !== null) {
    const name = match[1] ?? '';
    const args = (match[2] ?? '').split(',').map((part) => part.trim());
    if (name === 'translatex' && args[0]) {
      classes.push(dimensionClass('translate-x', args[0]));
    } else if (name === 'translatey' && args[0]) {
      classes.push(dimensionClass('translate-y', args[0]));
    } else if (name === 'translate' && args[0]) {
      classes.push(dimensionClass('translate-x', args[0]));
      if (args[1]) {
        classes.push(dimensionClass('translate-y', args[1]));
      }
    } else if (name === 'scale') {
      const number = Number.parseFloat(args[0] ?? '');
      if (Number.isFinite(number)) {
        const percent = Math.round(number * 100);
        classes.push(percent === 100 ? 'scale-100' : `scale-${percent}`);
      }
    } else if (name === 'rotate') {
      classes.push(
        (args[0] ?? '').startsWith('-')
          ? `-rotate-${(args[0] ?? '').replace('-', '').replace('deg', '')}`
          : `rotate-${(args[0] ?? '').replace('deg', '')}`
      );
    } else {
      return null;
    }
  }
  return classes.length > 0 ? classes : null;
};

const gridTemplateClass = (
  prefix: 'grid-cols' | 'grid-rows',
  value: string
): string => {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'none' || normalized === 'subgrid') {
    return `${prefix}-${normalized}`;
  }
  const repeat =
    /^repeat\(\s*(\d+)\s*,\s*(?:minmax\(\s*0(?:px|rem)?\s*,\s*)?1fr\s*\)?\s*\)$/.exec(
      normalized
    );
  if (repeat) {
    return `${prefix}-${repeat[1]}`;
  }
  const tokens = normalized.split(/\s+/).filter(Boolean);
  if (tokens.length > 0 && tokens.every((token) => token === '1fr')) {
    return `${prefix}-${tokens.length}`;
  }
  return `${prefix}-[${arbitrary(value)}]`;
};

const gridSpanClass = (prefix: 'col' | 'row', value: string): string | null => {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'auto') {
    return `${prefix}-auto`;
  }
  if (normalized === '1 / -1') {
    return `${prefix}-span-full`;
  }
  const span = /^span\s+(\d+)(?:\s*\/\s*span\s+\d+)?$/.exec(normalized);
  if (span) {
    return `${prefix}-span-${span[1]}`;
  }
  const startSpan = /^(\d+)\s*\/\s*span\s+(\d+)$/.exec(normalized);
  if (startSpan) {
    return `${prefix}-span-${startSpan[2]}`;
  }
  return `${prefix}-[${arbitrary(value)}]`;
};

const asSingleClass = (value: string | null): string[] =>
  value ? [value] : [];

const splitSpacingShorthand = (value: string): string[] | null => {
  if (value.includes('(')) {
    return null;
  }
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0 || parts.length > 4) {
    return null;
  }
  return parts;
};

const mapSpacingShorthand = (base: string, value: string): string[] | null => {
  const parts = splitSpacingShorthand(value);
  if (!parts) {
    return null;
  }
  if (parts.length === 1) {
    return asSingleClass(spacingOrArbitrary(base, parts[0]!));
  }
  if (parts.length === 2) {
    const vertical = spacingOrArbitrary(`${base}y`, parts[0]!);
    const horizontal = spacingOrArbitrary(`${base}x`, parts[1]!);
    return [...asSingleClass(vertical), ...asSingleClass(horizontal)];
  }
  if (parts.length === 3) {
    const top = spacingOrArbitrary(`${base}t`, parts[0]!);
    const horizontal = spacingOrArbitrary(`${base}x`, parts[1]!);
    const bottom = spacingOrArbitrary(`${base}b`, parts[2]!);
    return [
      ...asSingleClass(top),
      ...asSingleClass(horizontal),
      ...asSingleClass(bottom),
    ];
  }
  const classes: string[] = [];
  const mappings: Array<[string, string]> = [
    [`${base}t`, parts[0] ?? ''],
    [`${base}r`, parts[1] ?? ''],
    [`${base}b`, parts[2] ?? ''],
    [`${base}l`, parts[3] ?? ''],
  ];
  for (const [prefix, part] of mappings) {
    classes.push(...asSingleClass(spacingOrArbitrary(prefix, part)));
  }
  return classes;
};

const SPACING_PROPERTIES: Record<string, string> = {
  'margin-top': 'mt',
  'margin-right': 'mr',
  'margin-bottom': 'mb',
  'margin-left': 'ml',
  'margin-inline-start': 'ms',
  'margin-inline-end': 'me',
  'padding-top': 'pt',
  'padding-right': 'pr',
  'padding-bottom': 'pb',
  'padding-left': 'pl',
  'padding-inline-start': 'ps',
  'padding-inline-end': 'pe',
  top: 'top',
  right: 'right',
  bottom: 'bottom',
  left: 'left',
  gap: 'gap',
  'row-gap': 'gap-y',
  'column-gap': 'gap-x',
  'grid-gap': 'gap',
  'grid-row-gap': 'gap-y',
  'grid-column-gap': 'gap-x',
  'text-indent': 'indent',
  'scroll-margin': 'scroll-m',
  'scroll-margin-top': 'scroll-mt',
  'scroll-margin-right': 'scroll-mr',
  'scroll-margin-bottom': 'scroll-mb',
  'scroll-margin-left': 'scroll-ml',
  'scroll-padding': 'scroll-p',
  'scroll-padding-top': 'scroll-pt',
  'scroll-padding-right': 'scroll-pr',
  'scroll-padding-bottom': 'scroll-pb',
  'scroll-padding-left': 'scroll-pl',
};

const DIMENSION_PROPERTIES: Record<string, string> = {
  width: 'w',
  height: 'h',
  'min-width': 'min-w',
  'min-height': 'min-h',
  'max-width': 'max-w',
  'max-height': 'max-h',
  'inline-size': 'w',
  'block-size': 'h',
  'min-inline-size': 'min-w',
  'min-block-size': 'min-h',
  'max-inline-size': 'max-w',
  'max-block-size': 'max-h',
  'flex-basis': 'basis',
};

export const declarationToTailwind = (
  rawProperty: string,
  rawValue: string
): { classes: string[]; notes: string[] } | null => {
  const notes: string[] = [];
  let property = rawProperty.trim().toLowerCase();
  property = property.replace(/^-(webkit|moz|ms|o)-/, '');
  let value = rawValue.trim();
  if (/!\s*important\s*$/i.test(value)) {
    value = value.replace(/!\s*important\s*$/i, '').trim();
    notes.push('!important is not represented in the utility classes.');
  }
  const lower = value.toLowerCase();

  if (!property || property.startsWith('--')) {
    return null;
  }

  switch (property) {
    case 'display':
      return DISPLAY[lower] ? { classes: [DISPLAY[lower]!], notes } : null;

    case 'position': {
      const map: Record<string, string> = {
        static: 'static',
        fixed: 'fixed',
        absolute: 'absolute',
        relative: 'relative',
        sticky: 'sticky',
      };
      return map[lower] ? { classes: [map[lower]!], notes } : null;
    }

    case 'visibility':
      return lower === 'visible' || lower === 'hidden'
        ? { classes: [`${lower}`], notes }
        : null;

    case 'box-sizing':
      return lower === 'border-box'
        ? { classes: ['box-border'], notes }
        : lower === 'content-box'
          ? { classes: ['box-content'], notes }
          : null;

    case 'float':
      return lower === 'left' || lower === 'right' || lower === 'none'
        ? { classes: [`float-${lower}`], notes }
        : null;

    case 'clear':
      return ['left', 'right', 'both', 'none'].includes(lower)
        ? { classes: [`clear-${lower}`], notes }
        : null;

    case 'isolation':
      return lower === 'isolate' || lower === 'auto'
        ? {
            classes: [lower === 'isolate' ? 'isolate' : 'isolation-auto'],
            notes,
          }
        : null;

    case 'overflow':
    case 'overflow-x':
    case 'overflow-y': {
      const suffix =
        property === 'overflow' ? '' : property === 'overflow-x' ? '-x' : '-y';
      if (['auto', 'hidden', 'clip', 'visible', 'scroll'].includes(lower)) {
        return {
          classes: [
            lower === 'visible'
              ? `overflow${suffix}-visible`
              : `overflow${suffix}-${lower}`,
          ],
          notes,
        };
      }
      return { classes: [`overflow${suffix}-[${arbitrary(value)}]`], notes };
    }

    case 'overscroll-behavior':
    case 'overscroll-behavior-x':
    case 'overscroll-behavior-y': {
      const suffix =
        property === 'overscroll-behavior'
          ? ''
          : property.endsWith('-x')
            ? '-x'
            : '-y';
      return ['auto', 'contain', 'none'].includes(lower)
        ? { classes: [`overscroll${suffix}-${lower}`], notes }
        : null;
    }

    case 'margin': {
      const classes = mapSpacingShorthand('m', value);
      return classes ? { classes, notes } : null;
    }
    case 'padding': {
      const classes = mapSpacingShorthand('p', value);
      return classes ? { classes, notes } : null;
    }
    case 'inset':
      return {
        classes: asSingleClass(spacingOrArbitrary('inset', value)),
        notes,
      };
    case 'inset-inline':
      return asSingleClass(spacingOrArbitrary('inset-x', value)).length
        ? {
            classes: asSingleClass(spacingOrArbitrary('inset-x', value)),
            notes,
          }
        : null;
    case 'inset-block':
      return asSingleClass(spacingOrArbitrary('inset-y', value)).length
        ? {
            classes: asSingleClass(spacingOrArbitrary('inset-y', value)),
            notes,
          }
        : null;

    case 'top':
    case 'right':
    case 'bottom':
    case 'left':
      return {
        classes: asSingleClass(
          dimensionClass(SPACING_PROPERTIES[property] ?? property, value)
        ),
        notes,
      };

    case 'width':
    case 'height':
    case 'min-width':
    case 'min-height':
    case 'max-width':
    case 'max-height':
    case 'inline-size':
    case 'block-size':
    case 'min-inline-size':
    case 'min-block-size':
    case 'max-inline-size':
    case 'max-block-size':
    case 'flex-basis':
      return {
        classes: [
          dimensionClass(DIMENSION_PROPERTIES[property] ?? property, value),
        ],
        notes,
      };

    case 'gap':
    case 'row-gap':
    case 'column-gap':
    case 'grid-gap':
    case 'grid-row-gap':
    case 'grid-column-gap':
    case 'text-indent':
    case 'scroll-margin':
    case 'scroll-margin-top':
    case 'scroll-margin-right':
    case 'scroll-margin-bottom':
    case 'scroll-margin-left':
    case 'scroll-padding':
    case 'scroll-padding-top':
    case 'scroll-padding-right':
    case 'scroll-padding-bottom':
    case 'scroll-padding-left':
      return {
        classes: asSingleClass(
          spacingOrArbitrary(SPACING_PROPERTIES[property] ?? property, value)
        ),
        notes,
      };

    case 'flex-direction': {
      const map: Record<string, string> = {
        row: 'flex-row',
        'row-reverse': 'flex-row-reverse',
        column: 'flex-col',
        'column-reverse': 'flex-col-reverse',
      };
      return map[lower] ? { classes: [map[lower]!], notes } : null;
    }

    case 'flex-wrap': {
      const map: Record<string, string> = {
        wrap: 'flex-wrap',
        nowrap: 'flex-nowrap',
        'wrap-reverse': 'flex-wrap-reverse',
      };
      return map[lower] ? { classes: [map[lower]!], notes } : null;
    }

    case 'flex': {
      const map: Record<string, string> = {
        '1': 'flex-1',
        '1 1 0%': 'flex-1',
        '1 1 0px': 'flex-1',
        auto: 'flex-auto',
        '1 1 auto': 'flex-auto',
        initial: 'flex-initial',
        '0 1 auto': 'flex-initial',
        none: 'flex-none',
        '0 0 auto': 'flex-none',
      };
      return map[lower] ? { classes: [map[lower]!], notes } : null;
    }

    case 'flex-grow': {
      if (lower === '0') {
        return { classes: ['grow-0'], notes };
      }
      if (lower === '1') {
        return { classes: ['grow'], notes };
      }
      return { classes: [`grow-[${arbitrary(value)}]`], notes };
    }

    case 'flex-shrink': {
      if (lower === '0') {
        return { classes: ['shrink-0'], notes };
      }
      if (lower === '1') {
        return { classes: ['shrink'], notes };
      }
      return { classes: [`shrink-[${arbitrary(value)}]`], notes };
    }

    case 'justify-content':
      return JUSTIFY_CONTENT[lower]
        ? { classes: [JUSTIFY_CONTENT[lower]!], notes }
        : null;

    case 'align-items':
      return ALIGN_ITEMS[lower]
        ? { classes: [ALIGN_ITEMS[lower]!], notes }
        : null;

    case 'align-content':
      return ALIGN_CONTENT[lower]
        ? { classes: [ALIGN_CONTENT[lower]!], notes }
        : null;

    case 'align-self':
      return ALIGN_SELF[lower]
        ? { classes: [ALIGN_SELF[lower]!], notes }
        : null;

    case 'justify-items':
      return JUSTIFY_ITEMS[lower]
        ? { classes: [JUSTIFY_ITEMS[lower]!], notes }
        : null;

    case 'justify-self':
      return JUSTIFY_SELF[lower]
        ? { classes: [JUSTIFY_SELF[lower]!], notes }
        : null;

    case 'place-items': {
      const map: Record<string, string> = {
        start: 'place-items-start',
        end: 'place-items-end',
        center: 'place-items-center',
        stretch: 'place-items-stretch',
      };
      return map[lower] ? { classes: [map[lower]!], notes } : null;
    }

    case 'place-content': {
      const map: Record<string, string> = {
        start: 'place-content-start',
        end: 'place-content-end',
        center: 'place-content-center',
        between: 'place-content-between',
        around: 'place-content-around',
        evenly: 'place-content-evenly',
        stretch: 'place-content-stretch',
      };
      return map[lower] ? { classes: [map[lower]!], notes } : null;
    }

    case 'place-self': {
      const map: Record<string, string> = {
        auto: 'place-self-auto',
        start: 'place-self-start',
        end: 'place-self-end',
        center: 'place-self-center',
        stretch: 'place-self-stretch',
      };
      return map[lower] ? { classes: [map[lower]!], notes } : null;
    }

    case 'order': {
      if (lower === '-1' || lower === '-9999') {
        return { classes: ['order-first'], notes };
      }
      if (lower === '9999') {
        return { classes: ['order-last'], notes };
      }
      if (lower === '0') {
        return { classes: ['order-none'], notes };
      }
      return { classes: [`order-[${arbitrary(value)}]`], notes };
    }

    case 'grid-template-columns':
      return { classes: [gridTemplateClass('grid-cols', value)], notes };

    case 'grid-template-rows':
      return { classes: [gridTemplateClass('grid-rows', value)], notes };

    case 'grid-column':
      return {
        classes: asSingleClass(gridSpanClass('col', value)),
        notes,
      };

    case 'grid-row':
      return {
        classes: asSingleClass(gridSpanClass('row', value)),
        notes,
      };

    case 'grid-column-start':
      return { classes: [`col-start-[${arbitrary(value)}]`], notes };
    case 'grid-column-end':
      return { classes: [`col-end-[${arbitrary(value)}]`], notes };
    case 'grid-row-start':
      return { classes: [`row-start-[${arbitrary(value)}]`], notes };
    case 'grid-row-end':
      return { classes: [`row-end-[${arbitrary(value)}]`], notes };

    case 'grid-auto-flow': {
      const map: Record<string, string> = {
        row: 'grid-flow-row',
        column: 'grid-flow-col',
        dense: 'grid-flow-dense',
        'row dense': 'grid-flow-row-dense',
        'column dense': 'grid-flow-col-dense',
      };
      return map[lower] ? { classes: [map[lower]!], notes } : null;
    }

    case 'font-size':
      return { classes: [fontSizeClass(value)], notes };

    case 'font-weight': {
      const mapped = FONT_WEIGHTS[lower];
      return mapped ? { classes: [mapped], notes } : null;
    }

    case 'font-style':
      return lower === 'italic' || lower === 'oblique'
        ? { classes: ['italic'], notes }
        : lower === 'normal'
          ? { classes: ['not-italic'], notes }
          : null;

    case 'line-height':
      return { classes: [lineHeightClass(value)], notes };

    case 'letter-spacing': {
      const mapped = LETTER_SPACINGS[lower];
      return mapped
        ? { classes: [mapped], notes }
        : { classes: [`tracking-[${arbitrary(value)}]`], notes };
    }

    case 'text-align':
      return ['left', 'center', 'right', 'justify', 'start', 'end'].includes(
        lower
      )
        ? { classes: [`text-${lower}`], notes }
        : null;

    case 'text-transform':
      return ['uppercase', 'lowercase', 'capitalize', 'none'].includes(lower)
        ? { classes: [lower === 'none' ? 'normal-case' : lower], notes }
        : null;

    case 'text-decoration-line':
    case 'text-decoration': {
      if (lower.includes('underline') && !lower.includes('line-through')) {
        return { classes: ['underline'], notes };
      }
      if (lower.includes('line-through')) {
        return { classes: ['line-through'], notes };
      }
      if (lower.includes('overline')) {
        return { classes: ['overline'], notes };
      }
      if (lower === 'none') {
        return { classes: ['no-underline'], notes };
      }
      return null;
    }

    case 'text-decoration-color':
      return {
        classes: asSingleClass(colorClass('decoration', value)),
        notes,
      };
    case 'text-decoration-style': {
      const map: Record<string, string> = {
        solid: 'decoration-solid',
        double: 'decoration-double',
        dotted: 'decoration-dotted',
        dashed: 'decoration-dashed',
        wavy: 'decoration-wavy',
      };
      return map[lower] ? { classes: [map[lower]!], notes } : null;
    }

    case 'text-decoration-thickness':
      return {
        classes: [`decoration-[${arbitrary(value)}]`],
        notes,
      };

    case 'text-overflow':
      return lower === 'ellipsis'
        ? { classes: ['text-ellipsis'], notes }
        : lower === 'clip'
          ? { classes: ['text-clip'], notes }
          : null;

    case 'text-wrap':
      return ['wrap', 'nowrap', 'balance', 'pretty'].includes(lower)
        ? { classes: [`text-${lower}`], notes }
        : null;

    case 'white-space': {
      const map: Record<string, string> = {
        normal: 'whitespace-normal',
        nowrap: 'whitespace-nowrap',
        pre: 'whitespace-pre',
        'pre-line': 'whitespace-pre-line',
        'pre-wrap': 'whitespace-pre-wrap',
        'break-spaces': 'whitespace-break-spaces',
      };
      return map[lower] ? { classes: [map[lower]!], notes } : null;
    }

    case 'word-break': {
      const map: Record<string, string> = {
        normal: 'break-normal',
        'break-all': 'break-all',
        'break-word': 'break-words',
        'keep-all': 'break-keep',
      };
      return map[lower] ? { classes: [map[lower]!], notes } : null;
    }

    case 'overflow-wrap':
      return lower === 'break-word' || lower === 'anywhere'
        ? { classes: ['break-words'], notes }
        : lower === 'normal'
          ? { classes: ['break-normal'], notes }
          : null;

    case 'hyphens':
      return ['none', 'manual', 'auto'].includes(lower)
        ? { classes: [`hyphens-${lower}`], notes }
        : null;

    case 'color':
      return {
        classes: asSingleClass(colorClass('text', value)),
        notes,
      };

    case 'background-color':
      return {
        classes: asSingleClass(colorClass('bg', value)),
        notes,
      };

    case 'background': {
      if (lower === 'none') {
        return { classes: ['bg-none'], notes };
      }
      if (
        lower === 'transparent' ||
        lower.startsWith('#') ||
        lower.startsWith('rgb') ||
        lower.startsWith('hsl') ||
        lower.startsWith('var(') ||
        (!/\s/.test(lower) &&
          !lower.includes('url(') &&
          !lower.includes('gradient'))
      ) {
        return {
          classes: asSingleClass(colorClass('bg', value)),
          notes,
        };
      }
      return null;
    }

    case 'background-image': {
      if (lower === 'none') {
        return { classes: ['bg-none'], notes };
      }
      if (lower.startsWith('url(')) {
        return { classes: [`bg-[${arbitrary(value)}]`], notes };
      }
      if (lower.includes('gradient')) {
        return { classes: [`bg-[${arbitrary(value)}]`], notes };
      }
      return null;
    }

    case 'background-size':
      if (lower === 'cover' || lower === 'contain' || lower === 'auto') {
        return { classes: [`bg-${lower}`], notes };
      }
      return { classes: [`bg-[length:${arbitrary(value)}]`], notes };

    case 'background-position': {
      const map: Record<string, string> = {
        center: 'bg-center',
        top: 'bg-top',
        bottom: 'bg-bottom',
        left: 'bg-left',
        right: 'bg-right',
        'left top': 'bg-left-top',
        'left bottom': 'bg-left-bottom',
        'right top': 'bg-right-top',
        'right bottom': 'bg-right-bottom',
        'top left': 'bg-left-top',
        'top right': 'bg-right-top',
        'bottom left': 'bg-left-bottom',
        'bottom right': 'bg-right-bottom',
      };
      return map[lower]
        ? { classes: [map[lower]!], notes }
        : { classes: [`bg-[position:${arbitrary(value)}]`], notes };
    }

    case 'background-repeat': {
      const map: Record<string, string> = {
        repeat: 'bg-repeat',
        'no-repeat': 'bg-no-repeat',
        'repeat-x': 'bg-repeat-x',
        'repeat-y': 'bg-repeat-y',
        round: 'bg-repeat-round',
        space: 'bg-repeat-space',
      };
      return map[lower] ? { classes: [map[lower]!], notes } : null;
    }

    case 'background-attachment':
      return ['fixed', 'local', 'scroll'].includes(lower)
        ? { classes: [`bg-${lower}`], notes }
        : null;

    case 'background-clip': {
      const map: Record<string, string> = {
        'border-box': 'bg-clip-border',
        'padding-box': 'bg-clip-padding',
        'content-box': 'bg-clip-content',
        text: 'bg-clip-text',
      };
      return map[lower] ? { classes: [map[lower]!], notes } : null;
    }

    case 'background-origin': {
      const map: Record<string, string> = {
        'border-box': 'bg-origin-border',
        'padding-box': 'bg-origin-padding',
        'content-box': 'bg-origin-content',
      };
      return map[lower] ? { classes: [map[lower]!], notes } : null;
    }

    case 'border-width':
      return {
        classes: asSingleClass(borderWidthClass('border', value)),
        notes,
      };

    case 'border-top-width':
    case 'border-right-width':
    case 'border-bottom-width':
    case 'border-left-width':
      return {
        classes: asSingleClass(
          borderWidthClass(BORDER_SIDES[property] ?? 'border', value)
        ),
        notes,
      };

    case 'border-color':
      return { classes: asSingleClass(colorClass('border', value)), notes };

    case 'border-top-color':
    case 'border-right-color':
    case 'border-bottom-color':
    case 'border-left-color':
      return {
        classes: asSingleClass(
          colorClass(BORDER_COLOR_SIDES[property] ?? 'border', value)
        ),
        notes,
      };

    case 'border-style': {
      const map: Record<string, string> = {
        solid: 'border-solid',
        dashed: 'border-dashed',
        dotted: 'border-dotted',
        double: 'border-double',
        none: 'border-none',
        hidden: 'border-hidden',
      };
      return map[lower] ? { classes: [map[lower]!], notes } : null;
    }

    case 'border': {
      if (lower === 'none') {
        return { classes: ['border-0'], notes };
      }
      const parts = value.trim().split(/\s+/);
      const classes: string[] = [];
      for (const part of parts) {
        const partLower = part.toLowerCase();
        if (BORDER_WIDTHS[partLower] !== undefined) {
          const widthClass = borderWidthClass('border', part);
          if (widthClass) {
            classes.push(widthClass);
          }
        } else if (
          ['solid', 'dashed', 'dotted', 'double', 'none', 'hidden'].includes(
            partLower
          )
        ) {
          if (partLower !== 'none') {
            classes.push(`border-${partLower}`);
          }
        } else {
          const color = colorClass('border', part);
          if (color) {
            classes.push(color);
          }
        }
      }
      return classes.length > 0 ? { classes, notes } : null;
    }

    case 'border-radius':
      return { classes: [radiusClass('rounded', value)], notes };

    case 'border-top-left-radius':
      return { classes: [radiusClass('rounded-tl', value)], notes };
    case 'border-top-right-radius':
      return { classes: [radiusClass('rounded-tr', value)], notes };
    case 'border-bottom-right-radius':
      return { classes: [radiusClass('rounded-br', value)], notes };
    case 'border-bottom-left-radius':
      return { classes: [radiusClass('rounded-bl', value)], notes };

    case 'box-shadow':
      return { classes: [shadowClass(value)], notes };

    case 'outline': {
      if (lower === 'none') {
        return { classes: ['outline-none'], notes };
      }
      const classes: string[] = [];
      for (const part of value.trim().split(/\s+/)) {
        const partLower = part.toLowerCase();
        if (['solid', 'dashed', 'dotted', 'double'].includes(partLower)) {
          classes.push(`outline-${partLower}`);
        } else if (/^\d+(?:\.\d+)?px$/.test(partLower)) {
          classes.push(`outline-[${partLower}]`);
        } else if (partLower !== 'none') {
          const color = colorClass('outline', part);
          if (color) {
            classes.push(color);
          }
        }
      }
      return classes.length > 0 ? { classes, notes } : null;
    }

    case 'outline-width':
      return { classes: [`outline-[${arbitrary(value)}]`], notes };

    case 'outline-style': {
      if (lower === 'none') {
        return { classes: ['outline-none'], notes };
      }
      return ['solid', 'dashed', 'dotted', 'double'].includes(lower)
        ? { classes: [`outline-${lower}`], notes }
        : null;
    }

    case 'outline-color':
      return { classes: asSingleClass(colorClass('outline', value)), notes };

    case 'outline-offset':
      return { classes: [`outline-offset-[${arbitrary(value)}]`], notes };

    case 'opacity': {
      const percent = Math.round(Number.parseFloat(lower) * 100);
      if (Number.isFinite(percent)) {
        return { classes: [`opacity-${percent}`], notes };
      }
      return { classes: [`opacity-[${arbitrary(value)}]`], notes };
    }

    case 'z-index':
      return {
        classes: [
          lower === 'auto'
            ? 'z-auto'
            : ['0', '10', '20', '30', '40', '50'].includes(lower)
              ? `z-${lower}`
              : `z-[${arbitrary(value)}]`,
        ],
        notes,
      };

    case 'cursor':
      return CURSORS.has(lower)
        ? { classes: [`cursor-${lower}`], notes }
        : { classes: [`cursor-[${arbitrary(value)}]`], notes };

    case 'pointer-events':
      return lower === 'none' || lower === 'auto'
        ? { classes: [`pointer-events-${lower}`], notes }
        : null;

    case 'user-select': {
      const map: Record<string, string> = {
        none: 'select-none',
        text: 'select-text',
        all: 'select-all',
        auto: 'select-auto',
      };
      return map[lower] ? { classes: [map[lower]!], notes } : null;
    }

    case 'resize':
      if (lower === 'none') {
        return { classes: ['resize-none'], notes };
      }
      if (lower === 'both') {
        return { classes: ['resize'], notes };
      }
      if (lower === 'horizontal') {
        return { classes: ['resize-x'], notes };
      }
      if (lower === 'vertical') {
        return { classes: ['resize-y'], notes };
      }
      return null;

    case 'appearance':
      return lower === 'none' ? { classes: ['appearance-none'], notes } : null;

    case 'transition':
      return transitionClasses(value).length > 0
        ? { classes: transitionClasses(value), notes }
        : null;

    case 'transition-property': {
      const mapped = TRANSITION_PROPERTIES[lower];
      return mapped
        ? { classes: [mapped], notes }
        : { classes: [`transition-[${arbitrary(value)}]`], notes };
    }

    case 'transition-duration': {
      const milliseconds = lower.endsWith('ms')
        ? Number.parseFloat(lower)
        : lower.endsWith('s')
          ? Number.parseFloat(lower) * 1000
          : Number.NaN;
      return {
        classes: [
          Number.isFinite(milliseconds)
            ? `duration-[${Math.round(milliseconds)}ms]`
            : `duration-[${arbitrary(value)}]`,
        ],
        notes,
      };
    }

    case 'transition-delay': {
      const milliseconds = lower.endsWith('ms')
        ? Number.parseFloat(lower)
        : lower.endsWith('s')
          ? Number.parseFloat(lower) * 1000
          : Number.NaN;
      return {
        classes: [
          Number.isFinite(milliseconds)
            ? `delay-[${Math.round(milliseconds)}ms]`
            : `delay-[${arbitrary(value)}]`,
        ],
        notes,
      };
    }

    case 'transition-timing-function':
      return {
        classes: [EASINGS[lower] ?? `ease-[${arbitrary(value)}]`],
        notes,
      };

    case 'transform': {
      const classes = transformClasses(value);
      return classes ? { classes, notes } : null;
    }

    case 'transform-origin': {
      const map: Record<string, string> = {
        center: 'origin-center',
        top: 'origin-top',
        'top right': 'origin-top-right',
        right: 'origin-right',
        'bottom right': 'origin-bottom-right',
        bottom: 'origin-bottom',
        'bottom left': 'origin-bottom-left',
        left: 'origin-left',
        'top left': 'origin-top-left',
      };
      return map[lower]
        ? { classes: [map[lower]!], notes }
        : { classes: [`origin-[${arbitrary(value)}]`], notes };
    }

    case 'object-fit': {
      const map: Record<string, string> = {
        contain: 'object-contain',
        cover: 'object-cover',
        fill: 'object-fill',
        none: 'object-none',
        'scale-down': 'object-scale-down',
      };
      return map[lower] ? { classes: [map[lower]!], notes } : null;
    }

    case 'object-position': {
      const map: Record<string, string> = {
        center: 'object-center',
        top: 'object-top',
        bottom: 'object-bottom',
        left: 'object-left',
        right: 'object-right',
        'left top': 'object-left-top',
        'left bottom': 'object-left-bottom',
        'right top': 'object-right-top',
        'right bottom': 'object-right-bottom',
      };
      return map[lower]
        ? { classes: [map[lower]!], notes }
        : { classes: [`object-[${arbitrary(value)}]`], notes };
    }

    case 'aspect-ratio': {
      if (lower === 'auto') {
        return { classes: ['aspect-auto'], notes };
      }
      if (lower === '1 / 1' || lower === '1/1') {
        return { classes: ['aspect-square'], notes };
      }
      if (lower === '16 / 9' || lower === '16/9') {
        return { classes: ['aspect-video'], notes };
      }
      return { classes: [`aspect-[${arbitrary(value)}]`], notes };
    }

    case 'list-style-type': {
      const map: Record<string, string> = {
        none: 'list-none',
        disc: 'list-disc',
        decimal: 'list-decimal',
      };
      return map[lower]
        ? { classes: [map[lower]!], notes }
        : { classes: [`list-[${arbitrary(value)}]`], notes };
    }

    case 'list-style-position':
      return lower === 'inside' || lower === 'outside'
        ? { classes: [`list-${lower}`], notes }
        : null;

    case 'vertical-align': {
      const map: Record<string, string> = {
        baseline: 'align-baseline',
        top: 'align-top',
        middle: 'align-middle',
        bottom: 'align-bottom',
        'text-top': 'align-text-top',
        'text-bottom': 'align-text-bottom',
        sub: 'align-sub',
        super: 'align-super',
      };
      return map[lower] ? { classes: [map[lower]!], notes } : null;
    }

    case 'scroll-behavior':
      return lower === 'smooth' || lower === 'auto'
        ? { classes: [`scroll-${lower}`], notes }
        : null;

    case 'mix-blend-mode': {
      const allowed = [
        'normal',
        'multiply',
        'screen',
        'overlay',
        'darken',
        'lighten',
        'color-dodge',
        'color-burn',
        'hard-light',
        'soft-light',
        'difference',
        'exclusion',
        'hue',
        'saturation',
        'color',
        'luminosity',
        'plus-lighter',
      ];
      return allowed.includes(lower)
        ? { classes: [`mix-blend-${lower}`], notes }
        : null;
    }

    case 'accent-color':
      return { classes: asSingleClass(colorClass('accent', value)), notes };

    case 'caret-color':
      return { classes: asSingleClass(colorClass('caret', value)), notes };

    default:
      return null;
  }
};

export const convertCssToTailwind = (input: string): TailwindConversion => {
  const { rules, atRules } = extractCssRules(input);
  const results: TailwindRuleResult[] = [];
  let mappedCount = 0;
  let unmappedCount = 0;

  for (const rule of rules) {
    const declarations = parseDeclarations(rule.body);
    const classes: string[] = [];
    const unmapped: CssDeclaration[] = [];
    const notes: string[] = [];

    for (const declaration of declarations) {
      const mapped = declarationToTailwind(
        declaration.property,
        declaration.value
      );
      if (mapped && mapped.classes.length > 0) {
        classes.push(...mapped.classes);
        mappedCount += 1;
        for (const note of mapped.notes) {
          if (!notes.includes(note)) {
            notes.push(note);
          }
        }
      } else {
        unmapped.push(declaration);
        unmappedCount += 1;
      }
    }

    results.push({
      selector: rule.selector,
      atRule: rule.atRule,
      classes: [...new Set(classes)],
      unmapped,
      notes,
    });
  }

  const text = results
    .map((rule) => {
      const header = rule.atRule
        ? `/* ${rule.atRule} > ${rule.selector} */`
        : `/* ${rule.selector} */`;
      const classLine =
        rule.classes.length > 0
          ? rule.classes.join(' ')
          : 'No Tailwind classes generated.';
      const unmappedLines =
        rule.unmapped.length > 0
          ? `\n\nUnmapped declarations:\n${rule.unmapped
              .map(
                (declaration) =>
                  `- ${declaration.property}: ${declaration.value}`
              )
              .join('\n')}`
          : '';
      return `${header}\n${classLine}${unmappedLines}`;
    })
    .join('\n\n');

  return { rules: results, atRules, mappedCount, unmappedCount, text };
};
