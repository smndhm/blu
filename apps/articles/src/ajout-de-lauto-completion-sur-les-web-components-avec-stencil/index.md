---
tags: articles
title: Ajout de l'auto-complétion sur les Web Components avec Stencil
date: 2024-03-14
origin: { href: https://dev.to/mgdis/ajout-de-lauto-completion-sur-les-web-components-avec-stencil-8o8, title: dev.to }
ogImage: og.webp
---

## Introduction

Chez MGDIS, nous mettons à jour nos services en passant de AngularJS, désormais obsolète, à Vue.js. Cependant, avec l'évolution rapide des frameworks et la transition de Vue 2 à Vue 3, ces changements ne sont pas sans difficultés. Pour cela, nous nous sommes tournés vers les [Web Components](https://developer.mozilla.org/docs/Web/API/Web_components), un standard indépendant de tout framework.

Au sein de la Core UI, nous développons [mg-components](https://github.com/MGDIS/core-ui/tree/master/packages/mg-components), une bibliothèque de Web Components basée sur [Stencil](https://stenciljs.com/). Cette bibliothèque offre une collection de composants conçus pour faciliter le développement et garantir l'accessibilité de nos produits.
Note: Stencil n'est pas un framework mais une librairie qui permet de générer des Web Components.

Une demande fréquente des développeurs était l'auto-complétion dans leurs IDEs pour notre librairie mg-components. Cependant, les Web Components ne fournissent pas automatiquement cette fonctionnalité car cela nécessite des informations spécifiques sur les éléments et attributs personnalisés. Nous avons donc cherché une solution pour remédier à cette limitation.

## La recherche de la solution

Nous avons d'abord exploré les options pour VS Code, nous avons rapidement découvert que Stencil propose l'export [VS Code Documentation](https://stenciljs.com/docs/docs-vscode), basé sur les [custom data](https://github.com/microsoft/vscode-custom-data), un format pris en charge par VS Code. Une fois le fichier généré, l'intégration est simple : il suffit d'ajouter un fichier de configuration dans le projet utilisant la librairie pour que l'auto-complétion fonctionne.

Cependant, nous avons également des développeurs qui utilisent WebStorm, pour lequel Stencil ne propose pas d'export de documentation. Pour contourner ce problème, nous avons utilisé les [web types](https://github.com/JetBrains/web-types) de JetBrains, qui sont un équivalent des custom data mais pour WebStorm.
Avec le package [stenciljs-web-types-generator
](https://github.com/nielsboogaard/stenciljs-web-types-generator) nous sommes en mesure de générer ce fichier. Il suffit ensuite de le référencer à la propriété "web-types" dans le `package.json` de la librairie pour que le projet bénéficie de l'auto-complétion.

Ces solutions permettent d'obtenir l'auto-complétion pour les principaux IDE utilisés chez MGDIS mais dans l'idéal, nous souhaiterions également accéder aux informations détaillées sur les attributs, propriétés, événements et méthodes disponibles pour chaque élément, ainsi que connaître les valeurs possibles ou le type attendu par un attribut. Avoir des liens vers la documentation et le code source des composants serait aussi un gros plus.

## Le développement de la solution

Pour générer nos deux fichiers, nous utilisons le build [docs-custom](https://stenciljs.com/docs/docs-custom) proposé par Stencil. Cette fonctionnalité nous permet d'accéder à un JSON représentant la documentation de nos composants.
Ce JSON est ensuite transformé pour obtenir les formats attendus pour les custom data et web types.

Le générateur pour VS Code :

```ts
/**
 * Generate custom HTML datasets for VS Code
 * @param version - Library version
 * @param storybookBaseUrl - Storybook Base Url
 * @param jsonDocs - Stencil JSON doc
 * @returns custom HTML datasets
 */
export const vsCodeGenerator = (version: string, jsonDocs: JsonDocs, storybookBaseUrl: string, sourceBaseUrl: string) => ({
  version,
  tags: jsonDocs.components.map(component => {
    const references = getReferences(storybookBaseUrl, sourceBaseUrl, component.filePath);
    return {
      name: component.tag,
      description: getElementDescription(component),
      attributes: component.props.map(prop => ({
        name: prop.attr || prop.name,
        description: getAttributeDescription(prop),
        values: getValues(prop),
        references,
      })),
      references,
    };
  }),
  globalAttributes: [],
  valueSets: [],
});
```

Le générateur pour WebStorm :

```ts
/**
 * Generate Web Types metadata for IntelliJ's IDE
 * @param name - Library name
 * @param version - Library version
 * @param storybookBaseUrl - Storybook Base Url
 * @param jsonDocs - Stencil JSON doc
 * @returns Web Types metadata
 */
export const webTypesGenerator = (name: string, version: string, jsonDocs: JsonDocs, storybookBaseUrl: string) => ({
  '$schema': 'https://json.schemastore.org/web-types',
  name,
  version,
  'description-markup': 'markdown',
  'contributions': {
    html: {
      elements: jsonDocs.components.map(component => {
        const docUrl = getStorybookUrl(storybookBaseUrl, component.filePath);
        return {
          'name': component.tag,
          'description': getElementDescription(component),
          'doc-url': docUrl,
          'attributes': component.props
            .filter(prop => prop.attr)
            .map(prop => ({
              'name': prop.attr,
              'description': getAttributeDescription(prop),
              'doc-url': docUrl,
              'value': {
                type: prop.type,
                default: prop.default,
                required: prop.required,
              },
            })),
          'js': {
            properties: component.props.map(prop => ({
              'name': prop.name,
              'description': getAttributeDescription(prop),
              'doc-url': docUrl,
              'value': {
                type: prop.type,
                default: prop.default,
                required: prop.required,
              },
            })),
            events: component.events.map(event => ({
              name: event.event,
              description: event.docs,
            })),
          },
        };
      }),
    },
  },
});
```

Nous avons centralisé la génération des descriptions des éléments et des attributs dans les méthodes `getElementDescription` et `getAttributeDescription` pour garantir une expérience uniforme sur les deux IDEs, celles-ci seront disponibles au survol.

Code mutualisé :

```ts
/**
 * Get Component element description
 * @param component - Component
 * @returns Component element description
 */
const getElementDescription = (component: JsonDocsComponent): string => {
  // Init description
  let description = component.overview ? `${component.overview}\n\n` : '';
  // Attributes
  const attributes = component.props.filter(({ attr }) => attr !== undefined);
  if (attributes.length) {
    description += `Attributes:\n`;
    description += attributes.map(({ attr, docs }) => `- \`${attr}\`: ${docs}\n`).join('');
    description += '\n';
  }
  // Properties
  const properties = component.props.filter(({ attr }) => attr === undefined);
  if (properties.length) {
    description += `Properties:\n`;
    description += properties.map(({ name, docs }) => `- \`${name}\`: ${docs}\n`).join('');
    description += '\n';
  }
  // Methods
  if (component.methods.length) {
    description += `Methods:\n`;
    description += component.methods.map(({ name, docs }) => `- \`${name}\`: ${docs}\n`).join('');
    description += '\n';
  }
  // Events
  if (component.events.length) {
    description += `Events:\n`;
    description += component.events.map(({ event, docs }) => `- \`${event}\`: ${docs}\n`).join('');
    description += '\n';
  }
  // Listeners
  if (component.listeners.length) {
    description += `Listeners:\n`;
    description += component.listeners.map(({ event }) => `- \`${event}\`\n`).join('');
    description += '\n';
  }
  // Slots
  if (component.slots.length) {
    description += `Slots:\n`;
    description += component.slots.map(({ name, docs }) => `- \`${name}\`: ${docs}\n`).join('');
    description += '\n';
  }
  // Return
  return description;
};

/**
 * Get Props Description
 * @param prop - Component Property
 * @returns Props Description
 */
const getAttributeDescription = (prop: JsonDocsProp): string => {
  return `${prop.docs}\n\nType: \`${prop.type}\``;
};
```

A MGDIS nous avons deux librairies de Web Components réalisées avec Stencil : une pour le design system et l'autre pour les composants métier spécifiques à nos applications.
Afin d'éviter la duplication de code, nous avons centralisé le code de ces "générateurs" dans le package [@mgdis/stencil-helpers](https://github.com/MGDIS/core-ui/tree/master/packages/mg-components-helpers) de notre monorepo Core UI.

## Intégration dans les projets

La mise en place de l'auto-complétion varie selon l'IDE utilisé. Pour VS Code, il est nécessaire d'ajouter aux projets utilisant la librairie un fichier `settings.json` dans le dossier `.vscode` avec la propriété suivante :

```json
{
  "html.customData": ["packages/mg-components/ide/vscode/html-custom-data.json"]
}
```

Pour IntelliJ, le processus est plus simple. Nous avons ajouté la propriété "web-types" dans le `package.json` de la librairie avec le lien vers le fichier, ainsi tout projet qui charge la librairie profite de l'auto-complétion :

```json
{
    ...
    "web-types": "ide/intellij/web-types.json",
    ...
}
```

Avec ces configurations en place, les projets utilisant la librairie auront l'auto-complétion et des éléments de documentation au survol, offrant ainsi une intégration simple et efficace.

![Documentation au survol de l'élément](./1.png)

![Documentation au survol de l'attribut](./2.png)

## Conclusion

L'ajout de l'auto-complétion et des éléments de documentation s'est révélé être une tâche relativement simple. Cependant, il est dommage que chaque IDE propose une solution différente.

J'ai apprécié l'approche d'IntelliJ, qui semble plus proche de la réalité en distinguant les attributs et propriétés, et en offrant une intégration transparente sans nécessiter de configuration supplémentaire.
D'un autre côté, j'ai trouvé la flexibilité et la personnalisation des liens proposés par VS Code plus intéressantes.
Idéalement, il faudrait avoir une norme commune pour tous les IDEs.

Il est également à noter que ces deux standards permettent aussi de documenter le CSS.
Nous travaillons sur un package pour les styles, il est probable que nous allons apporter une configuration similaire à celle que nous avons mise en place pour les Web Components.

Enfin, ce serait une amélioration intéressante si Stencil proposait aussi les web-types comme format dans ses exports de documentation.
