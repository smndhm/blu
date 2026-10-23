# @dume/ds

My design system, DS (also SD, Simon Duhem, the other way round), with its `--ds-` custom properties: the design tokens shared by my projects ([simon.duhem.fr](https://simon.duhem.fr), Music Bridge…), so that their style lives in one place: colors, light and dark, fonts, radius and the keyboard focus ring. Only the tokens the projects use, and components as they repeat from one project to another.

## Naming

Custom properties are named in lowercase words:

- `--ds-b-{category}-{role}-{variant}` for a base token: `--ds-b-color-text`, `--ds-b-color-text-muted`, `--ds-b-color-background-surface`, `--ds-b-outline-focus`.
- `--ds-c-{component}-{category}-…` for a component's (`--ds-c-button-size-min-height`), `--ds-l-{layout}-{category}-…` for a layout's (`--ds-l-grid-size-gap`).
- `--ds-` is the namespace; `b`, `c`, `l` the layer.
- The category, from a closed list: `color`, `font`, `size`, or the CSS property a composite value goes to (`outline`).
- The role, then the variant, from the most general to the most specific.
- The light and dark themes change the values, never the names.

Not `--ds-b-muted-color` (the category comes first), `--ds-b-color-surface` (the role, `background`, is missing), `--ds-b-focus-outline` (`focus` is no category: the CSS property is).

@dume/dev-config's Stylelint configuration checks the names (`custom-property-pattern`) in any project, and, in a project that installs `@dume/ds`, reports a `var()` naming none of its tokens nor a custom property of the project. This package's tests check its own tokens the same way. A new category goes in this list, in the Stylelint rule and in the test.

Only the tokens the projects use: a new one comes with its first use. In JavaScript, the same path: `colors.light.backgroundSurface`, `outlines.focus`. Classes, once components come: the `.ds-` namespace, then `c-` for components, `l-` for layout, `u-` for utilities, in [BEM](https://getbem.com/introduction/) (`.ds-c-button--primary`).

## Units

- `rem` for sizes, on the base 4: multiples of 4px, `0.25rem` (`0.5rem` is 8px, `1rem` 16px). They follow the font size the visitor chose in the browser.
- `em` inside a component, for what grows with its text, such as a button's padding.
- `px` for borders and the focus ring: 1px stays 1px, and the 3px ring stays visible whatever the zoom.
- No unit for line heights (`1.5`), `ch` for a reading width (`65ch`), `clamp()` for a size that follows the screen between a minimum and a maximum, `dvh` rather than `vh`, logical properties (`margin-inline`, `padding-block`).
- A page's root font size stays the browser's: no `font-size: 62.5%`, which would make every `rem` 10px.
- The exception: a component shown in a page that is not ours, such as Music Bridge's message on a music page, is in px, as that page's root font size is not ours.

## CSS

```css
@import '@dume/ds/tokens.css';

body {
  background: var(--ds-b-color-background);
  color: var(--ds-b-color-text);
  font-family: var(--ds-b-font-family);
}

:focus-visible {
  outline: var(--ds-b-outline-focus);
  outline-offset: var(--ds-b-outline-offset-focus);
}
```

The custom properties are set on `:root`, with `color-scheme: light dark` and the dark colors under `prefers-color-scheme: dark`:

| Custom property                   | Light     | Dark      | For                              |
| --------------------------------- | --------- | --------- | -------------------------------- |
| `--ds-b-color-text`               | `#222`    | `#fafafa` | Text                             |
| `--ds-b-color-text-muted`         | `#555`    | `#bbb`    | Secondary text                   |
| `--ds-b-color-background`         | `#fafafa` | `#222`    | The page                         |
| `--ds-b-color-background-surface` | `#f1edf7` | `#2e2a35` | A box on the page                |
| `--ds-b-color-border`             | `#ccc`    | `#555`    | A separator, a decorative border |
| `--ds-b-color-border-control`     | `#8a8a8a` | `#8a8a8a` | The border of an input (3:1)     |
| `--ds-b-color-primary`            | `#4b0195` | `#c9a2ff` | Links, focus, buttons            |
| `--ds-b-color-text-on-primary`    | `#fff`    | `#222`    | Text on the primary color        |

| Custom property                                                                    | Value                                                         |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `--ds-b-font-family`, `--ds-b-font-family-heading`, `--ds-b-font-family-monospace` | system-ui (the system's font), Bricolage Grotesque, monospace |
| `--ds-b-size-radius`                                                               | `0.5rem` (8px)                                                |
| `--ds-b-outline-focus`, `--ds-b-outline-offset-focus`                              | `3px solid var(--ds-b-color-primary)`, `2px`                  |

Text colors pass WCAG AA (4.5:1) on both backgrounds, in both themes: the tests check them. Bricolage Grotesque is for headings only (and a site's name), not for bold text, buttons or labels; it is the page's to load (`@fontsource-variable/bricolage-grotesque`); without it, headings fall back to the system font.

## Components

One stylesheet per component, in `css/components/`, after the tokens: `@import '@dume/ds/components/button.css';`.

| Component                           | Classes                                                        | For                                                         |
| ----------------------------------- | -------------------------------------------------------------- | ----------------------------------------------------------- |
| [Button](css/components/button.css) | `.ds-c-button`, `--outline`                                    | A button, or a link that looks like one                     |
| [Field](css/components/field.css)   | `.ds-c-field__label`, `__control` (`--multiline`), `__message` | A label, its control, a message under it whose line is kept |
| [Table](css/components/table.css)   | `.ds-c-table`                                                  | A data table                                                |
| [Quote](css/components/quote.css)   | `.ds-c-quote`                                                  | A quote set apart                                           |

## JavaScript

For styles a page cannot load, such as a shadow root's or a canvas', and for scripts:

```js
import { colors, cssVariables } from '@dume/ds';

shadowRoot.innerHTML = `<style>${cssVariables(':host')} div { color: var(--ds-b-color-text); }</style>…`;
colors.dark.primary; // '#c9a2ff'
```

## Development

`pnpm build` writes `dist/tokens.css` from `src/tokens.js`, the one source of the tokens; `pnpm test` checks their contrasts.
