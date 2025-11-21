@smndhm/deep-query-selector

# @smndhm/deep-query-selector

DeepQuerySelector Library

This library provides deep DOM and Shadow DOM selectors for Web Components.
Use it to test, debug, or manipulate custom elements and shadow roots in modern web applications.

Features:

- Query any element, even inside open shadow roots, using standard CSS selectors
- Detect custom elements in any DOM tree
- Designed for testing, automation, and advanced DOM traversal

## Table of contents

### Functions

- [findCustomElements](README.md#findcustomelements)
- [querySelectorAllDeep](README.md#queryselectoralldeep)
- [querySelectorDeep](README.md#queryselectordeep)

## Functions

### findCustomElements

▸ **findCustomElements**(`root?`): `Element`[]

Detects Custom Elements in a given root.
Custom Elements always have a dash in their tag name (standard Web Components).

#### Parameters

| Name   | Type         | Default value | Description                                 |
| :----- | :----------- | :------------ | :------------------------------------------ |
| `root` | `ParentNode` | `document`    | The root node to search (default: document) |

#### Returns

`Element`[]

Array of custom elements found

**`Example`**

```ts
// Finds all custom elements in the document
const customEls = findCustomElements();
```

**`Remarks`**

Useful for debugging, testing, or tooling around Web Components.

#### Defined in

[index.ts:28](https://github.com/smndhm/blu/blob/8975cd193d408babfd225aa8a4130a07735c1e47/packages/deep-query-selector/src/index.ts#L28)

---

### querySelectorAllDeep

▸ **querySelectorAllDeep**(`selector`, `root?`): `Element`[]

Deep selector: querySelectorAll for the DOM and all accessible Shadow DOMs.
Recursively finds all elements matching the selector, including inside open shadow roots.

#### Parameters

| Name       | Type         | Default value | Description                                 |
| :--------- | :----------- | :------------ | :------------------------------------------ |
| `selector` | `string`     | `undefined`   | CSS selector to match                       |
| `root`     | `ParentNode` | `document`    | The root node to search (default: document) |

#### Returns

`Element`[]

Array of matching elements

**`Example`**

```ts
// Finds all <input> elements in DOM and shadow roots
const allInputs = querySelectorAllDeep('input');
```

**`Remarks`**

Only open shadow roots are traversed. Useful for tests and automation.

#### Defined in

[index.ts:47](https://github.com/smndhm/blu/blob/8975cd193d408babfd225aa8a4130a07735c1e47/packages/deep-query-selector/src/index.ts#L47)

---

### querySelectorDeep

▸ **querySelectorDeep**(`selector`, `root?`): `Element` \| `null`

Deep selector: querySelector for the DOM and all accessible Shadow DOMs.
Returns the first matching element found, or null if none.

#### Parameters

| Name       | Type         | Default value | Description                                 |
| :--------- | :----------- | :------------ | :------------------------------------------ |
| `selector` | `string`     | `undefined`   | CSS selector to match                       |
| `root`     | `ParentNode` | `document`    | The root node to search (default: document) |

#### Returns

`Element` \| `null`

The first matching element, or null

**`Example`**

```ts
// Finds the first <input> element anywhere
const firstInput = querySelectorDeep('input');
```

**`Remarks`**

Returns null if nothing is found. Traverses open shadow roots recursively.

#### Defined in

[index.ts:73](https://github.com/smndhm/blu/blob/8975cd193d408babfd225aa8a4130a07735c1e47/packages/deep-query-selector/src/index.ts#L73)
