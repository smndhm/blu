/**
 * Generates `public/og.png`, the default Open Graph image (1200×630) used by pages without their own `ogImage`.
 * Run it again after changing the site title or description: `pnpm --filter simon.duhem.fr og-image`
 */
import { readFile } from 'node:fs/promises';
import process from 'node:process';
import { chromium } from 'playwright';
import metadata from '../_data/metadata.js';

const font = await readFile(new URL('../node_modules/@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-wght-normal.woff2', import.meta.url));

// Triangles in the colors of the home page animation, along a curve on the right (seeded: same image on every run)
const colors = ['#25CE7B', '#DA38B5', '#FDC741', '#01B3E3', '#FF6B01'];
let seed = 7;
const random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const vertices = [];
const triangles = [];
for (let i = 0; i < 70; i++) {
  const t = i / 70;
  const vertex = { x: 1250 - 260 * Math.sin(t * Math.PI) + (random() - 0.5) * 110, y: -40 + t * 710 + (random() - 0.5) * 110 };
  if (vertices.length >= 2) {
    const [a, b] = [...vertices].sort((p, q) => Math.hypot(p.x - vertex.x, p.y - vertex.y) - Math.hypot(q.x - vertex.x, q.y - vertex.y));
    triangles.push(`<polygon points="${[vertex, a, b].map(({ x, y }) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')}" fill="${colors[Math.floor(random() * colors.length)]}"/>`);
  }
  vertices.push(vertex);
}

const html = `<!doctype html>
<html lang="${metadata.language}">
<style>
  @font-face { font-family: 'Bricolage Grotesque'; font-weight: 200 800; src: url(data:font/woff2;base64,${font.toString('base64')}) format('woff2'); }
  * { box-sizing: border-box; margin: 0; }
  body { position: relative; overflow: hidden; width: 1200px; height: 630px; padding: 80px; background: #222; color: #fafafa;
    font-family: -apple-system, blinkmacsystemfont, 'Segoe UI', roboto, helvetica, arial, sans-serif; display: flex; flex-direction: column; justify-content: center; }
  svg { position: absolute; inset: 0; opacity: 0.6; }
  main { position: relative; max-width: 740px; }
  h1 { font-family: 'Bricolage Grotesque', sans-serif; font-size: 104px; font-weight: 800; line-height: 1; }
  p { margin-top: 32px; color: #ddd; font-size: 30px; line-height: 1.45; }
  footer { position: absolute; bottom: 64px; left: 80px; color: #c9a2ff; font-size: 28px; font-weight: 700; }
</style>
<svg viewBox="0 0 1200 630" aria-hidden="true">${triangles.join('')}</svg>
<main>
  <h1>${metadata.title}</h1>
  <p>${metadata.description}</p>
</main>
<footer>${new URL(metadata.url).host}</footer>
</html>`;

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html);
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: new URL('../public/og.png', import.meta.url).pathname });
await browser.close();
