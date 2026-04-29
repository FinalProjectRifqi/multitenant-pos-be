require('ts-node/register');
require('tsconfig-paths/register');
require('dotenv').config();

const localConfig = require('./src/config/local/database').default;
const developmentConfig = require('./src/config/development/database').default;
const productionConfig = require('./src/config/production/database').default;

module.exports = {
  local: localConfig(),
  development: developmentConfig(),
  production: productionConfig(),
};
