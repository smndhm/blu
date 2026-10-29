/**
 * Prints the CV page (`url` in _data/cv.js) as its PDF (`pdf`), which the page links to.
 *
 * In the light theme, with @dume/ds's print styles (no header nor footer, no download link): one column of text,
 * for applicant tracking systems (ATS). The PDF is tagged, for screen readers, and has an outline of the headings.
 * The page is loaded at its production URL, its requests answered from `_site`: the PDF's links point to simon.duhem.fr.
 *
 * Usage: pnpm build && pnpm cv:pdf (the deployment runs it, after the build)
 * Set CHROMIUM_PATH to use an already installed Chromium instead of the Playwright one.
 */
import { access } from 'node:fs/promises';
import { join, normalize } from 'node:path';
import process from 'node:process';
import { chromium } from 'playwright';
import cv from '../_data/cv.js';
import metadata from '../_data/metadata.js';

const siteDir = new URL('../_site/', import.meta.url).pathname;
const siteUrl = new URL(metadata.url).origin;
const output = join(siteDir, cv.pdf);

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const page = await browser.newPage({ colorScheme: 'light' });

// Every request to the site is answered from `_site` (`index.html` for directories), any other is aborted
await page.route('**/*', async route => {
  const { origin, pathname } = new URL(route.request().url());
  if (origin !== siteUrl) return route.abort();
  const file = join(siteDir, normalize(decodeURIComponent(pathname)), pathname.endsWith('/') ? 'index.html' : '');
  try {
    await access(file);
    await route.fulfill({ path: file });
  } catch {
    await route.fulfill({ status: 404 });
  }
});

const response = await page.goto(siteUrl + cv.url);
if (!response.ok()) {
  console.error(`${cv.url}: HTTP ${response.status()}, run the build first`);
  process.exit(1);
}
await page.evaluate(() => document.fonts.ready);
await page.pdf({
  path: output,
  format: 'A4',
  margin: { top: '1.2cm', right: '1.5cm', bottom: '1.2cm', left: '1.5cm' },
  // About 9.5pt text, a CV's usual size: two pages
  scale: 0.75,
  tagged: true,
  outline: true,
});
await browser.close();

console.log(`CV printed as ${output}`);
