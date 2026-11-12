# CoderTools

<p align="center">
  <img src="public/logo.svg" alt="CoderTools" width="320" />
</p>

CoderTools is a collection of 190+ browser-based developer tools for working
with code, data, colors, images and more: format, minify, validate, convert,
hash, generate and inspect. Everything runs locally.

> **Status:** the catalog, searchable tool directory, category pages, tool
> routes and GitHub-style UI are in place. Individual tools are being
> implemented.

## The idea

A developer pastes code into a page, chooses an action, and gets the result
without installing anything or uploading source code to a server.

- **Format / beautify** — make messy code readable.
- **Minify / compress** — reduce the size of code.
- **Validate** — report syntax errors and structural problems.
- **Stylize** — apply consistent formatting/style rules.

Everything should run client-side so the app can be exported as a static site.

## Tools

The complete catalog contains roughly **190 client-side tools** across 18 categories. The full inventory is in [docs/PRODUCT.md](docs/PRODUCT.md).

| Category                         | Route prefix           | Examples                                         |
| -------------------------------- | ---------------------- | ------------------------------------------------ |
| HTML                             | `/tools/html/`         | HTML formatter, minifier, validator, preview     |
| CSS                              | `/tools/css/`          | CSS formatter, minifier, validator               |
| JavaScript                       | `/tools/js/`           | JS formatter, minifier, validator, TS → JS       |
| JSON                             | `/tools/json/`         | JSON formatter, minifier, validator, tree viewer |
| Encoding & Decoding              | `/tools/encoding/`     | Base64, Base32, hex, URL, Unicode escapes        |
| Hashing & Cryptography           | `/tools/crypto/`       | MD5, SHA, HMAC, bcrypt, AES, RSA                 |
| Auth & Tokens                    | `/tools/auth/`         | JWT, PKCE, Basic auth, TOTP, cookies             |
| Generators                       | `/tools/generators/`   | UUID, ULID, NanoID, passwords, fake data         |
| Text & Strings                   | `/tools/text/`         | Case converter, diff, regex, Markdown            |
| Data Format Conversion           | `/tools/data/`         | JSON ↔ YAML/XML/CSV, TOML, XLSX, schemas         |
| Code Formatting & Transformation | `/tools/code/`         | SQL, GraphQL, SCSS, curl ↔ fetch                 |
| Color & CSS                      | `/tools/color/`        | Color converter, contrast, gradients, shadows    |
| Number, Math & Units             | `/tools/math/`         | Base converter, bitwise, units, calculators      |
| Time & Date                      | `/tools/time/`         | Timestamp, timezone, cron, duration              |
| Web & Network                    | `/tools/web/`          | HTTP status, MIME, URL, CIDR, configs            |
| Images & Media                   | `/tools/images/`       | Compress, resize, SVG, favicon, QR               |
| Validators                       | `/tools/validators/`   | Email, card, IBAN, ISBN, phone, semver           |
| Git, Docs & Productivity         | `/tools/productivity/` | Commits, diffs, licenses, logs, timers           |

Every tool gets its own route, for example:

```text
/tools/html/formatter/
/tools/crypto/sha-256/
/tools/data/json-to-typescript/
/tools/generators/uuid/
/tools/time/timestamp-converter/
```

The app uses a searchable `/tools/` directory, 18 category pages and one page
per tool. The GitHub-style shell includes light and dark themes.

## Current implementation

| Area                                    | Status                         |
| --------------------------------------- | ------------------------------ |
| Next.js 16 App Router                   | Done                           |
| React 19                                | Done                           |
| Tailwind CSS 4                          | Done                           |
| Static export (`out/`)                  | Done                           |
| Header, footer, responsive shell        | Done                           |
| Searchable `/tools/` directory          | Done                           |
| 18 category pages                       | Done                           |
| About page                              | Done                           |
| SEO metadata, sitemap, robots, manifest | Done                           |
| Full 190-tool catalog                   | Done                           |
| Tool routes                             | Done                           |
| Individual tool implementations         | Complete (190/190 audited)     |
| Shared copy/download controls           | Done                           |
| Privacy-first analytics + footer counts | Done                           |
| Privacy, Terms and Cookie pages         | Done                           |
| Offline service worker + fallback page  | Done                           |
| Branding/logo assets                    | CoderTools SVG mark and lockup |

