import { Router } from 'express';
import type { Knex } from 'knex';
import type { Logger } from 'pino';
import type { AppConfig } from '../config';
import { buildHealthRouter } from './health.routes';
import { buildAuthRouter } from '../domains/auth/auth';

interface ApiRouterDeps {
  knex: Knex;
  config: AppConfig;
  logger: Logger;
}

export const buildApiRouter = ({
  knex,
  config,
  logger,
}: ApiRouterDeps): Router => {
  const router = Router();

  router.use('/health', buildHealthRouter({ knex }));
  router.use('/auth', buildAuthRouter({ knex, config, logger }));

  return router;
};
