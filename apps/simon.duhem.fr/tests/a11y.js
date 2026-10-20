/**
 * Accessibility audit of the built site with axe-core.
 *
 * Serves `_site`, then checks every HTML page it contains, plus the presentations listed in the sitemap,
 * in light and dark color schemes, with @dume/dev-config/a11y: WCAG 2.2 A and AA rules, axe's best practices, and the rules
 * axe maps to RGAA 4 and EN 301 549.
 * The Marp presentations (`/slides/*.html`), built at deploy time, are served from `apps/slides/dist/a11y`:
 * `test:a11y` builds them first with the `bare` template, where every slide is visible.
 * Interactive states that a page load does not show are audited too: the IApostrophe tester filled with text,
 * and a page highlighted by the bookmarklet, with a contrast check of the highlight colors.
 * Exits with code 1 when a violation is found.
 *
 * Usage: pnpm build && pnpm test:a11y
 * Set CHROMIUM_PATH to use an already installed Chromium instead of the Playwright one.
 */
import { createServer } from 'node:http';
import { readdir, readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import process from 'node:process';
import { chromium } from 'playwright';
import { audit as axe, contrastRatio } from '@dume/dev-config/a11y';

const siteDir = new URL('../_site/', import.meta.url).pathname;
const slidesDir = new URL('../../slides/dist/a11y/', import.meta.url).pathname;
const siteUrl = 'https://simon.duhem.fr';
const colorSchemes = ['light', 'dark'];
const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.xml': 'application/xml',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
};

// Minimal static server for `_site` (`index.html` for directories), and the presentations under `/slides/`
const server = createServer(async (request, response) => {
  const pathname = normalize(decodeURIComponent(new URL(request.url, 'http://localhost').pathname));
  const presentation = /^\/slides\/(?:assets\/|[^/]+\.html$)/.test(pathname);
  const file = presentation ? join(slidesDir, pathname.replace(/^\/slides\//, '')) : join(siteDir, pathname.endsWith('/') ? `${pathname}index.html` : pathname);
  try {
    const content = await readFile(file);
    response.writeHead(200, { 'Content-Type': mimeTypes[extname(file)] ?? 'application/octet-stream' });
    response.end(content);
  } catch {
    response.writeHead(404);
    response.end();
  }
});
await new Promise(resolve => server.listen(0, resolve));
const baseUrl = `http://localhost:${server.address().port}`;

// Every page of `_site`: the sitemap leaves out the articles published elsewhere first
const sitePaths = (await readdir(siteDir, { recursive: true }))
  .filter(file => file.endsWith('.html'))
  .map(file => `/${file}`.replace(/index\.html$/, ''))
  .toSorted();
// The presentations are not in `_site`: they are built at deploy time
const sitemap = await readFile(join(siteDir, 'sitemap.xml'), 'utf8');
const slidePaths = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, loc]) => loc.replace(siteUrl, '')).filter(path => path.startsWith('/slides/') && path.endsWith('.html'));
const paths = [...sitePaths, ...slidePaths];

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
let violationCount = 0;
let auditCount = 0;

// Runs axe on the current state of the page and logs its violations
const audit = async (page, label, options) => {
  auditCount++;
  const violations = await axe(page, options);

  if (violations.length === 0) {
    console.log(`✓ ${label}`);
    return;
  }

  console.log(`✗ ${label}`);
  violationCount += violations.length;
  for (const violation of violations) console.log(violation.replace(/^/gm, '  '));
};

