/**
 * A Chromium page on the built site, in the light theme: every request to simon.duhem.fr is answered from `_site`
 * (`index.html` for directories), any other is aborted. Pages load as in production, without a server nor a network.
 * Set CHROMIUM_PATH to use an already installed Chromium instead of the Playwright one.
 */
import { access } from 'node:fs/promises';
import { join, normalize } from 'node:path';
import process from 'node:process';
import { chromium } from 'playwright';
import metadata from '../_data/metadata.js';

export const siteDir = new URL('../_site/', import.meta.url).pathname;
export const siteUrl = new URL(metadata.url).origin;

/** @param {import('playwright').BrowserContextOptions} [options] The page's options, such as its viewport */
export async function openSite(options = {}) {
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const page = await browser.newPage({ colorScheme: 'light', ...options });
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
  return { browser, page };
}
