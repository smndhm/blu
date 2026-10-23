import assert from 'node:assert/strict';
import test from 'node:test';
import { colors, cssVariables, sizes } from '../src/tokens.js';

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
    for (const [name, value] of Object.entries(colors[theme])) {
      const property = `--ds-b-color-${name.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)}`;
      assert.match(css, new RegExp(`${property}: (light-dark\\([^)]*${value}[^)]*\\)|${value});`), name);
    }
  });
}

test('names every custom property after the taxonomy (see the README)', () => {
  // As @dume/dev-config's Stylelint rule: --ds-b-{category}-…, --ds-c-{component}-{category}-…, --ds-l-{layout}-{category}-…
  const name = /^--ds-(b|[cl]-[a-z0-9]+)-(color|font|size|outline)(-[a-z0-9]+)+$/;
  const names = cssVariables().match(/--ds-[\w-]+(?=:)/g);
  assert.ok(names.length > 0);
  for (const property of names) assert.match(property, name);
});

test('sizes in rem on the base 4: multiples of 0.25rem', () => {
  for (const [name, value] of Object.entries(sizes)) {
    assert.match(value, /^\d*\.?\d+rem$/, name);
    assert.equal((Number.parseFloat(value) * 4) % 1, 0, `${name}: ${value} is no multiple of 0.25rem`);
  }
});

test('sets each color in light-dark(), on any selector, with color-scheme', () => {
  const css = cssVariables(':host');
  assert.match(css, /^:host \{\n {2}color-scheme: light dark;/);
  assert.ok(css.includes('--ds-b-color-text: light-dark(#222, #fafafa);'));
  assert.ok(css.includes('--ds-b-color-border-control: #8a8a8a;'));
  assert.ok(!css.includes('@media'));
  assert.ok(css.includes("--ds-b-font-family-heading: 'Bricolage Grotesque', "));
  assert.ok(css.includes('--ds-b-outline-focus: 3px solid var(--ds-b-color-primary);'));
});
