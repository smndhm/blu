# @dume/ds

## 0.2.0

### Minor Changes

- a68fcde: Printed, the text is in Instrument Sans, served with the design system (`fonts.css`): the same on every computer that prints, such as the server printing simon.duhem.fr's CV as PDF, which used its own system font. On screen, the text stays in the system's font.
- c96412f: Print styles: a printed page is in the light theme, the whole width of the sheet and its own height, without the header, footer and skip link; a heading is never left alone at the bottom of a sheet. `.ds-u-print-hidden` leaves out what only makes sense on screen, such as a download link. In a `hgroup`, a `h2` to `h6` has no bottom margin: its tagline sits right under it, which the flex column kept apart (a CV position's dates); a `h1` keeps its own. A tagline in small print (a `<small>` alone in its paragraph, such as a date) has a line as low as its text. Every heading level is styled, on the base 4: `h1` 40px extra bold, `h2` 24px bold, `h3` 20px extra bold, and `h4`, `h5`, `h6` in the text's 16px, extra bold, bold and semibold; the browser's sizes and margins no longer show (articles, the CV). A heading right after another has no margin above: the previous heading's below sets the room between them (8px under a CV's company, 16px under a section's title). Printed, the page's main content has no padding of its own, the sheet's margins being enough. A `hgroup` with a `h2` to a `h6` takes its heading's margins, so that they collapse with its neighbors' as the heading's alone would. A new layout, `.ds-l-stack` (`layout/stack.css`): items one under the other, 8px apart, closer than paragraphs, such as a CV position's highlights. A board of typography, `tests/typography.html`, checked by the accessibility test with axe, each heading level's distinct style and screenshots in both themes; the README documents the typography.

### Patch Changes

- fb2c2e2: `.ds-l-cluster` centers its items on a line: a button next to a link lines up with it.

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
