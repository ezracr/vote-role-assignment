const rules = require('./.eslintrc.rules.js')

module.exports = {
  'extends': './node_modules/kcd-scripts/eslint.js',
  rules,
  parserOptions: {
    tsconfigRootDir: `${__dirname}`,
    project: './tsconfig.json',
  },
}
