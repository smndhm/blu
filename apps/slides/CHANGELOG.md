# slides

## 1.0.2

### Patch Changes

- 176ca3a: Deck Paris Web : texte alternatif des photos de profil. `![h:200](…)` produisait `alt=""`, car Marp lit `h:200` comme une taille.
- ab58e68: Descriptions des présentations Marp raccourcies sous 160 caractères. Description du site raccourcie à 130 caractères pour la balise meta, le partage et les données structurées ; l'intro de la page d'accueil ne change pas. Description de l'article sur les Web Components dans les scripts raccourcie sous 160 caractères. Slides : textes alternatifs des liens-icônes (ils n'avaient pas de nom accessible), des pictos et des captures du bouton Envoyer. Liens soulignés dans le deck The Remote Tribe. Le test d'accessibilité audite aussi les présentations. Il audite aussi la zone de test d'IApostrophe remplie et le surlignage du bookmarklet, et vérifie le contraste des couleurs de surlignage. Le test d'accessibilité applique aussi les règles axe du RGAA 4 et de l'EN 301 549, et indique le critère RGAA de chaque violation. Deck The Remote Tribe : pictogramme du lien MGDIS (repris de @mgdis/img) et capture du rendu du Custom Element, qui manquaient. Le test d'accessibilité signale aussi les ressources introuvables.
- 716d349: Updated dependency `@marp-team/marp-cli` to `4.5.1`.
- 372c24d: SEO et robots IA : robots.txt qui autorise tous les robots, balise canonical, données structurées schema.org (profil sur l'accueil, BlogPosting sur les articles), description propre à chaque article, présentations dans le sitemap (dont les dates `lastmod` sont désormais au format ISO) et résumé du site dans `/llms.txt`. Les présentations Marp déclarent leur propre adresse comme canonical, le lien vers l'événement passe dans `eventUrl`.
- 372c24d: Titre de l'accueil plus descriptif ; image de partage des articles sans `ogImage` : leur première image ; balises `og:site_name`, `og:locale` et `twitter:card` ; texte complet des articles dans `/llms-full.txt`. Les tirets longs des titres, du flux et des slides deviennent des tirets simples. Le deck d'exemple Marp n'est plus publié.

## 1.0.1

### Patch Changes

- d740884: Refonte du site : la page d'accueil, les articles et les slides des conférences (listées avec les articles et sur /slides/) sont regroupés dans un seul site Eleventy, orienté accessibilité et Web Components.

## 1.0.0

### Major Changes

- 0d0f47b: Import
