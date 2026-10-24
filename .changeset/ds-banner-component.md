---
'@dume/ds': minor
---

The banner component, `.ds-c-banner` (`__icon`, `__text`, `__close`): a message that stays until closed, in HTML and CSS alone, a `<dialog open>` closed without JavaScript by its ghost button in a `<form method="dialog">`. `<ds-banner>` is this component in a shadow root, unchanged on the page. Every component is HTML and CSS first, a web component being that component in a shadow root with its behavior: the README says so. `styles.css` takes the button before the other components, which build on it.
