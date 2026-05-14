import crypto from 'node:crypto';
import type { Logger } from 'pino';
import type { AppConfig } from '../../config';
import { AppError } from '../../common/errors/app-error';
import { ErrorCodes } from '../../common/errors/error-codes';
import { unitNotFoundError } from '../business-units/errors/business-unit.errors';
import { orderNotFoundError } from './errors/order.errors';
import {
  paymentAlreadyActiveError,
  paymentAmountMismatchError,
  paymentCannotBeCancelledError,
  paymentMidtransRequestFailedError,
  paymentNotFoundError,
  paymentOrderNotReadyError,
  paymentWebhookInvalidPayloadError,
  paymentWebhookSignatureInvalidError,
} from './errors/payment.errors';
import type {
  PaymentCancelApiResponse,
  PaymentCashlessCreateApiResponse,
  PaymentCreateApiResponse,
  PaymentDetailApiResponse,
  PaymentListApiResponse,
  PaymentResponse,
  PaymentRow,
  PaymentStatus,
  PaymentWebhookApiResponse,
} from './models/payment.model';
import type { CreateCashlessPaymentDto } from './dto/create-cashless-payment.dto';
import type { CreateCashPaymentDto } from './dto/create-cash-payment.dto';
import type { IOrderRepository } from './repositories/order.repository';
import type { IPaymentRepository } from './repositories/payment.repository';

const PRICE_TOLERANCE = 1;
const CASHLESS_EXPIRY_MINUTES = 15;

interface MidtransQrisAction {
  name: string;
  method: string;
  url: string;
}

interface MidtransQrisChargeResponse {
  status_code: string;
  status_message: string;
  transaction_id: string;
  order_id: string;
  gross_amount: string;
  payment_type: string;
  transaction_status: string;
  qr_string: string;
  acquirer: string;
  actions: MidtransQrisAction[];
}

interface MidtransWebhookPayload {
  reference_number?: string;
  order_id?: string;
  status_code?: string;
  gross_amount?: string;
  transaction_status?: string;
  fraud_status?: string;
  signature_key?: string;
  status_message?: string;
  transaction_time?: string;
  settlement_time?: string;
}

export class PaymentService {
  constructor(
    private readonly orderRepository: IOrderRepository,
    private readonly paymentRepository: IPaymentRepository,
    private readonly config: AppConfig,
    private readonly logger: Logger,
  ) {}

  // ===========================
  // Cashless Payment (Midtrans QRIS Core API)
  // ===========================

