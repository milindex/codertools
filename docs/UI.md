# CoderTools UI guide

The interface follows GitHub's product UI: compact spacing, 1px borders,
muted surfaces, a single blue accent, green primary actions and monospace code.
It supports GitHub-style light and dark themes.

## Design tokens

Tokens live in `src/styles/global.css` and are exposed as Tailwind colors through
`@theme inline`, so classes like `bg-canvas`, `text-fg-muted` and
`border-border` automatically switch with the theme.

| Token           | Dark      | Light     | Usage                          |
| --------------- | --------- | --------- | ------------------------------ |
| `canvas`        | `#0d1117` | `#ffffff` | Page background                |
| `canvas-subtle` | `#161b22` | `#f6f8fa` | Header, panels, muted sections |
| `canvas-inset`  | `#010409` | `#f6f8fa` | Inputs, code blocks, previews  |
| `surface`       | `#161b22` | `#ffffff` | Cards and panels               |
| `surface-hover` | `#1f242c` | `#f6f8fa` | Hover states                   |
| `border`        | `#30363d` | `#d0d7de` | Default border                 |
| `fg`            | `#e6edf3` | `#1f2328` | Primary text                   |
| `fg-muted`      | `#8b949e` | `#656d76` | Secondary text                 |
| `accent`        | `#2f81f7` | `#0969da` | Links, focus, selection        |
| `success`       | `#3fb950` | `#1a7f37` | Valid states, primary buttons  |
| `danger`        | `#f85149` | `#cf222e` | Errors                         |
| `attention`     | `#d29922` | `#9a6700` | Warnings                       |
| `done`          | `#a371f7` | `#8250df` | Informational labels           |

## Typography

- UI font: **Barlow** (loaded with `next/font`), with a system fallback stack.
- Code font: `ui-monospace`, SFMono-Regular, Menlo, Consolas.
- Body text is 14px; supporting text is 12px; code is 13px.
- Headings use tight tracking and semibold weight.

## Layout

- Content width: `max-w-6xl`.
- Page padding: 16px on mobile, 24–32px on larger screens.
- Cards use `rounded-lg` (12px); controls use `rounded-md` (6px).
- Tool pages use a two-column layout on large screens (`ToolLayout`).
- The header is sticky with a translucent canvas background and a bottom border.

## Components

| Component                         | Path                                     | Notes                                     |
| --------------------------------- | ---------------------------------------- | ----------------------------------------- |
| Header                            | `src/components/site/Header.tsx`         | Logo, search, category menu, theme toggle |
| Footer                            | `src/components/site/Footer.tsx`         | Category links, privacy note              |
| Button                            | `src/components/ui/Button.tsx`           | `default`, `primary`, `danger`, `ghost`   |
| LinkButton                        | `src/components/ui/LinkButton.tsx`       | Link styled as a button                   |
| Panel                             | `src/components/ui/Panel.tsx`            | Bordered card with header/body/footer     |
| Field / Input / Textarea / Select | `src/components/ui/`                     | Form controls                             |
| ResultPanel                       | `src/components/ui/ResultPanel.tsx`      | Output with copy/download                 |
| CodeBlock                         | `src/components/ui/CodeBlock.tsx`        | Read-only code with copy                  |
| FileDropzone                      | `src/components/ui/FileDropzone.tsx`     | Drag-and-drop file input                  |
| SegmentedControl                  | `src/components/ui/SegmentedControl.tsx` | Mode switcher                             |
| Callout                           | `src/components/ui/Callout.tsx`          | Info/success/warning/error notes          |
| Badge                             | `src/components/ui/Badge.tsx`            | Category and status labels                |
| ToolCard / CategoryCard           | `src/components/`                        | Catalog navigation                        |

## Guidelines

- Use borders and background steps for hierarchy before using shadows.
- Keep the accent blue for interactive elements; use green only for primary
  actions and success states.
- Never use gradient fills on controls. The only decorative gradient is the
  hero glow.
- Code, hashes, keys and generated output always use the monospace font.
- Every tool must show a visible empty state, error state and result state.
- Inputs must have labels; icon-only buttons must have `aria-label`.
- Do not add global CSS from a tool component. Use shared primitives and
  Tailwind utilities.
- Heavy libraries must stay inside the tool's lazy-loaded chunk.

## Themes

The theme is applied to `<html data-theme="dark|light">` before paint by a small
inline script in `src/app/layout.tsx`. The toggle stores the choice in
`localStorage` under `ct-theme`. If no choice exists, the system preference is
used.
