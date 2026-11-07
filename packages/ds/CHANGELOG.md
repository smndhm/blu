# @dume/ds

## 0.7.1

### Patch Changes

- b04888f: Updated dependency `vite-plus` to `1.5.0`.

## 0.7.0

### Minor Changes

- 4a6844e: `.ds-l-page` is now the column's width only: readable, centered, with a margin on each side. The window's height, which pushes the footer down, is `--full-height`, and `--centered` includes it. `--fluid` takes the whole width, as for an extension's options in the browser's settings. A page that wants its footer at the bottom of the window adds `ds-l-page--full-height`, as simon.duhem.fr does.

## 0.6.0

### Minor Changes

- 4811a9f: `.ds-u-text-center`: text centered, a paragraph across its container. `.ds-u-text-primary`: text in the primary color, such as the answer after a question in a heading. `--ds-c-hero-size-heading` sets a hero's heading size, as `--ds-c-hero-size-text` its text's. `.ds-c-card--horizontal`: an image (rounded) beside a few short lines, cut with an ellipsis when too long, such as an album's cover beside a link, then its title and artist. `.ds-l-cluster--center` puts a cluster's items in the middle of the line, and `.ds-l-cluster--equal` makes them as wide as each other across it, its images at their own size, such as two cards with an arrow between. A cluster of cards keeps as much room between its lines as between them. `.ds-l-page--tinted`'s glow is now in proportion to the window, lighter on a small one.
- 5aff602: `--ds-c-hero-size-text` sets the size of a hero's text, 24px by default, smaller for a long one, its lines a little further apart when it is smaller. The site's home page sets it to 20px.

## 0.5.0

### Minor Changes

- 4914d2c: `.ds-l-page--tinted` is now a glow of the primary color from the top left, on `--ds-b-color-background-tinted`, whose contrasts are tested, and `--ds-b-color-danger` is a little stronger for it. `.ds-c-hero` has as much room above as below, nothing under its last line, and its text is larger and closer to its heading. `.ds-c-hero--media` and `__media`: an image beside its text. The site's sharing cards use the design system's classes, in the dark theme, with this glow.

## 0.4.0

### Minor Changes

- c01a0f8: `.ds-c-card` loses its visible border and its padding is now 12px and 16px. `.ds-c-checkbox`: a checkbox with its label and its description. `.ds-c-field__control` takes its container's whole width. `extension-page.css`: the design system's font on an extension's page, where Chrome sets its own.

## 0.3.0

### Minor Changes

- ca994b6: `.ds-c-hero`, a block that catches the eye, its heading large whatever its level, and `.ds-c-card`, a box on the page. `.ds-l-cluster--between` puts a cluster's items at each end of the line. A file input stays within a phone's width.
  
  **Breaking:** a `h1` in a `hgroup` is no longer large, which is now the hero's: add `.ds-c-hero`. And the `h1` is now 32px instead of 40px.
- 8ec8b92: `.ds-c-pagination`, previous and next links, and `.ds-u-text-muted`, text that comes second. `.ds-l-stack` can be a list, without its bullets, and a `hgroup`'s tagline sits right under its heading.
  
  **Breaking:** `.ds-c-post`, `.ds-c-post-list` and `.ds-c-post-nav`, which were the blog's, are gone. For `.ds-c-post-nav`, use `.ds-c-pagination`, on its list; for the rest, a `hgroup`, `.ds-l-stack` and `.ds-u-text-muted`.
- f9282f8: For a product's pages: `.ds-l-page--large` and `.ds-l-page--tinted`, a wider page and a light wash of the primary color, `.ds-l-grid`, as many items side by side as fit, and `.ds-c-process-list`, the numbered steps of a process. The theme a project lets its visitor choose, `data-theme` on the root, sets `color-scheme`, and `hidden` always hides.
  
  A paragraph is now 65 characters wide at most, and a paragraph among a cluster's items has no margin.

### Patch Changes

- f369a1b: The hovered and pressed colors and backgrounds, and the surface, come from `--ds-b-color-primary`: a project sets that one on `:root` to change them all. The states stay the same; the surface barely changes (`#f1eef5` and `#2c2a2f`, for `#f1edf7` and `#2e2a35`).

## 0.2.0

### Minor Changes

