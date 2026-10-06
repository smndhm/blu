# IApostrophe

Un bookmarklet pour surligner les caractères typographiques insérés par les IA.

La page de l'outil fait partie du site [simon.duhem.fr](../simon.duhem.fr) (`content/ia-postrophe/`). Ce paquet contient son script : le bookmarklet et la zone de test. Il est compilé dans `dist/ia-postrophe.js`, que le site copie dans `/js/`.

## Développement

```sh
# Recompile le script à chaque modification
pnpm --filter ia-postrophe dev
# Dans un autre terminal, lance le site
pnpm --filter simon.duhem.fr start
```

## Tests

```sh
pnpm --filter ia-postrophe test
```

## L'histoire

En préparant mes slides pour la conférence [les Web Components et l'accessibilité](https://www.paris-web.fr/2025/conference/les-web-components-et-laccessibilite) à Paris Web, j'ai utilisé ChatGPT pour corriger mes textes.

En recopiant ses corrections, j'ai remarqué des caractères un peu “étranges”, que je ne taperais pas normalement au clavier : des tirets longs (—), des guillemets différents (« »), et surtout ces apostrophes penchées (’). J'ai corrigé mes slides sans y prêter plus d'attention.

Puis, je les ai vus partout : sites web, emails, entretiens annuels, messages Teams...

> Maintenant, vous aussi, vous les verrez partout.