## Quality checks

```shell
npm run check          # type-check + lint + tests
npm run check-types    # TypeScript
npm run lint           # ESLint
npm run format:check   # Prettier
npm run test           # Jest + React Testing Library
npm run audit:tools    # catalog → component mapping
npm run audit:browser  # headless audit of all 190 tool pages
npm run audit:offline  # service worker + offline fallback audit
npm run build          # production static build
```

The browser audits use the installed Chrome or Edge and require a production
build in `out/` first. All 190 tools and 7 core pages pass the browser audit,
and the offline audit verifies both cached tool pages and the `/offline/`
fallback.

## Offline support

`public/sw.js` precaches the app shell and caches visited pages and static
assets at runtime. A visited tool page continues to work offline; an uncached
page shows the friendly `/offline/` fallback instead of a browser error.
Service worker registration is production-only.

## Architecture

- `src/data/catalog.ts` — single source of truth for categories and tools.
- `src/tools/<category>/<slug>.tsx` — one client component per tool.
- `src/tools/<category>/index.ts` — maps catalog slugs to tool components.
- `src/components/tools/ToolRenderer.tsx` — lazily imports the category bundle
  for the current tool, so tools are not shipped in the initial page load.
- `src/components/ui/` — GitHub-style shared UI primitives.
- `src/app/tools/` — searchable directory, category pages and tool pages.
- `src/styles/global.css` — design tokens and light/dark theme variables.
- `src/lib/analytics/` and `src/hooks/usePresence.ts` — privacy-first analytics.
- `functions/api/track.js` — Cloudflare Pages Function that stamps country data.
- `supabase/migrations/001_codertools_analytics.sql` — `codertools_*` tables in
  the shared Supabase database.
- `public/sw.js` — offline cache and fallback handling.
- `scripts/audit-tools-browser.mjs` — headless mount/control audit for every
  tool page.
- `scripts/audit-offline.mjs` — offline and service-worker audit.

## Analytics

CoderTools includes the same custom analytics stack as `milinds.dev-v2`: a
client tracker, live footer preview, and a `/analytics/` dashboard. The shared
Supabase project uses project-prefixed tables (`codertools_visitors`,
`codertools_page_views`, `codertools_presence`) so other projects never mix
data.

See [docs/ANALYTICS.md](docs/ANALYTICS.md) for setup and deployment.

## Cloudflare Pages deployment

The repo is configured for a static Cloudflare Pages deployment:

| Setting                | Value           |
| ---------------------- | --------------- |
| Build command          | `npm run build` |
| Build output directory | `out`           |
| Node version           | `22.23.4`       |
| Framework preset       | None / static   |

`wrangler.jsonc` sets `pages_build_output_dir` to `out`. `.node-version` and
`.nvmrc` pin Node `22.23.4` for local and CI use.

> **Important:** Cloudflare Pages build environment variables override the
> version files. If the Pages project has `NODE_VERSION=26.13.1`, change it to
> `22.23.4` or delete it in **Settings → Environment variables → Build**.
> Node `26.13.1` is not available in the Pages build image and causes:
> `node-build: definition not found: 26.13.1`.

Build-time environment variables:

```text
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

Runtime variable for the `/api/track` Pages Function:

```text
SUPABASE_TRACK_URL=https://<project>.supabase.co/functions/v1/codertools-track
```

The `functions/` directory is deployed alongside `out/` and provides the
country-stamping proxy. See [docs/ANALYTICS.md](docs/ANALYTICS.md).

## Development

```shell
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```shell
npm run build     # static build in out/
npm run start     # serve the static build on port 3000
npm run clean     # remove .next and out
```

See [docs/PRODUCT.md](docs/PRODUCT.md) for the project brief and full tool
inventory.
