@dume/webcomp-utils

# @dume/webcomp-utils

Utilities for deep DOM and Web Components manipulation.
Allows selecting elements in both regular DOM and all open shadow roots.

Main features:

- Select elements with CSS selectors, including inside shadow DOMs
- Detect custom elements (Web Components) in any DOM tree
- Designed for testing, automation, and debugging Web Components

You can import the library in any ESM-compatible environment (Node.js, Vite, Webpack, etc.):

```ts
import { deepQuerySelector, deepQuerySelectorAll, findCustomElements } from '@dume/webcomp-utils';
```

You can also import the library in any HTML page using jsdelivr CDN.

```html
<script src="https://cdn.jsdelivr.net/npm/@dume/webcomp-utils/dist/webcomp-utils.umd.min.js"></script>

<script>
  const inputs = window.webcompUtils.deepQuerySelectorAll('input');
</script>
```

## Table of contents

### Functions

- [deepQuerySelector](README.md#deepqueryselector)
- [deepQuerySelectorAll](README.md#deepqueryselectorall)
- [findCustomElements](README.md#findcustomelements)

## Functions

### deepQuerySelector

▸ **deepQuerySelector**(`selector`, `root?`): `Element` \| `null`

Selects the first element matching the CSS selector in the DOM and all open shadow roots.
Returns the first found element or null if none matches.

**`Example`**

```ts
// Find the first <input> element in DOM or shadow roots
const firstInput = deepQuerySelector('input');
```

**`Remarks`**

Returns null if no element matches. Recursively explores open shadow roots.

#### Parameters

| Name       | Type         | Default value | Description                                 |
| :--------- | :----------- | :------------ | :------------------------------------------ |
| `selector` | `string`     | `undefined`   | CSS selector to match                       |
| `root`     | `ParentNode` | `document`    | The root node to search (default: document) |

#### Returns

`Element` \| `null`

The first found element, or null

#### Defined in

[index.ts:89](https://github.com/smndhm/blu/blob/2659c11/packages/webcomp-utils/src/index.ts#L89)

---

### deepQuerySelectorAll

▸ **deepQuerySelectorAll**(`selector`, `root?`): `Element`[]

Selects all elements matching the CSS selector in the DOM and all open shadow roots.
Recursively traverses Web Components to find elements, even in nested shadow DOMs.

**`Example`**

```ts
// Find all <input> elements in DOM and shadow roots
const allInputs = deepQuerySelectorAll('input');
```

**`Remarks`**

Only open shadow roots are traversed. Ideal for tests and automation.

#### Parameters

| Name       | Type         | Default value | Description                                 |
| :--------- | :----------- | :------------ | :------------------------------------------ |
| `selector` | `string`     | `undefined`   | CSS selector to match                       |
| `root`     | `ParentNode` | `document`    | The root node to search (default: document) |

#### Returns

`Element`[]

Array of found elements

#### Defined in

[index.ts:63](https://github.com/smndhm/blu/blob/2659c11/packages/webcomp-utils/src/index.ts#L63)

---

### findCustomElements

▸ **findCustomElements**(`root?`): `Element`[]

Finds all custom elements (Web Components) in a given DOM tree.
Custom elements are identified by a dash in their tag name.

**`Example`**

```ts
// Find all custom elements in the page
const customEls = findCustomElements();
```

**`Remarks`**

Useful for debugging, testing, or analyzing Web Components.

#### Parameters

| Name   | Type         | Default value | Description                                 |
| :----- | :----------- | :------------ | :------------------------------------------ |
| `root` | `ParentNode` | `document`    | The root node to search (default: document) |

#### Returns

`Element`[]

Array of found custom elements

#### Defined in

[index.ts:44](https://github.com/smndhm/blu/blob/2659c11/packages/webcomp-utils/src/index.ts#L44)
