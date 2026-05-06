import type { Logger } from 'pino';
import type { AppConfig } from '../../config';
import type { OrderEventBus } from '../../common/events/order-event-bus';
import { AppError } from '../../common/errors/app-error';
import { ErrorCodes } from '../../common/errors/error-codes';
import { unitNotFoundError } from '../business-units/errors/business-unit.errors';
import {
  orderAlreadyCancelledError,
  orderAlreadyCompletedError,
  orderCannotBeCancelledError,
  orderNotFoundError,
  orderStatusNotFoundError,
} from '../orders/errors/order.errors';
import type {
  OrderDetailApiResponse,
  OrderCancelApiResponse,
} from '../orders/models/order.model';
import type { IOrderRepository } from '../orders/repositories/order.repository';
import { mapOrderDetailResponse } from '../orders/order-response.mapper';
import {
  assertKdsOrderStatusTransition,
  resolveStatusCode,
} from '../orders/order-status-transition';
import type { KdsOrderStatusTransitionDto } from './dto/kds-order-status-transition.dto';

export interface KdsRequestContext {
  userId?: string;
  correlationId?: string;
}

export class KdsOrderStatusService {
  constructor(
    private readonly repository: IOrderRepository,
    private readonly config: AppConfig,
    private readonly logger: Logger,
    private readonly orderEventBus: OrderEventBus,
  ) {}

