import { defineConfig } from 'eslint/config';
import eslintConfig from '@blu/linting/eslint';
import { fileURLToPath } from 'node:url';
import { includeIgnoreFile } from '@eslint/compat';

// Importing the gitignore file to ensure it is included in the linting process
const gitignorePath = fileURLToPath(new URL('.gitignore', import.meta.url));

export default defineConfig([...eslintConfig, includeIgnoreFile(gitignorePath)]);
