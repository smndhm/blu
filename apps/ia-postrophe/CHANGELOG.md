# ia-postrophe

## 1.1.1

### Patch Changes

- 75ebb28: @dume/ds: my design system, the design tokens shared by my projects (colors, light and dark, fonts, font sizes, spacing, radius, focus ring) as CSS custom properties, the heading font (Bricolage Grotesque), modern-normalize and a base styling HTML elements without classes, a visually hidden utility, page and cluster layouts and its first components (button, field, skip link, header, footer, links, post list, post, post nav, code): plain CSS, colors in light-dark(), logical properties, in cascade layers, all of it in one stylesheet, styles.css. simon.duhem.fr takes all its style from it, loading styles.css, which its Eleventy configuration copies as /ds/: it has no stylesheet of its own anymore; the IApostrophe page neither. The list of articles and talks shows their descriptions. The 404 page just says "Non". The IApostrophe tester's highlight colors come from its script, as the bookmarklet's.
- 30ae1aa: Updated dependency `vite` to `8.3.5`.

## 1.1.0

### Minor Changes

- b1574aa: Le bookmarklet surligne les caractères avec la CSS Custom Highlight API, sans modifier la page, et ignore le code coloré et les SVG
- 37e87e0: Le bookmarklet surligne aussi les caractères dans les shadow roots ouverts des Web Components
- b1574aa: La page IApostrophe est intégrée au site et reprend son thème ; le paquet ia-postrophe ne fournit plus que le script de l'outil
- b1574aa: Ajout d'un champ pour coller un texte et y surligner les caractères typographiques IA

### Patch Changes

- 9ad9816: Updated dependency `vite` to `7.3.6`.
- eaea8f7: Updated dependency `jsdom` to `30.1.2`.
- 4f3d4fe: Updated dependency `vitest` to `5.0.5`.
  Updated dependency `@vitest/coverage-v8` to `5.0.5`.
- bd865f3: Updated dependency `jsdom` to `30.1.1`.
- 9bbce61: Updated dependency `vitest` to `5.0.3`.
  Updated dependency `@vitest/coverage-v8` to `5.0.3`.
- 664d2eb: Updated dependency `vitest` to `5.0.4`.
  Updated dependency `@vitest/coverage-v8` to `5.0.4`.
- ed6d5a9: Updated dependency `vite` to `8.3.4`.
- 5022cd5: Updated dependency `vite` to `8.3.2`.
- 36be6d2: Updated dependency `jsdom` to `30.1.3`.
- 5b964d9: Updated dependency `vite` to `8.3.3`.

## 1.0.0

### Major Changes

- 5b11c6f: Release
