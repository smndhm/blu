/**
 * The board of typography (tests/typography.html), in the light and dark themes:
 * - axe checks it with @dume/dev-config/a11y, the contrast of every text style included;
 * - each heading level looks other than the others (its size or its weight), and the h6 is in the text's size;
 * - its screenshot matches the reference, tests/screenshots/typography-light.png and typography-dark.png: rendered in
 *   Playwright's Docker image (playwright.config.js), it is the same on every computer. After a change meant to change
 *   the typography, run with --update-snapshots and look at the new screenshots.
 */
import { expect, test } from '@playwright/test';
// From the repository's root, which has @dume/dev-config for the whole repository
import { audit } from '@dume/dev-config/a11y';

for (const colorScheme of ['light', 'dark']) {
  test(`the typography, ${colorScheme} theme`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await page.goto(new URL('tests/typography.html', process.env.DS_BASE_URL).href);
    await page.evaluate(() => document.fonts.ready);

    expect(await audit(page), 'axe finds no violation').toEqual([]);

    const { levels, paragraph } = await page.evaluate(() => ({
      levels: [...document.querySelectorAll('[data-level]')].map(level => {
        const style = getComputedStyle(level.querySelector('h1, h2, h3, h4, h5, h6'));
        return `${style.fontSize} ${style.fontWeight}`;
      }),
      paragraph: getComputedStyle(document.querySelector('main p')).fontSize,
    }));
    expect(levels, 'six heading levels').toHaveLength(6);
    expect(new Set(levels).size, 'each heading level looks other than the others').toBe(6);
    expect(levels[5].split(' ')[0], "the h6 is in the text's size").toBe(paragraph);

    await expect(page).toHaveScreenshot(`typography-${colorScheme}.png`, { fullPage: true });
  });
}