- bdb7a71: The banner is now the alert, as it has no position of its own: `.ds-c-alert`, `<ds-alert>`, `showAlert()` and `@dume/ds/web-components/alert.js`, its shadow in `<ds-alert>` only, over a page's content, in place of `.ds-c-banner`, `<ds-banner>`, `showBanner()` and `@dume/ds/web-components/banner.js`.
- 8ca0194: `.ds-c-field__control` on a file input: the native input, its button outlined, in all its states. `<ds-file-field>` around such a field: it also takes a file dropped anywhere on it, and refuses one that its input does not accept, saying why.
- a68fcde: Printed, the text is in Instrument Sans, served with the design system (`fonts.css`): the same on every computer that prints, such as the server printing simon.duhem.fr's CV as PDF, which used its own system font. On screen, the text stays in the system's font.
- c96412f: Print styles: a printed page is in the light theme, the whole width of the sheet and its own height, without the header, footer and skip link; a heading is never left alone at the bottom of a sheet. `.ds-u-print-hidden` leaves out what only makes sense on screen, such as a download link. In a `hgroup`, a `h2` to `h6` has no bottom margin: its tagline sits right under it, which the flex column kept apart (a CV position's dates); a `h1` keeps its own. A tagline in small print (a `<small>` alone in its paragraph, such as a date) has a line as low as its text. Every heading level is styled, on the base 4: `h1` 40px extra bold, `h2` 24px bold, `h3` 20px extra bold, and `h4`, `h5`, `h6` in the text's 16px, extra bold, bold and semibold; the browser's sizes and margins no longer show (articles, the CV). A heading right after another has no margin above: the previous heading's below sets the room between them (8px under a CV's company, 16px under a section's title). Printed, the page's main content has no padding of its own, the sheet's margins being enough. A `hgroup` with a `h2` to a `h6` takes its heading's margins, so that they collapse with its neighbors' as the heading's alone would. A new layout, `.ds-l-stack` (`layout/stack.css`): items one under the other, 8px apart, closer than paragraphs, such as a CV position's highlights. A board of typography, `tests/typography.html`, checked by the accessibility test with axe, each heading level's distinct style and screenshots in both themes; the README documents the typography.

### Patch Changes

- fb2c2e2: `.ds-l-cluster` centers its items on a line: a button next to a link lines up with it.
- f2ec180: The order of the cascade layers holds once bundled by Vite: the tokens in `ds.base.tokens`, a layer of their own within the base. `ds.base` came last, over the components: the text of a filled button that is a link, `<a class="ds-c-button">`, was unreadable.

## 0.1.0

### Minor Changes

- 96f02d0: The banner component, `.ds-c-banner` (`__icon`, `__text`, `__close`): a message that stays until closed, `<ds-banner>`'s markup in HTML and CSS, for a page of ours, its script closing it. `<ds-banner>` is this component in a shadow root, unchanged on the page. Every component is HTML and CSS first, a web component being that component in a shadow root with its behavior: the README says so. `styles.css` takes the button before the other components, which build on it.
- df0d73c: Its first web component, `<ds-banner>` (`@dume/ds/web-components/banner.js`): a message at the top of a page that is not ours, its styles and the tokens in its shadow root, in px, light or dark as the system, announced by screen readers, closed with its button or Escape. Music Bridge's message on music pages, moved here.
- 05c7f7f: The button is filled with the primary color, and outlined with `--outline`, for a secondary action or a button within the text (IApostrophe's bookmarklet); its text in the text's weight; on a `<button>`, no background nor font of the browser's.
- df0d73c: The button's `--ghost` variant: neither filled nor outlined, tinted with the primary color on hover, for an action that stays discreet; `<ds-banner>`'s close button.
- 96f02d0: Every interactive element has all its states, accessible: a principle of the design system, in its README. Hovered, pressed, disabled (`disabled` or `aria-disabled="true"`) for the buttons, their pointer cursor, `not-allowed` when disabled; a thicker underline for a hovered link, darker when pressed; a hover border, an invalid state (`aria-invalid`, `.ds-c-field__message--danger`) and a disabled one for the controls; the current page's header link in bold. Windows' contrast themes show a disabled element in `GrayText`. New tokens: `--ds-b-color-primary-hover`, `-active`, `--ds-b-color-background-hover`, `-active`, `--ds-b-color-text-disabled`, `--ds-b-color-background-disabled` and `--ds-b-color-danger`, a red of the primary color's chroma. The tests check every color's contrast as people see them and as the three kinds of color blindness do.
- 75ebb28: @dume/ds: my design system, the design tokens shared by my projects (colors, light and dark, fonts, font sizes, spacing, radius, focus ring) as CSS custom properties, the heading font (Bricolage Grotesque), modern-normalize and a base styling HTML elements without classes, a visually hidden utility, page and cluster layouts and its first components (button, field, skip link, header, footer, links, post list, post, post nav, code): plain CSS, colors in light-dark(), logical properties, in cascade layers, all of it in one stylesheet, styles.css. simon.duhem.fr takes all its style from it, loading styles.css, which its Eleventy configuration copies as /ds/: it has no stylesheet of its own anymore; the IApostrophe page neither. The list of articles and talks shows their descriptions. The 404 page just says "Non". The IApostrophe tester's highlight colors come from its script, as the bookmarklet's.
- df0d73c: Built with Vite+ (`vp pack`) instead of a script of its own: each stylesheet bundles its imports in their layer (modern-normalize, Prism's Okaidia theme), the heading font declared in `css/fonts.css`, the web components written in TypeScript, their types generated. The same styles, pixel for pixel on simon.duhem.fr.

### Patch Changes

- 27ac0b6: Updated dependency `vite-plus` to `1.4.0`.
