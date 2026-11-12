# CoderTools — product brief and tool catalog

## What the project is

CoderTools is a client-side collection of developer tools: format, minify,
validate, convert, generate and inspect code and data in one place.

The repository started as a Next.js Boilerplate fork and was rebranded to
CoderTools. The original repo contained no tool specification or
implementation; this document is now the canonical catalog for the project.

> **Status:** the catalog, searchable tool directory, category pages, tool
> routes and GitHub-style UI are in place. Individual tool implementations are
> in progress.

## Product principles

1. **Client-side only** — code and files never leave the browser.
2. **One-click actions** — paste, choose an action, get the result.
3. **No account required** — deployable as a static site.
4. **One route per tool** — predictable URLs grouped by category.
5. **Shared tool UI** — input editor, action controls, output panel, copy and
   download actions.
6. **Lazy-load heavy tools** — WASM, Pyodide, image codecs and spreadsheet
   parsers must not affect the initial page load.

## Scope

The catalog contains roughly 190 tools across 18 categories:

| Category                         | Route prefix           | Purpose                                           |
| -------------------------------- | ---------------------- | ------------------------------------------------- |
| HTML                             | `/tools/html/`         | HTML format, minify, validate, preview            |
| CSS                              | `/tools/css/`          | CSS format, minify, validate                      |
| JavaScript                       | `/tools/js/`           | JS format, minify, validate, convert              |
| JSON                             | `/tools/json/`         | JSON format, minify, validate, inspect            |
| Encoding & Decoding              | `/tools/encoding/`     | Convert between text and encoded representations  |
| Hashing & Cryptography           | `/tools/crypto/`       | Hashes, HMAC, checksums, encryption, keys         |
| Auth & Tokens                    | `/tools/auth/`         | JWT, PKCE, Basic auth, TOTP, cookies              |
| Generators                       | `/tools/generators/`   | IDs, passwords, random data, fake data            |
| Text & Strings                   | `/tools/text/`         | Case, diff, counting, sorting, regex, Markdown    |
| Data Format Conversion           | `/tools/data/`         | JSON, YAML, XML, CSV, TOML, XLSX, schemas         |
| Code Formatting & Transformation | `/tools/code/`         | Formatters, transpilers, converters, highlighters |
| Color & CSS                      | `/tools/color/`        | Color conversion, contrast, CSS generators        |
| Number, Math & Units             | `/tools/math/`         | Bases, bitwise, floats, calculators, units        |
| Time & Date                      | `/tools/time/`         | Timestamps, timezones, cron, durations            |
| Web & Network                    | `/tools/web/`          | HTTP, MIME, URL, IP/CIDR, server config           |
| Images & Media                   | `/tools/images/`       | Compression, conversion, SVG, QR, barcodes        |
| Validators                       | `/tools/validators/`   | Email, card, IBAN, ISBN, phone, IP, semver        |
| Git, Docs & Productivity         | `/tools/productivity/` | Commits, diffs, docs, logs, timers                |

## Core language tools

| Category   | Format / beautify | Minify / compress | Validate            |
| ---------- | ----------------- | ----------------- | ------------------- |
| HTML       | HTML formatter    | HTML minifier     | HTML validator      |
| CSS        | CSS formatter     | CSS minifier      | CSS validator       |
| JavaScript | JS formatter      | JS minifier       | JS syntax validator |
| JSON       | JSON formatter    | JSON minifier     | JSON validator      |

Additional language-specific tools:

- **HTML:** HTML preview, HTML entity encoder/decoder
- **CSS:** CSS → Tailwind, px ↔ rem converter
- **JavaScript:** JS object → JSON, JSON → JS object
- **JSON:** JSON tree viewer

## Encoding & Decoding

- Base32 encoder/decoder
- Base64 encoder/decoder
- URL-safe Base64 converter
- Base64 file-to-data-URI converter
- Hex encoder/decoder
- Binary ↔ text converter
- Octal converter
- Unicode escape converter (`\uXXXX`, `\u{...}`)
- ROT13 / Caesar cipher
- Morse code translator
- Punycode ↔ IDN converter
- Quoted-printable encoder/decoder
- String escaper/unescaper (JS, Python, C, JSON)
- URL encoder/decoder

