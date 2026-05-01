import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import type { Knex } from 'knex';
import type { Logger } from 'pino';
import type { AppConfig } from './config';
import { buildApiRouter } from './routes/routes';
import { requestId } from './common/middlewares/request-id';
import { buildCorsOptions } from './common/middlewares/cors';
import { createHttpLogger } from './logger';
import { notFoundHandler } from './common/middlewares/not-found';
import { createErrorHandler } from './common/middlewares/error-handler';
import { setupSwagger } from './config/swagger.config';

interface AppDependencies {
  config: AppConfig;
  knex: Knex;
  logger: Logger;
}

export const createApp = ({
  config,
  knex,
  logger,
}: AppDependencies): Express => {
  const app = express();

  app.disable('x-powered-by');

  app.use(requestId());
  app.use(createHttpLogger(config.logger));
  app.use(helmet());
  app.use(cors(buildCorsOptions(config.cors)));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  setupSwagger(app, config);
  app.use('/v1', buildApiRouter({ knex, config, logger }));

  app.use(notFoundHandler());
  app.use(createErrorHandler(logger));

  return app;
};
