import { Router } from 'express';
import type { Knex } from 'knex';
import type { Logger } from 'pino';
import type { AppConfig } from '../../config';
import { asyncHandler } from '../../common/middlewares/async-handler';
import { buildPermissionMiddleware } from '../../common/middlewares/require-permission';
import { validateRequest } from '../../common/middlewares/validate-request';
import { InventarisController } from './inventaris.controller';
import { InventarisService } from './inventaris.service';
import {
  InventarisDailyPlanParamsDto,
  InventarisDailyRealizationParamsDto,
  InventarisBusinessIdParamsDto,
  InventarisItemParamsDto,
} from './dto/inventaris-params.dto';
import { ListInventarisQueryDto } from './dto/list-inventaris-query.dto';
import { CreateInventarisItemDto } from './dto/create-inventaris-item.dto';
import { UpdateInventarisItemDto } from './dto/update-inventaris-item.dto';
import { ListInventoryTransactionsQueryDto } from './dto/list-inventory-transactions-query.dto';
import { CreateInventoryTransactionDto } from './dto/create-inventory-transaction.dto';
import {
  CreateDailyInventoryPlanDto,
  ListDailyInventoryPlanQueryDto,
  UpdateDailyInventoryPlanDto,
} from './dto/daily-inventory-plan.dto';
import {
  CreateDailyInventoryRealizationDto,
  ListDailyInventoryRealizationQueryDto,
} from './dto/daily-inventory-realization.dto';
import {
  DailyUsageReportQueryDto,
  VarianceReportQueryDto,
} from './dto/inventory-report-query.dto';
import { InventarisRepository } from './repositories/inventaris.repository';

interface InventarisRouterDeps {
  knex: Knex;
  config: AppConfig;
  logger: Logger;
}

export const buildInventarisRouter = ({
  knex,
  config,
  logger,
}: InventarisRouterDeps): Router => {
  const router = Router();
  const requirePermission = buildPermissionMiddleware(config, logger);

  const repository = new InventarisRepository(knex);
  const service = new InventarisService(repository, logger);
  const controller = new InventarisController(service);

  router.post(
    '/:businessId/daily-plans',
    requirePermission(['inventory:read', 'inventory:create']),
    validateRequest(InventarisBusinessIdParamsDto, 'params'),
    validateRequest(CreateDailyInventoryPlanDto),
    asyncHandler((req, res) => controller.createDailyPlan(req, res)),
  );

  router.get(
    '/:businessId/daily-plans',
    requirePermission('inventory:read'),
    validateRequest(InventarisBusinessIdParamsDto, 'params'),
    validateRequest(ListDailyInventoryPlanQueryDto, 'query'),
    asyncHandler((req, res) => controller.listDailyPlans(req, res)),
  );

  router.get(
    '/:businessId/daily-plans/:dailyPlanId',
    requirePermission('inventory:read'),
    validateRequest(InventarisDailyPlanParamsDto, 'params'),
    asyncHandler((req, res) => controller.getDailyPlanById(req, res)),
  );

  router.patch(
    '/:businessId/daily-plans/:dailyPlanId',
    requirePermission(['inventory:read', 'inventory:update']),
    validateRequest(InventarisDailyPlanParamsDto, 'params'),
    validateRequest(UpdateDailyInventoryPlanDto),
    asyncHandler((req, res) => controller.updateDailyPlan(req, res)),
  );

  router.delete(
    '/:businessId/daily-plans/:dailyPlanId',
    requirePermission(['inventory:read', 'inventory:delete']),
    validateRequest(InventarisDailyPlanParamsDto, 'params'),
    asyncHandler((req, res) => controller.deleteDailyPlan(req, res)),
  );

  router.post(
    '/:businessId/daily-realizations',
    requirePermission(['inventory:read', 'inventory:create']),
    validateRequest(InventarisBusinessIdParamsDto, 'params'),
    validateRequest(CreateDailyInventoryRealizationDto),
    asyncHandler((req, res) => controller.submitDailyRealization(req, res)),
  );

  router.get(
    '/:businessId/daily-realizations',
    requirePermission('inventory:read'),
    validateRequest(InventarisBusinessIdParamsDto, 'params'),
    validateRequest(ListDailyInventoryRealizationQueryDto, 'query'),
    asyncHandler((req, res) => controller.listDailyRealizations(req, res)),
  );

  router.get(
    '/:businessId/daily-realizations/:dailyRealizationId',
    requirePermission('inventory:read'),
    validateRequest(InventarisDailyRealizationParamsDto, 'params'),
    asyncHandler((req, res) => controller.getDailyRealizationById(req, res)),
  );

  router.get(
    '/:businessId/reports/daily-usage',
    requirePermission('inventory:read'),
    validateRequest(InventarisBusinessIdParamsDto, 'params'),
    validateRequest(DailyUsageReportQueryDto, 'query'),
    asyncHandler((req, res) => controller.getDailyUsageReport(req, res)),
  );

  router.get(
    '/:businessId/reports/variance',
    requirePermission('inventory:read'),
    validateRequest(InventarisBusinessIdParamsDto, 'params'),
    validateRequest(VarianceReportQueryDto, 'query'),
    asyncHandler((req, res) => controller.getVarianceReport(req, res)),
  );

  router.get(
    '/:businessId/items',
    requirePermission('inventory:read'),
    validateRequest(InventarisBusinessIdParamsDto, 'params'),
    validateRequest(ListInventarisQueryDto, 'query'),
    asyncHandler((req, res) => controller.listItems(req, res)),
  );

  router.get(
    '/:businessId/stats',
    requirePermission('inventory:read'),
    validateRequest(InventarisBusinessIdParamsDto, 'params'),
    asyncHandler((req, res) => controller.getStats(req, res)),
  );

  router.post(
    '/:businessId/items',
    requirePermission(['inventory:read', 'inventory:create']),
    validateRequest(InventarisBusinessIdParamsDto, 'params'),
    validateRequest(CreateInventarisItemDto),
    asyncHandler((req, res) => controller.createItem(req, res)),
  );

  router.get(
    '/:businessId/transactions',
    requirePermission('inventory:read'),
    validateRequest(InventarisBusinessIdParamsDto, 'params'),
    validateRequest(ListInventoryTransactionsQueryDto, 'query'),
    asyncHandler((req, res) => controller.listTransactions(req, res)),
  );

  router.post(
    '/:businessId/transactions',
    requirePermission(['inventory:read', 'inventory:create']),
    validateRequest(InventarisBusinessIdParamsDto, 'params'),
    validateRequest(CreateInventoryTransactionDto),
    asyncHandler((req, res) => controller.createTransaction(req, res)),
  );

  router.get(
    '/:businessId/items/:inventoryItemId',
    requirePermission('inventory:read'),
    validateRequest(InventarisItemParamsDto, 'params'),
    asyncHandler((req, res) => controller.getItemById(req, res)),
  );

  router.patch(
    '/:businessId/items/:inventoryItemId',
    requirePermission(['inventory:read', 'inventory:update']),
    validateRequest(InventarisItemParamsDto, 'params'),
    validateRequest(UpdateInventarisItemDto),
    asyncHandler((req, res) => controller.updateItem(req, res)),
  );

  router.delete(
    '/:businessId/items/:inventoryItemId',
    requirePermission(['inventory:read', 'inventory:delete']),
    validateRequest(InventarisItemParamsDto, 'params'),
    asyncHandler((req, res) => controller.deleteItem(req, res)),
  );

  return router;
};
