# @dume/ds

My design system: the styles shared by my projects ([simon.duhem.fr](https://simon.duhem.fr), Music Bridge…), its custom properties and classes prefixed with `ds-`. Only what the projects use: tokens, components and layouts come as they repeat from one project to another.

While in version 0, it covers my projects' needs only, and a minor version may change what is there: use it elsewhere at your own pace, its version pinned.

## Naming

Custom properties are named in lowercase words:

- `--ds-b-{category}-{role}-{variant}` for a base token: `--ds-b-color-text`, `--ds-b-color-text-muted`, `--ds-b-color-background-surface`, `--ds-b-outline-focus`.
- `--ds-c-{component}-{category}-…` for a component's (`--ds-c-button-size-min-height`), `--ds-l-{layout}-{category}-…` for a layout's (`--ds-l-grid-size-gap`).
- `--ds-` is the namespace; `b`, `c`, `l` the layer.
- The category, from a closed list: `color`, `font`, `size`, or the CSS property a composite value goes to (`outline`).
- The role, then the variant, from the most general to the most specific.
- The light and dark themes change the values, never the names.

Not `--ds-b-muted-color` (the category comes first), `--ds-b-color-surface` (the role, `background`, is missing), `--ds-b-focus-outline` (`focus` is no category: the CSS property is).

@dume/dev-config's Stylelint configuration checks the names (`custom-property-pattern`) in any project, without depending on this package. Its tests check its tokens (`css/tokens.css`) the same way. A new category goes in this list, in the Stylelint rule and in the test.

Only the tokens the projects use: a new one comes with its first use.

HTML elements are styled without classes, in the base: links, headings, a heading and its tagline (`hgroup`), tables, quotes, code. Classes are for components (`c-`), layouts (`l-`) and utilities (`u-`), after the `.ds-` namespace, in [BEM](https://getbem.com/introduction/) (`.ds-l-page--centered`), and only where a style needs them: a block's class on its root, an element's on what its block styles, inside it. No utility-first nor framework classes. A modifier only when its block or element is also used without it, or when it is a variant of its own (`.ds-c-field__control--multiline`: a select or an input is the control without it).

### Web components

A component is HTML and CSS first: a native element (`<a>`, `<button>`, `<dialog>`, `<details>`…) and a class. It becomes a web component only when it needs what CSS and native HTML cannot give:

- a behavior of its own, in JavaScript, that the browser does not have (Music Bridge's message, closed with its button or Escape);
- styles isolated from the page in a shadow root, when the page is not ours (Music Bridge's message, on a music platform's page).

Not for a look alone (a button, a field: a class is enough), nor for what a native element already does. Its content works without JavaScript wherever it can, the web component enhancing it.

Web components are named `ds-` too (`<ds-banner>`); third-party ones keep their name (`<heading-anchors>`).

They live in `web-components/`, in TypeScript, each with its styles in its shadow root: its module imports them, with the tokens set on `:host`, and turns their rem into px, as a page that is not ours has its own root font size.

| Web component                      | Module                              | What it is                                                                                                                                                                                                                                                                                |
| ---------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Banner](web-components/banner.js) | `@dume/ds/web-components/banner.js` | `<ds-banner>`, a message at the top of a page that is not ours, announced by screen readers, closed with its button or Escape: `showBanner(document, { text, lang, closeLabel, iconUrl, link })`, without the custom elements registry, which an extension's content script does not have |

## Units

- `rem` for sizes, on the base 4: multiples of 4px, `0.25rem` (`0.5rem` is 8px, `1rem` 16px). They follow the font size the visitor chose in the browser.
- Spacing, font sizes, radii and border widths from the tokens (`var(--ds-b-size-16)`, `var(--ds-b-size-border-1) solid`), never written in rem or px: the scale stays in one place. Stylelint (@dume/dev-config) checks both rules.
- `em` inside a component, for what grows with its text, such as a button's padding.
- `px` for borders and the focus ring: 1px stays 1px, and the 3px ring stays visible whatever the zoom.
- No unit for line heights (`1.5`), `ch` for a reading width (`65ch`), `clamp()` for a size that follows the screen between a minimum and a maximum, `dvh` rather than `vh`, logical properties (`margin-inline`, `padding-block`).
- A page's root font size stays the browser's: no `font-size: 62.5%`, which would make every `rem` 10px.
- The exception: a component shown in a page that is not ours, such as Music Bridge's message on a music page, is in px, as that page's root font size is not ours.

## Standards

- Plain CSS, no preprocessor: native nesting, custom properties, `color-mix()`, `@layer`.
- The target: [Baseline widely available](https://web.dev/baseline), what every major browser has had for 30 months.
- Light and dark themes: each color is `light-dark(light, dark)`, which follows `color-scheme`, the system's by default; `color-scheme: dark` on a page or an element forces a theme.
- Left-to-right and right-to-left languages alike: logical properties and values (`margin-inline-start`, `text-align: start`), which @dume/dev-config's Stylelint configuration requires.
- Cascade layers: `ds.normalize`, `ds.base`, `ds.layout`, `ds.components`, `ds.utilities`, under any project's own CSS, which wins without a specificity fight. Their order is set in `tokens.css`, the first stylesheet to import.
- Windows' contrast themes (`forced-colors`): components draw their edges with borders and outlines, which those themes keep, not with backgrounds alone.
- Native controls in the primary color (`accent-color`), balanced headings and paragraphs without an orphan word (`text-wrap`).

## CSS

The whole design system is one stylesheet, `@dume/ds/ds.css`, with its fonts in `fonts/` next to it: serve the package's `dist/` folder as is, and load it.

```html
<link rel="stylesheet" href="/ds/ds.css" />
```

simon.duhem.fr does so: its Eleventy configuration copies `dist/` as `/ds/`.

Its parts are also stylesheets of their own, for a project that only takes some of them:

| Stylesheet                  | What                                                                                                                                                                                     |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@dume/ds/fonts.css`        | Bricolage Grotesque, the heading font: its Latin subsets, the files in `fonts/` next to it                                                                                               |
| `@dume/ds/tokens.css`       | The design tokens, as custom properties                                                                                                                                                  |
| `@dume/ds/base.css`         | [modern-normalize](https://github.com/sindresorhus/modern-normalize), then the HTML elements, without classes: text, headings, `hgroup`, links, focus ring, images, tables, quotes, code |
| `@dume/ds/utilities.css`    | `.ds-u-visually-hidden`: hidden on screen, read by screen readers                                                                                                                        |
| `@dume/ds/layout/*.css`     | One stylesheet per layout: `page.css` (`.ds-l-page`, `__main`, `--centered`), `cluster.css` (`.ds-l-cluster`)                                                                            |
| `@dume/ds/components/*.css` | One stylesheet per component (see below)                                                                                                                                                 |

```css
@import '@dume/ds/tokens.css';
@import '@dume/ds/base.css';
@import '@dume/ds/components/button.css';
```

The custom properties are set on `:root`, with `color-scheme: light dark`, each color in `light-dark()`:

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

| Custom property                                                                      | Value                                                                  |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| `--ds-b-font-family`, `--ds-b-font-family-heading`, `--ds-b-font-family-monospace`   | system-ui (the system's font), Bricolage Grotesque, monospace          |
| `--ds-b-size-4`, `-8`, `-12`, `-16`, `-20`, `-24`, `-32`, `-40`, `-48`               | `0.25rem` to `3rem`, named after their px, for spacing and fonts alike |
| `--ds-b-size-display`                                                                | `clamp(2.5rem, 8vw, 4rem)`, a home page's title                        |
| `--ds-b-size-radius`                                                                 | `0.5rem` (8px)                                                         |
| `--ds-b-size-border-1`, `-2`, `-4`                                                   | `1px`, `2px`, `4px`: border widths                                     |
| `--ds-b-outline-focus`, `--ds-b-outline-offset-focus`, `--ds-b-outline-radius-focus` | `3px solid var(--ds-b-color-primary)`, `2px`, `2px`                    |

Text colors pass WCAG AA (4.5:1) on both backgrounds, in both themes: the tests check them. Bricolage Grotesque is for headings only (and a site's name), not for bold text, buttons or labels. `ds.css` and `fonts.css` find its files in `fonts/`, next to them. Without it, headings fall back to the system font.

## Components

One stylesheet per component, after the tokens: `@import '@dume/ds/components/button.css';`.

| Component                                 | Classes                                                            | For                                                                                                                                                            |
| ----------------------------------------- | ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Button](css/components/button.css)       | `.ds-c-button`, `--outline`, `--ghost`                             | A button, or a link that looks like one, filled; outlined for a secondary action or within the text; ghost, neither filled nor outlined, for a discreet action |
| [Field](css/components/field.css)         | `.ds-c-field`, `__label`, `__control` (`--multiline`), `__message` | A label, its control, a message under it whose line is kept                                                                                                    |
| [Skip link](css/components/skip-link.css) | `.ds-c-skip-link`                                                  | A link to the main content, shown when focused                                                                                                                 |
| [Header](css/components/header.css)       | `.ds-c-header`, `__brand`, `__link`                                | A site's header: its name and navigation                                                                                                                       |
| [Footer](css/components/footer.css)       | `.ds-c-footer`                                                     | A site's footer                                                                                                                                                |
| [Links](css/components/links.css)         | `.ds-c-links`                                                      | A few prominent links, under a home page's introduction                                                                                                        |
| [Post list](css/components/post-list.css) | `.ds-c-post-list`, `__item`, `__title`, `__meta`, `__description`  | A list of articles or talks, with their descriptions                                                                                                           |
| [Post](css/components/post.css)           | `.ds-c-post`, `__header`, `__meta`                                 | An article                                                                                                                                                     |
| [Post nav](css/components/post-nav.css)   | `.ds-c-post-nav`, `__list`, `__item` (`--next`)                    | Links to the previous and next articles                                                                                                                        |
| [Code](css/components/code.css)           | Prism's classes                                                    | Code examples highlighted by Prism (Okaidia theme, contrast fixed)                                                                                             |

## Development

Built with [Vite+](https://viteplus.dev) (`vp pack`, its settings in `vite.config.ts`). Each file in `css/` declares its own layer (`@layer ds.components { … }`), their order set once, in `tokens.css`, which comes first; its imports are bundled into it, in their layer: modern-normalize before the base (`@import 'modern-normalize' layer(ds.normalize)`), Prism's Okaidia theme before the code component. `pnpm build` writes `dist/`: each stylesheet, `ds.css` (all of them, from `css/ds.css`), `fonts/` (Bricolage Grotesque's Latin subsets, from @fontsource-variable/bricolage-grotesque, which `css/fonts.css` declares), and `web-components/` with their types. Lightning CSS keeps the syntax as it is for the browsers aimed at (`light-dark()`, nesting). `pnpm test` (Vitest) checks the tokens' names, contrasts and sizes, and `<ds-banner>`.
