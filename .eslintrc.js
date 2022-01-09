module.exports = {
  "extends": "./node_modules/kcd-scripts/eslint.js",
  rules: {
    '@typescript-eslint/explicit-function-return-type': [
      'warn',
      {
        allowExpressions: true,
      },
    ],
  }
}
