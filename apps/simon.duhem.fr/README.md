# simon.duhem.fr

Site personnel construit avec [Eleventy](https://www.11ty.dev/) : page de présentation et liste des articles et des conférences.

## Développement

```sh
pnpm --filter "simon.duhem.fr^..." build # compile les dépendances du site (script d'IApostrophe)
pnpm --filter simon.duhem.fr start
```

## Accessibilité

```sh
pnpm --filter "simon.duhem.fr..." build
pnpm --filter simon.duhem.fr test:a11y
```

`tests/a11y.js` audite avec [axe-core](https://github.com/dequelabs/axe-core) toutes les pages du `sitemap.xml` (plus la page 404), en thème clair et sombre, selon les critères WCAG 2.2 A et AA. Les présentations Marp en font partie : `test:a11y` les génère d'abord dans `apps/slides/dist/a11y` avec le modèle `bare`, où toutes les diapositives sont visibles (`pnpm --filter slides a11y:html`).

Il applique aussi les règles qu'axe rattache au RGAA 4 (tag `RGAAv4`, qui ajoute notamment `region` et `skip-link`) et à l'EN 301 549, et indique le critère RGAA de chaque violation. Le RGAA 5, attendu fin 2026, devrait reposer sur les WCAG 2.2 et l'EN 301 549 : ces tags le couvrent déjà, dans la limite de ce qu'un outil automatique peut vérifier.

Il audite aussi deux états de la page IApostrophe qu'un simple chargement ne montre pas : la zone de test remplie, et la page surlignée par le bookmarklet. axe ne vérifie pas le contraste d'un caractère isolé, ni celui des styles `::highlight()` : le test calcule donc lui-même le contraste de chaque couleur de surlignage (4,5:1 au moins).

Le workflow « Accessibility » le lance sur chaque PR qui touche le site, IApostrophe ou les slides.

## Structure

- `content/index.njk` : page d'accueil.
- `content/articles/` : un dossier par article (`index.md` + images).
- `content/articles/index.njk` : liste des articles et des conférences ; les conférences sont lues depuis le front matter des présentations de `apps/slides/src` (voir `_data/talks.js`).
- `content/slides/index.njk` : liste des conférences uniquement.
- `content/ia-postrophe/` : page de l'outil [IApostrophe](../ia-postrophe). Son script est compilé par `apps/ia-postrophe` et copié dans `/js/ia-postrophe.js`.

Les slides elles-mêmes sont générées par [Marp](https://marp.app/) au déploiement et copiées dans `/slides/`.
Pour qu'une présentation apparaisse dans la liste, son front matter doit contenir un champ `event`.
`url` est l'adresse de la présentation sur ce site : Marp s'en sert pour la balise canonical et `og:url`. Le lien vers la page de l'événement va dans `eventUrl` :

```yaml
title: Les Web Components et l'accessibilité
event: Paris Web
date: 2025-09-26
url: https://simon.duhem.fr/slides/paris-web-les-web-components-et-laccessibilite.html
eventUrl: https://www.paris-web.fr/2025/conference/les-web-components-et-laccessibilite
```
