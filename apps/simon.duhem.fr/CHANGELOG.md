# simon.duhem.fr

## 2.2.0

### Minor Changes

- fb2c2e2: The CV in English, `/en/cv/`, and its PDF, `/en/cv/simon-duhem-cv-en.pdf`, printed at deploy time as the French one. `_data/cv.js` writes each text that differs `{ fr, en }` and gives a complete version per language; `content/cv/index.njk` renders both, each linking to the other, the pages naming each other with `hreflang`. The layout speaks the page's language (`lang`): its interface texts and Open Graph locale come from `_data/i18n.js`. The English page marks the French titles of the talks and articles. Both pages are in the sitemap and llms.txt.
- c96412f: A CV page, `/cv/`, only in the sitemap and llms.txt for now (no link on the site), from `_data/cv.js` and the home page's introduction: profile, skills, languages, positions with their dates and places, talks and articles published elsewhere, education. Its PDF, `/cv/simon-duhem-cv.pdf`, is the page printed by Chromium at deploy time (`scripts/cv-pdf.js`): one column of selectable text with plain section headings, for applicant tracking systems (ATS), tagged and with an outline, on two pages. No phone number nor postal address. The structured data's person (JSON-LD), built in `_data/person.js` and the same on the home page, the CV and as the articles' author, gets the CV's current employer, schools and languages. Templates only display: the author's contact links, written out, come from `_data/metadata.js`, the CV's title from `_data/cv.js`.
- 76ab9b7: A social sharing card for each page without an image of its own (home, CV, articles and slides lists): the page's title, the author and the site, in @dume/ds's colors and fonts, taken as `/og/<slug>.png` at deploy time. Every sharing image gets its alternative text (`og:image:alt`): `ogImageAlt` in the front matter, the article image's own, or the card's text.

### Patch Changes

- 02b8af4: The stylesheet and the scripts are linked with a version made from their content (`/ds/styles.css?v=…`, `_data/assets.js`): after a deployment, a browser no longer shows a new page with the stylesheet it had cached.
- 55e2cbf: The CV lists the articles whose front matter has `onCv: true`, instead of every article published elsewhere first: the three already there keep their place. An article published on the site only links to its page, "simon.duhem.fr" as its publication. Talks and articles make one list, the most recent first. The side projects' articles, Music Bridge and LSLT Pebble Watchface, join the CV.
- 432402b: The CV's current position as on LinkedIn: the design system within the Core UI team, the front-end architecture and best practices for consistent, high-quality and accessible products; no team size.
- 5244264: The CV's PDFs completed by @dume/pdf-ua, the links described from the PDF itself.
- 5bdeb4d: Les PDF du CV sont conformes à PDF/UA-1, la norme d'accessibilité des PDF, et validés avec veraPDF à chaque PR.
- 92d3550: The sharing cards take their whole width: no room kept for a scrollbar, so the band on top reaches the right edge.

## 2.1.1

### Patch Changes

