---
marp: true
lang: fr
title: Les Web Components et l'accessibilité
description: Les Web Components (composants web) représentent une avancée dans le développement web moderne, permettant la création de composants réutilisables et encapsulés. Cependant, l'utilisation du Shadow DOM introduit des complexités pour garantir l'accessibilité.
author: Simon Duhem & Nicolas Jouanno Daniel
keywords: web Components, composants web, accessibility, accessibilité, a11y
image: https://www.paris-web.fr/media/pages/2025/les-web-components-et-laccessibilite/4734750850-1747341738/ogimage.png
url: https://www.paris-web.fr/2025/conference/les-web-components-et-laccessibilite
footer: Paris Web — Les Web Components et l'accessibilité
paginate: true
theme: paris-web
---

<!--
_class: title
_footer: ''
_paginate: false
-->

# Les Web Components et l'accessibilité

**Paris Web**
26 septembre 2025

<!--
Bonjour à toutes et tous !

Nous allons donc parler de Web Components et d'accessibilité.

Mais nous allons commencer par nous présenter.
-->

---

<!--
header: Intro
_class: profils list-h
-->

## Qui sommes-nous ?

- ![h:200](./assets/paris-web/profil-simon-duhem.jpg)
  **Simon Duhem**
  Architecte front-end
  [![w:24 LinkedIn](./assets/logos/linkedin.svg)](https://www.linkedin.com/in/simonduhem/) [![w:24 GitHub](./assets/logos/github.svg)](https://github.com/smndhm)
- ![h:200](./assets/paris-web/profil-nicolas-jouanno-daniel.svg)
  **Nicolas Jouanno Daniel**
  Lead front-end
  [![w:24 LinkedIn](./assets/logos/linkedin.svg)](https://www.linkedin.com/in/nicolasjouanno/) [![w:24 GitHub](./assets/logos/github.svg)](https://github.com/jn-prod)

<!--
Moi c'est Simon Duhem, architecte front-end.

Et moi c'est Nicolas Jouanno Daniel, lead front-end.
-->

---

<!--
_class: company list-h
-->

## Que faisons-nous ?

- ![''](./assets/pictos/building.svg)
  ![w:150 MGDIS](./assets/logos/mgdis.svg)
  [![w:24](./assets/pictos/link.svg)](https://www.mgdis.fr/)
- ![''](./assets/pictos/user-group.svg)
  Core UI
- ![''](./assets/pictos/color-palette.svg)
  Design System
- ![''](./assets/pictos/code-square-outline.svg)
  mg-components
  [![w:24 GitHub](./assets/logos/github.svg)](https://github.com/MGDIS/core-ui/tree/master) [![w:24 Storybook](./assets/logos/storybook.svg)](https://mgdis.github.io/core-ui/)

<!--
Nous travaillons tous les deux à MGDIS.

1. MGDIS est une entreprise basée à Vannes,
éditeur de logiciels qui travaille principalement pour le secteur public :
les collectivités territoriales, les organismes d'État et les établissements de santé.

Et comme nous travaillons pour le public, nous sommes tenus contractuellement de fournir des produits accessibles.

Mais au-delà de cette obligation, l'accessibilité est un vrai engagement pour nous.

2. Nous travaillons tous les deux dans une équipe nommée Core UI, c'est une équipe transverse qui a pour mission de fournir des outils (UI) pour les équipes de développement.

3. Un de ces outils est un design system.

4. Et les composants de ce design system, que nous appelons les mg-components sont des Web Components.

Notre objectif est de garantir leur accessibilité, pour que l'ensemble de nos produits le soient aussi.
-->

---

<!--
header: ''
_class: title
_footer: ''
_paginate: false
-->

## Les Web Components

<!--
On va maintenant vous expliquer ce que sont les Web Components,
et pourquoi nous avons choisi de les utiliser dans nos projets.
-->

---

<!--
header: Les Web Components
-->

### Qu'est-ce qu'un composant ?

<!-- prettier-ignore -->
* Un composant est une brique d'interface autonome.
* Regroupe structure, style et comportement.
* Il facilite la réutilisation et la maintenance du code.

<!--
Commençons par voir ce qu'est un composant.

1. Un composant est une brique d'interface autonome

2. Il regroupe la structure HTML, le style CSS, et le comportement.

3. L'intérêt, c'est de pouvoir réutiliser cette brique partout dans une application, et de faciliter la maintenance du code.

Je parle ici de code mais on a la même chose dans le design avec des outils comme Figma, Penpot ou autre.
-->

---

### Qu'est-ce que les Web Components ?

<!--
Parlons maintenant des Web Components
-->

---

#### Historique des Web Components

- 2011 : Proposés par Google.
- 2014 : Spécifications officielles publiées.
- 2016 : Adoption progressive dans les navigateurs modernes.
- Aujourd'hui : Standard mature, en évolution constante.

<!--
Un rapide historique.

1. les Web Components ont été proposés dès 2011 par Alex Russell de chez Google.

2. Les spécifications officielles sont arrivées vers 2014.

3. Depuis 2016, leur adoption progresse dans les navigateurs modernes.

4. Aujourd'hui, c'est un standard mature qui continue d'évoluer.
-->

---

#### Les clés des Web Components

<!-- prettier-ignore -->
* Un standard web natif pour créer des composants personnalisés et encapsulés.  
* Indépendants des frameworks.
* Compatibles avec tous les navigateurs modernes.  
* Trois technologies clés : 
  - Custom Elements
  - **Shadow DOM**
  - Templates HTML

<!--
1. Les Web Components sont un standard natif du web qui permet de créer des composants personnalisés et encapsulés.

2. On ne parle pas de composants de frameworks comme React, VueJS, Angular ou autre. Mais bien d'un standard du W3C.
Ils fonctionnent indépendamment des frameworks.

3. Ils sont compatibles avec tous les navigateurs modernes.

4. Ils s’appuient sur trois technologies principales :
les Custom Elements,
le Shadow DOM
et les Templates HTML.
-->

---

<!--
class: code
-->

##### Custom Elements

```html
<paris-web></paris-web>
```

<!-- prettier-ignore -->
* Permettent de créer ses propres balises HTML avec un comportement spécifique.  
* Le nom doit contenir un tiret (`-`).  
* S'utilisent comme n'importe quel élément du DOM.  
* Doivent être enregistrés via `customElements.define()`.

<!--
Voici un Custom Element !

1. C'est un élément HTML avec sa propre logique et son style, et avec le nom que nous voulons.

2. Presque. Pour s'assurer qu'il n'y aura pas de conflit avec les balises standards, le nom doit obligatoirement contenir un tiret (`-`).
Je ne sais pas si vous avez déjà remarqué, mais toutes les balises HTML standards sont en un seul mot : div, blockquote, textarea, colgroup, etc.

3. Il s'utilise comme n'importe quel élément du DOM.

4. Une fois défini en JS avec `customElements.define()`.
-->

---

##### Shadow DOM

```html
<paris-web>
  #shadow-root
  <p>Contenu encapsulé</p>
</paris-web>
```

<!-- prettier-ignore -->
* Permet d'encapsuler le style et le code d'un composant.  
* Crée une frontière entre le contenu interne et le reste du document.  
* Les styles définis à l'intérieur ne s'appliquent pas à l'extérieur, et ceux de l'extérieur n'affectent pas l'intérieur.  
* Deux modes :  
  - `open` : accessible via `.shadowRoot` en JavaScript.  
  - `closed` : inaccessible depuis l'extérieur.

<!--
Le DOM (Document Object Model) : c'est la représentation d'une page HTML sous forme d'objet.

Et le Shadow DOM, porte bien son nom, c'est le même principe que le DOM… mais caché, isolé à l'intérieur de notre Custom Element.

1. Il encapsule HTML et CSS, pas de `<html>`, `<head>` ou de `<body>`, uniquement le template et les styles propres au composant.

2. Le Shadow DOM crée une barrière entre son contenu et l'exterieur.

3. C'est à dire que rien ne peut "polluer" l'intérieur et inversement rien ne "fuit" vers l'extérieur.

4. En `mode : "open"`, on peut y accéder via `.shadowRoot`.

4. En `mode : "closed"`, impossible, même avec du code externe.
-->

---

##### Templates

```html
<template id="paris-web-template">
  <p>Hello Paris Web!</p>
</template>
```

<!-- prettier-ignore -->
* Contient du HTML.
* N'est pas affiché.
* On l'insère dans le Shadow DOM via JavaScript.

<!--
1. Le `<template>` contient du HTML.

2. Mais il n'est pas affiché tant qu'on ne l'utilise pas.

3. On l'insère dans le Shadow DOM via JavaScript.
-->

---

<!--
class: ''
-->

##### Exemple de composant

```html
<template id="paris-web-template">
  <p>Hello Paris Web!</p>
</template>

<script>
  class ParisWeb extends HTMLElement {
    constructor() {
      super();
      const template = document.getElementById('paris-web-template');
      const content = template.content.cloneNode(true);

      const shadow = this.attachShadow({ mode: 'open' });
      shadow.appendChild(content);
    }
  }

  customElements.define('paris-web', ParisWeb);
</script>

<paris-web></paris-web>
```

<!--
Voilà à quoi peut ressembler un Web Component très simple, qui va juste afficher un paragraphe "Hello Paris Web!".

Imaginez donc quelque chose de plus complexe, avec :

- des attributs/propriétés
- de la réactivité
- des évènements, etc.
-->

---

<!--
_class: code--right
-->

#### Librairies

- Lit [![w:24](./assets/pictos/link.svg)](https://lit.dev/)
- Stencil [![w:24](./assets/pictos/link.svg)](https://stenciljs.com/)

```TSX
import { Component, h } from '@stencil/core';

@Component({
  tag: 'paris-web',
  shadow: true,
})
export class ParisWeb {
  render(): HTMLElement {
    return <p>Hello Paris Web!</p>;
  }
}
```

<!--
C'est pourquoi on va plutôt avoir tendance à utiliser des librairies pour créer ses Web Components.

Depuis 2021, chez MGDIS nous utilisons Stencil pour fabriquer nos Web Components (et notre design system),
mais aujourd'hui c'est Lit qui est la librairie la plus connue.

Et là à droite, un exemple de code du même Web Component fait avec Stencil. C'est bien plus court!
-->

---

### Pourquoi les Web Components ?

<!-- prettier-ignore -->
* Un standard du W3C qui reste stable dans le temps.
* Des composants réutilisables partout, peut importe le framework.

<!--
Du coup, pourquoi les Web Components ?

Chez MGDIS, notre architecture repose sur des micro-services, chacun ayant son propre front-end.

Nous avons commencé avec AngularJS, puis sommes passés à Vue.

Nous nous sommes retrouvés à devoir réécrire nos librairies de composants AngularJS vers Vue.

Vue 2, puis est arrivé Vue 3… c'est sans fin.

1. Les Web Components, c'est un standard du W3C, et ces standards ne bougent pas facilement.

Ça ne va pas disparaître ou changer de version tous les 2-3 ans comme les frameworks.

L'autre avantage, similaire à celui apporté par les frameworks, c'est la réutilisation.

2. On écrit un composant une fois, et il est censé fonctionner partout, quel que soit le framework.

C'est exactement ce dont nous avions besoin chez MGDIS.
-->

---

<!--
header: ''
_class: title
_footer: ''
_paginate: false
-->

## Shadow DOM & Accessibilité : quand l'encapsulation brise les liens ARIA

<!--
Nico (30s):

> "Chez MGDIS, on fait beaucoup de formulaires.
>
> On a un design system en Atomic Design.
>
> Et quand on a commencé à utiliser les Web Components et le Shadow DOM, on a découvert un piège inattendu avec l'accessibilité.
>
> Je vais vous montrer ce qu'on a appris."
-->

---

<!--
header: Shadow DOM & Accessibilité
-->

### Le contexte : notre approche atomic design

```html
<label for="input">Nom</label>
<input type="text" id="input" aria-describedby="aide erreur" />
<span id="aide">Format attendu</span>
<span id="erreur">Champ requis</span>
```

Les liens ARIA fonctionnent parfaitement

<!--
Nico (45s) | Transition :

> "Commençons par voir comment ça marchait avant..."

🖥️ [slide] - À expliquer :

- Montrer le code classique qui fonctionne
- Insister sur "Les liens ARIA fonctionnent parfaitement"
  - l'input référence plusieurs éléments (tooltip, aide, message d'erreur) via aria-labelledby.
- Anatomie simple : label → input → aide/erreur
  - un label lié via for/id a son input
-->

---

### Mais quand on passe aux Web Components...

```html
<!-- Maintenant : chaque élément devient un composant -->
<mg-label for="input">Nom</mg-label>
<mg-input id="input" aria-describedby="aide erreur"></mg-input>
<mg-help-text id="aide">Format attendu</mg-help-text>
<mg-message id="erreur">Champ requis</mg-message>
```

<!-- prettier-ignore -->
* Logique parfaite... en théorie

<!--
Nico (45s) | Transition forte :

> "Et puis on évolue vers les Web Components..."

🖥️ [slide] - À expliquer :

Même logique, mais atomisée
- Avec un raisonnement atomique, nous allons avoir tendance à créer un composant distinct pour chaque brique
Chaque élément devient un composant
- le label
- l'input
- le texte d'aide
- le message d'erreur…

1. "Logique parfaite... en théorie..."

⏰ CHECKPOINT : 2min
-->

---

### Le problème révélé

```html
<p id="info">Remplissez le formulaire et cliquez sur le bouton pour envoyer le formulaire</p>
<my-button aria-describedby="info">Envoyer</my-button>
```

<!--
Nico (1m30)

🖥️ [slide] - Exemple concret simple
> "On dirait que ça va marcher..."
-->

---

#### ✅ VISUEL

Le contenu est bien rendu visuellement

![alt text](assets/paris-web/rendu-bouton-envoyer.png)

<!--
Nico:

> "Visuellement, tout semble parfait..."
-->

---

#### 🚫 VoiceOver

```txt
❌ "Envoyer, bouton"
✅ Attendu : "Envoyer, Instructions importantes, bouton"
```

<!--
Nico:

> "Mais quand on teste avec VoiceOver... Problème ! Il ne lit que 'Envoyer, bouton'. Il manque les instructions !"

-->

---

#### Le Shadow DOM isole chaque composant !

<!--
Nico - Message fort :

> 🎯  "Le Shadow DOM isole chaque composant !"

⏰ CHECKPOINT : 4min
-->

---

### Pourquoi ça ne marche plus ?

```html
<p id="info">Remplissez le formulaire et cliquez sur le bouton pour envoyer le formulaire</p>
<my-button aria-describedby="info">
  #shadow-root (open)
  <button><slot></slot></button>
  "Envoyer"
</my-button>
```

<!-- prettier-ignore -->
* Le `<p>` porte l' `id="info"`
* L'attribut `aria-describedby="info"` est sur le host de `<my-button>`
* Le focus est sur l'élément `<button>` dans le Shadow DOM

<!--
Nico (1m) - Transition :

> "Mais pourquoi ça ne marche plus ? Regardons ce qui se passe techniquement..."

🖥️ [slide] - À expliquer simplement :

1. le context contient l'element cible `<p>` qui porte l' `id="info"`
2. L'attribut `aria-describedby="info"` est sur le host de `<my-button>`
3. Le focus sur le <button> dans le Shadow DOM

> 💥 "Une fois encapsulés dans le shadow DOM, chaque id est scoppé à son propre shadow tree."
- Les attributs du composant ne sont pas propagés aux enfants du shadowDOM.

> 🎯 "Résultat :
> - les références ARIA des elements HTML cessent de fonctionner.
> - Les lecteurs d'écran ne font plus le lien avec les éléments encapsulés"

> 🎯 "Solution :
- Il faut definir les liens ARIA en tenant compte du shadow DOM et des elements interactifs pour respecter le pattern."
-->

---

### Solution 1 : Encapsuler complètement la logique ARIA

```html
<my-button description="Remplissez le formulaire et cliquez sur le bouton pour envoyer le formulaire">Envoyer</my-button>

<template id="mg-button-template">
  <p id="info"></p>
  <button aria-describedby="info">
    <slot></slot>
    <!-- Description interne, cachée visuellement mais lisible par screen readers -->
  </button>
</template>
<script>
  class MyButton extends HTMLElement {
    [...]
    connectedCallback() {
      // Remplit la description avec la prop/attribut "description"
      this.shadowRoot.querySelector("#info").textContent = this.getAttribute("description");
    }
  }
</script>
```

<!--
Nico (1m30) - Transition :

> "Première solution : on encapsule tout dans le Shadow DOM..."

🖥️ [slide] - Principe :

- Code avec attribut description
- Logique interne au composant
-->

---

#### DOM

```html
<my-button description="Remplissez le formulaire et cliquez sur le bouton pour envoyer le formulaire">
  #shadow-root (open)
  <p id="info">Remplissez le formulaire et cliquez sur le bouton pour envoyer le formulaire</p>
  <button aria-describedby="info"><slot></slot></button>
  "Envoyer"
</my-button>
```

<!--
[slide] - DOM :

- Montrer rapidement la structure
- Ne pas s'attarder sur les détails
-->

---

#### ✅ Résultat : Fonctionne parfaitement

![Rendu du bouton envoyer](assets/paris-web/rendu-bouton-envoyer.png)

```txt
✅ VoiceOver : Envoyer, Remplissez le formulaire et cliquez sur le bouton pour envoyer le formulaire, bouton
```

<!--
🖥️ [slide] - Résultat :

> 🎯 "Et là, ça marche ! VoiceOver lit bien toute la description."

Message : Encapsulation complète = solution propre

⏰ CHECKPOINT: 6min
-->

---

### Solution 2 : Le host comme élément ARIA

```html
<p id="info">Remplissez le formulaire et cliquez sur le bouton pour envoyer le formulaire</p>
<my-button aria-describedby="info">Envoyer</my-button>

<template id="mg-button-template">
  <slot></slot>
</template>
<script>
  class MyButton extends HTMLElement {
    [...]
    connectedCallback() {
      this.setAttribute('role', 'button'); // Le host devient le bouton
      this.setAttribute('tabindex', '0');
      this.addEventListener('keydown', (e) => { // Gestion du clavier
        if (e.key === 'Enter' || e.key === ' ') {
          this.click();
        }
      });
    }
  }
</script>
```

<!--
Nico (1m30) - Transition :

> "Deuxième approche : transformer le host lui-même..."

🖥️ [slide] - Principe :

- Host devient l'élément interactif
- Plus de travail mais plus de contrôle
-->

---

#### DOM

```html
<p id="info">Remplissez le formulaire et cliquez sur le bouton pour envoyer le formulaire</p>
<my-button role="button" aria-describedby="info"> #shadow-root (open) "Envoyer" </my-button>
```

<!--

Nico:

🖥️ [slide] - DOM :

- Structure plus simple
- Logique sur le host
-->

---

#### Résultat

- ✅ VoiceOver : Les attributs ARIA fonctionnent (restitution : "Envoyer, Remplissez le formulaire et cliquez sur le bouton pour envoyer le formulaire, bouton")
- ⚠️ Plus de travail pour recréer le comportement natif
- 😬 On perd aussi le rendu natif navigateur
  ![Bouton Envoyer rendu mais sans le syle d'un bouton](assets/paris-web/rendu-bouton-envoyer_2.png)

<!--
🖥️ [slide] - Résultat :

> "Ça marche aussi côté VoiceOver, mais attention : on perd le rendu natif et il faut recréer tous les comportements."

Message : Plus de contrôle = plus de responsabilités
-->

---

### A retenir

Stratégie hybride selon le contexte :

<!-- prettier-ignore -->
*	Composants simples : Privilégier les éléments natifs
*	Logique complexe : Encapsuler dans le Shadow DOM
* Toujours : Tester avec les lecteurs d'écran
* Le Shadow DOM n'est pas l'ennemi de l'accessibilité...
**Il nous force juste à être plus rigoureux !**

<!--
Nico (45s) - Transition finale :

> "Alors, qu'est-ce qu'on retient de tout ça ?"

Messages clés :

1. Stratégie hybride selon le contexte
2. Composants simples → éléments natifs
3. Logique complexe → Shadow DOM
4. TOUJOURS tester avec les lecteurs d'écran

Punch line finale :

> 🎯  "Le Shadow DOM n'est pas l'ennemi de l'accessibilité... Il nous force juste à être plus rigoureux !"

Ton : Optimiste et encourageant
-->

---

### Les Web Components améliorent l'accessibilité

<!-- prettier-ignore -->
*	Centralisation de la logique: corriger une fois = corrigé partout
*	Uniformiser le comportement des champs
* Protéger avec l’encapsulation : pas d’effets de bord
*	Favoriser l’inclusion 🎯

<!--
Nico:

1. “Alors, ça c’est pas spécifique aux Web Components : dès qu’on crée une librairie de composants, on a déjà un énorme gain d’accessibilité.”

> “Par exemple, avec un <mg-input>, toute la logique est centralisée : label, ARIA, gestion des erreurs… et si on améliore un détail, c’est corrigé partout.”

2.	“Ça veut dire aussi que l’expérience utilisateur est cohérente : les champs se comportent de la même manière, donc l’utilisateur n’est jamais perdu.”

3.	“Et puis avec le Shadow DOM, on a un bonus : l’encapsulation protège notre composant contre les styles ou scripts extérieurs qui risqueraient de casser l’accessibilité.”

4. >>
-->

---

<!--
header: ''
_class: title
_footer: ''
_paginate: false
-->

## Les audits

<!--
Nous venons de voir les soucis techniques que nous avons pu rencontrer.

Maintenant, nous avons aussi eu des soucis pendant les audits.

Comme nous avons l'obligation et la volonté de fournir des produits accessibles, nous faisons régulièrement des audits.

Et nous avons souvent eu des désaccords liés au Web Components.

Pour tout dire, c'est à partir de là que nous avons eu l'idée de proposer ce sujet.
-->

---

<!--
header: 'Les audits'
-->

### Quand le RGAA est clair

```html
<mg-button size="large">Non valide!</mg-button>
```

```html
<mg-input-select width="full" items="..."></mg-input-select>
```

> [10.1.2](https://accessibilite.numerique.gouv.fr/methode/) Dans chaque page web, les attributs servant à la **présentation de l’information** ne doivent pas être présents dans le code source généré des pages. Cette règle est-elle respectée ?

<!--
Alors là, c'est pour nous, et c'est assez dur à accepter, mais le critère 10.1.2 qui dit (…) fait que l'on ne peut pas utiliser les attributs size, width ou encore height.

Et plein d'autres encore, mais ceux là ça nous a bien embêtés. Et c'est clairement dommage, ça semble plutôt naturel de vouloir les utiliser avec des composants.
-->

---

### Quand le RGAA est moins clair

> [7.5](https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#7.5) Dans chaque page web, les messages de statut sont-ils correctement restitués par les technologies d'assistance ?

<!-- prettier-ignore -->
* Pour l'auditeur, le rôle devait être sur le `<mg-alert>` et non pas dans le Shadow DOM.
* Le cas de test du critère :
  - Retrouver dans le document les messages qui valent pour message de statut.
  - Pour chacun de ces messages, déterminer la nature de l'information dont est porteur le message :
  - Si le message…

<!--
Des fois le RGAA est moins clair...

1. Pour les messages de statut, l'auditeur voulait que le rôle soit porté par le `<mg-alert>` dans le DOM.

Nous, nous l'avions placé dans le Shadow DOM.

2. Le problème, c'est que le cas de test du critère 7.5 n'impose rien de tel.

--

Dans ce cas nous avons effectué le changement demandé, mais à contre coeur, la notification était parfaitement restituée par les lecteurs d'écran.

Là je vous parle des retours que nous avons traité, mais il y a quand même eu des fois où nous avons pu expliquer que l'attendu était dans le Shadow DOM, et l'auditeur à validé le critère.

Mais au final on a pu se rendre compte que certains des retours que nous avions étaient parfois dû aux outils utilisés lors des audits.
-->

---

### Les outils d'audit

<!-- prettier-ignore -->
* Ne prennent pas en compte le Shadow DOM
  - Nu Html Checker [![w:24](./assets/pictos/link.svg)](https://validator.w3.org/nu/)
  - Assistant RGAA [![w:24](./assets/pictos/link.svg)](https://addons.mozilla.org/fr/firefox/addon/assistant-rgaa/) [![w:24 GitHub](./assets/logos/github.svg)](https://github.com/search?q=repo%3Aboscop-fr%2Fassistant-rgaa+shadowRoot&type=code)
  - Web Developer [![w:24](./assets/pictos/link.svg)](https://addons.mozilla.org/fr/firefox/addon/web-developer/) [![w:24 GitHub](./assets/logos/github.svg)](https://github.com/search?q=repo%3Achrispederick%2Fweb-developer+shadowRoot&type=code)
  - detectAutocomplete [![w:24](./assets/logos/github.svg)](https://github.com/search?q=repo%3AMewenLeHo%2FdetectAutocomplete%20shadowRoot&type=code) [![w:24 LinkedIn](./assets/logos/linkedin.svg)](https://www.linkedin.com/posts/mewenleho_github-mewenlehodetectautocomplete-bookmarklet-activity-7313195631567622144-kBXw)
* Prennent en compte le Shadow DOM :
  - HeadingsMap [![w:24](./assets/pictos/link.svg)](https://addons.mozilla.org/fr/firefox/addon/headingsmap/)
  - WCAG Contrast checker [![w:24](./assets/pictos/link.svg)](https://addons.mozilla.org/fr/firefox/addon/wcag-contrast-checker/)

<!--
Nous sommes tous les deux formés en accessibilité : développeur a11y, design a11y, et depuis un an nous avons aussi suivi une formation d'auditeur.

Du coup, je me suis intéressé aux outils que l'on nous avait demandés d'installer pour la formation auditeur.

Ils sont souvent open source, et je suis allé voir dans leur code pour vérifier si ils prennent en compte le Shadow DOM.

1. Ici on a quand même des outils importants.

Nu Html Checker : l'outil officiel du W3C. Mais lui, c'est logique, il analyse uniquement le code source, pas ce qui est dans les Web Components.

Assistant RGAA : là c'est plus problématique, il permet d'auditer des pages mais ses outils ignorent le Shadow DOM. Mais il y a une issue d'ouverte pour corriger ça.

Web Developer : une boîte à outils bien connue, pour désactiver les styles, le JavaScript… mais pareil, pas de Shadow DOM.

detectAutocomplete : un bookmarklet très partagé dans la communauté. Il scanne les formulaires, mais ne voit rien dans les composants encapsulés.

2. Il n'y a pas que des mauvais élèves.

Ces deux extensions, développées par la même personne, prennent bien en compte les Web Components.

J'imagine que ce n'est pas un hasard : elles-mêmes utilisent des Web Components dans leur implémentation.
-->

---

#### Essentiels mais à faire évoluer

<!-- prettier-ignore -->
* Utiles pour nos audits
* Indispensables pour gagner du temps
* Mais pas toujours adaptés à certains projets
* Ils doivent évoluer pour mieux prendre en compte les Web components

<!--
On ne remet pas en cause ces outils

1. Ils sont précieux et nous les utilisons.

2. Ils permettent de gagner beaucoup de temps et de vérifier rapidement des points essentiels.

3. Mais dans certains contextes, comme les projets basés sur les Web Components, ils ne sont pas toujours adaptés.
On ne peut pas se baser uniquement sur eux pour juger l'accessibilité d'un projet.

4. Il faut donc qu'ils continuent d'évoluer, pour mieux prendre en compte les Web components.
-->

---

<!--
header: ''
_class: title
_footer: ''
_paginate: false
-->

## Conclusion

---

<!--
header: 'Conclusion'
-->

### Pourquoi ne pas adapter le RGAA aux Web Components ?

<!-- prettier-ignore -->
* Les Web Components sont un standard récent, qui doit coexister avec des spécifications historiques du RGAA.
* Nous avons déposé un dossier pour participer aux prochaines versions du RGAA, afin d'apporter notre expertise sur les Web Components.

<!--
1. Avec les Web Components, on peut créer librement nos balises, alors qu'à l'inverse le RGAA nous interdit certains attributs comme size ou width qui semblent naturels.

Ce contraste montre l'importance d'adapter le RGAA pour qu'il reste compatible avec les pratiques modernes du web.

2. C'est pour cela que nous avons déposé un dossier pour participer aux prochaines versions du RGAA, afin d'apporter notre expertise sur les Web Components

Si quelqu'un de la DINUM et du W3C est présent, nous sommes disponible pour en parler.
-->

---

<!--
header: ''
_class: center
-->

### Merci

Des questions ?

<!--
Merci

Des questions ?
-->
