// Ambient declarations for browser-only dependencies that do not ship types.

declare module 'less' {
  export type LessRenderResult = {
    css: string;
    map?: string;
    imports?: string[];
  };

  export type LessRenderOptions = {
    compress?: boolean;
    strictMath?: boolean;
    javascriptEnabled?: boolean;
    [key: string]: unknown;
  };

  export function render(
    input: string,
    options?: LessRenderOptions
  ): Promise<LessRenderResult>;

  const less: {
    render: typeof render;
    version?: number[];
  };

  export default less;
}

declare module 'prismjs/components/*';
