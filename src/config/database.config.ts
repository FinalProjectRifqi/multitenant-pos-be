import { cleanEnv, str } from 'envalid';
import type { Knex } from 'knex';
import type { NodeEnv } from './types';
import localConfig from './local/database';
import developmentConfig from './development/database';
import productionConfig from './production/database';

export type DatabaseConfig = Knex.Config;

export const getDatabaseConfig = (nodeEnv?: NodeEnv): DatabaseConfig => {
  const env = cleanEnv(process.env, {
    NODE_ENV: str({
      choices: ['local', 'development', 'production'],
      default: 'local',
    }),
  });

  const environment = (nodeEnv ?? env.NODE_ENV) as NodeEnv;

  const configurations: Record<NodeEnv, DatabaseConfig> = {
    local: localConfig(),
    development: developmentConfig(),
    production: productionConfig(),
  };

  return configurations[environment] ?? configurations.local;
};
