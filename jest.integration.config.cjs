const base = require('./jest.config.cjs');

module.exports = {
  ...base,
  testMatch: ['<rootDir>/tests/integration/**/*.spec.ts'],
  testTimeout: 30000,
};
