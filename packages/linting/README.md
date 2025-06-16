# @blu/linting

Shared linting configurations for my projects.

## Installation

```bash
pnpm add -D @blu/linting
```

## Usage

### ESLint

Create an `eslint.config.mjs` file in your project root:

```js
import eslintConfig from '@blu/linting/eslint';
export default eslintConfig;
```

### Prettier

Create a `prettier.config.mjs` file in your project root:

```js
import prettierConfig from '@blu/linting/prettier';
export default prettierConfig;
```

### Stylelint

Create a `stylelint.config.mjs` file in your project root:

```js
export default {
  extends: '@smndhm/linting/stylelint',
};
```

## Features

### ESLint Configuration

- JavaScript/TypeScript support with recommended configs
- JSON linting with @eslint/json
- Markdown linting with @eslint/markdown
- Browser globals support
- Integration with Prettier
- Turbo repo configuration

### Prettier Configuration

- 180 characters line length
- Single quotes
- 2 spaces indentation
- Trailing commas
- Arrow function parentheses avoided when possible

### Stylelint Configuration

- SCSS support via stylelint-config-standard-scss
- BEM naming convention enforcement
- Property ordering via stylelint-config-idiomatic-order
- Integration with Prettier via stylelint-prettier