## Hashing & Cryptography

- MD5 hash generator
- SHA-1 / SHA-256 / SHA-384 / SHA-512 generator
- File hash calculator (drag-and-drop)
- HMAC generator
- CRC32 checksum calculator
- bcrypt hash generator and verifier
- AES encrypt/decrypt (Web Crypto)
- RSA key pair generator
- PEM ↔ DER converter
- Certificate (PEM) viewer

## Auth & Tokens

- JWT encoder/signer (HS256/HS512)
- JWT expiry and claims inspector
- OAuth 2.0 PKCE code verifier/challenge generator
- Basic auth header generator
- TOTP/2FA code generator from secret
- Cookie string parser and builder

## Generators

- UUID v1/v4/v7 generator
- ULID generator
- NanoID generator
- Snowflake ID decoder
- Random string generator (custom charset)
- Password generator
- Diceware passphrase generator
- API key / secret generator
- Lorem ipsum generator
- Fake data generator (names, emails, addresses, dates)

## Text & Strings

- Case converter (camel, snake, kebab, Pascal, constant, title)
- Slugify
- Text diff (side-by-side)
- Word, character and byte counter
- Remove duplicate lines
- Sort lines (alphabetical, numeric, natural)
- Regex tester with match groups
- Regex explainer
- Find and replace with regex
- ASCII art text generator
- Line-ending normalizer (CRLF ↔ LF)
- Tabs ↔ spaces converter
- Strip HTML tags
- Markdown preview
- Markdown → HTML converter
- Character and Unicode inspector

## Data Format Conversion

- JSON ↔ YAML
- JSON ↔ XML
- JSON ↔ CSV
- CSV formatter and validator
- CSV → JSON
- TOML ↔ JSON
- YAML validator
- XML formatter and validator
- JSON diff
- JSONPath tester
- JSON Schema validator
- JSON → TypeScript interfaces
- JSON → Zod schema
- JSON → Go struct / Java POJO / Python dataclass / Pydantic model
- XLSX → CSV/JSON (SheetJS)
- Markdown table generator

## Code Formatting & Transformation

- SQL formatter
- GraphQL formatter
- SCSS → CSS compiler
- LESS → CSS compiler
- Stylus → CSS compiler
- Tailwind class sorter
- Strip comments (JS, CSS, HTML, Python)
- Remove `console.log` statements
- Import sorter (JS/TS)
- Code syntax highlighter (HTML output)
- Code screenshot generator (Carbon-style)
- TypeScript → JavaScript transpiler
- JSX → JS / HTML → JSX converter
- Curl ↔ fetch converter
- Python formatter (Pyodide/Black, larger download)

## Color & CSS

- Color picker and converter (HEX, RGB, HSL, HWB, LCH, OKLCH)
- WCAG contrast checker
- Color palette generator
- Tailwind color scale generator (50–950)
- Color blindness simulator
- Gradient generator (linear, radial, conic)
- Box-shadow generator
- Text-shadow generator
- Border-radius generator
- Glassmorphism generator
- Clip-path generator
- Cubic-bezier easing generator
- CSS keyframes animation builder
- Flexbox playground
- CSS Grid generator
- Media query builder

## Number, Math & Units

- Number base converter (binary, octal, decimal, hex)
- Bitwise calculator
- Two's complement calculator
- IEEE 754 float inspector
- Roman numeral converter
- Big integer calculator (BigInt)
- Scientific calculator
- Graphing calculator
- Percentage calculator
- Prime checker and factorizer
- Unit converter (length, weight, temperature, pixels, points)
- Data size converter (bytes, KB, MB, GiB)
- Aspect ratio calculator
- Hex dump viewer

## Time & Date

- Unix timestamp ↔ ISO 8601 converter
- Timezone converter
- Cron expression parser and generator
- Cron explainer (human-readable)
- Date difference calculator
- Business days calculator
- Duration formatter (ms → "2h 15m")

## Web & Network

