---
'@dume/ds': minor
---

Print styles: a printed page is in the light theme, the whole width of the sheet and its own height, without the header, footer and skip link; a heading is never left alone at the bottom of a sheet. `.ds-u-print-hidden` leaves out what only makes sense on screen, such as a download link. In a `hgroup`, the heading has no bottom margin: its tagline sits right under it, which the flex column kept apart (a CV position's dates; the home page's introduction comes up a little). A tagline in small print (a `<small>` alone in its paragraph, such as a date) has a line as low as its text.
