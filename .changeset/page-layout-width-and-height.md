---
'@dume/ds': minor
'simon.duhem.fr': patch
---

`.ds-l-page` is now the column's width only: readable, centered, with a margin on each side. The window's height, which pushes the footer down, is `--full-height`, and `--centered` includes it. `--fluid` takes the whole width, as for an extension's options in the browser's settings. A page that wants its footer at the bottom of the window adds `ds-l-page--full-height`, as simon.duhem.fr does.
