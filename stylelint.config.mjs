export default {
  extends: '@dume/dev-config/lint/stylelint',
  // The slides' Marp theme, written for Marp's own rendering and left as it is: not on the design system's rules
  // (logical properties, sizes from the tokens)
  ignoreFiles: ['apps/slides/src/themes/**'],
};
