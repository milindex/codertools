import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';

import { chromium } from 'playwright-core';

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, 'out');
const ARTIFACT_DIR = path.join(ROOT, 'artifacts', 'tool-audit');
const BASE_PATH = '/tools';

if (!fs.existsSync(OUT_DIR)) {
  console.error('out/ does not exist. Run `npm run build` first.');
  process.exit(1);
}

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.wasm': 'application/wasm',
  '.webmanifest': 'application/manifest+json',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml; charset=utf-8',
};

const server = http.createServer((request, response) => {
  try {
    const requestPath = decodeURIComponent(
      (request.url || '/').split('?')[0] || '/'
    );
    let filePath = path.join(OUT_DIR, requestPath);

    if (requestPath.endsWith('/')) {
      filePath = path.join(filePath, 'index.html');
    }

    if (!fs.existsSync(filePath) && fs.existsSync(`${filePath}.html`)) {
      filePath = `${filePath}.html`;
    }

    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }

    if (!fs.existsSync(filePath)) {
      filePath = path.join(OUT_DIR, '404.html');
      response.statusCode = 404;
    }

    response.setHeader(
      'Content-Type',
      mimeTypes[path.extname(filePath)] || 'application/octet-stream'
    );
    response.setHeader('Cache-Control', 'no-store');
    response.end(fs.readFileSync(filePath));
  } catch (error) {
    response.statusCode = 500;
    response.end(String(error));
  }
});

