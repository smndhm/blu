/**
 * The board of interactive states (states/index.html), in Chromium, in the light and dark themes. A page cannot hover,
 * focus or press an element itself: each element's state, named in data-state, is forced as the DevTools do
 * (CSS.forcePseudoState), so the design system's very :hover, :focus-visible and :active rules apply. Then:
 * - axe checks it with @dume/dev-config/a11y: every state being always on there, axe checks the contrast of each one
 *   (hovered, pressed, focused, disabled, invalid, current), which it cannot do on a page nobody hovers;
 * - each state looks other than the element at rest: the same color, background, border, outline, underline and cursor
 *   would mean a state lost;
 * - the styles of each state match tests/states.snapshot.json, the reference: computed styles are the same from one
 *   computer to another, where a screenshot's pixels are not (fonts, antialiasing). Run with --update to write it
 *   after a change meant to change a state, and review its diff.
 * The screenshots of both themes are written to states/screenshots/, to look at.
 *
 * Usage: pnpm --filter @dume/ds build && pnpm --filter @dume/ds test:a11y [--update]
 * Set CHROMIUM_PATH to use an already installed Chromium instead of the Playwright one.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import process from 'node:process';
import { chromium } from 'playwright';
// From the repository's root, which has @dume/dev-config for the whole repository
import { audit } from '@dume/dev-config/a11y';

const states = new URL('../states/', import.meta.url);
const snapshotFile = new URL('states.snapshot.json', import.meta.url);
const update = process.argv.includes('--update');

// What tells a state from another: neither sizes nor positions, which depend on the fonts of the computer
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

mkdirSync(new URL('screenshots/', states), { recursive: true });

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
const failures = [];
const snapshot = {};

for (const colorScheme of ['light', 'dark']) {
  const page = await browser.newPage({ colorScheme, viewport: { width: 1200, height: 600 } });
  await page.goto(new URL('index.html', states).href);
  await page.evaluate(() => document.fonts.ready);
  await forceStates(page);

  for (const violation of await audit(page)) failures.push(`${colorScheme}: ${violation}`);

  /** @type {Record<string, Record<string, Record<string, string>>>} component, then case, then property */
  const styles = await page.evaluate(
    properties =>
      Object.fromEntries(
        [...document.querySelectorAll('[data-component]')].map(row => [
          row.dataset.component,
          Object.fromEntries(
            [...row.querySelectorAll('[data-case]')].map(element => {
              const computed = getComputedStyle(element);
              const style = Object.fromEntries(properties.map(property => [property, computed.getPropertyValue(property)]));
              // No outline drawn: its width is 0px whatever it computes to, which differs between Chromium versions
              if (style['outline-style'] === 'none') style['outline-width'] = '0px';
              return [element.dataset.case, style];
            }),
          ),
        ]),
      ),
    PROPERTIES,
  );
  snapshot[colorScheme] = styles;

  for (const [component, cases] of Object.entries(styles)) {
    for (const [name, style] of Object.entries(cases)) {
      if (name !== 'rest' && PROPERTIES.every(property => style[property] === cases.rest[property])) {
        failures.push(`${colorScheme}: the ${name} state of ${component} looks like its rest state`);
      }
    }
  }

  await page.screenshot({ path: new URL(`screenshots/${colorScheme}.png`, states).pathname, fullPage: true });
  await page.close();
}
await browser.close();

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

const written = `${JSON.stringify(snapshot, undefined, 2)}\n`;
if (update) {
  writeFileSync(snapshotFile, written);
  console.log('tests/states.snapshot.json written: review its diff');
} else {
  let reference;
  try {
    reference = readFileSync(snapshotFile, 'utf8');
  } catch {
    failures.push('No tests/states.snapshot.json: run with --update to write it');
  }
  if (reference !== undefined && reference !== written) {
    const expected = JSON.parse(reference);
    for (const [colorScheme, components] of Object.entries(snapshot)) {
      for (const [component, cases] of Object.entries(components)) {
        for (const [name, style] of Object.entries(cases)) {
          for (const property of PROPERTIES) {
            const before = expected[colorScheme]?.[component]?.[name]?.[property];
            if (before !== style[property]) failures.push(`${colorScheme}: ${component} ${name}, ${property}: ${before ?? '(none)'} -> ${style[property]}`);
          }
        }
      }
    }
    failures.push('The states differ from tests/states.snapshot.json: when meant, run with --update and review its diff');
  }
}

if (failures.length > 0) {
  for (const failure of failures) console.log(`✗ ${failure}`);
  process.exit(1);
}
console.log('✓ Every interactive state, in both themes: accessible, told from rest, as the reference');
