---
'@dume/codemod-redundant-attributes': minor
---

New codemod that removes what the HTML and ARIA specifications make redundant: native attributes at their default value, values written on boolean attributes, ARIA states and properties at their default (including `aria-hidden="false"`), roles equal to the implicit role, and ARIA repeating a native attribute. Attributes that stylesheets or scripts select are kept.
