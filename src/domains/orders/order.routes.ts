import { Router } from 'express';
import type { Knex } from 'knex';
import type { Logger } from 'pino';
import type { AppConfig } from '../../config';
import { asyncHandler } from '../../common/middlewares/async-handler';
import { buildPermissionMiddleware } from '../../common/middlewares/require-permission';
import { validateRequest } from '../../common/middlewares/validate-request';
import { CreateOrderDto } from './dto/create-order.dto';
import { CreateCashPaymentDto } from './dto/create-cash-payment.dto';
import { CreateCashlessPaymentDto } from './dto/create-cashless-payment.dto';
import { ListOrdersQueryDto } from './dto/list-orders-query.dto';
import { OrderItemParamsDto, OrderUnitParamsDto } from './dto/order-params.dto';
import {
  PaymentItemParamsDto,
  PaymentOrderParamsDto,
} from './dto/payment-params.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { OrderRepository } from './repositories/order.repository';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { PaymentRepository } from './repositories/payment.repository';

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

  const paymentRepository = new PaymentRepository(knex);
  const paymentService = new PaymentService(
    repository,
    paymentRepository,
    config,
    logger,
  );
  const paymentController = new PaymentController(paymentService);

  // POST /payments/midtrans/webhook — public webhook endpoint
  router.post(
    '/payments/midtrans/webhook',
    asyncHandler((req, res) =>
      paymentController.handleMidtransWebhook(req, res),
    ),
  );

  // POST /:unitId/:orderId/payments/cashless — create cashless payment
  router.post(
    '/:unitId/:orderId/payments/cashless',
    requirePermission('payment:process'),
    validateRequest(PaymentOrderParamsDto, 'params'),
    validateRequest(CreateCashlessPaymentDto, 'body'),
    asyncHandler((req, res) =>
      paymentController.createCashlessPayment(req, res),
    ),
  );

  // POST /:unitId/:orderId/payments/cash — create cash payment
  router.post(
    '/:unitId/:orderId/payments/cash',
    requirePermission('payment:process'),
    validateRequest(PaymentOrderParamsDto, 'params'),
    validateRequest(CreateCashPaymentDto, 'body'),
    asyncHandler((req, res) => paymentController.createCashPayment(req, res)),
  );

  // GET /:unitId/:orderId/payments — list payments for order
  router.get(
    '/:unitId/:orderId/payments',
    requirePermission('payment:read'),
    validateRequest(PaymentOrderParamsDto, 'params'),
    asyncHandler((req, res) => paymentController.listPayments(req, res)),
  );

  // GET /:unitId/:orderId/payments/:paymentId — payment detail
  router.get(
    '/:unitId/:orderId/payments/:paymentId',
    requirePermission('payment:read'),
    validateRequest(PaymentItemParamsDto, 'params'),
    asyncHandler((req, res) => paymentController.getPaymentById(req, res)),
  );

  // DELETE /:unitId/:orderId/payments/:paymentId — cancel cashless payment
  router.delete(
    '/:unitId/:orderId/payments/:paymentId',
    requirePermission('payment:process'),
    validateRequest(PaymentItemParamsDto, 'params'),
    asyncHandler((req, res) =>
      paymentController.cancelCashlessPayment(req, res),
    ),
  );

  // POST /:unitId/:orderId/payments/:paymentId/simulate-success — simulate settlement webhook
  router.post(
    '/:unitId/:orderId/payments/:paymentId/simulate-success',
    requirePermission('payment:process'),
    validateRequest(PaymentItemParamsDto, 'params'),
    asyncHandler((req, res) =>
      paymentController.simulateMidtransSettlement(req, res),
    ),
  );

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
