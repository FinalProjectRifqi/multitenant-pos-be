import { Router } from 'express';
import type { Knex } from 'knex';
import type { Logger } from 'pino';
import type { AppConfig } from '../../config';
import type { OrderEventBus } from '../../common/events/order-event-bus';
import { asyncHandler } from '../../common/middlewares/async-handler';
import { buildPermissionMiddleware } from '../../common/middlewares/require-permission';
import { validateRequest } from '../../common/middlewares/validate-request';
import { OrderItemParamsDto } from '../orders/dto/order-params.dto';
import { OrderRepository } from '../orders/repositories/order.repository';
import { KdsOrderStatusTransitionDto } from './dto/kds-order-status-transition.dto';
import { KdsOrderStatusController } from './kds-order-status.controller';
import { KdsOrderStatusService } from './kds-order-status.service';

interface KdsOrderStatusRouterDeps {
  knex: Knex;
  config: AppConfig;
  logger: Logger;
  orderEventBus: OrderEventBus;
}

export const buildKdsOrderStatusRouter = ({
  knex,
  config,
  logger,
  orderEventBus,
}: KdsOrderStatusRouterDeps): Router => {
  const router = Router();
  const requirePermission = buildPermissionMiddleware(config, logger);

  const repository = new OrderRepository(knex);
  const service = new KdsOrderStatusService(
    repository,
    config,
    logger,
    orderEventBus,
  );
  const controller = new KdsOrderStatusController(service);

  router.post(
    '/:unitId/:orderId/transition',
    requirePermission(['order_status:read', 'order_status:update']),
    validateRequest(OrderItemParamsDto, 'params'),
    validateRequest(KdsOrderStatusTransitionDto),
    asyncHandler((req, res) => controller.transition(req, res)),
  );

  router.post(
    '/:unitId/:orderId/cancel',
    requirePermission(['order_status:read', 'order_status:delete']),
    validateRequest(OrderItemParamsDto, 'params'),
    asyncHandler((req, res) => controller.cancel(req, res)),
  );

  return router;
};
