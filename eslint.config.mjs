// @ts-check
import eslint from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import jsdocPlugin from 'eslint-plugin-jsdoc';
import prettierPlugin from 'eslint-plugin-prettier';

export default tseslint.config(
  {
    ignores: ['node_modules/', 'dist/', 'eslint.config.mjs'],
  },

  eslint.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: {
      prettier: prettierPlugin,
      jsdoc: jsdocPlugin,
    },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
    rules: {
      'prettier/prettier': 'warn',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn',
      'jsdoc/check-alignment': 'warn',
      'jsdoc/check-indentation': 'warn',
      'jsdoc/check-tag-names': 'warn',
      'jsdoc/check-types': 'warn',
      'jsdoc/require-description': 'error',
      'jsdoc/require-description-complete-sentence': 'warn',
      'jsdoc/empty-tags': 'error',
      'jsdoc/no-blank-blocks': 'error',
      'jsdoc/require-jsdoc': [
        'warn',
        {
          require: {
            FunctionDeclaration: true,
            MethodDefinition: true,
            ClassDeclaration: true,
            ArrowFunctionExpression: false,
            FunctionExpression: false,
          },
          exemptEmptyConstructors: true,
          exemptEmptyFunctions: false,
          checkConstructors: false,
        },
      ],
      'jsdoc/require-param': 'warn',
      'jsdoc/require-returns': 'warn',
    },
  },

  {
    files: ['**/*.spec.ts', '**/*.test.ts', 'test/**/*.ts'],
    rules: {
      'jsdoc/require-jsdoc': 'off',
    },
  },

  {
    files: [
      '**/*.controller.ts',
      '**/*.service.ts',
      '**/*.guard.ts',
      '**/*.interceptor.ts',
      '**/*.middleware.ts',
      '**/*.pipe.ts',
      '**/*.filter.ts',
    ],
    rules: {
      'jsdoc/require-description': 'error',
      'jsdoc/require-param': 'warn',
      'jsdoc/require-returns': 'warn',
      'jsdoc/require-param-description': 'warn',
      'jsdoc/require-returns-description': 'warn',
    },
  },

  {
    files: ['**/*.ts'],
    rules: {
      'jsdoc/require-jsdoc': [
        'warn',
        {
          require: {
            FunctionDeclaration: true,
            MethodDefinition: true,
            ClassDeclaration: true,
            ArrowFunctionExpression: false,
            FunctionExpression: false,
          },
          exemptEmptyConstructors: true,
          exemptEmptyFunctions: false,
          checkConstructors: false,
        },
      ],
      'jsdoc/require-description': 'error',
      'jsdoc/empty-tags': 'error',
      'jsdoc/require-description-complete-sentence': 'warn',
    },
  }
);
