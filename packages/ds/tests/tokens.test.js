import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

/** The custom properties of css/tokens.css: their names, and each color in the light and dark themes */
const tokens = Object.fromEntries(
  [...readFileSync(new URL('../css/tokens.css', import.meta.url), 'utf8').matchAll(/(--ds-[\w-]+):\s*([^;]+);/g)].map(([, name, value]) => [name, value.trim()]),
);
const theme = (name, index) => {
  const pair = /^light-dark\((#\w+),\s*(#\w+)\)$/.exec(tokens[name]);
  return pair ? pair[index + 1] : tokens[name];
};

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

for (const [index, name] of ['light', 'dark'].entries()) {
  const color = token => theme(`--ds-b-color-${token}`, index);

  test(`${name}: text, muted text and primary pass WCAG AA on both backgrounds`, () => {
    for (const text of ['text', 'text-muted', 'primary']) {
      for (const behind of ['background', 'background-surface']) {
        const ratio = contrast(color(text), color(behind));
        assert.ok(ratio >= 4.5, `${text} on ${behind}: ${ratio.toFixed(2)}:1`);
      }
    }
  });

  test(`${name}: text on the primary color passes WCAG AA, the control border 3:1`, () => {
    assert.ok(contrast(color('text-on-primary'), color('primary')) >= 4.5);
    assert.ok(contrast(color('border-control'), color('background')) >= 3);
  });
}

test('names every custom property after the taxonomy (see the README)', () => {
  // As @dume/dev-config's Stylelint rule: --ds-b-{category}-…, --ds-c-{component}-{category}-…, --ds-l-{layout}-{category}-…
  const names = Object.keys(tokens);
  assert.ok(names.length > 0);
  for (const name of names) assert.match(name, /^--ds-(b|[cl]-[a-z0-9]+)-(color|font|size|outline)(-[a-z0-9]+)+$/);
});

test('sizes in rem on the base 4: multiples of 0.25rem', () => {
  for (const [name, value] of Object.entries(tokens).filter(([token]) => token.startsWith('--ds-b-size-'))) {
    assert.match(value, /^\d*\.?\d+rem$/, name);
    assert.equal((Number.parseFloat(value) * 4) % 1, 0, `${name}: ${value} is no multiple of 0.25rem`);
  }
});

test('font sizes in rem on the base 4, the display one included', () => {
  const fontSizes = Object.entries(tokens).filter(([token]) => token.startsWith('--ds-b-font-size-'));
  assert.ok(fontSizes.length > 0);
  for (const [name, value] of fontSizes) {
    const rems = [...value.matchAll(/(\d*\.?\d+)rem/g)].map(([, number]) => Number.parseFloat(number));
    assert.ok(rems.length > 0, `${name}: ${value} has no rem`);
    for (const rem of rems) assert.equal((rem * 4) % 1, 0, `${name}: ${rem}rem is no multiple of 0.25rem`);
  }
});
