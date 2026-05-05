import { Router } from 'express';
import type { Knex } from 'knex';
import type { Logger } from 'pino';
import type { AppConfig } from '../../config';
import { asyncHandler } from '../../common/middlewares/async-handler';
import { buildPermissionMiddleware } from '../../common/middlewares/require-permission';
import { validateRequest } from '../../common/middlewares/validate-request';
import { CreateOrderDto } from './dto/create-order.dto';
import { ListOrdersQueryDto } from './dto/list-orders-query.dto';
import { OrderItemParamsDto, OrderUnitParamsDto } from './dto/order-params.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { OrderRepository } from './repositories/order.repository';

interface OrderRouterDeps {
  knex: Knex;
  config: AppConfig;
  logger: Logger;
}

export const buildOrderRouter = ({
  knex,
  config,
  logger,
}: OrderRouterDeps): Router => {
  const router = Router();
  const requirePermission = buildPermissionMiddleware(config, logger);

  const repository = new OrderRepository(knex);
  const service = new OrderService(repository, config, logger);
  const controller = new OrderController(service);

  // GET /:unitId — list all orders for a unit
  router.get(
    '/:unitId',
    requirePermission(['order:read']),
    validateRequest(OrderUnitParamsDto, 'params'),
    validateRequest(ListOrdersQueryDto, 'query'),
    asyncHandler((req, res) => controller.listOrders(req, res)),
  );

  // POST /:unitId — create a new order
  router.post(
    '/:unitId',
    requirePermission(['order:read', 'order:create']),
    validateRequest(OrderUnitParamsDto, 'params'),
    validateRequest(CreateOrderDto, 'body'),
    asyncHandler((req, res) => controller.createOrder(req, res)),
  );

  // GET /:unitId/:orderId — get order detail
  // NOTE: must be defined after POST /:unitId to avoid route conflicts
  router.get(
    '/:unitId/:orderId',
    requirePermission(['order:read']),
    validateRequest(OrderItemParamsDto, 'params'),
    asyncHandler((req, res) => controller.getOrderById(req, res)),
  );

  // PATCH /:unitId/:orderId — update order
  router.patch(
    '/:unitId/:orderId',
    requirePermission(['order:read', 'order:update']),
    validateRequest(OrderItemParamsDto, 'params'),
    validateRequest(UpdateOrderDto, 'body'),
    asyncHandler((req, res) => controller.updateOrder(req, res)),
  );

  // DELETE /:unitId/:orderId — cancel order
  router.delete(
    '/:unitId/:orderId',
    requirePermission(['order:read', 'order:delete']),
    validateRequest(OrderItemParamsDto, 'params'),
    asyncHandler((req, res) => controller.cancelOrder(req, res)),
  );

  return router;
};
