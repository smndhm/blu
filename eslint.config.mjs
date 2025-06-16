import { defineConfig } from 'eslint/config';
import eslintConfig from '@smndhm/linting/eslint';
import { fileURLToPath } from 'node:url';
import { includeIgnoreFile } from '@eslint/compat';

// Importing the gitignore file to ensure it is included in the linting process
// https://eslint.org/docs/latest/use/configure/ignore#including-gitignore-files
const gitignorePath = fileURLToPath(new URL('.gitignore', import.meta.url));

export default defineConfig([...eslintConfig, includeIgnoreFile(gitignorePath)]);
