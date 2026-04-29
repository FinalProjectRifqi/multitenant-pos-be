import { Router } from 'express';
import type { Knex } from 'knex';
import { buildHealthRouter } from './health.routes';

interface ApiRouterDeps {
  knex: Knex;
}

export const buildApiRouter = ({ knex }: ApiRouterDeps): Router => {
  const router = Router();

  router.use('/health', buildHealthRouter({ knex }));

  return router;
};
