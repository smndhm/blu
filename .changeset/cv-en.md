---
'simon.duhem.fr': minor
---

The CV in English, `/en/cv/`, and its PDF, `/en/cv/simon-duhem-cv-en.pdf`, printed at deploy time as the French one. `_data/cv.js` writes each text that differs `{ fr, en }` and gives a complete version per language; `content/cv/index.njk` renders both, each linking to the other, the pages naming each other with `hreflang`. The layout speaks the page's language (`lang`): its interface texts and Open Graph locale come from `_data/i18n.js`. The English page marks the French titles of the talks and articles. Both pages are in the sitemap and llms.txt.
