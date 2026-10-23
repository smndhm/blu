/**
 * The design tokens: the one place for the colors, fonts, radius and focus ring of my projects, only those they use.
 * Each token is also a CSS custom property, `--sd-b-color-primary` for `colors.light.primary` and `colors.dark.primary`
 * (see the README for the naming): dist/tokens.css sets them (built by scripts/build.js), and `cssVariables()` gives the
 * same CSS for a stylesheet a page cannot load, such as a shadow root's.
 */

/**
 * Colors, light and dark, the dark ones under `prefers-color-scheme: dark`. Text colors pass WCAG AA (4.5:1) on both
 * backgrounds, `borderControl` the 3:1 asked of input borders (tests/tokens.test.js checks them).
 */
export const colors = {
  light: {
    text: '#222',
    textMuted: '#555',
    background: '#fafafa',
    // A box on the background, such as a checkbox with its label and help
    backgroundSurface: '#f1edf7',
    // A separator, a decorative border
    border: '#ccc',
    // The border of an input, a select
    borderControl: '#8a8a8a',
    primary: '#4b0195',
    // Text on the primary color, such as a button's
    textOnPrimary: '#fff',
  },
  dark: {
    text: '#fafafa',
    textMuted: '#bbb',
    background: '#222',
    backgroundSurface: '#2e2a35',
    border: '#555',
    borderControl: '#8a8a8a',
    primary: '#c9a2ff',
    textOnPrimary: '#222',
  },
};

const system = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'";

/** Font families: the system's for text, Bricolage Grotesque for headings where the page loads it (it falls back to the system's) */
export const fonts = {
  family: system,
  familyHeading: `'Bricolage Grotesque', ${system}`,
  familyMonospace: "ui-monospace, Consolas, Menlo, Monaco, 'Liberation Mono', 'Courier New', monospace",
};

/** In px: a page's root font size is not always the browser's (62.5% on Music Bridge's options, the page's own in a shadow root) */
export const sizes = { radius: '8px' };

/** The keyboard focus ring, in the primary color: `outline: var(--sd-b-outline-focus); outline-offset: var(--sd-b-outline-offset-focus);` */
export const outlines = { focus: '3px solid var(--sd-b-color-primary)', offsetFocus: '2px' };

/** `textMuted` → `text-muted` */
const kebab = name => name.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);

/** Custom properties of a category: `color` and `{ textMuted }` → `--sd-b-color-text-muted` */
const declarations = (category, tokens, indent) =>
  Object.entries(tokens)
    .map(([name, value]) => `${indent}--sd-b-${category}-${kebab(name)}: ${value};`)
    .join('\n');

/**
 * The tokens as CSS custom properties on `selector` (`:root` for a page, `:host` for a shadow root), with
 * `color-scheme: light dark` and the dark colors under `prefers-color-scheme: dark`.
 */
export function cssVariables(selector = ':root') {
  return `${selector} {
  color-scheme: light dark;
${declarations('color', colors.light, '  ')}
${declarations('font', fonts, '  ')}
${declarations('size', sizes, '  ')}
${declarations('outline', outlines, '  ')}
}

@media (prefers-color-scheme: dark) {
  ${selector} {
${declarations('color', colors.dark, '    ')}
  }
}
`;
}
