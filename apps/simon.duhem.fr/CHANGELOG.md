# simon.duhem.fr

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