// axe does not check the contrast of single characters, nor of ::highlight() styles:
// checks each highlight color against the WCAG AA ratio for normal text
const checkHighlightContrast = async (page, label) => {
  const colors = await page.evaluate(() => {
    const rules = [...document.styleSheets, ...document.adoptedStyleSheets].flatMap(sheet => [...sheet.cssRules]).filter(rule => rule.selectorText?.startsWith('::highlight('));
    const spans = [...document.querySelectorAll('[data-iapostrophe]')];
    // Resolves named colors to rgb()
    const probe = document.body.appendChild(document.createElement('span'));
    const resolve = ({ backgroundColor, color }) => {
      probe.style.backgroundColor = backgroundColor;
      probe.style.color = color;
      const style = getComputedStyle(probe);
      return { background: style.backgroundColor, color: style.color };
    };
    const result = [...rules.map(rule => resolve(rule.style)), ...spans.map(span => resolve(span.style))];
    probe.remove();
    return result;
  });
  if (colors.length === 0) throw new Error('no highlight color found');

  const failures = [...new Set(colors.map(pair => JSON.stringify(pair)))]
    .map(json => JSON.parse(json))
    .map(({ background, color }) => ({ background, color, ratio: contrastRatio(background, color) }))
    .filter(({ ratio }) => ratio < 4.5);
  for (const { background, color, ratio } of failures) {
    violationCount++;
    console.log(`✗ ${label}: highlight contrast ${ratio.toFixed(2)}:1 (${color} on ${background}), 4.5:1 expected`);
  }
};

// Interactive states, each one set up on a freshly loaded page
const scenarios = [
  {
    name: 'IApostrophe tester filled',
    path: '/ia-postrophe/',
    async setUp(page) {
      await page.locator('#tester-input').fill('L’IA écrit « comme ça »… et moi "comme ça"...');
      await page.locator('#tester-summary').filter({ hasText: /\S/ }).waitFor();
    },
    check: checkHighlightContrast,
  },
  {
    name: 'IApostrophe bookmarklet',
    path: '/ia-postrophe/',
    async setUp(page) {
      const href = await page.locator('#bookmarklet').getAttribute('href');
      // Without the CSS Custom Highlight API, the bookmarklet wraps characters in spans: axe checks the changed DOM
      await page.evaluate(() => delete CSS.highlights);
      await page.addScriptTag({ content: decodeURIComponent(href.replace(/^javascript:/, '')) });
      if ((await page.locator('[data-iapostrophe]').count()) === 0) throw new Error('no character highlighted');
    },
    check: checkHighlightContrast,
  },
];

for (const colorScheme of colorSchemes) {
  const context = await browser.newContext({ colorScheme, reducedMotion: 'reduce' });
  const page = await context.newPage();
  // Local resources that fail to load (a missing image has no visible content, whatever its alt)
  let brokenResources = [];
  page.on('response', response => {
    if (response.url().startsWith(baseUrl) && response.status() >= 400) brokenResources.push(response.url().replace(baseUrl, ''));
  });
  const checkResources = label => {
    for (const url of brokenResources) {
      violationCount++;
      console.log(`✗ ${label}: ${url} not found`);
    }
    brokenResources = [];
  };

  for (const path of paths) {
    const response = await page.goto(baseUrl + path);
    if (!response.ok()) {
      violationCount++;
      console.log(`✗ ${path} (${colorScheme}): HTTP ${response.status()}`);
      brokenResources = [];
      continue;
    }
    // Marp writes the presentations' page structure, without a main landmark: the slides are its sections
    await audit(page, `${path} (${colorScheme})`, path.startsWith('/slides/') ? { disable: ['landmark-one-main'] } : {});
    checkResources(`${path} (${colorScheme})`);
  }

  for (const { name, path, setUp, check } of scenarios) {
    const label = `${path}, ${name} (${colorScheme})`;
    try {
      await page.goto(baseUrl + path);
      await setUp(page);
      await check?.(page, label);
    } catch (error) {
      violationCount++;
      console.log(`✗ ${label}: ${error.message}`);
      continue;
    }
    await audit(page, label);
    checkResources(label);
  }

  await context.close();
}

await browser.close();
server.close();

if (violationCount > 0) {
  console.error(`\n${violationCount} accessibility violation(s) found.`);
  process.exit(1);
}
console.log(`\nNo accessibility violation on ${paths.length} pages and ${scenarios.length} interactive states × ${colorSchemes.length} color schemes (${auditCount} audits).`);
