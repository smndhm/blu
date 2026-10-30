---
'simon.duhem.fr': minor
---

A social sharing card for each page without an image of its own (home, CV, articles and slides lists): the page's title, the author and the site, in @dume/ds's colors and fonts, taken as `/og/<slug>.png` at deploy time. Every sharing image gets its alternative text (`og:image:alt`): `ogImageAlt` in the front matter, the article image's own, or the card's text.
