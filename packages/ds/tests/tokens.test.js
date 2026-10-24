import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'vite-plus/test';

/** The custom properties of css/tokens.css: their names, and each color in the light and dark themes */
const tokens = Object.fromEntries(
  [...readFileSync(new URL('../css/tokens.css', import.meta.url), 'utf8').matchAll(/(--ds-[\w-]+):\s*([^;]+);/g)].map(([, name, value]) => [name, value.trim()]),
);
const theme = (name, index) => {
  const pair = /^light-dark\((#\w+),\s*(#\w+)\)$/.exec(tokens[name]);
  return pair ? pair[index + 1] : tokens[name];
};

/** The sRGB channels, 0 to 1, of a #rgb, #rrggbb or #rrggbbaa color, and its alpha */
function channels(hex) {
  const digits = hex.length === 4 ? hex.replace(/[0-9a-f]/gi, '$&$&').slice(1) : hex.slice(1);
  const [red, green, blue, alpha = 1] = digits.match(/../g).map(pair => Number.parseInt(pair, 16) / 255);
  return { rgb: [red, green, blue], alpha };
}

const linear = channel => (channel <= 0.040_45 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);

/** A translucent color over an opaque one, as the browser paints it, in linear RGB */
function over(hex, behind) {
  const { rgb, alpha } = channels(hex);
  const back = channels(behind).rgb;
  return rgb.map((channel, index) => linear(channel) * alpha + linear(back[index]) * (1 - alpha));
}

// How the three kinds of color blindness see a color, in linear RGB (Machado, Oliveira and Fernandes, 2009, severity 1)
const VISIONS = {
  normal: [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ],
  protanopia: [
    [0.152_286, 1.052_583, -0.204_868],
    [0.114_503, 0.786_281, 0.099_216],
    [-0.003_882, -0.048_116, 1.051_998],
  ],
  deuteranopia: [
    [0.367_322, 0.860_646, -0.227_968],
    [0.280_085, 0.672_501, 0.047_413],
    [-0.011_82, 0.042_94, 0.968_881],
  ],
  tritanopia: [
    [1.255_528, -0.076_749, -0.178_779],
    [-0.078_411, 0.930_809, 0.147_602],
    [0.004_733, 0.691_367, 0.303_9],
  ],
};

/** Relative luminance of linear RGB channels, as `vision` sees them */
function luminance(rgb, vision) {
  const [red, green, blue] = VISIONS[vision].map(row =>
    Math.min(
      1,
      Math.max(
        0,
        row.reduce((sum, weight, index) => sum + weight * rgb[index], 0),
      ),
    ),
  );
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

/** WCAG contrast ratio of a color on another, as `vision` sees them; the first may be translucent, over the second */
function contrast(first, second, vision = 'normal') {
  const back = over(second, '#000');
  const [lighter, darker] = [luminance(over(first, second), vision), luminance(back, vision)].toSorted((x, y) => y - x);
  return (lighter + 0.05) / (darker + 0.05);
}

/** The ratio of text on a background, the background maybe translucent over `behind` */
function textContrast(text, background, behind, vision) {
  const back = over(background, behind);
  const front = over(text, '#000');
  const [lighter, darker] = [luminance(front, vision), luminance(back, vision)].toSorted((x, y) => y - x);
  return (lighter + 0.05) / (darker + 0.05);
}

for (const [index, name] of ['light', 'dark'].entries()) {
  const color = token => theme(`--ds-b-color-${token}`, index);
  const backgrounds = ['background', 'background-surface'];

  for (const vision of Object.keys(VISIONS)) {
    test(`${name}, ${vision}: text, muted text, primary and danger pass WCAG AA on both backgrounds`, () => {
      for (const text of ['text', 'text-muted', 'primary', 'primary-hover', 'primary-active', 'danger']) {
        for (const behind of backgrounds) {
          const ratio = contrast(color(text), color(behind), vision);
          assert.ok(ratio >= 4.5, `${text} on ${behind}: ${ratio.toFixed(2)}:1`);
        }
      }
    });

    test(`${name}, ${vision}: text on the primary color, hovered or pressed, and on danger passes WCAG AA`, () => {
      for (const behind of ['primary', 'primary-hover', 'primary-active', 'danger']) {
        const ratio = contrast(color('text-on-primary'), color(behind), vision);
        assert.ok(ratio >= 4.5, `text on ${behind}: ${ratio.toFixed(2)}:1`);
      }
    });

    test(`${name}, ${vision}: text on a hovered or pressed background passes WCAG AA, on both backgrounds`, () => {
      for (const state of ['background-hover', 'background-active']) {
        for (const behind of backgrounds) {
          const ratio = textContrast(color('text'), color(state), color(behind), vision);
          assert.ok(ratio >= 4.5, `text on ${state} over ${behind}: ${ratio.toFixed(2)}:1`);
        }
      }
    });

    test(`${name}, ${vision}: the control border and the focus ring contrast 3:1 with the background`, () => {
      for (const border of ['border-control', 'primary', 'danger']) {
        const ratio = contrast(color(border), color('background'), vision);
        assert.ok(ratio >= 3, `${border}: ${ratio.toFixed(2)}:1`);
      }
    });
  }
}

test('names every custom property after the taxonomy (see the README)', () => {
  // As @dume/dev-config's Stylelint rule: --ds-b-{category}-…, --ds-c-{component}-{category}-…, --ds-l-{layout}-{category}-…
  const names = Object.keys(tokens);
  assert.ok(names.length > 0);
  for (const name of names) assert.match(name, /^--ds-(b|[cl]-[a-z0-9]+)-(color|font|size|outline)(-[a-z0-9]+)+$/);
});

test('sizes in rem on the base 4: multiples of 0.25rem', () => {
  const sizes = Object.entries(tokens).filter(([token]) => token.startsWith('--ds-b-size-') && !token.startsWith('--ds-b-size-border-'));
  assert.ok(sizes.length > 0);
  for (const [name, value] of sizes) {
    const rems = [...value.matchAll(/(\d*\.?\d+)rem/g)].map(([, number]) => Number.parseFloat(number));
    assert.ok(rems.length > 0, `${name}: ${value} has no rem`);
    for (const rem of rems) assert.equal((rem * 4) % 1, 0, `${name}: ${rem}rem is no multiple of 0.25rem`);
  }
});

test('border widths in px', () => {
  const borders = Object.entries(tokens).filter(([token]) => token.startsWith('--ds-b-size-border-'));
  assert.ok(borders.length > 0);
  for (const [name, value] of borders) assert.match(value, /^\d+px$/, name);
});
