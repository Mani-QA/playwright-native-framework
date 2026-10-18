import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import playwright from 'eslint-plugin-playwright';
import globals from 'globals';

const playwrightRecommended = playwright.configs['flat/recommended'];

export default [
  {
    ignores: ['node_modules/**', 'dist/**', 'playwright-report/**', 'test-results/**', 'blob-report/**'],
  },
  {
    files: ['src/**/*.ts', 'tests/**/*.ts', 'global-setup.ts', 'playwright.config.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      playwright,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...tsPlugin.configs.recommended.rules,
      ...playwrightRecommended.rules,
      'playwright/missing-playwright-await': 'error',
      'playwright/no-page-pause': 'error',
      'playwright/no-force-option': 'error',
      'playwright/no-wait-for-timeout': 'error',
      'playwright/no-skipped-test': 'warn',
      'playwright/prefer-web-first-assertions': 'error',
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-console': 'warn',
    },
  },
];
