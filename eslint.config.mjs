import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
      ecmaVersion: 2022,
      sourceType: 'module',
    },
  },

  ...tseslint.configs.recommendedTypeChecked.map(config => ({
    ...config,
    files: ['src/**/*.{ts,tsx}', '**/*.d.ts'],
  })),

  {
    files: ['src/**/*.{ts,tsx}', '**/*.d.ts'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports' },
      ],
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',

      'no-console': 'error',
      'no-debugger': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
      'object-shorthand': 'error',
      'prefer-template': 'error',
      quotes: ['error', 'single', { avoidEscape: true }],
      semi: ['error', 'always'],
      'comma-dangle': ['error', 'always-multiline'],

      complexity: ['warn', 10],
      'max-lines-per-function': ['warn', 50],
      'no-magic-numbers': [
        'warn',
        {
          ignore: [-1, 0, 1, 2],
          ignoreArrayIndexes: true,
          ignoreDefaultValues: true,
        },
      ],
    },
  },

  {
    files: ['*.config.{js,mjs,ts}', '.*rc.{js,mjs,ts}', 'eslint.config.*'],
    rules: {
      'no-console': 'off',
      'no-magic-numbers': 'off',
      '@typescript-eslint/no-var-requires': 'off',
    },
  },

  {
    files: ['**/*.{js,mjs,cjs}'],
    rules: {
      'no-console': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
      quotes: ['error', 'single', { avoidEscape: true }],
      semi: ['error', 'always'],
    },
  },

  {
    files: ['**/*.test.{js,ts}', '**/*.spec.{js,ts}'],
    rules: {
      'no-magic-numbers': 'off',
      'max-lines-per-function': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/unbound-method': 'off',
    },
  },

  {
    ignores: [
      'dist/**',
      'build/**',
      'coverage/**',
      'node_modules/**',
      '*.min.js',
      '.swc/**',
    ],
  },
];
