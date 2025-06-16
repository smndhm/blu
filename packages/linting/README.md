# @dume/linting

Shared linting configurations for my projects.

## Installation

```bash
pnpm add -D @dume/linting
```

## Usage

### ESLint

Create an `eslint.config.mjs` file in your project root:

```js
import eslintConfig from '@dume/linting/eslint';
export default eslintConfig;
```

### Prettier

Create a `prettier.config.mjs` file in your project root:

```js
import prettierConfig from '@dume/linting/prettier';
export default prettierConfig;
```

### Stylelint

Create a `stylelint.config.mjs` file in your project root:

```js
export default {
  extends: '@dume/linting/stylelint',
};
```
