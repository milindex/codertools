import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';

import { chromium } from 'playwright-core';

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, 'out');

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
});

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

const waitForTool = async (page) => {
  await page.waitForSelector('[data-tool-root]', { timeout: 20000 });
  await page.waitForFunction(
    () => {
      const root = document.querySelector('[data-tool-root]');
      return Boolean(root && !root.innerText.includes('Loading tool…'));
    },
    { timeout: 30000 }
  );
};

const run = async () => {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 0;
  const origin = `http://127.0.0.1:${port}`;

  let browser;
  let context;
  const checks = [];

  try {
    browser = await chromium.launch({
      executablePath,
      headless: true,
    });
    context = await browser.newContext({
      viewport: { width: 1280, height: 900 },
    });

    await context.route('**/*', (route) => {
      const url = new URL(route.request().url());
      if (url.hostname === '127.0.0.1' || url.hostname === 'localhost') {
        return route.continue();
      }
      return route.abort();
    });

    const page = await context.newPage();
    page.setDefaultTimeout(30000);

    await page.goto(`${origin}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('h1');
    await page.evaluate(async () => {
      await Promise.race([
        navigator.serviceWorker.ready,
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error('Service worker did not become ready')),
            20000
          )
        ),
      ]);
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('h1');

    const controlled = await page.evaluate(() =>
      Boolean(navigator.serviceWorker.controller)
    );
    checks.push({ name: 'service worker controls the page', ok: controlled });

    await page.goto(`${origin}/tools/crypto/sha/`, {
      waitUntil: 'domcontentloaded',
    });
    await waitForTool(page);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await waitForTool(page);

    await context.setOffline(true);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await waitForTool(page);
    const offlineToolText = await page.locator('[data-tool-root]').innerText();
    const offlineToolPageText = await page.locator('body').innerText();
    const offlineToolControls = await page
      .locator(
        '[data-tool-root] input, [data-tool-root] textarea, [data-tool-root] select, [data-tool-root] button, [data-tool-root] canvas'
      )
      .count();
    checks.push({
      name: 'visited tool page works offline',
      ok:
        offlineToolPageText.includes('SHA hash generator') &&
        offlineToolControls > 0 &&
        !offlineToolText.includes('Loading tool…') &&
        !offlineToolText.includes('This tool hit an unexpected error'),
      detail: `controls=${offlineToolControls}`,
    });

    try {
      await page.goto(`${origin}/privacy/`, {
        waitUntil: 'domcontentloaded',
      });
    } catch {
      // The service worker may still have rendered the fallback page.
    }
    const offlinePageText = await page.locator('body').innerText();
    checks.push({
      name: 'uncached page shows the offline fallback',
      ok: offlinePageText.includes('You are offline'),
    });
  } catch (error) {
    checks.push({
      name: 'offline audit completed',
      ok: false,
      error: error.message,
    });
  } finally {
    if (context) {
      await context.setOffline(false).catch(() => {});
      await context.close().catch(() => {});
    }
    if (browser) {
      await browser.close().catch(() => {});
    }
    await new Promise((resolve) => server.close(resolve));
  }

  for (const check of checks) {
    console.log(
      `${check.ok ? 'PASS' : 'FAIL'}  ${check.name}${
        check.detail ? ` (${check.detail})` : ''
      }${check.error ? ` — ${check.error}` : ''}`
    );
  }

  if (checks.some((check) => !check.ok)) {
    process.exitCode = 1;
  } else {
    console.log('\nOffline audit passed.');
  }
};

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
