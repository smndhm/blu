---
tags: posts
title: Prendre en compte les Web Components dans vos scripts
date: 2025-12-09
description: 'Le shadow DOM isole le contenu des Web Components, au point que certains scripts ne le voient plus. Voici comment adapter vos scripts pour le parcourir.'
origin: { title: 24 jours de web, href: https://www.24joursdeweb.fr/2025/prendre-en-compte-les-web-components-dans-vos-scripts }
ogImage: og.png
layout: 'layouts/post.njk'
---

Les <span lang="en">Web Components</span> sont de plus en plus présents dans nos interfaces. Des <span lang="en">design systems</span> populaires comme <span lang="en">Carbon</span> d’IBM, <span lang="en">Spectrum</span> d’Adobe ou encore Polaris de <span lang="en">Shopify</span> ont aussi pris le parti de les utiliser pour leurs composants. Ce choix répond souvent à une volonté d’être agnostique, c’est-à-dire de proposer des éléments réutilisables quel que soit l’écosystème utilisé&nbsp;: React, Vue, Angular, ou même sans <span lang="en">framework</span>.

Techniquement, un <span lang="en">Web Component</span> repose sur trois autres standards&nbsp;: les <span lang="en">custom elements</span><sup>[1](https://developer.mozilla.org/fr/docs/Web/API/Web_components/Using_custom_elements "Utilisation d'éléments personnalisés sur MDN.")</sup> qui permettent de définir de nouvelles balises&nbsp;; les <span lang="en">HTML templates</span><sup>[2](https://developer.mozilla.org/fr/docs/Web/API/Web_components/Using_templates_and_slots 'Utiliser les éléments template et slot sur MDN.')</sup> qui servent de base à leur structure&nbsp;; et le <span lang="en">shadow DOM</span><sup>[3](https://developer.mozilla.org/fr/docs/Web/API/Web_components/Using_shadow_DOM 'Utiliser le DOM d’ombre sur MDN.')</sup> qui encapsule et isole le style et la logique interne du composant.

Cette isolation est une force, elle garantit qu’un composant ne sera pas impacté par les styles externes. Mais elle complique également la tâche des scripts qui veulent interagir avec le contenu encapsulé.

Lors de ma conférence «&nbsp;<cite>[Les <span lang="en">Web Components</span> et l’accessibilité](https://www.paris-web.fr/2025/conference/les-web-components-et-laccessibilite)</cite>&nbsp;» à Paris Web, j’ai évoqué le fait que certains outils d’accessibilité ne détectent pas les éléments présents dans le <span lang="en">shadow DOM</span>.  
Plusieurs personnes m’ont ensuite demandé comment faire pour corriger ça dans leurs propres scripts. Cet article est l’occasion d’y répondre plus en détail.

## Les particularités du <span lang="en">shadow DOM</span>

Le contenu d’un <span lang="en">Web Component</span> n’est pas directement accessible avec des sélecteurs habituels comme `document.querySelector`.
Pour accéder au contenu d’un <span lang="en">Web Component</span>, il faut d’abord cibler l’élément, puis explorer son `shadowRoot`&nbsp;:

```js
// Pour accéder au shadow DOM du custom element <24-jours-de-web>
const element = document.querySelector('24-jours-de-web');
const shadow = element.shadowRoot;
```

Mais attention, cela ne fonctionne que si le <span lang="en">shadow DOM</span> a été créé en mode `open`. En mode `closed` le contenu restera inaccessible<sup>[4](https://developer.mozilla.org/fr/docs/Web/API/Web_components/Using_shadow_DOM#element.shadowroot_et_loption_%C2%AB_mode_%C2%BB "`Element.shadowRoot` et l'option « mode » sur MDN.")</sup>.

Dans la suite de l’article, nous partirons donc du principe que les composants utilisent un <span lang="en">shadow DOM</span> `open`.

## Parcourir les <span lang="en">Web Components</span> dans un script

Pour illustrer la prise en compte des <span lang="en">Web Components</span> dans vos scripts, partons d’un cas simple&nbsp;: récupérer tous les champs `<input/>` présents dans une page.

### Le cas classique

Quand aucun <span lang="en">Web Component</span> n’est utilisé, les éléments sont directement présents dans le DOM principal.
Dans ce contexte, un sélecteur CSS classique suffit&nbsp;:

```js
const inputs = document.querySelectorAll('input');
```

### Avec des <span lang="en">Web Components</span>

Les choses se compliquent lorsque des `input` se retrouvent encapsulés dans un <span lang="en">shadow DOM</span>.
Dans ce cas, `document.querySelectorAll('input')` ne les verra pas.

Pour résoudre le problème, il faut d’abord être capable d’identifier les <span lang="en">Web Components</span> présents dans la page.

#### Identifier les <span lang="en">Web Components</span>

Pour éviter les conflits avec les balises HTML natives, le nom d’un <span lang="en">Custom Element</span> doit obligatoirement contenir un tiret (`-`).
C’est une règle du standard et c’est aussi un moyen simple et fiable de les détecter.

```js
const findCustomElements = () => {
  // On recherche tous les éléments de la page
  return [...document.querySelectorAll('*')].filter(elm => {
    // On ne retourne que ceux dont la balise contient un tiret
    return elm.tagName.includes('-');
  });
};
```

Cette fonction renvoie tous les <span lang="en">Web Components</span> présents dans le DOM principal mais pas leur contenu, qui reste encapsulé dans leur `shadowRoot`.

#### Parcourir leur <span lang="en">shadow DOM</span>

Une fois un <span lang="en">Custom Element</span> détecté, il faut vérifier qu’il possède un <span lang="en">shadow DOM</span>, puis s’assurer qu’il est en mode `open`, condition indispensable pour y accéder depuis un script externe&nbsp;:

```js
const findInputsInShadow = element => {
  // Si pas de shadowRoot (ou en mode closed), on s’arrête là
  if (!element.shadowRoot) return [];
  // À partir d’ici, on peut interroger librement le contenu du shadow DOM
  return [...element.shadowRoot.querySelectorAll('input')];
};
```

Cette approche fonctionne, mais uniquement à un niveau d’imbrication.

C’est une situation plutôt courante, un composant peut en contenir un autre, qui lui-même en contient un autre, etc. Et chacun possède potentiellement son propre <span lang="en">shadow DOM</span>.
Il faut donc répéter ce travail à chaque niveau, ce qui impose une approche récursive.

### Récupérer tous les `input`, dans le DOM et dans tous les <span lang="en">shadow DOM<span>

Pour couvrir tous les cas, il faut récupérer les champs présents dans le DOM principal et ceux encapsulés dans les <span lang="en">shadow DOM</span> accessibles.
On peut commencer par écrire une première fonction capable de descendre dans tous les niveaux d’imbrication&nbsp;:

```js
const findAllInputs = (root = document) => {
  // Inputs visibles à ce niveau du DOM
  const inputs = [...root.querySelectorAll('input')];

  // Web Components présents à ce même niveau
  const customElements = findCustomElements(root);

  // Pour chaque Web Component, on accède au shadowRoot
  for (const element of customElements) {
    if (!element.shadowRoot) continue;
    inputs.push(...findAllInputs(element.shadowRoot));
  }
  return inputs;
};
```

Cette première étape permet déjà de retrouver tous les `input` de la page, même ceux encapsulés dans des <span lang="en">Web Components</span>.
Mais on peut aller plus loin et généraliser le principe, pourquoi se limiter aux champs&nbsp;?

### Vers un `deepQuerySelectorAll()`

L’idée suivante découle assez naturellement, écrire un équivalent de `document.querySelectorAll()`, mais capable de traverser tous les <span lang="en">Shadow DOM</span>, quels que soient leur profondeur ou leur nombre.

La structure va être la même que précédemment, mais on remplace simplement le sélecteur `'input'` par n’importe quel sélecteur CSS passé en paramètre&nbsp;:

```js
const deepQuerySelectorAll = (selector, root = document) => {
  // Éléments trouvés dans le DOM courant
  const results = [...root.querySelectorAll(selector)];

  // Détection des Custom Elements déjà écrite plus haut
  const customElements = findCustomElements(root);

  // On explore chaque Shadow DOM accessible
  for (const el of customElements) {
    if (!el.shadowRoot) continue;
    results.push(...deepQuerySelectorAll(selector, el.shadowRoot));
  }

  return results;
};
```

Avec cette nouvelle fonction, on peut par exemple récupérer tous les boutons d’une page, y compris ceux encapsulés dans le <span lang="en">Shadow DOM</span>. Exactement comme on le ferait naturellement avec `document.querySelectorAll()`.

```js
const buttons = deepQuerySelectorAll('button');
```

### Et le `querySelectorDeep()`&nbsp;?

La suite logique serait de proposer l’équivalent de `document.querySelector()`, qui s’arrête au premier résultat.
Je ne vais pas m’attarder dessus, le principe est le même et je pense que l’idée générale est désormais claire.

Pour rendre tout cela plus pratique, j’ai regroupé ces fonctions dans une petite librairie dédiée&nbsp;: [@dume/webcomp-utils](https://www.npmjs.com/package/@dume/webcomp-utils).

Voici à quoi cela ressemble&nbsp;:

```js
import { deepQuerySelectorAll, deepQuerySelector } from '@dume/webcomp-utils';

const emailInput = deepQuerySelector('#email');
const fields = deepQuerySelectorAll('.field');
```

## Conclusion

Maintenant que vous avez toutes les clés pour parcourir les <span lang="en">Web Components</span>, n’oubliez pas qu’un <span lang="en">shadow DOM</span> n’est accessible que s’il est en mode `open`. En `closed` son contenu reste totalement isolé et aucun script extérieur ne pourra le toucher.

L’isolation apportée par le <span lang="en">shadow DOM</span> est volontaire, elle protège le composant et garantit qu’il ne sera pas perturbé par des styles ou scripts externes. Les fonctions que nous avons vues permettent d’accéder au contenu encapsulé, mais elles ne sont pas destinées à le modifier. Utilisez-les avec précaution.

Avec ces outils en main, vous pouvez désormais aller mettre à jour vos scripts et interagir avec vos <span lang="en">Web Components</span> comme si l’encapsulation n’existait pas. <span role="img" aria-label="clin d’œil">😉</span>
