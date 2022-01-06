const { jest: jestConfig } = require('kcd-scripts/config')

module.exports = Object.assign(jestConfig, {
  rootDir: "..",
  setupFilesAfterEnv: ['<rootDir>/jest/test-bundler.js'],
  testTimeout: 20000,
})
