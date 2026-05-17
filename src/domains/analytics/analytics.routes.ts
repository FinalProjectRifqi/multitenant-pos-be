import { Router } from 'express';
import type { Knex } from 'knex';
import type { Logger } from 'pino';
import type { AppConfig } from '../../config';
import { asyncHandler } from '../../common/middlewares/async-handler';
import { buildPermissionMiddleware } from '../../common/middlewares/require-permission';
import { validateRequest } from '../../common/middlewares/validate-request';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import {
  AnalyticsDateRangeQueryDto,
  AnalyticsUnitParamsDto,
  MyUnitAnalyticsQueryDto,
} from './dto/analytics-query.dto';
import { AnalyticsRepository } from './repositories/analytics.repository';

interface AnalyticsRouterDeps {
  knex: Knex;
  config: AppConfig;
  logger: Logger;
}

export const buildAnalyticsRouter = ({
  knex,
  config,
  logger,
}: AnalyticsRouterDeps): Router => {
  const router = Router();
  const requirePermission = buildPermissionMiddleware(config, logger);

  const repository = new AnalyticsRepository(knex);
  const service = new AnalyticsService(repository, logger);
  const controller = new AnalyticsController(service);

  router.get(
    '/group/summary',
    requirePermission('analytics:read'),
    validateRequest(AnalyticsDateRangeQueryDto, 'query'),
    asyncHandler((req, res) => controller.getGroupSummary(req, res)),
  );

  router.get(
    '/units/:unitId/summary',
    requirePermission('analytics:read'),
    validateRequest(AnalyticsUnitParamsDto, 'params'),
    validateRequest(AnalyticsDateRangeQueryDto, 'query'),
    asyncHandler((req, res) => controller.getUnitSummary(req, res)),
  );

  router.get(
    '/my/summary',
    requirePermission('analytics:read'),
    validateRequest(MyUnitAnalyticsQueryDto, 'query'),
    asyncHandler((req, res) => controller.getMyUnitSummary(req, res)),
  );

  return router;
};
