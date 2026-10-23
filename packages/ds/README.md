# @dume/ds

My design system, DS (SD, Simon Duhem, the other way round, hence the `--sd-` of its custom properties): the design tokens shared by my projects ([simon.duhem.fr](https://simon.duhem.fr), Music Bridge…), so that their style lives in one place: colors, light and dark, fonts, radius and the keyboard focus ring. Only the tokens the projects use, and components as they repeat from one project to another.

## Naming

Custom properties are named in lowercase words:

- `--sd-b-{category}-{role}-{variant}` for a base token: `--sd-b-color-text`, `--sd-b-color-text-muted`, `--sd-b-color-background-surface`, `--sd-b-outline-focus`.
- `--sd-c-{component}-{category}-…` for a component's (`--sd-c-button-size-min-height`), `--sd-l-{layout}-{category}-…` for a layout's (`--sd-l-grid-size-gap`).
- `--sd-` is the namespace; `b`, `c`, `l` the layer.
- The category, from a closed list: `color`, `font`, `size`, or the CSS property a composite value goes to (`outline`).
- The role, then the variant, from the most general to the most specific.
- The light and dark themes change the values, never the names.

Not `--sd-b-muted-color` (the category comes first), `--sd-b-color-surface` (the role, `background`, is missing), `--sd-b-focus-outline` (`focus` is no category: the CSS property is).

@dume/dev-config's Stylelint configuration checks the names (`custom-property-pattern`) in any project, and, in a project that installs `@dume/ds`, reports a `var()` naming none of its tokens nor a custom property of the project. This package's tests check its own tokens the same way. A new category goes in this list, in the Stylelint rule and in the test.

Only the tokens the projects use: a new one comes with its first use. In JavaScript, the same path: `colors.light.backgroundSurface`, `outlines.focus`. Classes, once components come: the `.sd-` namespace, then `c-` for components, `l-` for layout, `u-` for utilities, in [BEM](https://getbem.com/introduction/) (`.sd-c-button--primary`).

## CSS

```css
@import '@dume/ds/tokens.css';

body {
  background: var(--sd-b-color-background);
  color: var(--sd-b-color-text);
  font-family: var(--sd-b-font-family);
}

:focus-visible {
  outline: var(--sd-b-outline-focus);
  outline-offset: var(--sd-b-outline-offset-focus);
}
```

The custom properties are set on `:root`, with `color-scheme: light dark` and the dark colors under `prefers-color-scheme: dark`:

| Custom property                   | Light     | Dark      | For                              |
| --------------------------------- | --------- | --------- | -------------------------------- |
| `--sd-b-color-text`               | `#222`    | `#fafafa` | Text                             |
| `--sd-b-color-text-muted`         | `#555`    | `#bbb`    | Secondary text                   |
| `--sd-b-color-background`         | `#fafafa` | `#222`    | The page                         |
| `--sd-b-color-background-surface` | `#f1edf7` | `#2e2a35` | A box on the page                |
| `--sd-b-color-border`             | `#ccc`    | `#555`    | A separator, a decorative border |
| `--sd-b-color-border-control`     | `#8a8a8a` | `#8a8a8a` | The border of an input (3:1)     |
| `--sd-b-color-primary`            | `#4b0195` | `#c9a2ff` | Links, focus, buttons            |
| `--sd-b-color-text-on-primary`    | `#fff`    | `#222`    | Text on the primary color        |

| Custom property                                                                    | Value                                        |
| ---------------------------------------------------------------------------------- | -------------------------------------------- |
| `--sd-b-font-family`, `--sd-b-font-family-heading`, `--sd-b-font-family-monospace` | The system's, Bricolage Grotesque, monospace |
| `--sd-b-size-radius`                                                               | `8px`                                        |
| `--sd-b-outline-focus`, `--sd-b-outline-offset-focus`                              | `3px solid var(--sd-b-color-primary)`, `2px` |

Text colors pass WCAG AA (4.5:1) on both backgrounds, in both themes: the tests check them. Bricolage Grotesque is the page's to load (`@fontsource-variable/bricolage-grotesque`); without it, headings fall back to the system font.

## JavaScript

For styles a page cannot load, such as a shadow root's or a canvas', and for scripts:

```js
import { colors, cssVariables } from '@dume/ds';

shadowRoot.innerHTML = `<style>${cssVariables(':host')} div { color: var(--sd-b-color-text); }</style>…`;
colors.dark.primary; // '#c9a2ff'
```

## Development

`pnpm build` writes `dist/tokens.css` from `src/tokens.js`, the one source of the tokens; `pnpm test` checks their contrasts.
