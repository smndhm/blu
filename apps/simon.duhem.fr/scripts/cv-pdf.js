/**
 * Prints each version of the CV (`cv.versions` in _data/cv.js), its page (`url`) as its PDF (`pdf`), which the page links to.
 *
 * In the light theme, with @dume/ds's print styles (no header nor footer, no download link): one column of text,
 * for applicant tracking systems (ATS). The PDF is tagged, for screen readers, and has an outline of the headings;
 * @dume/pdf-ua completes it to conform to PDF/UA-1, the accessibility standard.
 * The page is loaded at its production URL, its requests answered from `_site`: the PDF's links point to simon.duhem.fr.
 *
 * Usage: pnpm build && pnpm cv:pdf (the deployment runs it, after the build)
 */
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import process from 'node:process';
import pdfUa from '@dume/pdf-ua';
import cv from '../_data/cv.js';
import { openSite, siteDir, siteUrl } from './site-browser.js';

const { browser, page } = await openSite();

for (const { url, pdf } of cv.versions) {
  const response = await page.goto(siteUrl + url);
  if (!response.ok()) {
    console.error(`${url}: HTTP ${response.status()}, run the build first`);
    process.exit(1);
  }
  await page.evaluate(() => document.fonts.ready);
  const output = join(siteDir, pdf);
  const printed = await page.pdf({
    format: 'A4',
    margin: { top: '1.2cm', right: '1.5cm', bottom: '1.2cm', left: '1.5cm' },
    // About 9.5pt text, a CV's usual size: two pages
    scale: 0.75,
    tagged: true,
    outline: true,
  });
  await writeFile(output, await pdfUa(printed));
  console.log(`CV printed as ${output}`);
}
await browser.close();
