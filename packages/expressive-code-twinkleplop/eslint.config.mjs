import hideoo from '@hideoo/eslint-config'

export default hideoo(
  {
    ignores: ['eslint.config.mjs'],
    languageOptions: {
      parserOptions: {
        project: ['../../tsconfig.json'],
      },
    },
  },
  {
    // Twinkleplop core subpaths share a single type declaration file which ends up wrongly reported as duplicates.
    files: ['tests/expressions.test.ts'],
    rules: {
      'import-x/no-duplicates': 'off',
    },
  },
)
