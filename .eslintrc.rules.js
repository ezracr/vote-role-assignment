module.exports = {
  '@typescript-eslint/explicit-function-return-type': [
    'warn',
    {
      allowExpressions: true,
    },
  ],
  '@typescript-eslint/no-parameter-properties': 'off',
  'max-len': ['error', {
    code: 140, ignoreUrls: true, ignoreComments: true, ignoreTrailingComments: true,
  }],
  semi: ['error', 'never'],
  'comma-dangle': ['error', 'always-multiline'],
  'no-console': 'error',
}
