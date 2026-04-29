import type { Knex } from 'knex';
import { cleanEnv, port, str } from 'envalid';

export interface DevelopmentDatabaseConfig extends Knex.Config {
  client: 'pg';
}

export default (): DevelopmentDatabaseConfig => {
  const env = cleanEnv(process.env, {
    DEV_DB_HOST: str({ default: 'your-dev-server.example.com' }),
    DEV_DB_PORT: port({ default: 5432 }),
    DEV_DB_USER: str({ default: 'dev_user' }),
    DEV_DB_PASSWORD: str({ default: 'dev_password' }),
    DEV_DB_NAME: str({ default: 'nest_app_dev' }),
    DEV_DB_SSL: str({ choices: ['true', 'false'], default: 'true' }),
    DEV_DB_SSL_REJECT_UNAUTHORIZED: str({
      choices: ['true', 'false'],
      default: 'true',
    }),
    DEV_DB_SSL_CA: str({ default: '' }),
    DEV_DB_SSL_KEY: str({ default: '' }),
    DEV_DB_SSL_CERT: str({ default: '' }),
  });

  return {
    client: 'pg',
    connection: {
      host: env.DEV_DB_HOST,
      port: env.DEV_DB_PORT,
      user: env.DEV_DB_USER,
      password: env.DEV_DB_PASSWORD,
      database: env.DEV_DB_NAME,
      ssl:
        env.DEV_DB_SSL === 'true'
          ? {
              rejectUnauthorized:
                env.DEV_DB_SSL_REJECT_UNAUTHORIZED !== 'false',
              ca: env.DEV_DB_SSL_CA || undefined,
              key: env.DEV_DB_SSL_KEY || undefined,
              cert: env.DEV_DB_SSL_CERT || undefined,
            }
          : false,
    },
    pool: {
      min: 1,
      max: 5,
      acquireTimeoutMillis: 30000,
      createTimeoutMillis: 30000,
      destroyTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
      reapIntervalMillis: 1000,
      createRetryIntervalMillis: 100,
    },
    migrations: {
      tableName: 'knex_migrations',
      directory: './src/database/migrations',
    },
    seeds: {
      directory: './src/database/seeds',
    },
    debug: process.env.DB_DEBUG === 'true',
    acquireConnectionTimeout: 30000,
    asyncStackTraces: true,
  };
};
