import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import parser from '@typescript-eslint/parser'

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser,
      parserOptions: {
        project: './tsconfig.json',
      },
    },
    rules: {
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/require-await': 'off',
    },
  },
  {
    ignores: ['dist/**'],
  },
]
