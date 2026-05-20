import { Router } from 'express';
import type { Knex } from 'knex';
import type { Logger } from 'pino';
import type { AppConfig } from '../../config';
import { authorizeRole } from '../../common/middlewares/authorize-role';
import { asyncHandler } from '../../common/middlewares/async-handler';
import { buildPermissionMiddleware } from '../../common/middlewares/require-permission';
import { validateRequest } from '../../common/middlewares/validate-request';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import {
  AnalyticsDateRangeQueryDto,
  AnalyticsUnitParamsDto,
  CompareUnitsAnalyticsQueryDto,
  GroupSummaryAnalyticsQueryDto,
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
    authorizeRole(['GROUP_MANAGEMENT']),
    validateRequest(GroupSummaryAnalyticsQueryDto, 'query'),
    asyncHandler((req, res) => controller.getGroupSummary(req, res)),
  );

  router.get(
    '/group/compare-units',
    requirePermission('analytics:read'),
    authorizeRole(['GROUP_MANAGEMENT']),
    validateRequest(CompareUnitsAnalyticsQueryDto, 'query'),
    asyncHandler((req, res) => controller.compareGroupUnits(req, res)),
  );

  router.get(
    '/group/units/:unitId',
    requirePermission('analytics:read'),
    authorizeRole(['GROUP_MANAGEMENT']),
    validateRequest(AnalyticsUnitParamsDto, 'params'),
    validateRequest(AnalyticsDateRangeQueryDto, 'query'),
    asyncHandler((req, res) => controller.getGroupUnitReport(req, res)),
  );

  router.get(
    '/unit/report',
    requirePermission('analytics:read'),
    authorizeRole(['UNIT_MANAGER']),
    validateRequest(MyUnitAnalyticsQueryDto, 'query'),
    asyncHandler((req, res) => controller.getUnitManagerReport(req, res)),
  );

  router.get(
    '/units/:unitId/summary',
    requirePermission('analytics:read'),
    authorizeRole(['GROUP_MANAGEMENT']),
    validateRequest(AnalyticsUnitParamsDto, 'params'),
    validateRequest(AnalyticsDateRangeQueryDto, 'query'),
    asyncHandler((req, res) => controller.getGroupUnitReport(req, res)),
  );

  router.get(
    '/my/summary',
    requirePermission('analytics:read'),
    authorizeRole(['UNIT_MANAGER']),
    validateRequest(MyUnitAnalyticsQueryDto, 'query'),
    asyncHandler((req, res) => controller.getUnitManagerReport(req, res)),
  );

  return router;
};
