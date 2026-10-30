# simon.duhem.fr

Site personnel construit avec [Eleventy](https://www.11ty.dev/) : page de présentation et liste des articles et des conférences.

## Développement

```sh
pnpm --filter "simon.duhem.fr^..." build # compile les dépendances du site (script d'IApostrophe)
pnpm --filter simon.duhem.fr start
```

## Accessibilité

Depuis la racine du dépôt, qui construit d'abord le site et ses dépendances (turbo) :

```sh
pnpm test:a11y
```

`tests/site.test.a11y.js` audite avec [axe-core](https://github.com/dequelabs/axe-core) toutes les pages HTML de `_site` (le sitemap n'a pas les articles publiés d'abord ailleurs), plus les présentations du `sitemap.xml`, en thème clair et sombre, selon les critères WCAG 2.2 A et AA. Les présentations Marp en font partie : `test:a11y` les génère d'abord dans `apps/slides/dist/a11y` avec le modèle `bare`, où toutes les diapositives sont visibles (`pnpm --filter slides a11y:html`).

Il applique aussi les règles qu'axe rattache au RGAA 4 (tag `RGAAv4`, qui ajoute notamment `region` et `skip-link`) et à l'EN 301 549, et indique le critère RGAA de chaque violation. Une ressource locale introuvable (image, feuille de style…) fait aussi échouer le test : une image cassée n'a pas de contenu visible, même avec un `alt`. Le RGAA 5, attendu fin 2026, devrait reposer sur les WCAG 2.2 et l'EN 301 549 : ces tags le couvrent déjà, dans la limite de ce qu'un outil automatique peut vérifier.

Il audite aussi deux états de la page IApostrophe qu'un simple chargement ne montre pas : la zone de test remplie, et la page surlignée par le bookmarklet. axe ne vérifie pas le contraste d'un caractère isolé, ni celui des styles `::highlight()` : le test calcule donc lui-même le contraste de chaque couleur de surlignage (4,5:1 au moins).

Le workflow « Accessibility » le lance sur chaque PR qui touche le site, IApostrophe ou les slides.

## IndexNow

Après chaque déploiement, le workflow « Deploy all apps to GitHub Pages » envoie les URL du `sitemap.xml` à [IndexNow](https://www.indexnow.org/), qui prévient Bing, Yandex, Seznam, Naver et Yep. Google n'utilise pas IndexNow : il passe par Search Console.

La clé n'est pas secrète : les moteurs la vérifient avec le fichier `public/<clé>.txt`, publié à la racine du site. Pour la changer, remplacer ce fichier et la variable `INDEXNOW_KEY` du workflow. Les URL reçues sont visibles dans Bing Webmaster Tools, section IndexNow.

## Données

Les pages ne font qu'afficher : tout ce qui se calcule est fait dans `_data/`.

- `_data/metadata.js` : le site et son auteur, la seule source du nom, du titre de poste, de l'accroche et des liens (`author.contacts` : e-mail, site, GitHub, LinkedIn, avec leur adresse écrite en clair).
- `_data/cv.js` : le CV en français et en anglais (adresse de la page et du PDF, titre, description, compétences, postes, formation, langues, textes fixes de la page). Un texte qui change d'une langue à l'autre s'écrit `{ fr, en }`, le reste est commun ; le fichier donne une version complète par langue (`cv.fr`, `cv.en`, `cv.versions`).
- `_data/i18n.js` : les textes de l'interface du layout (lien d'évitement, navigation, pied de page) et la locale Open Graph, par langue. Une page dans une autre langue que le site le dit dans ses données (`lang`) ; ses versions dans chaque langue vont dans `alternates`, pour les liens `hreflang`.
- `_data/person.js` : l'auteur pour les données structurées (JSON-LD), construit depuis `metadata.js` et `cv.js` : la même personne sur l'accueil, le CV et comme auteur des articles.
- `_data/talks.js` : les conférences, lues dans le front matter des présentations.
- `_data/assets.js` : l'adresse de la feuille de style et des scripts, avec une version tirée de leur contenu (`/ds/styles.css?v=…`) : après un déploiement, un navigateur ne garde pas l'ancienne feuille de style en cache avec une nouvelle page.

## CV

Le CV existe en français, `/cv/`, et en anglais, `/en/cv/`, chaque page renvoyant vers l'autre. `content/cv/index.njk` génère les deux (pagination sur `cv.versions`) depuis `_data/cv.js` : son adresse et celle du PDF, sa description, les compétences, les langues, les postes et la formation. Le profil est l'accroche de la page d'accueil (`intro` de `_data/metadata.js`). Les conférences s'y ajoutent seules, chacune dans sa dernière édition, et les articles quand leur front matter a `onCv: true`, en une seule liste du plus récent au plus ancien. Le lien d'un article mène à sa publication d'origine (`origin`) s'il en a une, sinon à sa page sur le site. Pas de téléphone ni d'adresse postale : la page et le PDF sont publics. Aucun lien du site n'y mène pour l'instant : la page n'est que dans le sitemap et llms.txt. La personne des données structurées (`_data/person.js`) prend dans le CV l'entreprise du poste en cours, les écoles et les langues.

Les PDF, `/cv/simon-duhem-cv.pdf` et `/en/cv/simon-duhem-cv-en.pdf`, sont ces pages imprimées par Chromium au déploiement (`scripts/cv-pdf.js`), avec les styles d'impression de @dume/ds : thème clair, une seule colonne, du texte sélectionnable, des titres de section classiques et des dates à chaque poste, pour les ATS. Ils sont balisés (lecteurs d'écran) et ont des signets, puis complétés pour être conformes à PDF/UA-1, la norme d'accessibilité des PDF, par `@dume/pdf-ua` (`packages/pdf-ua`). Le workflow Accessibility les valide avec veraPDF à chaque PR. En local :

```sh
pnpm --filter "simon.duhem.fr..." build
pnpm --filter simon.duhem.fr cv:pdf
# La validation PDF/UA-1, avec Docker
docker run --rm -v "$PWD/apps/simon.duhem.fr/_site:/data" verapdf/cli:v1.30.3 --flavour ua1 --format text --verbose --loglevel 0 /data/cv/simon-duhem-cv.pdf /data/en/cv/simon-duhem-cv-en.pdf
```

Chacun doit tenir sur deux pages : après avoir modifié le CV, vérifier le nombre de pages des deux PDF.

## Images de partage

Chaque page, hors la 404, a son image de partage (`og:image`) et son texte alternatif (`og:image:alt`), calculés dans `_data/eleventyComputed.js` :

1. l'image `ogImage` du front matter, relative à la page, avec son texte `ogImageAlt` (le titre sinon) ;
2. sinon, pour un article, sa première image, redimensionnée à 1200 px de large, avec son texte alternatif ;
3. sinon, une carte au titre de la page, avec le nom, le titre de poste et l'adresse du site, aux couleurs et dans les polices de @dume/ds : `content/og/cards.11ty.js` en fait une page de 1200 x 630 (`/og/<slug>.html`), dont `scripts/og-images.js` prend la capture (`/og/<slug>.png`) avant de la supprimer. Le déploiement le lance après le build. En local :

```sh
pnpm --filter "simon.duhem.fr..." build
pnpm --filter simon.duhem.fr og:images
```

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