const readCatalog = () => {
  const source = fs.readFileSync(
    path.join(ROOT, 'src/data/catalog.ts'),
    'utf8'
  );
  const categoryMatches = [...source.matchAll(/id:\s*'([^']+)'/g)].map(
    (match) => ({
      id: match[1],
      index: match.index ?? 0,
      tools: [],
    })
  );
  const toolMatches = [...source.matchAll(/tool\(\s*(['"])([^'"]+)\1/g)].map(
    (match) => ({
      slug: match[2],
      index: match.index ?? 0,
    })
  );

  for (const tool of toolMatches) {
    const category = [...categoryMatches]
      .reverse()
      .find((candidate) => candidate.index < tool.index);
    if (category) {
      category.tools.push(tool.slug);
    }
  }

  return categoryMatches.flatMap((category) =>
    category.tools.map((slug) => ({
      category: category.id,
      slug,
    }))
  );
};

const chromeCandidates = [
  process.env.CHROME_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
].filter(Boolean);

const executablePath = chromeCandidates.find((candidate) =>
  fs.existsSync(candidate)
);

if (!executablePath) {
  console.error('Chrome or Edge was not found. Set CHROME_PATH.');
  process.exit(1);
}

const getFailureReasons = async (page, origin) => {
  const root = page.locator('[data-tool-root]');
  const text = await root.innerText();
  const reasons = [];

  if (text.includes('This tool is being implemented.')) {
    reasons.push('not implemented');
  }
  if (text.includes('Tool unavailable')) {
    reasons.push('tool unavailable');
  }
  if (text.includes('This tool hit an unexpected error')) {
    reasons.push('error boundary shown');
  }

  const controlCount = await root
    .locator(
      'input, textarea, select, button, canvas, table, iframe, [role="button"]'
    )
    .count();

  if (controlCount === 0) {
    reasons.push('no interactive controls');
  }

  return { reasons, text, controlCount, origin };
};

const isIgnoredError = (text) => {
  const ignored = [
    'supabase.co',
    'codertools-analytics',
    'codertools-track',
    'Failed to fetch',
    'net::ERR_FAILED',
    'net::ERR_ABORTED',
    'Download the React DevTools',
    '__next',
    '_rsc',
    'Failed to load resource: the server responded with a status of 404 (Not Found)',
  ];
  return ignored.some((value) => text.includes(value));
};

const auditPage = async (page, url, options = {}) => {
  const errors = [];
  const onPageError = (error) => {
    errors.push(`pageerror: ${error.message}`);
  };
  const onConsole = (message) => {
    if (message.type() === 'error' && !isIgnoredError(message.text())) {
      errors.push(`console: ${message.text()}`);
    }
  };
  const onRequestFailed = (request) => {
    const failure = request.failure();
    if (failure?.errorText === 'net::ERR_ABORTED') {
      return;
    }
    if (
      request.url().startsWith(options.origin || '') &&
      !isIgnoredError(request.url())
    ) {
      errors.push(`request failed: ${request.url()}`);
    }
  };

  page.on('pageerror', onPageError);
  page.on('console', onConsole);
  page.on('requestfailed', onRequestFailed);

  try {
    const response = await page.goto(url, {
      timeout: 45000,
      waitUntil: 'domcontentloaded',
    });
    const status = response?.status() ?? 0;

    await page.waitForSelector('[data-tool-root]', { timeout: 20000 });
    await page.waitForFunction(
      () => {
        const root = document.querySelector('[data-tool-root]');
        return Boolean(root && !root.innerText.includes('Loading tool…'));
      },
      { timeout: 30000 }
    );

    const result = await getFailureReasons(page, url);
    return {
      status,
      reasons: result.reasons,
      errors,
      controlCount: result.controlCount,
    };
  } catch (error) {
    return {
      status: 0,
      reasons: ['navigation or mount timeout'],
      errors: [...errors, error.message],
      controlCount: 0,
    };
  } finally {
    page.off('pageerror', onPageError);
    page.off('console', onConsole);
    page.off('requestfailed', onRequestFailed);
  }
};

const auditSimplePage = async (page, url) => {
  const errors = [];
  const onPageError = (error) => errors.push(`pageerror: ${error.message}`);
  const onConsole = (message) => {
    if (message.type() === 'error' && !isIgnoredError(message.text())) {
      errors.push(`console: ${message.text()}`);
    }
  };
  page.on('pageerror', onPageError);
  page.on('console', onConsole);

  try {
    const response = await page.goto(url, {
      timeout: 45000,
      waitUntil: 'domcontentloaded',
    });
    await page.waitForTimeout(500);
    return {
      status: response?.status() ?? 0,
      errors,
      reasons: [],
    };
  } catch (error) {
    return {
      status: 0,
      errors: [...errors, error.message],
      reasons: ['navigation failed'],
    };
  } finally {
    page.off('pageerror', onPageError);
    page.off('console', onConsole);
  }
};

const run = async () => {
  const tools = readCatalog();
  if (tools.length !== 190) {
    console.warn(`Expected 190 tools from the catalog, found ${tools.length}.`);
  }

  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 0;
  const origin = `http://127.0.0.1:${port}`;

  const browser = await chromium.launch({
    executablePath,
    headless: true,
  });
  const context = await browser.newContext({
    serviceWorkers: 'block',
    viewport: { width: 1280, height: 900 },
  });

  await context.route('**/*', (route) => {
    const url = new URL(route.request().url());
    if (url.hostname === '127.0.0.1' || url.hostname === 'localhost') {
      return route.continue();
    }
    return route.abort();
  });

  const results = [];
  const queue = [...tools];
  let completed = 0;

  const worker = async () => {
    const page = await context.newPage();
    try {
      while (queue.length > 0) {
        const tool = queue.shift();
        if (!tool) {
          break;
        }

        const url = `${origin}${BASE_PATH}/${tool.category}/${tool.slug}/`;
        const result = await auditPage(page, url, { origin });
        const failed =
          result.status !== 200 ||
          result.reasons.length > 0 ||
          result.errors.length > 0;

        results.push({
          ...tool,
          url,
          status: result.status,
          reasons: result.reasons,
          errors: result.errors,
          controlCount: result.controlCount,
          ok: !failed,
        });

        if (failed) {
          const screenshotPath = path.join(
            ARTIFACT_DIR,
            `${tool.category}--${tool.slug}.png`
          );
          await page
            .screenshot({ fullPage: true, path: screenshotPath })
            .catch(() => {});
        }

        completed += 1;
        if (completed % 25 === 0 || completed === tools.length) {
          console.log(`Audited ${completed}/${tools.length} tool pages…`);
        }
      }
    } finally {
      await page.close();
    }
  };

  await Promise.all(Array.from({ length: 4 }, () => worker()));

  const simplePages = [
    '/',
    '/tools/',
    '/about/',
    '/privacy/',
    '/terms/',
    '/cookies/',
    '/analytics/',
  ];
  const simplePage = await context.newPage();
  for (const pagePath of simplePages) {
    const result = await auditSimplePage(simplePage, `${origin}${pagePath}`);
    const failed =
      result.status !== 200 ||
      result.errors.length > 0 ||
      result.reasons.length > 0;
    results.push({
      category: 'page',
      slug: pagePath,
      url: `${origin}${pagePath}`,
      status: result.status,
      reasons: result.reasons,
      errors: result.errors,
      controlCount: 0,
      ok: !failed,
    });
  }
  await simplePage.close();

  await context.close();
  await browser.close();
  await new Promise((resolve) => server.close(resolve));

  const failures = results.filter((result) => !result.ok);
  const reportPath = path.join(ARTIFACT_DIR, 'report.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));

  console.log(
    `\nAudited ${results.length} pages: ${results.length - failures.length} OK, ${failures.length} failed.`
  );
  console.log(`Report: ${reportPath}`);

  if (failures.length > 0) {
    console.log('\nFailures:');
    for (const failure of failures) {
      const reasons = [...failure.reasons, ...failure.errors].filter(Boolean);
      console.log(
        `- ${failure.category}/${failure.slug}: ${reasons.join(' | ') || `HTTP ${failure.status}`}`
      );
    }
    process.exitCode = 1;
  } else {
    console.log('Every tool page mounted without runtime errors.');
  }
};

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
