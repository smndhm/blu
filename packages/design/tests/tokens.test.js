import assert from 'node:assert/strict';
import test from 'node:test';
import { colors, cssVariables } from '../src/tokens.js';

/** Relative luminance of a #rgb or #rrggbb color */
function luminance(hex) {
  const digits = hex.length === 4 ? hex.replace(/[0-9a-f]/gi, '$&$&').slice(1) : hex.slice(1);
  const [red, green, blue] = digits.match(/../g).map(pair => {
    const channel = Number.parseInt(pair, 16) / 255;
    return channel <= 0.039_28 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

/** WCAG contrast ratio of two colors */
function contrast(first, second) {
  const [lighter, darker] = [luminance(first), luminance(second)].toSorted((x, y) => y - x);
  return (lighter + 0.05) / (darker + 0.05);
}

for (const theme of ['light', 'dark']) {
  const { text, textMuted, background, backgroundSurface, borderControl, primary, textOnPrimary } = colors[theme];
  test(`${theme}: text, muted text and primary pass WCAG AA on both backgrounds`, () => {
    for (const color of [text, textMuted, primary]) {
      for (const behind of [background, backgroundSurface]) assert.ok(contrast(color, behind) >= 4.5, `${color} on ${behind}: ${contrast(color, behind).toFixed(2)}:1`);
    }
  });

  test(`${theme}: text on the primary color passes WCAG AA, input borders 3:1`, () => {
    assert.ok(contrast(textOnPrimary, primary) >= 4.5);
    assert.ok(contrast(borderControl, background) >= 3);
  });

  test(`${theme}: every color has its custom property`, () => {
    const css = cssVariables();
    for (const [name, value] of Object.entries(colors[theme]))
      assert.ok(css.includes(`--sd-b-color-${name.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)}: ${value};`), name);
  });
}

test('names every custom property after the taxonomy (see the README)', () => {
  // --sd-{layer}-{category}-{role}-{variant}: the known layers and categories, then lowercase words
  const name = /^--sd-(b|c|l)-(color|font|size|outline)(-[a-z]+)+$/;
  const names = cssVariables().match(/--sd-[\w-]+(?=:)/g);
  assert.ok(names.length > 0);
  for (const property of names) assert.match(property, name);
});

test('sets the dark colors under prefers-color-scheme: dark, on any selector', () => {
  const css = cssVariables(':host');
  assert.match(css, /^:host \{\n {2}color-scheme: light dark;/);
  assert.match(css, /@media \(prefers-color-scheme: dark\) \{\n {2}:host \{\n {4}--sd-b-color-text: #fafafa;/);
  assert.ok(css.includes("--sd-b-font-family-heading: 'Bricolage Grotesque', "));
  assert.ok(css.includes('--sd-b-outline-focus: 3px solid var(--sd-b-color-primary);'));
});
