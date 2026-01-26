---
tags: posts
title: "Simplifier l'intégration des icônes depuis Figma : De la conception au design system"
date: 2024-02-19
origin: { href: https://dev.to/mgdis/simplifier-lintegration-des-icones-depuis-figma-de-la-conception-au-design-system-f9j, title: dev.to }
ogImage: og.webp
layout: 'layouts/post.njk'
---

## Introduction

Les icônes jouent un rôle crucial dans un design system, mais leur intégration peut être un processus fastidieux.

L'équipe Core UI de MGDIS se compose de deux développeurs frontend, deux designers et un alternant designer qui partagent leur temps entre le produit et le design system. Les designers créent les maquettes et les composants sur Figma, tandis que les développeurs travaillent sur un monorepo organisé en différents packages pour les composants, les styles, les images, etc.

Pour ajouter une seule icône à la bibliothèque du design system, le designer la concevait sur Figma, l'exportait au format SVG pour l'ajouter au ticket Jira. Ensuite, l'équipe de développement devait intervenir : télécharger l'icône, la nettoyer, ajouter les attributs nécessaires et mettre à jour les tests. Cette chaîne de tâches fastidieuses nous a poussés à chercher une solution pour automatiser le processus, de la conception à l'intégration dans le design system.

## A la découverte de l'API de Figma

Parmi les différentes API proposées par Figma, c'est l'API REST qui va nous intérésser. Elle va nous permettre d'acceder au fichier Figma, d'en extraire les propriétés et récupérer les images.

La documentation de l'API REST de Figma s'est avérée plutôt claire, et nous avons commencé par générer un access token. Bien qu'il soit possible d'en générer un automatiquement depuis la documentation, il est important de noter que celui-ci est programmé pour ne durer qu'une journée. Il vaut donc mieux [suivre les instructions](https://www.figma.com/developers/api#access-tokens) pour obtenir un access token qui n'expire pas.

![Ecran de création d'un access token](./1.png)

Dans notre cas, le seul scope dont nous avions besoin était "File content" en lecture seule. Avec l'access token en main, nous pouvons maintenant explorer les différents endpoints de la partie "Files" de l'API.

### Endpoints

La partie "Files" de l'API propose [quatre endpoints](https://www.figma.com/developers/api#files-endpoints) :

- `file` : pour avoir des informations sur l'ensemble d'un fichier,
- `file nodes` : pour avoir des informations sur des nœuds spécifiques,
- `image` : pour avoir des rendus d'images à partir d'un fichier,
- `image fills` : pour avoir des liens de téléchargement pour les images présentes dans le document Figma.

Pour utiliser ces endpoints, l'access token doit être inclus dans l'en-tête des appels, en utilisant la clé `X-FIGMA-TOKEN`.

Deux paramètres nous intéressent ici, l'identifiant du document `:key` et l'id de la page `:ids` où sont les icônes que nous souhaitons importer.
Pour l'URL suivante `https://www.figma.com/file/blubliblobla/Design-System-MGDIS?node-id=16:64` nous aurons `:key` qui vaut `blubliblobla` et `:ids` qui vaut `16:64`.

Pour accéder aux informations du document, nous avons choisi le `file` endpoint avec l'utilisation du paramètre `ids`, permettant de cibler la page contenant les icônes souhaitées. Avec ce paramètre la réponse est passée de 22 Mo à 400 Ko et nous permet de nous assurer que seules les icônes nécessaires sont renvoyées. Bien que le `file nodes` endpoint aurait pu être une alternative, nous avons préféré la structure de réponse du `file` endpoint.

```sh
curl -H 'X-FIGMA-TOKEN: figd_blublu' 'https://api.figma.com/v1/files/blubliblobla?ids=16:64'
```

```json
{
  "document": {
    "id": "0:0",
    "name": "Document",
    "type": "DOCUMENT",
    "scrollBehavior": "SCROLLS",
    "children": []
  },
  "components": {
    "544:5714": {
      "key": "0b2def94349533e0123459c6c5484868b03b7249",
      "name": "Fill=true",
      "description": "",
      "remote": false,
      "componentSetId": "544:5715",
      "documentationLinks": []
    },
    "544:5713": {
      "key": "f6e9220714ce66f47d259a6df2b638214daa0ad5",
      "name": "Fill=false",
      "description": "",
      "remote": false,
      "componentSetId": "544:5715",
      "documentationLinks": []
    }
  },
  "componentSets": {
    "544:5715": {
      "key": "cf0c91d6be16254a549f0e66e3d482e6e0f99769",
      "name": "briefcase",
      "description": "",
      "documentationLinks": []
    }
  },
  "styles": {},
  "name": "Design System MGDIS",
  "lastModified": "2024-02-15T13:43:30Z",
  "thumbnailUrl": "",
  "version": "",
  "role": "viewer",
  "editorType": "figma",
  "linkAccess": "view"
}
```

Les propriétés qui nous intéressent dans la réponse sont `components` et `componentSets`. Toutes nos icônes se trouvent sous `components` et peuvent exister en deux variantes : "pleine" (fill) ou "contour" (outline). Nous utiliserons le `componentSetId` pour retrouver le nom du fichier final avec les `componentSets`.

Maintenant, nous pouvons utiliser le `image` endpoint pour obtenir les liens de téléchargement de nos icônes au format SVG en fournissant `:key`, les `:ids` des composants icônes et le `format` souhaité.

```sh
curl -H 'X-FIGMA-TOKEN: figd_blublu' 'https://api.figma.com/v1/images/blubliblobla?ids=544:5714,544:5713&format=svg'
```

```json
{
  "err": null,
  "images": {
    "544:5714": "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/...",
    "544:5713": "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/..."
  }
}
```

Nous sommes désormais prêts à passer à la partie code !

## Script

En résumé, le script doit :

- Utiliser le `file` endpoint pour récupérer la liste des composants icônes.
- Utiliser le `image` endpoint pour obtenir les liens des fichiers images.
- Télécharger les images.

Voici le premier script fonctionnel que nous avons réalisé :

```js
// Utilisation d'Axios pour les appels API, fs pour écrire les fichiers téléchargés.
const axios = require('axios');
const { writeFile } = require('fs').promises;

// Création d'une instance Axios pour les appels API.
const instance = axios.create({
  baseURL: 'https://api.figma.com/v1/',
  headers: { 'X-FIGMA-TOKEN': 'figd_blublu' },
});

(async () => {
  try {
    // Document et node Figma où l'on souhaite récuperer les icônes.
    const figmaFileKey = 'blubliblobla';
    const figmaNodeId = '16:64';

    // Appel du `file endpoint` pour obtenir les composants icônes.
    const { data: dataFileEndpoint } = await instance.get(`files/${figmaFileKey}`, { params: { ids: figmaNodeId } });

    // Récuperation des ids des nodes components.
    const nodeComponentsIds = Object.keys(dataFileEndpoint.components);

    // Appel du `images endpoint` pour obtenir les liens de téléchargement des images.
    const { data: dataImageEndpoint } = await instance.get(`files/${figmaFileKey}`, { params: { ids: nodeComponentsIds.join(','), format: 'svg' } });

    // Pour chaques liens images présents dans la réponse :
    for (const [id, url] of Object.entries(dataImageEndpoint.images)) {
      // On récupère le nom de fichier.
      let filename = dataFileEndpoint.components[id].name;
      // Les composants avec une variante dépendent d'un componentSet.
      if (dataFileEndpoint.components[id].componentSetId) {
        // Dans ce cas c'est lui qui porte le bon nom de fichier.
        filename = dataFileEndpoint.componentSets[componentSetId].name;
        // Et il faut différencier en fonction du variant défini
        if (dataFileEndpoint.components[id].name === 'Fill=false') {
          filename += '-outline';
        }
      }

      // On télecharge l'image SVG.
      const { data: svgSrc } = await instance.get(url);

      // Et on termine par l'écrire.
      writeFile(`icons/${filename}.svg`, svgSrc, err => {
        if (err) {
          console.error(err);
          return;
        }
      });
    }
  } catch (error) {
    console.log('ERROR', error);
  }
})();
```

Ce script nous a permis de rapidement valider la mécanique et est actuellement intégré à notre monorepo, avec quelques ajustements, notamment pour formater et optimiser les SVG téléchargés avant de les enregistrer.

## Formatage des SVGs téléchargés

Les icônes sont importées telles quelles avec une couleur prédéfinie, généralement en noir. Cependant, nous souhaitons permettre la surcharge de cette couleur. Pour y parvenir, nous devons modifier le code téléchargé avant d'enregistrer le SVG.

Nous avons opté pour l'utilisation de la bibliothèque [jsdom](https://www.npmjs.com/package/jsdom) afin de manipuler le DOM et de remplacer les valeurs de couleur par `currentColor`. Cette méthode offre la possibilité de personnaliser facilement la couleur des icônes via CSS.

```js
// Utilisation de la bibliothèque JSDOM
import { JSDOM } from 'jsdom';

// Création d'un objet JSDOM avec le contenu du SVG téléchargé
const { window } = new JSDOM(svgSrc, { contentType: 'image/svg+xml' });
const { document } = window;

// Modification de tous les attributs fill dont la valeur n'est pas "none"
const pathElements = document.querySelectorAll('[fill]:not([fill="none"])');
pathElements.forEach(pathElement => {
  pathElement.setAttribute('fill', 'currentColor');
});

// Modification de tous les attributs stroke
const strokeElements = document.querySelectorAll('[stroke]');
strokeElements.forEach(pathElement => {
  pathElement.setAttribute('stroke', 'currentColor');
});

// Le document contient maintenant le SVG modifié
```

Le SVG étant maintenant formaté, la prochaine étape consiste à l'optimiser avant de l'enregistrer. Pour cela, nous avons utilisé [svgo](https://www.npmjs.com/package/svgo), une bibliothèque spécialisée dans la compression des images SVG.

```js
// Utilisation de la bibliothèque svgo
import { optimize } from 'svgo';

// Optimisation du SVG
const optimizedSVG = optimize(document.documentElement.outerHTML).data;

// Nous pouvons maintenant enregistrer l'icône.
```

En combinant ces méthodes, nous avons automatisé le processus d'importation des icônes depuis Figma, garantissant ainsi leur préparation pour une utilisation dans nos applications. Le script final que nous utilisons aujourd'hui est disponible [sur notre monorepo](https://github.com/MGDIS/core-ui/blob/master/packages/img/src/tools/import-figma.ts).

## Limites de l'automatisation

Bien que l'importation automatisée des SVGs soit désormais gérée par le package dédié aux images, certaines étapes requièrent toujours une intervention manuelle.

Par exemple, une fois les icônes importées, le package des composants doit mettre à jour sa liste pour refléter les nouvelles icônes disponibles. Cette mise à jour est généralement effectuée lors du processus de build. Cependant, en raison de notre volonté de fournir une couverture de tests complète, chaque nouvelle icône nécessite la création de snapshots Jest et de captures d'écran Playwright. De même, lorsqu'une icône existante est modifiée, il est nécessaire de mettre à jour ces snapshots et captures d'écran, ainsi que ceux des composants utilisant ces icônes.

Cette étape manuelle reste nécessaire car elle permet de vérifier visuellement que les icônes sont conformes aux attentes. Le script d'import des icônes est donc également exécuté manuellement.

## Conclusion

Nous avons considérablement amélioré notre processus en simplifiant l'intégration des icônes dans notre design system. En utilisant l'API de Figma et des outils comme jsdom et svgo, nous avons automatisé plusieurs étapes, ce qui nous a fait gagner un temps précieux.

Notre travail ne va pas s'arrêter là. Nous souhaitons maintenant poursuivre dans cette direction en exploitant davantage les possibilités offertes par Figma. Les prochaines étapes seront certainement de faire la même chose pour l'importation des illustrations, puis celle des variables.

Vous pouvez explorer notre collection complète d'icônes et de composants dans [notre Storybook](https://mgdis.github.io/core-ui/?path=/docs/style-icons--docs).
