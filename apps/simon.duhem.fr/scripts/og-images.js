/**
 * Takes the screenshot of each social sharing card (content/og/cards.11ty.js), `_site/og/<slug>.html`, as
 * `_site/og/<slug>.png`, the page's `og:image`, then removes the card's page: only its image is published.
 *
 * Usage: pnpm build && pnpm og:images (the deployment runs it, after the build)
 */
import { readdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { openSite, siteDir, siteUrl } from './site-browser.js';

const cards = (await readdir(join(siteDir, 'og'))).filter(file => file.endsWith('.html'));
const { browser, page } = await openSite({ viewport: { width: 1200, height: 630 } });
for (const card of cards) {
  await page.goto(`${siteUrl}/og/${card}`);
  await page.evaluate(() => document.fonts.ready);
  const output = join(siteDir, 'og', card.replace(/\.html$/, '.png'));
  await page.screenshot({ path: output });
  await rm(join(siteDir, 'og', card));
  console.log(`Card taken as ${output}`);
}
await browser.close();
