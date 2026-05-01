import { Router } from 'express';
import type { Knex } from 'knex';
import type { Logger } from 'pino';
import type { AppConfig } from '../config';
import { buildHealthRouter } from './health.routes';
import { buildAuthRouter } from '../domains/auth/auth';
import { buildBusinessUnitRouter } from '../domains/business-units/business-unit';

export type { RequirePermissionFactory } from '../common/middlewares/require-permission';
export { buildPermissionMiddleware } from '../common/middlewares/require-permission';

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
  router.use(
    '/business-units',
    buildBusinessUnitRouter({ knex, config, logger }),
  );

  return router;
};
