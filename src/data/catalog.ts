export type ToolPriority = 1 | 2 | 3;

export type ToolDefinition = {
  slug: string;
  name: string;
  description: string;
  keywords?: string[];
  priority?: ToolPriority;
};

export type CategoryDefinition = {
  id: string;
  name: string;
  description: string;
  icon: string;
  tools: ToolDefinition[];
};

const tool = (
  slug: string,
  name: string,
  description: string,
  priority: ToolPriority = 3,
  keywords: string[] = []
): ToolDefinition => ({ slug, name, description, priority, keywords });

export const catalog: CategoryDefinition[] = [
  {
    id: 'html',
    name: 'HTML',
    description: 'Format, minify, validate and preview HTML documents.',
    icon: 'code',
    tools: [
      tool(
        'formatter',
        'HTML formatter',
        'Beautify and indent HTML documents.',
        2
      ),
      tool(
        'minifier',
        'HTML minifier',
        'Remove whitespace and unnecessary characters from HTML.',
        2
      ),
      tool(
        'validator',
        'HTML validator',
        'Check HTML for syntax and structure errors.',
        2
      ),
      tool(
        'preview',
        'HTML preview',
        'Preview rendered HTML in a sandboxed frame.',
        3
      ),
      tool(
        'entity-encoder',
        'HTML entity encoder/decoder',
        'Encode and decode HTML entities.',
        3
      ),
    ],
  },
  {
    id: 'css',
    name: 'CSS',
    description: 'Format, minify and validate CSS, and convert it to Tailwind.',
    icon: 'palette',
    tools: [
      tool(
        'formatter',
        'CSS formatter',
        'Beautify and indent CSS stylesheets.',
        2
      ),
      tool(
        'minifier',
        'CSS minifier',
        'Compress CSS by removing whitespace and comments.',
        2
      ),
      tool('validator', 'CSS validator', 'Check CSS for syntax errors.', 2),
      tool(
        'to-tailwind',
        'CSS to Tailwind',
        'Convert CSS declarations into Tailwind utility classes.',
        3
      ),
      tool(
        'px-rem',
        'px ↔ rem converter',
        'Convert values between pixels and rem units.',
        3,
        ['pixel', 'root em']
      ),
    ],
  },
  {
    id: 'js',
    name: 'JavaScript',
    description: 'Format, minify, validate and convert JavaScript.',
    icon: 'braces',
    tools: [
      tool(
        'formatter',
        'JavaScript formatter',
        'Beautify and indent JavaScript code.',
        2
      ),
      tool(
        'minifier',
        'JavaScript minifier',
        'Compress JavaScript with Terser.',
        2
      ),
      tool(
        'validator',
        'JavaScript validator',
        'Check JavaScript for syntax errors.',
        2
      ),
      tool(
        'object-to-json',
        'JS object to JSON',
        'Convert a JavaScript object literal to JSON.',
        3
      ),
      tool(
        'json-to-object',
        'JSON to JS object',
        'Convert JSON into a JavaScript object literal.',
        3
      ),
    ],
  },
  {
    id: 'json',
    name: 'JSON',
    description: 'Format, minify, validate and explore JSON.',
    icon: 'file-json',
    tools: [
      tool('formatter', 'JSON formatter', 'Beautify and indent JSON.', 2),
      tool(
        'minifier',
        'JSON minifier',
        'Compress JSON by removing whitespace.',
        2
      ),
      tool(
        'validator',
        'JSON validator',
        'Validate JSON and report syntax errors.',
        2
      ),
      tool(
        'tree-viewer',
        'JSON tree viewer',
        'Explore JSON as a collapsible tree.',
        3
      ),
    ],
  },
  {
    id: 'encoding',
    name: 'Encoding & Decoding',
    description: 'Convert between text and encoded representations.',
    icon: 'binary',
    tools: [
      tool(
        'base32',
        'Base32 encoder/decoder',
        'Encode and decode Base32 strings.',
        3
      ),
      tool(
        'base64',
        'Base64 encoder/decoder',
        'Encode and decode Base64 strings.',
        3
      ),
      tool(
        'base64-url-safe',
        'URL-safe Base64 converter',
        'Convert between standard and URL-safe Base64.',
        3
      ),
      tool(
        'base64-file-to-data-uri',
        'Base64 file to data URI',
        'Turn a file into a Base64 data URI.',
        3,
        ['data url']
      ),
      tool(
        'hex',
        'Hex encoder/decoder',
        'Encode and decode hexadecimal strings.',
        3
      ),
      tool(
        'binary-to-text',
        'Binary ↔ text converter',
        'Convert between binary and text.',
        3
      ),
      tool('octal', 'Octal converter', 'Convert between octal and text.', 3),
      tool(
        'unicode-escape',
        'Unicode escape converter',
        'Escape and unescape Unicode sequences.',
        3
      ),
      tool(
        'rot13-caesar',
        'ROT13 / Caesar cipher',
        'Apply ROT13 or a Caesar cipher shift.',
        3
      ),
      tool(
        'morse-code',
        'Morse code translator',
        'Translate text to and from Morse code.',
        3
      ),
      tool(
        'punycode-idn',
        'Punycode ↔ IDN converter',
        'Convert between Punycode and internationalized domain names.',
        3,
        ['idn', 'domain']
      ),
      tool(
        'quoted-printable',
        'Quoted-printable encoder/decoder',
        'Encode and decode quoted-printable text.',
        3
      ),
      tool(
        'string-escaper',
        'String escaper/unescaper',
        'Escape and unescape JavaScript, Python, C and JSON strings.',
        3
      ),
      tool(
        'url-encoder',
        'URL encoder/decoder',
        'Encode and decode URL components.',
        3
      ),
    ],
  },
  {
    id: 'crypto',
    name: 'Hashing & Cryptography',
    description: 'Hashes, HMAC, checksums, encryption and keys.',
    icon: 'shield',
    tools: [
      tool(
        'md5',
        'MD5 hash generator',
        'Generate an MD5 hash in your browser.',
        1
      ),
      tool(
        'sha',
        'SHA hash generator',
        'Generate SHA-1, SHA-256, SHA-384 or SHA-512 hashes.',
        1,
        ['sha1', 'sha256', 'sha512']
      ),
      tool(
        'file-hash',
        'File hash calculator',
        'Hash a file without uploading it.',
        3,
        ['checksum', 'drag and drop']
      ),
      tool(
        'hmac',
        'HMAC generator',
        'Generate HMAC signatures with a secret key.',
        3
      ),
      tool(
        'crc32',
        'CRC32 checksum calculator',
        'Calculate a CRC32 checksum.',
        3
      ),
      tool(
        'bcrypt',
        'bcrypt hash generator',
        'Generate and verify bcrypt password hashes.',
        3
      ),
      tool(
        'aes',
        'AES encrypt/decrypt',
        'Encrypt and decrypt text with AES-GCM.',
        3,
        ['encryption']
      ),
      tool(
        'rsa-key-pair',
        'RSA key pair generator',
        'Generate an RSA key pair in the browser.',
        3
      ),
      tool(
        'pem-der',
        'PEM ↔ DER converter',
        'Convert keys and certificates between PEM and DER.',
        3
      ),
      tool(
        'certificate-viewer',
        'Certificate (PEM) viewer',
        'Inspect the fields of a PEM certificate.',
        3,
        ['x509']
      ),
    ],
  },
  {
    id: 'auth',
    name: 'Auth & Tokens',
    description: 'JWT, PKCE, Basic auth, TOTP and cookies.',
    icon: 'key-round',
    tools: [
      tool(
        'jwt-signer',
        'JWT encoder/signer',
        'Create and sign JWTs with HS256 or HS512.',
        3,
        ['json web token']
      ),
      tool(
        'jwt-inspector',
        'JWT inspector',
        'Decode JWT headers, claims and expiry.',
        3
      ),
      tool(
        'pkce',
        'OAuth PKCE generator',
        'Generate OAuth 2.0 PKCE verifiers and challenges.',
        3
      ),
      tool(
        'basic-auth',
        'Basic auth header generator',
        'Build HTTP Basic authorization headers.',
        3
      ),
      tool(
        'totp',
        'TOTP / 2FA generator',
        'Generate TOTP codes from a shared secret.',
        3,
        ['two factor', 'authenticator']
      ),
      tool(
        'cookie-parser',
        'Cookie parser and builder',
        'Parse and build cookie strings.',
        3
      ),
    ],
  },
  {
    id: 'generators',
    name: 'Generators',
    description: 'IDs, passwords, random data and fake data.',
    icon: 'wand-sparkles',
    tools: [
      tool('uuid', 'UUID generator', 'Generate UUID v1, v4 and v7 values.', 1, [
        'guid',
      ]),
      tool('ulid', 'ULID generator', 'Generate sortable ULIDs.', 1),
      tool(
        'nanoid',
        'NanoID generator',
        'Generate compact, URL-safe NanoIDs.',
        1
      ),
      tool(
        'snowflake-decoder',
        'Snowflake ID decoder',
        'Decode Discord-style snowflake IDs.',
        3
      ),
      tool(
        'random-string',
        'Random string generator',
        'Generate random strings from a custom charset.',
        3
      ),
      tool(
        'password',
        'Password generator',
        'Generate strong passwords with custom rules.',
        1
      ),
      tool(
        'diceware',
        'Diceware passphrase generator',
        'Generate memorable Diceware passphrases.',
        3
      ),
      tool('api-key', 'API key generator', 'Generate API keys and secrets.', 3),
      tool(
        'lorem-ipsum',
        'Lorem ipsum generator',
        'Generate Lorem ipsum placeholder text.',
        3
      ),
      tool(
        'fake-data',
        'Fake data generator',
        'Generate fake names, emails, addresses and dates.',
        3
      ),
    ],
  },
  {
    id: 'text',
    name: 'Text & Strings',
    description:
      'Case conversion, diffing, counting, sorting, regex and Markdown.',
    icon: 'type',
    tools: [
      tool(
        'case-converter',
        'Case converter',
        'Convert text between camel, snake, kebab, Pascal, constant and title case.',
        1
      ),
      tool('slugify', 'Slugify', 'Turn text into a URL-friendly slug.', 3),
      tool('text-diff', 'Text diff', 'Compare two texts side by side.', 1),
      tool(
        'text-counter',
        'Word and character counter',
        'Count words, characters, lines and bytes.',
        3
      ),
      tool(
        'remove-duplicate-lines',
        'Remove duplicate lines',
        'Remove duplicate lines from text.',
        3
      ),
      tool(
        'sort-lines',
        'Sort lines',
        'Sort lines alphabetically, numerically or naturally.',
        3
      ),
      tool(
        'regex-tester',
        'Regex tester',
        'Test regular expressions and inspect match groups.',
        1
      ),
      tool(
        'regex-explainer',
        'Regex explainer',
        'Explain a regular expression token by token.',
        3
      ),
      tool(
        'find-replace-regex',
        'Find and replace with regex',
        'Find and replace text using regular expressions.',
        3
      ),
      tool(
        'ascii-art',
        'ASCII art text generator',
        'Render text as ASCII art.',
        3
      ),
      tool(
        'line-ending-normalizer',
        'Line-ending normalizer',
        'Convert between CRLF and LF line endings.',
        3
      ),
      tool(
        'tabs-spaces',
        'Tabs ↔ spaces converter',
        'Convert tabs to spaces and vice versa.',
        3
      ),
      tool('strip-html', 'Strip HTML tags', 'Remove HTML tags from text.', 3),
      tool(
        'markdown-preview',
        'Markdown preview',
        'Preview Markdown as HTML.',
        3
      ),
      tool(
        'markdown-to-html',
        'Markdown to HTML',
        'Convert Markdown to HTML.',
        3
      ),
      tool(
        'unicode-inspector',
        'Unicode inspector',
        'Inspect characters, code points and Unicode names.',
        3
      ),
    ],
  },
  {
    id: 'data',
    name: 'Data Format Conversion',
    description: 'JSON, YAML, XML, CSV, TOML, XLSX and schema conversion.',
    icon: 'database',
    tools: [
      tool('json-yaml', 'JSON ↔ YAML', 'Convert between JSON and YAML.', 1),
      tool('json-xml', 'JSON ↔ XML', 'Convert between JSON and XML.', 1),
      tool('json-csv', 'JSON ↔ CSV', 'Convert between JSON and CSV.', 1),
      tool(
        'csv-formatter',
        'CSV formatter and validator',
        'Format and validate CSV data.',
        3
      ),
      tool('csv-to-json', 'CSV to JSON', 'Convert CSV rows into JSON.', 3),
      tool('toml-json', 'TOML ↔ JSON', 'Convert between TOML and JSON.', 3),
      tool(
        'yaml-validator',
        'YAML validator',
        'Validate YAML and report errors.',
        3
      ),
      tool(
        'xml-formatter',
        'XML formatter and validator',
        'Format and validate XML.',
        3
      ),
      tool('json-diff', 'JSON diff', 'Compare two JSON documents.', 3),
      tool(
        'jsonpath-tester',
        'JSONPath tester',
        'Evaluate JSONPath expressions against JSON.',
        3
      ),
      tool(
        'json-schema-validator',
        'JSON Schema validator',
        'Validate JSON against a JSON Schema.',
        3
      ),
      tool(
        'json-to-typescript',
        'JSON to TypeScript',
        'Generate TypeScript interfaces from JSON.',
        1
      ),
      tool(
        'json-to-zod',
        'JSON to Zod schema',
        'Generate Zod schemas from JSON.',
        3
      ),
      tool(
        'json-to-code',
        'JSON to Go / Java / Python',
        'Generate Go, Java, Python or Pydantic types from JSON.',
        3
      ),
      tool(
        'xlsx-converter',
        'XLSX to CSV/JSON',
        'Convert XLSX sheets to CSV or JSON.',
        3
      ),
      tool(
        'markdown-table',
        'Markdown table generator',
        'Generate Markdown tables from rows and columns.',
        3
      ),
    ],
  },
  {
    id: 'code',
    name: 'Code Formatting & Transformation',
    description: 'Formatters, transpilers, converters and highlighters.',
    icon: 'terminal',
    tools: [
      tool(
        'sql-formatter',
        'SQL formatter',
        'Format SQL queries with dialect, keyword-case and indentation options.',
        3
      ),
      tool(
        'graphql-formatter',
        'GraphQL formatter',
        'Format GraphQL schemas and queries.',
        3
      ),
      tool('scss-compiler', 'SCSS to CSS', 'Compile SCSS to CSS.', 3),
      tool('less-compiler', 'LESS to CSS', 'Compile LESS to CSS.', 3),
      tool('stylus-compiler', 'Stylus to CSS', 'Compile Stylus to CSS.', 3),
      tool(
        'tailwind-sorter',
        'Tailwind class sorter',
        'Sort Tailwind utility classes.',
        3
      ),
      tool(
        'strip-comments',
        'Strip comments',
        'Remove comments from JavaScript, CSS, HTML or Python.',
        3
      ),
      tool(
        'remove-console-log',
        'Remove console.log statements',
        'Remove console.log statements from JavaScript.',
        3
      ),
      tool(
        'import-sorter',
        'Import sorter',
        'Sort JavaScript and TypeScript imports.',
        3
      ),
      tool(
        'syntax-highlighter',
        'Code syntax highlighter',
        'Highlight code and emit HTML.',
        3
      ),
      tool(
        'code-screenshot',
        'Code screenshot generator',
        'Render code as a shareable image.',
        3
      ),
      tool(
        'typescript-to-javascript',
        'TypeScript to JavaScript',
        'Transpile TypeScript to JavaScript.',
        3
      ),
      tool('html-to-jsx', 'HTML to JSX', 'Convert HTML markup to JSX.', 3),
      tool(
        'curl-fetch',
        'Curl ↔ fetch converter',
        'Convert between curl commands and fetch calls.',
        3
      ),
      tool(
        'python-formatter',
        'Python formatter',
        'Format Python source code.',
        3
      ),
    ],
  },
  {
    id: 'color',
    name: 'Color & CSS',
    description: 'Color conversion, contrast, palettes and CSS generators.',
    icon: 'swatch-book',
    tools: [
      tool(
        'color-converter',
        'Color converter',
        'Convert colors between HEX, RGB, HSL, HWB, LCH and OKLCH.',
        1
      ),
      tool(
        'contrast-checker',
        'WCAG contrast checker',
        'Check WCAG contrast ratios.',
        1
      ),
      tool(
        'palette-generator',
        'Color palette generator',
        'Generate a color palette from a base color.',
        3
      ),
      tool(
        'tailwind-color-scale',
        'Tailwind color scale generator',
        'Generate a Tailwind 50–950 color scale.',
        3
      ),
      tool(
        'color-blindness-simulator',
        'Color blindness simulator',
        'Preview colors with color vision deficiencies.',
        3
      ),
      tool(
        'gradient-generator',
        'Gradient generator',
        'Build linear, radial and conic CSS gradients.',
        1
      ),
      tool(
        'box-shadow-generator',
        'Box-shadow generator',
        'Build CSS box shadows.',
        1
      ),
      tool(
        'text-shadow-generator',
        'Text-shadow generator',
        'Build CSS text shadows.',
        3
      ),
      tool(
        'border-radius-generator',
        'Border-radius generator',
        'Build CSS border radii.',
        3
      ),
      tool(
        'glassmorphism-generator',
        'Glassmorphism generator',
        'Build frosted-glass CSS effects.',
        3
      ),
      tool(
        'clip-path-generator',
        'Clip-path generator',
        'Build CSS clip-path shapes.',
        3
      ),
      tool(
        'cubic-bezier',
        'Cubic-bezier easing generator',
        'Preview and tune cubic-bezier easing.',
        3
      ),
      tool(
        'keyframes-builder',
        'CSS keyframes builder',
        'Build CSS keyframe animations.',
        3
      ),
      tool(
        'flexbox-playground',
        'Flexbox playground',
        'Experiment with CSS Flexbox.',
        3
      ),
      tool(
        'grid-generator',
        'CSS Grid generator',
        'Generate CSS Grid layouts.',
        3
      ),
      tool(
        'media-query-builder',
        'Media query builder',
        'Build CSS media queries.',
        3
      ),
    ],
  },
  {
    id: 'math',
    name: 'Number, Math & Units',
    description: 'Bases, bitwise, floats, calculators and unit conversion.',
    icon: 'calculator',
    tools: [
      tool(
        'base-converter',
        'Number base converter',
        'Convert numbers between binary, octal, decimal and hex.',
        1
      ),
      tool(
        'bitwise-calculator',
        'Bitwise calculator',
        'Evaluate bitwise operations.',
        3
      ),
      tool(
        'twos-complement',
        "Two's complement calculator",
        "Convert to and from two's complement.",
        3
      ),
      tool(
        'ieee754',
        'IEEE 754 float inspector',
        'Inspect IEEE 754 floating-point values.',
        3
      ),
      tool(
        'roman-numeral',
        'Roman numeral converter',
        'Convert between Roman numerals and integers.',
        3
      ),
      tool(
        'big-integer',
        'Big integer calculator',
        'Calculate with arbitrary-precision BigInt values.',
        3
      ),
      tool(
        'scientific-calculator',
        'Scientific calculator',
        'Evaluate scientific expressions.',
        3
      ),
      tool(
        'graphing-calculator',
        'Graphing calculator',
        'Plot mathematical functions.',
        3
      ),
      tool(
        'percentage-calculator',
        'Percentage calculator',
        'Calculate percentages and percentage changes.',
        3
      ),
      tool(
        'prime-factorizer',
        'Prime checker and factorizer',
        'Check primality and factor numbers.',
        3
      ),
      tool(
        'unit-converter',
        'Unit converter',
        'Convert length, weight, temperature, pixels and points.',
        3
      ),
      tool(
        'data-size-converter',
        'Data size converter',
        'Convert between bytes, KB, MB and GiB.',
        3
      ),
      tool(
        'aspect-ratio',
        'Aspect ratio calculator',
        'Calculate aspect ratios and dimensions.',
        3
      ),
      tool('hex-dump', 'Hex dump viewer', 'View text as a hex dump.', 3),
    ],
  },
  {
    id: 'time',
    name: 'Time & Date',
    description: 'Timestamps, time zones, cron expressions and durations.',
    icon: 'clock',
    tools: [
      tool(
        'timestamp-converter',
        'Unix timestamp converter',
        'Convert Unix timestamps and ISO 8601 dates.',
        1
      ),
      tool(
        'timezone-converter',
        'Timezone converter',
        'Convert times between time zones.',
        3
      ),
      tool(
        'cron-parser',
        'Cron expression parser',
        'Parse and generate cron expressions.',
        1
      ),
      tool(
        'cron-explainer',
        'Cron explainer',
        'Explain cron expressions in plain English.',
        3
      ),
      tool(
        'date-difference',
        'Date difference calculator',
        'Calculate the difference between dates.',
        3
      ),
      tool(
        'business-days',
        'Business days calculator',
        'Count business days between dates.',
        3
      ),
      tool(
        'duration-formatter',
        'Duration formatter',
        'Format milliseconds as human-readable durations.',
        3
      ),
    ],
  },
  {
    id: 'web',
    name: 'Web & Network',
    description: 'HTTP, MIME, URLs, IP/CIDR and server configuration.',
    icon: 'globe',
    tools: [
      tool('http-status', 'HTTP status codes', 'Look up HTTP status codes.', 3),
      tool(
        'mime-lookup',
        'MIME type lookup',
        'Look up MIME types by extension.',
        3
      ),
      tool(
        'user-agent-parser',
        'User-Agent parser',
        'Parse browser and device information from a user agent.',
        3
      ),
      tool('url-parser', 'URL parser', 'Inspect the parts of a URL.', 3),
      tool(
        'query-string',
        'Query string parser',
        'Parse and build query strings.',
        3
      ),
      tool(
        'ip-cidr',
        'IP and CIDR calculator',
        'Parse IP addresses and CIDR ranges.',
        3
      ),
      tool(
        'subnet-calculator',
        'Subnet calculator',
        'Calculate subnet masks and host ranges.',
        3
      ),
      tool(
        'meta-tag-generator',
        'Meta tag generator',
        'Generate meta tags and Open Graph tags.',
        3
      ),
      tool(
        'open-graph-preview',
        'Open Graph preview',
        'Preview Open Graph metadata.',
        3
      ),
      tool(
        'robots-generator',
        'robots.txt generator',
        'Generate robots.txt files.',
        3
      ),
      tool(
        'htaccess-generator',
        '.htaccess generator',
        'Generate .htaccess rules.',
        3
      ),
      tool(
        'nginx-generator',
        'Nginx config generator',
        'Generate Nginx configuration.',
        3
      ),
      tool(
        'gitignore-generator',
        '.gitignore generator',
        'Generate .gitignore files.',
        3
      ),
      tool(
        'docker-compose',
        'Docker run to compose',
        'Convert docker run commands to docker-compose.',
        3
      ),
      tool(
        'sitemap-generator',
        'Sitemap XML generator',
        'Generate sitemap XML.',
        3
      ),
    ],
  },
  {
    id: 'images',
    name: 'Images & Media',
    description: 'Compress, resize, convert, inspect and generate images.',
    icon: 'image',
    tools: [
      tool(
        'image-compressor',
        'Image compressor',
        'Compress JPEG, PNG and WebP images.',
        1
      ),
      tool(
        'image-resizer',
        'Image resizer and cropper',
        'Resize and crop images.',
        3
      ),
      tool(
        'image-converter',
        'Image format converter',
        'Convert images between PNG, JPEG, WebP and AVIF.',
        3
      ),
      tool('svg-to-png', 'SVG to PNG', 'Convert SVG files to PNG.', 1),
      tool('svg-optimizer', 'SVG optimizer', 'Optimize SVG markup.', 3),
      tool(
        'favicon-generator',
        'Favicon generator',
        'Generate favicon PNGs from an image.',
        3
      ),
      tool(
        'placeholder-image',
        'Placeholder image generator',
        'Generate SVG placeholder images.',
        3
      ),
      tool('exif-viewer', 'EXIF viewer', 'View and remove image metadata.', 3),
      tool(
        'color-extractor',
        'Image color extractor',
        'Extract a color palette from an image.',
        3
      ),
      tool(
        'qr-generator',
        'QR code generator',
        'Generate QR codes for URLs, text and contact details.',
        1
      ),
      tool(
        'barcode-generator',
        'Barcode generator',
        'Generate Code128 and EAN-13 barcodes.',
        3
      ),
    ],
  },
  {
    id: 'validators',
    name: 'Validators',
    description: 'Email, cards, IBAN, ISBN, phone, IP and semantic versions.',
    icon: 'check-circle',
    tools: [
      tool('email', 'Email validator', 'Validate email addresses.', 3),
      tool(
        'credit-card',
        'Credit card validator',
        'Validate card numbers with the Luhn algorithm.',
        3
      ),
      tool('iban', 'IBAN validator', 'Validate IBAN numbers.', 3),
      tool(
        'isbn',
        'ISBN validator',
        'Validate ISBN-10 and ISBN-13 numbers.',
        3
      ),
      tool(
        'phone',
        'Phone number validator',
        'Format and validate phone numbers.',
        3
      ),
      tool(
        'ip',
        'IP address validator',
        'Validate IPv4 and IPv6 addresses.',
        3
      ),
      tool(
        'semver',
        'Semver validator',
        'Validate and compare semantic versions.',
        3
      ),
      tool(
        'password-strength',
        'Password strength checker',
        'Estimate password strength.',
        3
      ),
      tool(
        'cron',
        'Cron expression validator',
        'Validate cron expressions.',
        3
      ),
    ],
  },
  {
    id: 'productivity',
    name: 'Git, Docs & Productivity',
    description: 'Commits, diffs, documentation, logs and timers.',
    icon: 'git-branch',
    tools: [
      tool(
        'conventional-commit',
        'Conventional commit builder',
        'Build Conventional Commit messages.',
        3
      ),
      tool(
        'diff-viewer',
        'Unified diff viewer',
        'View unified diffs and patches.',
        3
      ),
      tool(
        'directory-tree',
        'Directory tree generator',
        'Generate a directory tree from paths.',
        3
      ),
      tool('ascii-table', 'ASCII table generator', 'Generate ASCII tables.', 3),
      tool(
        'mermaid-preview',
        'Mermaid preview',
        'Preview Mermaid diagrams.',
        3
      ),
      tool(
        'license-generator',
        'License generator',
        'Generate MIT, Apache 2.0 or GPL licenses.',
        3
      ),
      tool(
        'readme-generator',
        'README generator',
        'Generate a README template.',
        3
      ),
      tool('log-viewer', 'Log viewer', 'Filter and inspect log files.', 3),
      tool('stack-trace', 'Stack trace formatter', 'Format stack traces.', 3),
      tool('pomodoro', 'Pomodoro timer', 'Run a Pomodoro timer.', 3),
      tool('emoji-picker', 'Emoji picker', 'Search and copy emojis.', 3),
      tool(
        'currency-formatter',
        'Currency formatter',
        'Format currencies with Intl.NumberFormat.',
        3
      ),
    ],
  },
];

export const allTools = catalog.flatMap((category) =>
  category.tools.map((toolDefinition) => ({
    ...toolDefinition,
    categoryId: category.id,
    categoryName: category.name,
    categoryIcon: category.icon,
  }))
);

export const popularTools = allTools
  .filter((toolDefinition) => toolDefinition.priority === 1)
  .slice(0, 12);

export const getCategory = (categoryId: string) =>
  catalog.find((category) => category.id === categoryId);

export const getTool = (categoryId: string, toolSlug: string) =>
  getCategory(categoryId)?.tools.find(
    (toolDefinition) => toolDefinition.slug === toolSlug
  );

export const getCategoryToolCount = (categoryId: string) =>
  getCategory(categoryId)?.tools.length ?? 0;

export const totalToolCount = allTools.length;
