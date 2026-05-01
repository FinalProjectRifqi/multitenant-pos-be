import 'reflect-metadata';
import http from 'http';
import { createApp } from './app';
import { getAppConfig } from './config';
import {
  createDatabase,
  destroyDatabase,
  testDatabaseConnection,
} from './database';
import { createLogger } from './logger';
import { loadEnv } from './utils/load-env';

const bootstrap = async (): Promise<void> => {
  loadEnv();

  const config = getAppConfig();
  const logger = createLogger(config.logger);

  const knex = createDatabase(config.database);

  try {
    await testDatabaseConnection(knex);
    logger.info('Database connection ok');
  } catch (error) {
    logger.error({ err: error }, 'Database connection failed');
  }

  const app = createApp({ config, knex, logger });
  const server = http.createServer(app);

  server.listen(config.port, () => {
    logger.info(`Server listening on http://localhost:${config.port}`);
    logger.info(`API Docs on http://localhost:${config.port}/api-docs`);
  });

  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Shutting down');

    try {
      await destroyDatabase(knex);
    } catch (error) {
      logger.error({ err: error }, 'Database shutdown failed');
    }

    server.close(() => process.exit(0));
  };

  process.on('SIGINT', () => {
    void shutdown('SIGINT');
  });

  process.on('SIGTERM', () => {
    void shutdown('SIGTERM');
  });
};

bootstrap().catch((error) => {
  console.error('Fatal bootstrap error:', error);
  process.exit(1);
});
