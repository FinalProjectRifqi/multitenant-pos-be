import type { Knex } from 'knex';
import { cleanEnv, port, str } from 'envalid';

export interface ProductionDatabaseConfig extends Knex.Config {
  client: 'pg';
}

export default (): ProductionDatabaseConfig => {
  const env = cleanEnv(process.env, {
    PROD_DB_HOST: str({ default: 'prod-db.example.com' }),
    PROD_DB_PORT: port({ default: 5432 }),
    PROD_DB_USER: str({ default: 'prod_user' }),
    PROD_DB_PASSWORD: str({ default: 'prod_password' }),
    PROD_DB_NAME: str({ default: 'nest_app_prod' }),
    PROD_DB_SSL: str({ choices: ['true', 'false'], default: 'true' }),
    PROD_DB_SSL_REJECT_UNAUTHORIZED: str({
      choices: ['true', 'false'],
      default: 'true',
    }),
    PROD_DB_SSL_CA: str({ default: '' }),
    PROD_DB_SSL_KEY: str({ default: '' }),
    PROD_DB_SSL_CERT: str({ default: '' }),
    PROD_DB_STATEMENT_TIMEOUT: str({ default: '30000' }),
    PROD_DB_QUERY_TIMEOUT: str({ default: '60000' }),
    PROD_DB_CONNECTION_TIMEOUT: str({ default: '5000' }),
    PROD_DB_POOL_MIN: str({ default: '2' }),
    PROD_DB_POOL_MAX: str({ default: '20' }),
  });

  return {
    client: 'pg',
    connection: {
      host: env.PROD_DB_HOST,
      port: env.PROD_DB_PORT,
      user: env.PROD_DB_USER,
      password: env.PROD_DB_PASSWORD,
      database: env.PROD_DB_NAME,
      ssl:
        env.PROD_DB_SSL === 'false'
          ? false
          : {
              rejectUnauthorized:
                env.PROD_DB_SSL_REJECT_UNAUTHORIZED !== 'false',
              ca: env.PROD_DB_SSL_CA || undefined,
              key: env.PROD_DB_SSL_KEY || undefined,
              cert: env.PROD_DB_SSL_CERT || undefined,
            },
      keepAlive: true,
      statement_timeout: parseInt(env.PROD_DB_STATEMENT_TIMEOUT, 10),
      query_timeout: parseInt(env.PROD_DB_QUERY_TIMEOUT, 10),
      connectionTimeoutMillis: parseInt(env.PROD_DB_CONNECTION_TIMEOUT, 10),
    },
    pool: {
      min: parseInt(env.PROD_DB_POOL_MIN, 10),
      max: parseInt(env.PROD_DB_POOL_MAX, 10),
      acquireTimeoutMillis: 60000,
      createTimeoutMillis: 30000,
      destroyTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
      reapIntervalMillis: 1000,
      createRetryIntervalMillis: 200,
      propagateCreateError: false,
    },
    migrations: {
      tableName: 'knex_migrations',
      directory: './src/database/migrations',
      disableTransactions: false,
      loadExtensions: ['.js'],
    },
    seeds: {
      directory: './src/database/seeds',
      loadExtensions: ['.js'],
    },
    debug: false,
    acquireConnectionTimeout: 60000,
    asyncStackTraces: false,
    wrapIdentifier: (value, origImpl) => origImpl(value),
    postProcessResponse: (result) => result,
    log: {
      warn(message) {
        console.warn('[DB WARNING]:', message);
      },
      error(message) {
        console.error('[DB ERROR]:', message);
      },
      deprecate(message) {
        console.warn('[DB DEPRECATED]:', message);
      },
      debug(message) {
        if (process.env.NODE_ENV !== 'production') {
          console.debug('[DB DEBUG]:', message);
        }
      },
    },
  };
};
