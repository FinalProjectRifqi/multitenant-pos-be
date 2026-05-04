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
  InventarisBusinessIdParamsDto,
  InventarisItemParamsDto,
} from './dto/inventaris-params.dto';
import { ListInventarisQueryDto } from './dto/list-inventaris-query.dto';
import { CreateInventarisItemDto } from './dto/create-inventaris-item.dto';
import { UpdateInventarisItemDto } from './dto/update-inventaris-item.dto';
import { ListInventoryTransactionsQueryDto } from './dto/list-inventory-transactions-query.dto';
import { CreateInventoryTransactionDto } from './dto/create-inventory-transaction.dto';
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

  router.get(
    '/:businessId',
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
    '/:businessId',
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
    '/:businessId/:inventoryItemId',
    requirePermission('inventory:read'),
    validateRequest(InventarisItemParamsDto, 'params'),
    asyncHandler((req, res) => controller.getItemById(req, res)),
  );

  router.patch(
    '/:businessId/:inventoryItemId',
    requirePermission(['inventory:read', 'inventory:update']),
    validateRequest(InventarisItemParamsDto, 'params'),
    validateRequest(UpdateInventarisItemDto),
    asyncHandler((req, res) => controller.updateItem(req, res)),
  );

  router.delete(
    '/:businessId/:inventoryItemId',
    requirePermission(['inventory:read', 'inventory:delete']),
    validateRequest(InventarisItemParamsDto, 'params'),
    asyncHandler((req, res) => controller.deleteItem(req, res)),
  );

  return router;
};
