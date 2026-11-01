---
'@dume/ds': patch
---

The order of the cascade layers holds once bundled by Vite: the tokens in `ds.base.tokens`, a layer of their own within the base. `ds.base` came last, over the components: the text of a filled button that is a link, `<a class="ds-c-button">`, was unreadable.
