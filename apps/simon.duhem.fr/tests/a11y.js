/**
 * Accessibility audit of the built site with axe-core.
 *
 * Serves `_site`, then checks every page listed in the sitemap (plus the 404 page)
 * in light and dark color schemes against WCAG 2.2 A and AA rules.
 * Exits with code 1 when a violation is found.
 *
 * Usage: pnpm build && pnpm test:a11y
 * Set CHROMIUM_PATH to use an already installed Chromium instead of the Playwright one.
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import process from 'node:process';
import { chromium } from 'playwright';
import { AxeBuilder } from '@axe-core/playwright';

const siteDir = new URL('../_site/', import.meta.url).pathname;
const siteUrl = 'https://simon.duhem.fr';
const tags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
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

// Minimal static server for `_site`, with `index.html` for directories
const server = createServer(async (request, response) => {
  const pathname = normalize(decodeURIComponent(new URL(request.url, 'http://localhost').pathname));
  const file = join(siteDir, pathname.endsWith('/') ? `${pathname}index.html` : pathname);
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

const sitemap = await readFile(join(siteDir, 'sitemap.xml'), 'utf8');
// Marp presentations (`/slides/*.html`) are only built at deploy time, they are not part of `_site`
const paths = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)]
  .map(([, loc]) => loc.replace(siteUrl, ''))
  .filter(path => !/^\/slides\/.+\.html$/.test(path))
  .concat('/404.html');

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
let violationCount = 0;

for (const colorScheme of colorSchemes) {
  const context = await browser.newContext({ colorScheme, reducedMotion: 'reduce' });
  const page = await context.newPage();

  for (const path of paths) {
    await page.goto(baseUrl + path);
    const { violations } = await new AxeBuilder({ page }).withTags(tags).analyze();
    const label = `${path} (${colorScheme})`;

    if (violations.length === 0) {
      console.log(`✓ ${label}`);
      continue;
    }

    console.log(`✗ ${label}`);
    for (const violation of violations) {
      violationCount++;
      console.log(`  [${violation.impact}] ${violation.id}: ${violation.help}`);
      console.log(`    ${violation.helpUrl}`);
      for (const node of violation.nodes) console.log(`    - ${node.target.join(' ')}`);
    }
  }

  await context.close();
}

await browser.close();
server.close();

if (violationCount > 0) {
  console.error(`\n${violationCount} accessibility violation(s) found.`);
  process.exit(1);
}
console.log(`\nNo accessibility violation on ${paths.length} pages × ${colorSchemes.length} color schemes.`);