- d21bbd2: Article Music Bridge : Korben en parle
- 05c7f7f: The button is filled with the primary color, and outlined with `--outline`, for a secondary action or a button within the text (IApostrophe's bookmarklet); its text in the text's weight; on a `<button>`, no background nor font of the browser's.
- 75ebb28: @dume/ds: my design system, the design tokens shared by my projects (colors, light and dark, fonts, font sizes, spacing, radius, focus ring) as CSS custom properties, the heading font (Bricolage Grotesque), modern-normalize and a base styling HTML elements without classes, a visually hidden utility, page and cluster layouts and its first components (button, field, skip link, header, footer, links, post list, post, post nav, code): plain CSS, colors in light-dark(), logical properties, in cascade layers, all of it in one stylesheet, styles.css. simon.duhem.fr takes all its style from it, loading styles.css, which its Eleventy configuration copies as /ds/: it has no stylesheet of its own anymore; the IApostrophe page neither. The list of articles and talks shows their descriptions. The 404 page just says "Non". The IApostrophe tester's highlight colors come from its script, as the bookmarklet's.
- 294cd87: simon.duhem.fr loads the heading-anchors web component as a file, on articles only, copied by Eleventy like the design system: no JavaScript bundle anymore.
- 75ebb28: Apostrophes typed on a keyboard in The Remote Tribe talk's title and description, and in the feed's subtitle.
- f033c14: Updated dependency `@11ty/eleventy-img` to `7.1.0`.
- d962800: Updated dependency `@11ty/eleventy-img` to `7.1.1`.
- 6f6171a: Updated dependency `@dume/dev-config` to `1.4.0`.

## 2.1.0

### Minor Changes

- cda767a: Nouvel article : Music Bridge
- b1574aa: La page IApostrophe est intégrée au site et reprend son thème ; le paquet ia-postrophe ne fournit plus que le script de l'outil
- f708781: SEO et robots IA : robots.txt qui autorise tous les robots, balise canonical, données structurées schema.org (profil sur l'accueil, BlogPosting sur les articles), description propre à chaque article, présentations dans le sitemap (dont les dates `lastmod` sont désormais au format ISO) et résumé du site dans `/llms.txt`. Les présentations Marp déclarent leur propre adresse comme canonical, le lien vers l'événement passe dans `eventUrl`.

### Patch Changes

- 37a28d7: Article Music Bridge : Odesli guidé sur l'API de Deezer
- 0481104: Articles publiés d'abord sur dev.to et 24 jours de web : l'URL canonique pointe vers la publication d'origine, et ils sortent du sitemap. Le test d'accessibilité audite toutes les pages de `_site`, plus seulement celles du sitemap.
- 2b5da75: Animation de la page d'accueil optimisée : rafraîchie au rythme de l'écran et mise en pause quand le pointeur quitte la page ou que l'onglet est masqué.
- 7ad1d4e: Descriptions des présentations Marp raccourcies sous 160 caractères. Description du site raccourcie à 130 caractères pour la balise meta, le partage et les données structurées ; l'intro de la page d'accueil ne change pas. Description de l'article sur les Web Components dans les scripts raccourcie sous 160 caractères. Slides : textes alternatifs des liens-icônes (ils n'avaient pas de nom accessible), des pictos et des captures du bouton Envoyer. Liens soulignés dans le deck The Remote Tribe. Le test d'accessibilité audite aussi les présentations. Il audite aussi la zone de test d'IApostrophe remplie et le surlignage du bookmarklet, et vérifie le contraste des couleurs de surlignage. Le test d'accessibilité applique aussi les règles axe du RGAA 4 et de l'EN 301 549, et indique le critère RGAA de chaque violation. Deck The Remote Tribe : pictogramme du lien MGDIS (repris de @mgdis/img) et capture du rendu du Custom Element, qui manquaient. Le test d'accessibilité signale aussi les ressources introuvables.
- e86d489: Favicon : suppression de `icon.svg`, une photo de 7,9 Mo dans un SVG, que les navigateurs préféraient au `favicon.ico`.
- c84ccd0: Flux des articles : l'avatar en 512 px comme icône, plutôt que le favicon agrandi dans Feedly.
- 666d834: Flux des articles : WebSub, les lecteurs abonnés (Feedly...) reçoivent les nouveaux articles dès le déploiement.
- 2b5da75: Corrige le build cassé par zod 4.6 : le champ `draft` du front matter est de nouveau optionnel.
- 53ca730: IndexNow : après chaque déploiement, les URL du sitemap sont envoyées à Bing, Yandex, Seznam, Naver et Yep. Fichier de clé publié à la racine du site.
- 45c3170: Page Articles : intro simplifiée en « Articles et slides. »
- c9cb8b8: JavaScript linted with oxlint, and the accessibility audit with `@dume/dev-config/a11y`, which adds axe's best practices to WCAG 2.2, RGAA 4 and EN 301 549.
- e72267b: Updated dependency `@11ty/eleventy-img` to `7.0.0`.
- 641182a: Updated dependency `zod` to `4.6.6`.
- cc63765: Updated dependency `zod` to `4.6.7`.
- 5485d62: Updated dependency `@11ty/eleventy` to `3.1.7`.
- 4e6708e: Updated dependency `@11ty/eleventy` to `3.1.6`.
- c2ad3fc: Updated dependency `playwright` to `1.64.0`.
- 1975740: Updated dependency `zod` to `4.6.5`.
- 1707024: Updated dependency `playwright` to `1.64.1`.
- a67c9a6: Updated dependency `@axe-core/playwright` to `4.14.0`.
- 9f2922a: Updated dependency `@11ty/eleventy-plugin-rss` to `3.1.0`.
- f708781: Titre de l'accueil plus descriptif ; image de partage des articles sans `ogImage` : leur première image ; balises `og:site_name`, `og:locale` et `twitter:card` ; texte complet des articles dans `/llms-full.txt`. Les tirets longs des titres, du flux et des slides deviennent des tirets simples. Le deck d'exemple Marp n'est plus publié.
- 90e8a52: Le lien d'évitement « Aller au contenu » n'est plus affiché sur la page d'accueil, qui n'a pas d'en-tête à sauter.

## 2.0.1

### Patch Changes

- adf3dbc: Contraste suffisant pour la coloration syntaxique des blocs de code (propriétés et balises) et audit axe automatique de toutes les pages en CI.
- a882df5: Plus de barre de défilement inutile sur la page d'accueil.

## 2.0.0

### Major Changes

- d740884: Refonte du site : la page d'accueil, les articles et les slides des conférences (listées avec les articles et sur /slides/) sont regroupés dans un seul site Eleventy, orienté accessibilité et Web Components.

## 1.0.0

### Major Changes

- 1956680: Import

### Patch Changes

- 423d51d: Updated dependency `sass` to `1.97.3`.
