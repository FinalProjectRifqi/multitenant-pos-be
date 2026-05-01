import { Router } from 'express';
import type { Knex } from 'knex';
import type { Logger } from 'pino';
import type { AppConfig } from '../../config';
import { asyncHandler } from '../../common/middlewares/async-handler';
import { validateRequest } from '../../common/middlewares/validate-request';
import { buildPermissionMiddleware } from '../../common/middlewares/require-permission';
import { BusinessUnitController } from './business-unit.controller';
import { BusinessUnitService } from './business-unit.service';
import { BusinessUnitRepository } from './repositories/business-unit.repository';
import { CreateBusinessUnitDto } from './dto/create-business-unit.dto';
import { UpdateBusinessUnitDto } from './dto/update-business-unit.dto';
import { ListBusinessUnitsQueryDto } from './dto/list-business-units-query.dto';
import { BusinessUnitParamsDto } from './dto/business-unit-params.dto';

interface BusinessUnitRouterDeps {
  knex: Knex;
  config: AppConfig;
  logger: Logger;
}

export const buildBusinessUnitRouter = ({
  knex,
  config,
  logger,
}: BusinessUnitRouterDeps): Router => {
  const router = Router();
  const requirePermission = buildPermissionMiddleware(config, logger);

  const repository = new BusinessUnitRepository(knex);
  const service = new BusinessUnitService(repository, logger);
  const controller = new BusinessUnitController(service);

  router.get(
    '/',
    requirePermission('unit:read'),
    validateRequest(ListBusinessUnitsQueryDto, 'query'),
    asyncHandler((req, res) => controller.listBusinessUnits(req, res)),
  );

  // /stats must be defined BEFORE /:id to avoid "stats" being treated as an ID
  router.get(
    '/stats',
    requirePermission('unit:read'),
    asyncHandler((req, res) => controller.getBusinessUnitStats(req, res)),
  );

  router.post(
    '/',
    requirePermission(['unit:read', 'unit:create']),
    validateRequest(CreateBusinessUnitDto),
    asyncHandler((req, res) => controller.createBusinessUnit(req, res)),
  );

  router.get(
    '/:id',
    requirePermission('unit:read'),
    validateRequest(BusinessUnitParamsDto, 'params'),
    asyncHandler((req, res) => controller.getBusinessUnitById(req, res)),
  );

  router.patch(
    '/:id',
    requirePermission(['unit:read', 'unit:update']),
    validateRequest(BusinessUnitParamsDto, 'params'),
    validateRequest(UpdateBusinessUnitDto),
    asyncHandler((req, res) => controller.updateBusinessUnit(req, res)),
  );

  router.delete(
    '/:id',
    requirePermission(['unit:read', 'unit:delete']),
    validateRequest(BusinessUnitParamsDto, 'params'),
    asyncHandler((req, res) => controller.deleteBusinessUnit(req, res)),
  );

  return router;
};
