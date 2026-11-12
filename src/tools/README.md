# Tool implementation guide

Every tool is a client component loaded lazily by category.

## Folder contract

```text
src/tools/<category>/
  index.ts          # maps catalog slugs to components
  <tool-slug>.tsx   # one file per tool, named exactly like the catalog slug
```

`src/data/catalog.ts` is the source of truth for category ids, tool slugs,
names and descriptions. Do not rename slugs.

## Component contract

- Add `'use client';` as the first line.
- Export the tool as the **default** export.
- Do not render a page title or breadcrumb; the page shell already does that.
- Keep the component focused on the interactive tool.
- Use the shared UI primitives below. Do not add global CSS.
- Do not edit `src/data/catalog.ts`, `package.json`, shared components, or
  another category's folder.
- Use only installed dependencies or browser APIs. If a dependency is missing,
  implement the feature with browser APIs instead of installing something.

## Category index

```ts
import type { CategoryModule } from '@/components/tools/types';

import Base32 from './base32';
import Base64 from './base64';

export const components: CategoryModule['components'] = {
  base32: Base32,
  base64: Base64,
};
```

## Shared UI primitives

```tsx
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { CodeBlock } from '@/components/ui/CodeBlock';
import { CopyButton } from '@/components/ui/CopyButton';
import { DownloadButton } from '@/components/ui/DownloadButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Field } from '@/components/ui/Field';
import { FileDropzone } from '@/components/ui/FileDropzone';
import { Input } from '@/components/ui/Input';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { ToolLayout } from '@/components/ui/ToolLayout';
```

All components are named exports.

## Example tool

```tsx
'use client';

import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { Field } from '@/components/ui/Field';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { Textarea } from '@/components/ui/Textarea';
import { ToolLayout } from '@/components/ui/ToolLayout';

export default function ExampleTool() {
  const [input, setInput] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const output = useMemo(() => input.toUpperCase(), [input]);
  const error = submitted && !input ? 'Enter some text first.' : null;

  return (
    <div className="space-y-4">
      <ToolLayout>
        <Panel title="Input">
          <Field label="Text" hint={`${input.length} characters`}>
            <Textarea
              onChange={(event) => {
                setInput(event.target.value);
                setSubmitted(false);
              }}
              placeholder="Paste text here…"
              value={input}
            />
          </Field>
          <div className="mt-3 flex gap-2">
            <Button onClick={() => setSubmitted(true)} variant="primary">
              Convert
            </Button>
          </div>
          {error && (
            <Callout className="mt-3" variant="error">
              {error}
            </Callout>
          )}
        </Panel>

        <ResultPanel
          filename="result.txt"
          label="Output"
          value={submitted ? output : ''}
        />
      </ToolLayout>
    </div>
  );
}
```

## Installed libraries

Use these when they make the implementation more reliable. They are already in
`package.json`:

- `hash-wasm` — MD5, SHA, HMAC, CRC32, bcrypt
- `jose` — JWT signing and verification
- `@peculiar/x509` — X.509 certificate parsing
- `js-yaml`, `smol-toml`, `fast-xml-parser`, `papaparse`, `xlsx`
- `ajv`, `jsonpath-plus`
- `diff`, `marked`, `dompurify`
- `nanoid`, `ulid`, `uuid`
- `qrcode`, `jsbarcode`, `jszip`
- `culori`
- `semver`, `ipaddr.js`, `ua-parser-js`, `libphonenumber-js`
- `cron-parser`, `cronstrue`
- `sql-formatter`, `graphql`
- `sass`, `less`, `stylus`
- `prettier`, `terser`, `clean-css`, `html-minifier-terser`
- `regexpp`, `figlet`, `html-to-image`, `svgo`, `exifr`, `mermaid`
- `@faker-js/faker`, `mathjs`, `prismjs`

Prefer Web Crypto, Canvas, `FileReader`, `Intl`, `BigInt` and other browser
APIs where possible.

## Quality checklist

- Handles empty input and invalid input with a visible error.
- Does not crash on large or unusual input.
- Uses labels and `aria-label` for controls.
- Shows output with `ResultPanel` (copy and download are built in).
- Uses `FileDropzone` for file-based tools.
- Heavy libraries are imported inside the component or inside an event handler
  so they stay in the tool's lazy chunk.
- No network requests are required.
- No global state or `window` access during server rendering.
