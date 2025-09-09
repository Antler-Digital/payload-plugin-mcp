// @ts-check

import payloadEsLintConfig from '@payloadcms/eslint-config'

export const defaultESLintIgnores = [
  '**/.temp',
  '**/.*', // ignore all dotfiles
  '**/.git',
  '**/.hg',
  '**/.pnp.*',
  '**/.svn',
  '**/playwright.config.ts',
  '**/vitest.config.js',
  '**/tsconfig.tsbuildinfo',
  '**/README.md',
  '**/eslint.config.js',
  '**/payload-types.ts',
  '**/dist/',
  '**/.yarn/',
  '**/build/',
  '**/node_modules/',
  '**/temp/',
  '**/examples/',
  '**/docs/',
  '**/dev/',
  '**/.prettierrc.js',
  '**/size-limit.config.js',
  '**/coverage/',
  '**/scripts/',
]

export default [
  {
    ignores: defaultESLintIgnores,
  },
  ...payloadEsLintConfig,
  {
    rules: {
      'no-restricted-exports': 'off',
      'no-console': 'off', // Allow console statements
      '@typescript-eslint/require-await': 'off', // Allow async functions without await
      '@typescript-eslint/await-thenable': 'off', // Allow await on non-promises
      'perfectionist/sort-objects': 'off', // Disable object sorting
      'perfectionist/sort-union-types': 'off', // Disable union type sorting
      '@typescript-eslint/no-unnecessary-type-assertion': 'off', // Allow type assertions for compatibility
    },
  },
  {
    languageOptions: {
      parserOptions: {
        sourceType: 'module',
        ecmaVersion: 'latest',
        projectService: {
          maximumDefaultProjectFileMatchCount_THIS_WILL_SLOW_DOWN_LINTING: 40,
          allowDefaultProject: ['scripts/*.ts', '*.js', '*.mjs', '*.spec.ts', '*.d.ts'],
        },
        // projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
]
