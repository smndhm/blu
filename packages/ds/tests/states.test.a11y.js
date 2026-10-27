/**
 * The board of interactive states (tests/states.html), in the light and dark themes. A page cannot hover, focus or
 * press an element itself: each element's state, named in data-state, is forced as the DevTools do
 * (CSS.forcePseudoState), so the design system's very :hover, :focus-visible and :active rules apply. Then:
 * - axe checks it with @dume/dev-config/a11y: every state being always on there, axe checks the contrast of each one
 *   (hovered, pressed, focused, disabled, invalid, current), which it cannot do on a page nobody hovers;
 * - each state looks other than the element at rest: the same color, background, border, outline, underline and cursor
 *   would mean a state lost;
 * - its screenshot matches the reference, tests/screenshots/light.png and dark.png: rendered in Playwright's Docker
 *   image (playwright.config.js), it is the same on every computer. After a change meant to change a state, run with
 *   --update-snapshots and look at the new screenshots.
 */
import { expect, test } from '@playwright/test';
// From the repository's root, which has @dume/dev-config for the whole repository
import { audit } from '@dume/dev-config/a11y';

// What tells a state from another
const PROPERTIES = [
  'color',
  'background-color',
  'border-top-color',
  'border-top-width',
  'box-shadow',
  'outline-style',
  'outline-width',
  'outline-color',
  'outline-offset',
  'text-decoration-line',
  'text-decoration-color',
  'text-decoration-thickness',
  'font-weight',
  'cursor',
];

/** Forces on each element of the page the pseudo-classes its data-state names, for as long as the page is open */
async function forceStates(page) {
  const session = await page.context().newCDPSession(page);
  await session.send('DOM.enable');
  await session.send('CSS.enable');
  const { root } = await session.send('DOM.getDocument');
  const { nodeIds } = await session.send('DOM.querySelectorAll', { nodeId: root.nodeId, selector: '[data-state]' });
  for (const nodeId of nodeIds) {
    const { attributes } = await session.send('DOM.getAttributes', { nodeId });
    const forcedPseudoClasses = attributes[attributes.indexOf('data-state') + 1].split(/\s+/);
    await session.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses });
  }
}

for (const colorScheme of ['light', 'dark']) {
  test(`every interactive state, ${colorScheme} theme`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await page.goto(new URL('tests/states.html', process.env.DS_BASE_URL).href);
    await page.evaluate(() => document.fonts.ready);
    await forceStates(page);

    expect(await audit(page), 'axe finds no violation').toEqual([]);

    const lost = await page.evaluate(properties => {
      const style = element => properties.map(property => getComputedStyle(element).getPropertyValue(property)).join();
      return [...document.querySelectorAll('[data-component]')].flatMap(row => {
        const rest = style(row.querySelector('[data-case="rest"]'));
        return [...row.querySelectorAll('[data-case]:not([data-case="rest"])')]
          .filter(element => style(element) === rest)
          .map(element => `the ${element.dataset.case} state of ${row.dataset.component}`);
      });
    }, PROPERTIES);
    expect(lost, 'each state looks other than its rest state').toEqual([]);

    await expect(page).toHaveScreenshot(`${colorScheme}.png`, { fullPage: true });
  });
}
