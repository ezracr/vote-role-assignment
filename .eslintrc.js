module.exports = {
  "extends": "./node_modules/kcd-scripts/eslint.js",
  rules: {
    '@typescript-eslint/explicit-function-return-type': [
      'warn',
      {
        allowExpressions: true,
      },
    ],
    '@typescript-eslint/no-parameter-properties': 'off',
  }
}
