// Minimal ambient types for the installed `culori` package, which does not
// ship its own declaration files. Only the APIs used by the color tools are
// described here.

declare module 'culori' {
  export type Color = {
    mode: string;
    alpha?: number;
    [channel: string]: number | string | undefined;
  };

  export type ColorInput = Color | string;

  export type Rgb = {
    mode: string;
    r: number;
    g: number;
    b: number;
    alpha?: number;
  };

  export type Hsl = {
    mode: string;
    h?: number;
    s: number;
    l: number;
    alpha?: number;
  };

  export type Hwb = {
    mode: string;
    h?: number;
    w: number;
    b: number;
    alpha?: number;
  };

  export type Lch = {
    mode: string;
    l: number;
    c: number;
    h?: number;
    alpha?: number;
  };

  export type Oklch = {
    mode: string;
    l: number;
    c: number;
    h?: number;
    alpha?: number;
  };

  export type Oklab = {
    mode: string;
    l: number;
    a: number;
    b: number;
    alpha?: number;
  };

  export function parse(color: string): Color | undefined;

  export function converter(mode: 'rgb'): (color: ColorInput) => Rgb;
  export function converter(mode: 'hsl'): (color: ColorInput) => Hsl;
  export function converter(mode: 'hwb'): (color: ColorInput) => Hwb;
  export function converter(mode: 'lch'): (color: ColorInput) => Lch;
  export function converter(mode: 'oklch'): (color: ColorInput) => Oklch;
  export function converter(mode: 'oklab'): (color: ColorInput) => Oklab;
  export function converter(mode: 'lrgb'): (color: ColorInput) => Rgb;
  export function converter(mode: string): (color: ColorInput) => Color;

  export function formatHex(color: ColorInput): string | undefined;
  export function formatHex8(color: ColorInput): string | undefined;
  export function formatRgb(color: ColorInput): string | undefined;
  export function formatHsl(color: ColorInput): string | undefined;
  export function formatCss(color: ColorInput): string | undefined;

  export function clampRgb<T extends ColorInput>(color: T): T;

  export function wcagContrast(a: ColorInput, b: ColorInput): number;
  export function wcagLuminance(color: ColorInput): number;

  export function filterDeficiencyProt(
    severity?: number
  ): (color: ColorInput) => Color | undefined;
  export function filterDeficiencyDeuter(
    severity?: number
  ): (color: ColorInput) => Color | undefined;
  export function filterDeficiencyTrit(
    severity?: number
  ): (color: ColorInput) => Color | undefined;
  export function filterGrayscale(
    amount?: number
  ): (color: ColorInput) => Color | undefined;

  export function interpolate(
    colors: ColorInput[],
    mode?: string
  ): (t: number) => Color;
}
