import { Router } from 'express';
import type { Knex } from 'knex';
import { ErrorCodes } from '../common/errors/error-codes';

interface HealthRouterDeps {
  knex: Knex;
}

export const buildHealthRouter = ({ knex }: HealthRouterDeps): Router => {
  const router = Router();

  router.get('/', async (_req, res) => {
    const startedAt = Date.now();

    try {
      await knex.raw('SELECT 1');

      res.status(200).json({
        success: true,
        data: {
          status: 'ok',
          db: 'ok',
          durationMs: Date.now() - startedAt,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      res.status(503).json({
        success: false,
        error: {
          code: ErrorCodes.DatabaseUnavailable,
          message: 'Database unavailable',
        },
        data: {
          status: 'degraded',
          db: 'down',
          durationMs: Date.now() - startedAt,
          timestamp: new Date().toISOString(),
        },
      });
    }
  });

  return router;
};
