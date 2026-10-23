---
'@dume/ds': minor
'simon.duhem.fr': patch
'ia-postrophe': patch
---

@dume/ds: my design system, the design tokens shared by my projects (colors, light and dark, fonts, font sizes, spacing, radius, focus ring) as CSS custom properties, the heading font (Bricolage Grotesque), modern-normalize and a base styling HTML elements without classes, a visually hidden utility, page and cluster layouts and its first components (button, field, skip link, header, footer, links, post list, post, post nav, code): plain CSS, colors in light-dark(), logical properties, in cascade layers, all of it in one stylesheet, ds.css. simon.duhem.fr takes all its style from it, loading ds.css, which its Eleventy configuration copies as /ds/: it has no stylesheet of its own anymore; the IApostrophe page neither. The list of articles and talks shows their descriptions. The IApostrophe tester's highlight colors come from its script, as the bookmarklet's.
