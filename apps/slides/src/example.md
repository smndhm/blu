---
marp: true
# theme: paris-web
---

<!-- eslint-disable markdown/no-multiple-h1 -- page example -->

# Example

<!--
Here is some content that will only display in presentation mode!
-->

---

## Slide 2

<!-- prettier-ignore -->
* `*` is the way to do [fragmented list](https://marpit.marp.app/fragmented-list)
* `<!-- prettier-ignore -->` is used to keep the `*` otherwise prettier would replace them by `-`

---

# Titre niveau 1

## Titre niveau 2

### Titre niveau 3

#### Titre niveau 4

##### Titre niveau 5

###### Titre niveau 6

---

Paragraphe court

Paragraphe moins court

Paragraphe sur deux lignes. Paragraphe sur **deux** _lignes_. **Paragraphe sur _deux_ lignes.** _Paragraphe sur **deux** lignes._

Paragraphe
avec retour à la ligne.

> La citation de monsieur

---

- liste non ordonnée
- liste non ordonnée
- liste non ordonnée

1. liste ordonnée
1. liste ordonnée
1. liste ordonnée

- liste imbriquées
  - liste imbriquées
    - liste imbriquées

---

```html
<template id="custom-element-template">
  <p>Hello Custom Element!</p>
</template>

<script>
  class CustomElement extends HTMLElement {
    constructor() {
      super();
      const template = document.getElementById('custom-element-template');
      const content = template.content.cloneNode(true);

      const shadow = this.attachShadow({ mode: 'open' });
      shadow.appendChild(content);
    }
  }

  customElements.define('custom-element', CustomElement);
</script>

<custom-element></custom-element>
```