  async createCashlessPayment(
    unitId: string,
    orderId: string,
    userId: string,
    dto: CreateCashlessPaymentDto,
  ): Promise<PaymentCashlessCreateApiResponse> {
    try {
      this.logger.info(
        { unitId, orderId, userId },
        'Creating cashless payment',
      );

      const unit = await this.orderRepository.findUnitById(unitId);
      if (!unit) {
        this.logger.warn(
          { unitId },
          'Cashless payment failed - unit not found',
        );
        throw unitNotFoundError();
      }

      const order = await this.orderRepository.findById(unitId, orderId);
      if (!order) {
        this.logger.warn(
          { unitId, orderId },
          'Cashless payment failed - order not found',
        );
        throw orderNotFoundError();
      }

      this.ensureOrderReady(order.order_status_id);
      this.validateAmount(dto.amount, order.total_amount);

      const activePayment =
        await this.paymentRepository.findActiveByOrderId(orderId);
      if (activePayment) {
        if (activePayment.payment_status === 'paid') {
          this.logger.warn(
            { unitId, orderId, paymentId: activePayment.payment_id },
            'Cashless payment failed - order already paid',
          );
          throw paymentAlreadyActiveError();
        }

        // Payment is 'pending' — check if it has expired
        const nowCheck = new Date();
        if (activePayment.expired_at <= nowCheck) {
          // Expired locally — mark as expired and fall through to create new
          this.logger.info(
            { unitId, orderId, paymentId: activePayment.payment_id },
            'Existing pending payment expired — marking expired and creating new',
          );
          try {
            await this.paymentRepository.updateStatus(
              activePayment.payment_id,
              {
                payment_status: 'expired',
              },
            );
          } catch (updateError) {
            this.logger.error(
              { err: updateError, paymentId: activePayment.payment_id },
              'Failed to mark expired payment as expired',
            );
          }
          // fall through to create new payment
        } else {
          // Still valid — fetch QR from Midtrans and return existing payment
          this.logger.info(
            { unitId, orderId, paymentId: activePayment.payment_id },
            'Resuming existing pending QRIS payment',
          );
          const qrisStatus = await this.getQrisTransactionStatus(
            activePayment.reference_number,
          );
          const grossAmount = this.formatGrossAmount(activePayment.amount);
          const webhookSignatureKey = this.buildMidtransSignature(
            activePayment.reference_number,
            '200',
            grossAmount,
          );
          return {
            success: true,
            statusCode: 201,
            message: 'Payment cashless berhasil dibuat',
            data: {
              payment: this.mapToResponse(activePayment),
              qr_code_url: qrisStatus.qr_code_url,
              qr_string: qrisStatus.qr_string,
              acquirer: qrisStatus.acquirer,
              webhook_signature_key: webhookSignatureKey,
            },
          };
        }
      }

      const referenceNumber = this.generateReferenceNumber(order.order_number);
      const now = new Date();
      const expiredAt = new Date(
        now.getTime() + CASHLESS_EXPIRY_MINUTES * 60 * 1000,
      );

      const { payment_id } = await this.paymentRepository.create({
        order_id: orderId,
        reference_number: referenceNumber,
        amount: dto.amount,
        payment_status: 'pending',
        failure_reason: null,
        expired_at: expiredAt,
      });

      let qrisResult: {
        transaction_id: string;
        qr_code_url: string;
        qr_string: string;
        acquirer: string;
      };
      try {
        qrisResult = await this.chargeQris(
          referenceNumber,
          dto.amount,
          order.customer_name,
        );
      } catch (error) {
        const failureReason =
          error instanceof AppError
            ? error.message
            : 'Gagal membuat transaksi ke Midtrans';

        try {
          await this.paymentRepository.updateStatus(payment_id, {
            payment_status: 'failed',
            failure_reason: this.trimFailureReason(failureReason),
          });
        } catch (updateError) {
          this.logger.error(
            { err: updateError, paymentId: payment_id },
            'Failed to mark payment as failed after Midtrans error',
          );
        }

        throw error;
      }

      const payment = await this.paymentRepository.findById(
        unitId,
        orderId,
        payment_id,
      );
      if (!payment) {
        this.logger.error(
          { unitId, orderId, paymentId: payment_id },
          'Payment created but not found',
        );
        throw new AppError({
          code: ErrorCodes.Internal,
          message: 'Terjadi kesalahan internal',
          status: 500,
        });
      }

      this.logger.info(
        { unitId, orderId, paymentId: payment_id },
        'Cashless payment created successfully',
      );

      const grossAmount = this.formatGrossAmount(dto.amount);
      const webhookSignatureKey = this.buildMidtransSignature(
        referenceNumber,
        '200',
        grossAmount,
      );

      return {
        success: true,
        statusCode: 201,
        message: 'Payment cashless berhasil dibuat',
        data: {
          payment: this.mapToResponse(payment),
          qr_code_url: qrisResult.qr_code_url,
          qr_string: qrisResult.qr_string,
          acquirer: qrisResult.acquirer,
          webhook_signature_key: webhookSignatureKey,
        },
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      this.logger.error(
        { err: error, unitId, orderId, userId },
        'Unexpected error while creating cashless payment',
      );
      throw new AppError({
        code: ErrorCodes.Internal,
        message: 'Terjadi kesalahan internal',
        status: 500,
      });
    }
  }

  // ===========================
  // Cash Payment
  // ===========================

  async createCashPayment(
    unitId: string,
    orderId: string,
    userId: string,
    dto: CreateCashPaymentDto,
  ): Promise<PaymentCreateApiResponse> {
    try {
      this.logger.info({ unitId, orderId, userId }, 'Creating cash payment');

      const unit = await this.orderRepository.findUnitById(unitId);
      if (!unit) {
        this.logger.warn({ unitId }, 'Cash payment failed - unit not found');
        throw unitNotFoundError();
      }

      const order = await this.orderRepository.findById(unitId, orderId);
      if (!order) {
        this.logger.warn(
          { unitId, orderId },
          'Cash payment failed - order not found',
        );
        throw orderNotFoundError();
      }

      this.ensureOrderReady(order.order_status_id);
      this.validateAmount(dto.amount, order.total_amount);

      const activePayment =
        await this.paymentRepository.findActiveByOrderId(orderId);
      if (activePayment) {
        this.logger.warn(
          { unitId, orderId, paymentId: activePayment.payment_id },
          'Cash payment failed - active payment exists',
        );
        throw paymentAlreadyActiveError();
      }

      const referenceNumber = this.generateReferenceNumber(order.order_number);
      const now = new Date();
      const { payment_id } = await this.paymentRepository.create({
        order_id: orderId,
        reference_number: referenceNumber,
        amount: dto.amount,
        payment_status: 'paid',
        failure_reason: null,
        paid_at: now,
        expired_at: now,
      });

      await this.markOrderCompleteIfReady(
        unitId,
        orderId,
        now,
        'cash payment created',
      );

      const payment = await this.paymentRepository.findById(
        unitId,
        orderId,
        payment_id,
      );
      if (!payment) {
        this.logger.error(
          { unitId, orderId, paymentId: payment_id },
          'Payment created but not found',
        );
        throw new AppError({
          code: ErrorCodes.Internal,
          message: 'Terjadi kesalahan internal',
          status: 500,
        });
      }

      this.logger.info(
        { unitId, orderId, paymentId: payment_id },
        'Cash payment created successfully',
      );

      return {
        success: true,
        statusCode: 201,
        message: 'Payment cash berhasil dibuat',
        data: this.mapToResponse(payment),
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      this.logger.error(
        { err: error, unitId, orderId, userId },
        'Unexpected error while creating cash payment',
      );
      throw new AppError({
        code: ErrorCodes.Internal,
        message: 'Terjadi kesalahan internal',
        status: 500,
      });
    }
  }

  // ===========================
  // List Payments
  // ===========================

  async listPayments(
    unitId: string,
    orderId: string,
  ): Promise<PaymentListApiResponse> {
    try {
      this.logger.info({ unitId, orderId }, 'Fetching payments list');

      const unit = await this.orderRepository.findUnitById(unitId);
      if (!unit) {
        this.logger.warn({ unitId }, 'Payments list failed - unit not found');
        throw unitNotFoundError();
      }

      const order = await this.orderRepository.findById(unitId, orderId);
      if (!order) {
        this.logger.warn(
          { unitId, orderId },
          'Payments list failed - order not found',
        );
        throw orderNotFoundError();
      }

      const rows = await this.paymentRepository.findByOrderId(unitId, orderId);

      this.logger.info(
        { unitId, orderId, total: rows.length },
        'Payments list fetched successfully',
      );

      return {
        success: true,
        statusCode: 200,
        message: 'Data payment berhasil diambil',
        data: rows.map((row) => this.mapToResponse(row)),
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      this.logger.error(
        { err: error, unitId, orderId },
        'Unexpected error while fetching payments list',
      );
      throw new AppError({
        code: ErrorCodes.Internal,
        message: 'Terjadi kesalahan internal',
        status: 500,
      });
    }
  }

  // ===========================
  // Get Payment By ID
  // ===========================

  async getPaymentById(
    unitId: string,
    orderId: string,
    paymentId: string,
  ): Promise<PaymentDetailApiResponse> {
    try {
      this.logger.info(
        { unitId, orderId, paymentId },
        'Fetching payment detail',
      );

      const unit = await this.orderRepository.findUnitById(unitId);
      if (!unit) {
        this.logger.warn({ unitId }, 'Payment detail failed - unit not found');
        throw unitNotFoundError();
      }

      const order = await this.orderRepository.findById(unitId, orderId);
      if (!order) {
        this.logger.warn(
          { unitId, orderId },
          'Payment detail failed - order not found',
        );
        throw orderNotFoundError();
      }

      const payment = await this.paymentRepository.findById(
        unitId,
        orderId,
        paymentId,
      );
      if (!payment) {
        this.logger.warn(
          { unitId, orderId, paymentId },
          'Payment detail failed - payment not found',
        );
        throw paymentNotFoundError();
      }

      this.logger.info(
        { unitId, orderId, paymentId },
        'Payment detail fetched successfully',
      );

      return {
        success: true,
        statusCode: 200,
        message: 'Detail payment berhasil diambil',
        data: this.mapToResponse(payment),
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      this.logger.error(
        { err: error, unitId, orderId, paymentId },
        'Unexpected error while fetching payment detail',
      );
      throw new AppError({
        code: ErrorCodes.Internal,
        message: 'Terjadi kesalahan internal',
        status: 500,
      });
    }
  }

  // ===========================
  // Cancel Cashless Payment
  // ===========================

  async cancelCashlessPayment(
    unitId: string,
    orderId: string,
    paymentId: string,
    userId: string,
  ): Promise<PaymentCancelApiResponse> {
    try {
      this.logger.info(
        { unitId, orderId, paymentId, userId },
        'Cancelling cashless payment',
      );

      const unit = await this.orderRepository.findUnitById(unitId);
      if (!unit) {
        this.logger.warn({ unitId }, 'Cancel payment failed - unit not found');
        throw unitNotFoundError();
      }

      const order = await this.orderRepository.findById(unitId, orderId);
      if (!order) {
        this.logger.warn(
          { unitId, orderId },
          'Cancel payment failed - order not found',
        );
        throw orderNotFoundError();
      }

      const payment = await this.paymentRepository.findById(
        unitId,
        orderId,
        paymentId,
      );
      if (!payment) {
        this.logger.warn(
          { unitId, orderId, paymentId },
          'Cancel payment failed - payment not found',
        );
        throw paymentNotFoundError();
      }

      if (payment.payment_status !== 'pending') {
        this.logger.warn(
          { unitId, orderId, paymentId, status: payment.payment_status },
          'Cancel payment failed - payment not in pending status',
        );
        throw paymentCannotBeCancelledError();
      }

      // Try to cancel at Midtrans (best-effort — does not throw)
      await this.tryMidtransCancel(payment.reference_number);

      // Mark as cancelled in DB
      await this.paymentRepository.updateStatus(paymentId, {
        payment_status: 'cancelled',
      });

      this.logger.info(
        { unitId, orderId, paymentId },
        'Cashless payment cancelled successfully',
      );

      return {
        success: true,
        statusCode: 200,
        message: 'Payment cashless berhasil dibatalkan',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      this.logger.error(
        { err: error, unitId, orderId, paymentId, userId },
        'Unexpected error while cancelling cashless payment',
      );
      throw new AppError({
        code: ErrorCodes.Internal,
        message: 'Terjadi kesalahan internal',
        status: 500,
      });
    }
  }

  // ===========================
  // Midtrans Webhook Handler
  // ===========================

  async handleMidtransWebhook(
    payload: MidtransWebhookPayload,
  ): Promise<PaymentWebhookApiResponse> {
    try {
      const referenceNumber = payload.reference_number ?? payload.order_id;

      this.logger.info(
        {
          referenceNumber,
          orderId: payload.order_id,
          status: payload.transaction_status,
        },
        'Handling Midtrans webhook',
      );

      const { status_code, gross_amount, signature_key } = payload;

      if (!referenceNumber || !status_code || !gross_amount || !signature_key) {
        this.logger.warn({ payload }, 'Webhook payload missing fields');
        throw paymentWebhookInvalidPayloadError();
      }

      if (
        !this.isValidMidtransSignature(
          referenceNumber,
          status_code,
          gross_amount,
          signature_key,
        )
      ) {
        this.logger.warn(
          { referenceNumber, grossAmount: gross_amount },
          'Webhook signature verification failed',
        );
        throw paymentWebhookSignatureInvalidError();
      }

      const payment =
        await this.paymentRepository.findByReferenceNumber(referenceNumber);

      if (!payment) {
        this.logger.warn(
          { referenceNumber },
          'Webhook ignored - payment not found',
        );
        return {
          success: true,
          statusCode: 200,
          message: 'Webhook diterima',
        };
      }

      this.validateAmount(Number(gross_amount), payment.amount);

      const nextStatus = this.mapMidtransStatus(payload);
      if (!nextStatus) {
        this.logger.warn(
          {
            referenceNumber,
            status: payload.transaction_status,
          },
          'Webhook ignored - unhandled status',
        );
        return {
          success: true,
          statusCode: 200,
          message: 'Webhook diterima',
        };
      }

      if (this.isFinalStatus(payment.payment_status)) {
        this.logger.info(
          { referenceNumber, status: payment.payment_status },
          'Webhook ignored - payment already final',
        );
        return {
          success: true,
          statusCode: 200,
          message: 'Webhook diterima',
        };
      }

      const now = new Date();
      const failureReason = this.buildFailureReason(payload);

      await this.paymentRepository.updateStatus(payment.payment_id, {
        payment_status: nextStatus,
        failure_reason: failureReason,
        paid_at: nextStatus === 'paid' ? now : undefined,
        expired_at: nextStatus === 'expired' ? now : undefined,
      });

      if (nextStatus === 'paid') {
        if (payment.unit_id) {
          await this.markOrderCompleteIfReady(
            payment.unit_id,
            payment.order_id,
            now,
            'midtrans webhook settlement',
          );
        } else {
          this.logger.warn(
            { referenceNumber, orderId: payment.order_id },
            'Order completion skipped - payment missing unit id',
          );
        }
      }

      this.logger.info(
        { referenceNumber, status: nextStatus },
        'Webhook processed successfully',
      );

      return {
        success: true,
        statusCode: 200,
        message: 'Webhook diterima',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      this.logger.error(
        {
          err: error,
          referenceNumber: payload.reference_number ?? payload.order_id,
        },
        'Unexpected error while handling webhook',
      );
      throw new AppError({
        code: ErrorCodes.Internal,
        message: 'Terjadi kesalahan internal',
        status: 500,
      });
    }
  }

  async simulateMidtransSettlement(
    unitId: string,
    orderId: string,
    paymentId: string,
    userId: string,
  ): Promise<PaymentWebhookApiResponse> {
    try {
      this.logger.info(
        { unitId, orderId, paymentId, userId },
        'Simulating Midtrans settlement webhook',
      );

      const unit = await this.orderRepository.findUnitById(unitId);
      if (!unit) {
        this.logger.warn(
          { unitId },
          'Simulate settlement failed - unit not found',
        );
        throw unitNotFoundError();
      }

      const order = await this.orderRepository.findById(unitId, orderId);
      if (!order) {
        this.logger.warn(
          { unitId, orderId },
          'Simulate settlement failed - order not found',
        );
        throw orderNotFoundError();
      }

      const payment = await this.paymentRepository.findById(
        unitId,
        orderId,
        paymentId,
      );
      if (!payment) {
        this.logger.warn(
          { unitId, orderId, paymentId },
          'Simulate settlement failed - payment not found',
        );
        throw paymentNotFoundError();
      }

      if (payment.payment_status === 'paid') {
        this.logger.info(
          { unitId, orderId, paymentId },
          'Simulate settlement ignored - payment already paid',
        );
        return {
          success: true,
          statusCode: 200,
          message: 'Webhook diterima',
        };
      }

      if (payment.payment_status !== 'pending') {
        this.logger.warn(
          { unitId, orderId, paymentId, status: payment.payment_status },
          'Simulate settlement failed - payment not pending',
        );
        throw paymentCannotBeCancelledError();
      }

      const grossAmount = this.formatGrossAmount(payment.amount);
      const payload: MidtransWebhookPayload = {
        reference_number: payment.reference_number,
        status_code: '200',
        gross_amount: grossAmount,
        transaction_status: 'settlement',
        fraud_status: 'accept',
        signature_key: this.buildMidtransSignature(
          payment.reference_number,
          '200',
          grossAmount,
        ),
      };

      return await this.handleMidtransWebhook(payload);
    } catch (error) {
      if (error instanceof AppError) throw error;
      this.logger.error(
        { err: error, unitId, orderId, paymentId, userId },
        'Unexpected error while simulating Midtrans settlement webhook',
      );
      throw new AppError({
        code: ErrorCodes.Internal,
        message: 'Terjadi kesalahan internal',
        status: 500,
      });
    }
  }

  // ===========================
  // Private Helpers
  // ===========================

  private ensureOrderReady(orderStatusId: string): void {
    if (orderStatusId !== this.config.order.readyStatusUuid) {
      throw paymentOrderNotReadyError();
    }
  }

  private async markOrderCompleteIfReady(
    unitId: string,
    orderId: string,
    completedAt: Date,
    reason: string,
  ): Promise<void> {
    const order = await this.orderRepository.findById(unitId, orderId);
    if (!order) {
      this.logger.warn(
        { unitId, orderId, reason },
        'Order completion skipped - order not found',
      );
      return;
    }

    if (order.order_status_id !== this.config.order.readyStatusUuid) {
      this.logger.info(
        {
          unitId,
          orderId,
          currentStatusId: order.order_status_id,
          reason,
        },
        'Order completion skipped - current status is not ready',
      );
      return;
    }

    await this.orderRepository.transaction(async (trx) => {
      await this.orderRepository.update(
        orderId,
        {
          order_status_id: this.config.order.completeStatusUuid,
          completed_at: completedAt,
        },
        trx,
      );
    });

    this.logger.info(
      {
        unitId,
        orderId,
        completeStatusId: this.config.order.completeStatusUuid,
        reason,
      },
      'Order status updated to complete',
    );
  }

  private validateAmount(submittedAmount: number, orderAmount: number): void {
    if (
      Math.abs(Number(submittedAmount) - Number(orderAmount)) > PRICE_TOLERANCE
    ) {
      throw paymentAmountMismatchError();
    }
  }

  private generateReferenceNumber(orderNumber: string): string {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const day = String(now.getUTCDate()).padStart(2, '0');
    const hours = String(now.getUTCHours()).padStart(2, '0');
    const minutes = String(now.getUTCMinutes()).padStart(2, '0');
    const seconds = String(now.getUTCSeconds()).padStart(2, '0');
    return `PAY-${orderNumber}-${year}${month}${day}${hours}${minutes}${seconds}`;
  }

  private async chargeQris(
    referenceNumber: string,
    amount: number,
    customerName: string,
  ): Promise<{
    transaction_id: string;
    qr_code_url: string;
    qr_string: string;
    acquirer: string;
  }> {
    try {
      const grossAmount = this.formatGrossAmount(amount);
      const payload = {
        payment_type: 'qris',
        transaction_details: {
          order_id: referenceNumber,
          gross_amount: Number(grossAmount),
        },
        customer_details: {
          first_name: customerName,
        },
        qris: {
          acquirer: 'gopay',
        },
        custom_expiry: {
          expiry_duration: CASHLESS_EXPIRY_MINUTES,
          unit: 'minute',
        },
      };

      const authToken = Buffer.from(
        `${this.config.midtrans.serverKey}:`,
      ).toString('base64');

      const response = await fetch(
        `${this.config.midtrans.coreApiBaseUrl}/v2/charge`,
        {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Basic ${authToken}`,
          },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        const body = await response.text();
        this.logger.error(
          { status: response.status, body },
          'Midtrans QRIS charge request failed',
        );
        throw paymentMidtransRequestFailedError();
      }

      const data = (await response.json()) as MidtransQrisChargeResponse;

      const qrCodeUrl = data.actions?.find(
        (a) => a.name === 'generate-qr-code',
      )?.url;

      if (!qrCodeUrl) {
        this.logger.error(
          { data },
          'Midtrans QRIS response missing qr-code action',
        );
        throw paymentMidtransRequestFailedError();
      }

      return {
        transaction_id: data.transaction_id,
        qr_code_url: qrCodeUrl,
        qr_string: data.qr_string,
        acquirer: data.acquirer,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      this.logger.error({ err: error }, 'Midtrans QRIS charge request error');
      throw paymentMidtransRequestFailedError();
    }
  }

  private async getQrisTransactionStatus(referenceNumber: string): Promise<{
    qr_code_url: string;
    qr_string: string;
    acquirer: string;
  }> {
    try {
      const authToken = Buffer.from(
        `${this.config.midtrans.serverKey}:`,
      ).toString('base64');

      const response = await fetch(
        `${this.config.midtrans.coreApiBaseUrl}/v2/${referenceNumber}/status`,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            Authorization: `Basic ${authToken}`,
          },
        },
      );

      if (!response.ok) {
        const body = await response.text();
        this.logger.error(
          { status: response.status, body, referenceNumber },
          'Midtrans QRIS status request failed',
        );
        throw paymentMidtransRequestFailedError();
      }

      const data = (await response.json()) as MidtransQrisChargeResponse;

      const qrCodeUrl = data.actions?.find(
        (a) => a.name === 'generate-qr-code',
      )?.url;

      if (!qrCodeUrl) {
        this.logger.error(
          { data, referenceNumber },
          'Midtrans QRIS status response missing qr-code action',
        );
        throw paymentMidtransRequestFailedError();
      }

      return {
        qr_code_url: qrCodeUrl,
        qr_string: data.qr_string,
        acquirer: data.acquirer,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      this.logger.error(
        { err: error, referenceNumber },
        'Midtrans QRIS status request error',
      );
      throw paymentMidtransRequestFailedError();
    }
  }

  private async tryMidtransCancel(referenceNumber: string): Promise<void> {
    try {
      const authToken = Buffer.from(
        `${this.config.midtrans.serverKey}:`,
      ).toString('base64');

      const response = await fetch(
        `${this.config.midtrans.coreApiBaseUrl}/v2/${referenceNumber}/cancel`,
        {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            Authorization: `Basic ${authToken}`,
          },
        },
      );

      if (!response.ok) {
        const body = await response.text();
        this.logger.warn(
          { status: response.status, body, referenceNumber },
          'Midtrans cancel request failed \u2014 continuing with local cancellation',
        );
        return;
      }

      this.logger.info(
        { referenceNumber },
        'Midtrans QRIS transaction cancelled successfully',
      );
    } catch (error) {
      this.logger.warn(
        { err: error, referenceNumber },
        'Failed to cancel Midtrans transaction \u2014 continuing with local cancellation',
      );
    }
  }

  private buildMidtransSignature(
    orderId: string,
    statusCode: string,
    grossAmount: string,
  ): string {
    const raw = `${orderId}${statusCode}${grossAmount}${this.config.midtrans.serverKey}`;
    return crypto.createHash('sha512').update(raw).digest('hex');
  }

  private isValidMidtransSignature(
    orderId: string,
    statusCode: string,
    grossAmountRaw: string,
    providedSignature: string,
  ): boolean {
    const candidates = new Set<string>([grossAmountRaw]);
    const normalizedNumber = Number(grossAmountRaw);

    if (Number.isFinite(normalizedNumber)) {
      candidates.add(this.formatGrossAmount(normalizedNumber));
      candidates.add(normalizedNumber.toFixed(2));
    }

    for (const grossAmount of candidates) {
      const expected = this.buildMidtransSignature(
        orderId,
        statusCode,
        grossAmount,
      );
      if (this.safeEqual(expected, providedSignature)) {
        return true;
      }
    }

    return false;
  }

  private safeEqual(a: string, b: string): boolean {
    const left = Buffer.from(a);
    const right = Buffer.from(b);
    if (left.length !== right.length) {
      return false;
    }
    return crypto.timingSafeEqual(left, right);
  }

  private formatGrossAmount(amount: number): string {
    return Number(amount).toFixed(2);
  }

  private mapMidtransStatus(
    payload: MidtransWebhookPayload,
  ): PaymentStatus | null {
    const status = payload.transaction_status;
    if (!status) return null;

    if (status === 'capture') {
      return payload.fraud_status === 'challenge' ? 'pending' : 'paid';
    }

    if (status === 'settlement') return 'paid';
    if (status === 'pending') return 'pending';
    if (status === 'deny') return 'failed';
    if (status === 'cancel') return 'cancelled';
    if (status === 'expire') return 'expired';
    if (status === 'refund' || status === 'partial_refund') return 'refunded';

    return null;
  }

  private isFinalStatus(status: PaymentStatus): boolean {
    return (
      status === 'paid' ||
      status === 'failed' ||
      status === 'expired' ||
      status === 'cancelled' ||
      status === 'refunded'
    );
  }

  private buildFailureReason(payload: MidtransWebhookPayload): string | null {
    const status = payload.transaction_status;
    if (!status) return null;

    if (status === 'deny' || status === 'cancel') {
      return this.trimFailureReason(payload.status_message ?? status);
    }

    return null;
  }

  private trimFailureReason(reason: string): string {
    return reason.length > 255 ? reason.slice(0, 255) : reason;
  }

  private mapToResponse(row: PaymentRow): PaymentResponse {
    return {
      payment_id: row.payment_id,
      order_id: row.order_id,
      reference_number: row.reference_number,
      amount: Number(row.amount),
      payment_status: row.payment_status,
      failure_reason: row.failure_reason,
      paid_at: row.paid_at,
      expired_at: row.expired_at,
      created_at: row.created_at,
    };
  }
}