  async transitionOrderStatus(
    unitId: string,
    orderId: string,
    dto: KdsOrderStatusTransitionDto,
    reqContext: KdsRequestContext,
  ): Promise<OrderDetailApiResponse> {
    try {
      const hasId =
        dto.order_status_id !== undefined && dto.order_status_id !== '';
      const codeTrimmed = dto.order_status_code?.trim() ?? '';
      const hasCode = codeTrimmed.length > 0;

      if ((!hasId && !hasCode) || (hasId && hasCode)) {
        throw new AppError({
          code: ErrorCodes.ValidationFailed,
          message:
            'Kirim salah satu antara order_status_id atau order_status_code, tidak keduanya',
          status: 400,
        });
      }

      this.logger.info(
        {
          unitId,
          orderId,
          hasId,
          order_status_code: hasCode ? codeTrimmed : undefined,
        },
        'KDS order status transition',
      );

      const unit = await this.repository.findUnitById(unitId);
      if (!unit) {
        this.logger.warn({ unitId }, 'KDS transition failed - unit not found');
        throw unitNotFoundError();
      }

      const existingOrder = await this.repository.findById(unitId, orderId);
      if (!existingOrder) {
        this.logger.warn(
          { unitId, orderId },
          'KDS transition failed - order not found',
        );
        throw orderNotFoundError();
      }

      const currentStatusValue =
        existingOrder.order_status_code ?? existingOrder.order_status_name;

      if (!currentStatusValue) {
        throw orderStatusNotFoundError();
      }

      const currentStatusCode = resolveStatusCode(currentStatusValue);

      if (currentStatusCode === 'SELESAI') {
        throw orderAlreadyCompletedError();
      }

      if (currentStatusCode === 'DIBATALKAN') {
        throw orderAlreadyCancelledError();
      }

      type ResolvedStatusRow = NonNullable<
        Awaited<ReturnType<IOrderRepository['findOrderStatusById']>>
      >;

      let nextRow: ResolvedStatusRow;

      if (hasId) {
        const row = await this.repository.findOrderStatusById(
          dto.order_status_id!,
        );
        if (!row) {
          throw orderStatusNotFoundError();
        }
        nextRow = row;
      } else {
        const row = await this.repository.findOrderStatusByCode(codeTrimmed);
        if (!row) {
          throw orderStatusNotFoundError();
        }
        nextRow = row;
      }

      const nextStatusCode = resolveStatusCode(nextRow.order_status_code);

      console.log('current Status: ', currentStatusCode);

      console.log('next status: ', nextStatusCode);

      assertKdsOrderStatusTransition(currentStatusCode, nextStatusCode);

      await this.repository.transaction(async (trx) => {
        await this.repository.update(
          orderId,
          { order_status_id: nextRow.order_status_id },
          trx,
        );
      });

      const refreshed = await this.repository.findById(unitId, orderId);
      const items = await this.repository.findOrderItemsByOrderId(orderId);

      this.orderEventBus.publish({
        type: 'ORDER_STATUS_CHANGED',
        occurredAt: new Date().toISOString(),
        correlationId: reqContext.correlationId,
        payload: {
          unitId,
          orderId,
          action: 'TRANSITION',
          fromStatusId: existingOrder.order_status_id,
          fromStatusCode: currentStatusCode,
          toStatusId: nextRow.order_status_id,
          toStatusCode: nextStatusCode,
          userId: reqContext.userId,
        },
      });

      return {
        success: true,
        statusCode: 200,
        message: 'Status order berhasil diperbarui dari Kitchen Display',
        data: mapOrderDetailResponse(refreshed!, items),
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      this.logger.error(
        { err: error, unitId, orderId },
        'Unexpected error during KDS order status transition',
      );
      throw new AppError({
        code: ErrorCodes.Internal,
        message: 'Terjadi kesalahan internal',
        status: 500,
      });
    }
  }

  async cancelOrderFromKds(
    unitId: string,
    orderId: string,
    reqContext: KdsRequestContext,
  ): Promise<OrderCancelApiResponse> {
    try {
      this.logger.info({ unitId, orderId }, 'KDS order cancel');

      const unit = await this.repository.findUnitById(unitId);
      if (!unit) {
        this.logger.warn({ unitId }, 'KDS cancel failed - unit not found');
        throw unitNotFoundError();
      }

      const existingOrder = await this.repository.findById(unitId, orderId);
      if (!existingOrder) {
        this.logger.warn(
          { unitId, orderId },
          'KDS cancel failed - order not found',
        );
        throw orderNotFoundError();
      }

      const currentStatusValue =
        existingOrder.order_status_code ?? existingOrder.order_status_name;

      if (!currentStatusValue) {
        throw orderStatusNotFoundError();
      }

      const currentStatusCode = resolveStatusCode(currentStatusValue);

      if (currentStatusCode === 'DIBATALKAN') {
        throw orderAlreadyCancelledError();
      }

      if (currentStatusCode !== 'BARU_MASUK') {
        throw orderCannotBeCancelledError();
      }

      const cancelStatusId = this.config.order.cancelStatusUuid;
      const cancelRow =
        await this.repository.findOrderStatusById(cancelStatusId);

      await this.repository.transaction(async (trx) => {
        await this.repository.softDeleteOrder(orderId, cancelStatusId, trx);
        await this.repository.softDeleteOrderItemsByOrderId(orderId, trx);
      });

      const toStatusCode =
        cancelRow?.order_status_code !== undefined &&
        cancelRow.order_status_code !== ''
          ? resolveStatusCode(cancelRow.order_status_code)
          : 'DIBATALKAN';

      this.orderEventBus.publish({
        type: 'ORDER_STATUS_CHANGED',
        occurredAt: new Date().toISOString(),
        correlationId: reqContext.correlationId,
        payload: {
          unitId,
          orderId,
          action: 'CANCEL',
          fromStatusId: existingOrder.order_status_id,
          fromStatusCode: currentStatusCode,
          toStatusId: cancelStatusId,
          toStatusCode,
          userId: reqContext.userId,
        },
      });

      return {
        success: true,
        statusCode: 200,
        message: 'Order berhasil dibatalkan',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      this.logger.error(
        { err: error, unitId, orderId },
        'Unexpected error during KDS order cancel',
      );
      throw new AppError({
        code: ErrorCodes.Internal,
        message: 'Terjadi kesalahan internal',
        status: 500,
      });
    }
  }
}
