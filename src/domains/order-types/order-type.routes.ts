import { Router } from 'express';
import { Knex } from 'knex';
import { Logger } from 'pino';
import { asyncHandler } from '../../common/middlewares/async-handler';
import { validateRequest } from '../../common/middlewares/validate-request';
import { AppConfig } from '../../config';
import { buildPermissionMiddleware } from '../../routes/routes';
import { ListOrderTypesQueryDto } from './dto/list-order-type-query.dto';
import { OrderTypeController } from './order-type.controller';
import { OrderTypeService } from './order-type.service';
import { OrderTypeRepository } from './repositories/order-type.repository';

interface OrderTypeRouterDeps {
  knex: Knex;
  config: AppConfig;
  logger: Logger;
}

export const buildOrderTypeRouter = ({
  knex,
  config,
  logger,
}: OrderTypeRouterDeps): Router => {
  const router = Router();
  const requirePermission = buildPermissionMiddleware(config, logger);

  const repository = new OrderTypeRepository(knex);
  const service = new OrderTypeService(repository, logger);
  const controller = new OrderTypeController(service);

  router.get(
    '/',
    requirePermission('order_type:read'),
    validateRequest(ListOrderTypesQueryDto, 'query'),
    asyncHandler((req, res) => controller.listOrderTypes(req, res)),
  );

  return router;
};
