---
'@dume/codemod-redundant-attributes': minor
---

New codemod that removes what the HTML and ARIA specifications make redundant: native attributes at their default value, values written on boolean attributes, ARIA states and properties at their default (including `aria-hidden="false"`), roles equal to the implicit role, ARIA repeating a native attribute, and invalid keyword values the browser ignores (invalid values that still do something, like `hidden="no"`, are reported). Attributes that stylesheets or scripts select are kept.
