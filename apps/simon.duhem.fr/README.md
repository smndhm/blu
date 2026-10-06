# simon.duhem.fr

Site personnel construit avec [Eleventy](https://www.11ty.dev/) : page de présentation et liste des articles et des conférences.

## Développement

```sh
pnpm --filter simon.duhem.fr start
```

## Structure

- `content/index.njk` : page d'accueil.
- `content/articles/` : un dossier par article (`index.md` + images).
- `content/articles/index.njk` : liste des articles et des conférences ; les conférences sont lues depuis le front matter des présentations de `apps/slides/src` (voir `_data/talks.js`).
- `content/slides/index.njk` : liste des conférences uniquement.

Les slides elles-mêmes sont générées par [Marp](https://marp.app/) au déploiement et copiées dans `/slides/`.
Pour qu'une présentation apparaisse dans la liste, son front matter doit contenir un champ `event` :

```yaml
title: Les Web Components et l'accessibilité
event: Paris Web
date: 2025-09-26
url: https://www.paris-web.fr/2025/conference/les-web-components-et-laccessibilite
```
