import type { Knex } from 'knex';
import { cleanEnv, port, str } from 'envalid';

export interface LocalDatabaseConfig extends Knex.Config {
  client: 'pg';
}

export default (): LocalDatabaseConfig => {
  const env = cleanEnv(process.env, {
    LOCAL_DB_HOST: str({ default: 'postgresql' }),
    LOCAL_DB_PORT: port({ default: 5432 }),
    LOCAL_DB_USER: str({ default: 'nest_user' }),
    LOCAL_DB_PASSWORD: str({ default: 'nest_password' }),
    LOCAL_DB_NAME: str({ default: 'nest_app' }),
  });

  return {
    client: 'pg',
    connection: {
      host: env.LOCAL_DB_HOST,
      port: env.LOCAL_DB_PORT,
      user: env.LOCAL_DB_USER,
      password: env.LOCAL_DB_PASSWORD,
      database: env.LOCAL_DB_NAME,
      ssl: false,
    },
    pool: {
      min: 2,
      max: 10,
      acquireTimeoutMillis: 10000,
      createTimeoutMillis: 10000,
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
    acquireConnectionTimeout: 60000,
    asyncStackTraces: true,
  };
};
