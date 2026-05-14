import type { Logger } from 'pino';
import { createHash } from 'node:crypto';
import { ErrorCodes } from '../../../common/errors/error-codes';
import { DomainErrorCodes } from '../../../common/errors/error-codes-domain';
import type { AppConfig } from '../../../config';
import type { OrderRow } from '../models/order.model';
import type { PaymentRow } from '../models/payment.model';
import { PaymentService } from '../payment.service';
import type { IOrderRepository } from '../repositories/order.repository';
import type { IPaymentRepository } from '../repositories/payment.repository';

const UNIT_ID = '550e8400-e29b-41d4-a716-446655440000';
const ORDER_ID = 'a3bb4c2e-f123-4d56-b789-000000000010';
const PAYMENT_ID = 'f1cc5d3f-g234-5e67-c890-999999999999';
const USER_ID = '660f9511-f3ac-52e5-b827-557766551111';

const createMockOrderRepository = (): jest.Mocked<IOrderRepository> =>
  ({
    findUnitById: jest.fn(),
    findOrderTypeById: jest.fn(),
    findMenuItemsByIds: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    findByIdForUpdate: jest.fn(),
    findOrderItemsByOrderId: jest.fn(),
    countOrdersToday: jest.fn(),
    create: jest.fn(),
    createOrderItems: jest.fn(),
    update: jest.fn(),
    updateOrderItem: jest.fn(),
    insertOrderItem: jest.fn(),
    softDeleteOrderItemsByIds: jest.fn(),
    softDeleteOrder: jest.fn(),
    softDeleteOrderItemsByOrderId: jest.fn(),
    transaction: jest.fn(),
  }) as unknown as jest.Mocked<IOrderRepository>;

const createMockPaymentRepository = (): jest.Mocked<IPaymentRepository> =>
  ({
    findByOrderId: jest.fn(),
    findById: jest.fn(),
    findActiveByOrderId: jest.fn(),
    findByReferenceNumber: jest.fn(),
    create: jest.fn(),
    updateStatus: jest.fn(),
  }) as unknown as jest.Mocked<IPaymentRepository>;

const createMockLogger = (): jest.Mocked<Logger> =>
  ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  }) as unknown as jest.Mocked<Logger>;

const createMockConfig = (): AppConfig =>
  ({
    order: {
      readyStatusUuid: 'ready-status-uuid',
      completeStatusUuid: 'complete-status-uuid',
    },
    midtrans: {
      serverKey: 'server-key',
      snapBaseUrl: 'https://app.sandbox.midtrans.com/snap/v1',
      coreApiBaseUrl: 'https://api.sandbox.midtrans.com',
    },
  }) as unknown as AppConfig;

const createOrderRow = (overrides?: Partial<OrderRow>): OrderRow => ({
  order_id: ORDER_ID,
  unit_id: UNIT_ID,
  user_id: USER_ID,
  order_number: 'ORD-20250115-0001',
  table_number: '5',
  subtotal: 50000,
  tax_amount: 5000,
  total_amount: 55000,
  notes: null,
  ordered_at: new Date(),
  completed_at: null,
  created_at: new Date(),
  updated_at: new Date(),
  deleted_at: null,
  customer_name: 'Budi',
  order_type_id: 'order-type-id',
  order_type_name: 'Dine-in',
  order_status_id: 'ready-status-uuid',
  order_status_name: 'siap',
  order_status_code: 'ready',
  ...overrides,
});

const createPaymentRow = (overrides?: Partial<PaymentRow>): PaymentRow => ({
  payment_id: PAYMENT_ID,
  order_id: ORDER_ID,
  reference_number: 'PAY-ORD-20250115-0001-20250115103045',
  amount: 55000,
  payment_status: 'pending',
  failure_reason: null,
  paid_at: new Date(),
  expired_at: new Date(),
  created_at: new Date(),
  updated_at: new Date(),
  deleted_at: null,
  ...overrides,
});