- HTTP status code reference
- MIME type lookup
- User-Agent parser
- URL parser
- Query string parser and builder
- IP address and CIDR calculator
- Subnet calculator
- Meta tag and Open Graph generator
- Open Graph preview
- robots.txt generator
- `.htaccess` generator
- Nginx config generator
- `.gitignore` generator
- Docker run ↔ docker-compose converter
- Sitemap XML generator

## Images & Media

- Image compressor (JPEG/PNG/WebP)
- Image resizer and cropper
- Image format converter (PNG, JPEG, WebP, AVIF)
- SVG → PNG converter
- SVG optimizer (SVGO)
- Favicon generator
- Placeholder image generator (SVG)
- EXIF viewer and metadata remover
- Image color extractor
- QR code generator
- Barcode generator (Code128, EAN-13)

## Validators

- Email address validator
- Credit card validator (Luhn)
- IBAN validator
- ISBN validator
- Phone number formatter and validator (libphonenumber)
- IPv4 / IPv6 validator
- Semver validator and comparator
- Password strength checker
- Cron expression validator

## Git, Docs & Productivity

- Conventional commit message builder
- Unified diff / patch viewer
- Directory tree generator (from text)
- ASCII table generator
- Mermaid diagram preview
- Software license generator (MIT, Apache 2.0, GPL)
- README template generator
- Log file viewer with filtering
- Stack trace formatter
- Pomodoro timer
- Emoji picker
- Currency formatter

## Suggested launch priority

1. Hash generator, UUID/NanoID generator, password generator
2. JSON ↔ YAML/CSV/XML, JSON → TypeScript
3. Regex tester, text diff, case converter
4. Color converter, contrast checker, gradient and box-shadow generators
5. Timestamp converter, cron parser, number base converter
6. Image compressor, SVG → PNG, QR code generator

Heavy tools (Python formatter, image compression, SQL formatting, XLSX
conversion, Pyodide-based tools) should be lazy-loaded so they do not slow down
the initial page load.

## Proposed navigation

With 190 tools, a flat navigation will not scale. Use:

1. A searchable `/tools/` directory with category filters.
2. Top-level navigation for the highest-traffic groups: **Tools**, **Browse**,
   **Encoding**, **Crypto**, **Generators**, **Data**, **About**.
3. Language landing pages at `/tools/html/`, `/tools/css/`, `/tools/js/` and
   `/tools/json/`.
4. One page per tool, for example `/tools/crypto/sha-256/`,
   `/tools/data/json-to-typescript/` and `/tools/generators/uuid/`.

## Shared tool page behaviour

Every tool page should provide:

1. An input editor (syntax highlighting where useful).
2. The primary action for that tool.
3. An output panel with the result, preview or errors.
4. Copy, download and clear controls.
5. A short explanation and example input.
6. Related tools from the same category.

## Client-side implementation notes

- **Web Crypto** — SHA-1/256/384/512, HMAC, AES, RSA key generation.
- **hash-wasm** — MD5, CRC32, bcrypt and other hashes not in Web Crypto.
- **Canvas / createImageBitmap** — image resize, compression and conversion.
- **File API** — file hashing, drag-and-drop, EXIF and data-URI tools.
- **SheetJS** — XLSX → CSV/JSON.
- **Pyodide** — Python formatter, loaded on demand.
- **SVGO / libphonenumber-js / QR and barcode libraries** — loaded per tool.
- **Web Workers** — keep large inputs and heavy transformations off the main thread.

## Implementation status

| Feature                                           | Status                     |
| ------------------------------------------------- | -------------------------- |
| Next.js 16 + App Router                           | Complete                   |
| React 19                                          | Complete                   |
| Tailwind CSS 4                                    | Complete                   |
| Static export                                     | Complete                   |
| App shell (header, footer, navigation)            | Complete                   |
| Home, About, tool directory and 18 category pages | Complete                   |
| SEO metadata                                      | Complete                   |
| Full tool catalog                                 | Complete                   |
| Searchable tool directory                         | Complete                   |
| Shared tool page components                       | Complete                   |
| Individual tool implementations                   | In progress                |
| Copy/download/reset actions                       | Copy and download complete |
| Logo and brand assets                             | Basic mark                 |
