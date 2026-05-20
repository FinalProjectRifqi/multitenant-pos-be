import { Router } from 'express';
import type { Knex } from 'knex';
import type { Logger } from 'pino';
import type { AppConfig } from '../../config';
import { asyncHandler } from '../../common/middlewares/async-handler';
import { buildPermissionMiddleware } from '../../common/middlewares/require-permission';
import { authorizeRole } from '../../common/middlewares/authorize-role';
import { validateRequest } from '../../common/middlewares/validate-request';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { AnalyticsRepository } from './repositories/analytics.repository';
import { AnalyticsUnitParamsDto } from './dto/analytics-params.dto';
import { AnalyticsPeriodQueryDto } from './dto/analytics-period-query.dto';
import { AnalyticsDailyInventoryQueryDto } from './dto/analytics-daily-inventory-query.dto';
import { AnalyticsGroupCompareQueryDto } from './dto/analytics-group-compare-query.dto';

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

  // ─── Group Analytics (static routes — must come before /:unitId) ────────────

  // GET /v1/analytics/group/summary?period=7d
  router.get(
    '/group/summary',
    requirePermission('analytics:read'),
    authorizeRole(['GROUP_MANAGEMENT']),
    validateRequest(AnalyticsPeriodQueryDto, 'query'),
    asyncHandler((req, res) => controller.getGroupSummary(req, res)),
  );

  // GET /v1/analytics/group/compare?unitIds=uuid1,uuid2&period=7d
  router.get(
    '/group/compare',
    requirePermission('analytics:read'),
    authorizeRole(['GROUP_MANAGEMENT']),
    validateRequest(AnalyticsGroupCompareQueryDto, 'query'),
    asyncHandler((req, res) => controller.getGroupCompare(req, res)),
  );

  // ─── Unit Analytics ──────────────────────────────────────────────────────────

  // GET /v1/analytics/:unitId/kpi?period=7d
  router.get(
    '/:unitId/kpi',
    requirePermission('analytics:read'),
    validateRequest(AnalyticsUnitParamsDto, 'params'),
    validateRequest(AnalyticsPeriodQueryDto, 'query'),
    asyncHandler((req, res) => controller.getKpi(req, res)),
  );

  // GET /v1/analytics/:unitId/sales-trend?period=7d
  router.get(
    '/:unitId/sales-trend',
    requirePermission('analytics:read'),
    validateRequest(AnalyticsUnitParamsDto, 'params'),
    validateRequest(AnalyticsPeriodQueryDto, 'query'),
    asyncHandler((req, res) => controller.getSalesTrend(req, res)),
  );

  // GET /v1/analytics/:unitId/top-menus?period=7d
  router.get(
    '/:unitId/top-menus',
    requirePermission('analytics:read'),
    validateRequest(AnalyticsUnitParamsDto, 'params'),
    validateRequest(AnalyticsPeriodQueryDto, 'query'),
    asyncHandler((req, res) => controller.getTopMenus(req, res)),
  );

  // GET /v1/analytics/:unitId/payments
  router.get(
    '/:unitId/payments',
    requirePermission('analytics:read'),
    validateRequest(AnalyticsUnitParamsDto, 'params'),
    asyncHandler((req, res) => controller.getRecentPayments(req, res)),
  );

  // GET /v1/analytics/:unitId/inventory-status
  router.get(
    '/:unitId/inventory-status',
    requirePermission('analytics:read'),
    validateRequest(AnalyticsUnitParamsDto, 'params'),
    asyncHandler((req, res) => controller.getInventoryStatus(req, res)),
  );

  // GET /v1/analytics/:unitId/daily-inventory?date=YYYY-MM-DD
  router.get(
    '/:unitId/daily-inventory',
    requirePermission('analytics:read'),
    validateRequest(AnalyticsUnitParamsDto, 'params'),
    validateRequest(AnalyticsDailyInventoryQueryDto, 'query'),
    asyncHandler((req, res) => controller.getDailyInventory(req, res)),
  );

  return router;
};