describe('PaymentService', () => {
  let service: PaymentService;
  let mockOrderRepository: jest.Mocked<IOrderRepository>;
  let mockPaymentRepository: jest.Mocked<IPaymentRepository>;
  let mockLogger: jest.Mocked<Logger>;
  let mockConfig: AppConfig;

  beforeEach(() => {
    mockOrderRepository = createMockOrderRepository();
    mockPaymentRepository = createMockPaymentRepository();
    mockLogger = createMockLogger();
    mockConfig = createMockConfig();

    service = new PaymentService(
      mockOrderRepository,
      mockPaymentRepository,
      mockConfig,
      mockLogger,
    );

    mockOrderRepository.transaction.mockImplementation(async (callback) =>
      callback({} as never),
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('createCashPayment', () => {
    it('creates paid payment when order is ready', async () => {
      const order = createOrderRow();
      const payment = createPaymentRow({ payment_status: 'paid' });

      mockOrderRepository.findUnitById.mockResolvedValue({
        unit_id: UNIT_ID,
        unit_name: 'Unit A',
      });
      mockOrderRepository.findById.mockResolvedValue(order);
      mockPaymentRepository.findActiveByOrderId.mockResolvedValue(null);
      mockPaymentRepository.create.mockResolvedValue({
        payment_id: PAYMENT_ID,
      });
      mockPaymentRepository.findById.mockResolvedValue(payment);

      const result = await service.createCashPayment(
        UNIT_ID,
        ORDER_ID,
        USER_ID,
        {
          amount: 55000,
        },
      );

      expect(result.statusCode).toBe(201);
      expect(result.data.payment_status).toBe('paid');
      expect(mockPaymentRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ payment_status: 'paid' }),
        expect.anything(),
      );
      expect(mockOrderRepository.update).toHaveBeenCalledWith(
        ORDER_ID,
        expect.objectContaining({
          order_status_id: 'complete-status-uuid',
        }),
        expect.anything(),
      );
    });
  });

  describe('createCashlessPayment', () => {
    const fetchSpy = () =>
      jest.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => ({
          status_code: '201',
          status_message: 'Success',
          transaction_id: 'qris-transaction-id',
          order_id: 'PAY-TEST-001',
          gross_amount: '55000.00',
          payment_type: 'qris',
          transaction_status: 'pending',
          qr_string: 'qr-string-data',
          acquirer: 'gopay',
          actions: [
            {
              name: 'generate-qr-code',
              method: 'GET',
              url: 'https://api.midtrans.com/v2/qris/img.png',
            },
          ],
        }),
      } as Response);

    it('throws when order is not ready', async () => {
      const order = createOrderRow({ order_status_id: 'not-ready' });

      mockOrderRepository.findUnitById.mockResolvedValue({
        unit_id: UNIT_ID,
        unit_name: 'Unit A',
      });
      mockOrderRepository.findById.mockResolvedValue(order);

      await expect(
        service.createCashlessPayment(UNIT_ID, ORDER_ID, USER_ID, {
          amount: 55000,
        }),
      ).rejects.toMatchObject({
        code: DomainErrorCodes.PaymentOrderNotReady,
        status: 422,
      });
    });

    it('throws when active paid payment exists', async () => {
      const order = createOrderRow();

      mockOrderRepository.findUnitById.mockResolvedValue({
        unit_id: UNIT_ID,
        unit_name: 'Unit A',
      });
      mockOrderRepository.findById.mockResolvedValue(order);
      mockOrderRepository.findByIdForUpdate.mockResolvedValue(order);
      mockPaymentRepository.findActiveByOrderId.mockResolvedValue(
        createPaymentRow({ payment_status: 'paid' }),
      );

      await expect(
        service.createCashlessPayment(UNIT_ID, ORDER_ID, USER_ID, {
          amount: 55000,
        }),
      ).rejects.toMatchObject({
        code: DomainErrorCodes.PaymentAlreadyActive,
        status: 409,
      });
    });

    it('resumes existing pending payment when still valid', async () => {
      const order = createOrderRow();
      const activePayment = createPaymentRow({
        expired_at: new Date(Date.now() + 5 * 60 * 1000),
      });
      fetchSpy();

      mockOrderRepository.findUnitById.mockResolvedValue({
        unit_id: UNIT_ID,
        unit_name: 'Unit A',
      });
      mockOrderRepository.findById.mockResolvedValue(order);
      mockOrderRepository.findByIdForUpdate.mockResolvedValue(order);
      mockPaymentRepository.findActiveByOrderId.mockResolvedValue(
        activePayment,
      );

      const result = await service.createCashlessPayment(
        UNIT_ID,
        ORDER_ID,
        USER_ID,
        {
          amount: 55000,
        },
      );

      expect(result.statusCode).toBe(201);
      expect(result.data.payment.payment_id).toBe(PAYMENT_ID);
      expect(result.data.qr_code_url).toBe(
        'https://api.midtrans.com/v2/qris/img.png',
      );
      expect(mockPaymentRepository.create).not.toHaveBeenCalled();
    });

    it('returns qr_code_url when cashless payment created', async () => {
      const order = createOrderRow();
      const payment = createPaymentRow();
      fetchSpy();

      mockOrderRepository.findUnitById.mockResolvedValue({
        unit_id: UNIT_ID,
        unit_name: 'Unit A',
      });
      mockOrderRepository.findById.mockResolvedValue(order);
      mockOrderRepository.findByIdForUpdate.mockResolvedValue(order);
      mockPaymentRepository.findActiveByOrderId.mockResolvedValue(null);
      mockPaymentRepository.create.mockResolvedValue({
        payment_id: PAYMENT_ID,
      });
      mockPaymentRepository.findById.mockResolvedValue(payment);

      const result = await service.createCashlessPayment(
        UNIT_ID,
        ORDER_ID,
        USER_ID,
        { amount: 55000 },
      );

      expect(result.statusCode).toBe(201);
      expect(result.data.qr_code_url).toBe(
        'https://api.midtrans.com/v2/qris/img.png',
      );
      expect(result.data.qr_string).toBe('qr-string-data');
      expect(result.data.acquirer).toBe('gopay');
    });
  });

  describe('handleMidtransWebhook', () => {
    it('throws when signature invalid', async () => {
      await expect(
        service.handleMidtransWebhook({
          reference_number: 'PAY-ORD-20250115-0001-20250115103045',
          status_code: '200',
          gross_amount: '55000',
          transaction_status: 'pending',
          signature_key: 'invalid',
        }),
      ).rejects.toMatchObject({
        code: DomainErrorCodes.PaymentWebhookSignatureInvalid,
        status: 401,
      });
    });

    it('updates payment status when settlement', async () => {
      const orderId = 'PAY-ORD-20250115-0001-20250115103045';
      const signature = createHash('sha512')
        .update(`${orderId}20055000server-key`)
        .digest('hex');

      mockPaymentRepository.findByReferenceNumber.mockResolvedValue(
        createPaymentRow({ payment_status: 'pending', unit_id: UNIT_ID }),
      );
      mockOrderRepository.findByIdForUpdate.mockResolvedValue(createOrderRow());

      const result = await service.handleMidtransWebhook({
        reference_number: orderId,
        status_code: '200',
        gross_amount: '55000',
        transaction_status: 'settlement',
        signature_key: signature,
      });

      expect(result.statusCode).toBe(200);
      expect(mockPaymentRepository.updateStatus).toHaveBeenCalledWith(
        PAYMENT_ID,
        expect.objectContaining({ payment_status: 'paid' }),
      );
      expect(mockOrderRepository.update).toHaveBeenCalledWith(
        ORDER_ID,
        expect.objectContaining({
          order_status_id: 'complete-status-uuid',
        }),
        expect.anything(),
      );
    });

    it('accepts Midtrans payload using order_id field', async () => {
      const midtransOrderId = 'PAY-ORD-20250115-0001-20250115103045';
      const signature = createHash('sha512')
        .update(`${midtransOrderId}20055000server-key`)
        .digest('hex');

      mockPaymentRepository.findByReferenceNumber.mockResolvedValue(
        createPaymentRow({ payment_status: 'pending', unit_id: UNIT_ID }),
      );
      mockOrderRepository.findByIdForUpdate.mockResolvedValue(createOrderRow());

      const result = await service.handleMidtransWebhook({
        order_id: midtransOrderId,
        status_code: '200',
        gross_amount: '55000',
        transaction_status: 'settlement',
        signature_key: signature,
      });

      expect(result.statusCode).toBe(200);
      expect(mockPaymentRepository.findByReferenceNumber).toHaveBeenCalledWith(
        midtransOrderId,
      );
    });

    it('does not update order to complete when current status is not ready', async () => {
      const orderId = 'PAY-ORD-20250115-0001-20250115103045';
      const signature = createHash('sha512')
        .update(`${orderId}20055000server-key`)
        .digest('hex');

      mockPaymentRepository.findByReferenceNumber.mockResolvedValue(
        createPaymentRow({ payment_status: 'pending', unit_id: UNIT_ID }),
      );
      mockOrderRepository.findByIdForUpdate.mockResolvedValue(
        createOrderRow({ order_status_id: 'processing-status' }),
      );

      const result = await service.handleMidtransWebhook({
        reference_number: orderId,
        status_code: '200',
        gross_amount: '55000',
        transaction_status: 'settlement',
        signature_key: signature,
      });

      expect(result.statusCode).toBe(200);
      expect(mockPaymentRepository.updateStatus).toHaveBeenCalled();
      expect(mockOrderRepository.update).not.toHaveBeenCalled();
    });

    it('throws 500 on unexpected error', async () => {
      const orderId = 'PAY-ORD-20250115-0001-20250115103045';
      const signature = createHash('sha512')
        .update(`${orderId}20055000server-key`)
        .digest('hex');

      mockPaymentRepository.findByReferenceNumber.mockRejectedValueOnce(
        new Error('DB error'),
      );

      await expect(
        service.handleMidtransWebhook({
          reference_number: orderId,
          status_code: '200',
          gross_amount: '55000',
          transaction_status: 'pending',
          signature_key: signature,
        }),
      ).rejects.toMatchObject({
        code: ErrorCodes.Internal,
        status: 500,
      });
    });
  });

  describe('simulateMidtransSettlement', () => {
    it('simulates settlement and updates payment status', async () => {
      const payment = createPaymentRow({ payment_status: 'pending' });

      mockOrderRepository.findUnitById.mockResolvedValue({
        unit_id: UNIT_ID,
        unit_name: 'Unit A',
      });
      mockOrderRepository.findById.mockResolvedValue(createOrderRow());
      mockOrderRepository.findByIdForUpdate.mockResolvedValue(createOrderRow());
      mockPaymentRepository.findById.mockResolvedValue(payment);
      mockPaymentRepository.findByReferenceNumber.mockResolvedValue({
        ...payment,
        unit_id: UNIT_ID,
      });

      const result = await service.simulateMidtransSettlement(
        UNIT_ID,
        ORDER_ID,
        PAYMENT_ID,
        USER_ID,
      );

      expect(result.statusCode).toBe(200);
      expect(mockPaymentRepository.updateStatus).toHaveBeenCalledWith(
        PAYMENT_ID,
        expect.objectContaining({ payment_status: 'paid' }),
      );
    });
  });
});
