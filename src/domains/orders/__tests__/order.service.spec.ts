import type { Logger } from 'pino';
import { DomainErrorCodes } from '../../../common/errors/error-codes-domain';
import type { AppConfig } from '../../../config';
import type { JwtTokenPayload } from '../../auth/models/auth.model';
import type { OrderTransactionHistoryRow } from '../models/order.model';
import { OrderService } from '../order.service';
import type { IOrderRepository } from '../repositories/order.repository';

const UNIT_ID = '550e8400-e29b-41d4-a716-446655440000';
const OTHER_UNIT_ID = '550e8400-e29b-41d4-a716-446655440001';
const USER_ID = '660f9511-f3ac-42e5-b827-557766551111';
const ORDER_ID = 'a3bb4c2e-f123-4d56-b789-000000000010';
const PAYMENT_ID = 'f1cc5d3f-a234-4e67-b890-999999999999';

const createMockOrderRepository = (): jest.Mocked<IOrderRepository> =>
  ({
    findUnitById: jest.fn(),
    findOrderTypeById: jest.fn(),
    findOrderStatusById: jest.fn(),
    findOrderStatusByCode: jest.fn(),
    findMenuItemsByIds: jest.fn(),
    findAll: jest.fn(),
    findTransactionHistory: jest.fn(),
    userHasActiveUnit: jest.fn(),
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
      pendingStatusUuid: 'pending-status-uuid',
      cancelStatusUuid: 'cancel-status-uuid',
    },
  }) as unknown as AppConfig;

const createJwtPayload = (
  overrides?: Partial<JwtTokenPayload>,
): JwtTokenPayload => ({
  sub: USER_ID,
  typ: 'Bearer',
  roles: 'manajer_unit',
  permission: ['order:read'],
  full_name: 'Budi Santoso',
  email: 'budi@example.com',
  units: ['Unit A'],
  must_change_password: false,
  ...overrides,
});

const createTransactionHistoryRow = (
  overrides?: Partial<OrderTransactionHistoryRow>,
): OrderTransactionHistoryRow => ({
  order_id: ORDER_ID,
  unit_id: UNIT_ID,
  business_unit_name: 'Unit A',
  order_number: 'ORD-20250115-0001',
  customer_name: 'Budi',
  table_number: '5',
  total_amount: 55000,
  ordered_at: new Date('2025-01-15T10:00:00.000Z'),
  completed_at: new Date('2025-01-15T10:15:00.000Z'),
  order_type_id: '7a9e8400-e29b-41d4-a716-446655440000',
  order_type_name: 'Dine-in',
  order_status_id: '8b9e8400-e29b-41d4-a716-446655440000',
  order_status_name: 'selesai',
  payment_id: PAYMENT_ID,
  reference_number: 'PAY-ORD-20250115-0001-20250115101500',
  payment_status: 'paid',
  payment_amount: 55000,
  payment_method: 'cashless',
  paid_at: new Date('2025-01-15T10:15:00.000Z'),
  ...overrides,
});

describe('OrderService transaction history', () => {
  let service: OrderService;
  let repository: jest.Mocked<IOrderRepository>;
  let logger: jest.Mocked<Logger>;

  beforeEach(() => {
    repository = createMockOrderRepository();
    logger = createMockLogger();
    service = new OrderService(repository, createMockConfig(), logger);

    repository.findUnitById.mockResolvedValue({
      unit_id: UNIT_ID,
      unit_name: 'Unit A',
    });
    repository.findTransactionHistory.mockResolvedValue({
      data: [createTransactionHistoryRow()],
      total: 1,
    });
  });

  it('allows Manajemen Grup to read history for any selected unit', async () => {
    const result = await service.listTransactionHistory(
      OTHER_UNIT_ID,
      { page: 1, limit: 10 },
      createJwtPayload({ roles: 'manajemen_grup_xyz', units: [] }),
    );

    expect(result.statusCode).toBe(200);
    expect(result.data[0].business_unit_id).toBe(UNIT_ID);
    expect(repository.userHasActiveUnit).not.toHaveBeenCalled();
    expect(repository.findTransactionHistory).toHaveBeenCalledWith(
      expect.objectContaining({ unitId: OTHER_UNIT_ID }),
    );
  });

  it('allows Manajer Unit or Staf Unit only for assigned unit history', async () => {
    repository.userHasActiveUnit.mockResolvedValueOnce(true);

    const result = await service.listTransactionHistory(
      UNIT_ID,
      {},
      createJwtPayload({ roles: 'staf_unit' }),
    );

    expect(result.statusCode).toBe(200);
    expect(repository.userHasActiveUnit).toHaveBeenCalledWith(USER_ID, UNIT_ID);
    expect(result.data[0].payment?.payment_status).toBe('paid');
    expect(result.data[0].payment?.payment_method).toBe('cashless');
  });

  it('passes date range and payment method filters to repository', async () => {
    repository.userHasActiveUnit.mockResolvedValueOnce(true);

    await service.listTransactionHistory(
      UNIT_ID,
      {
        date_from: '2025-01-01',
        date_to: '2025-01-31',
        payment_method: 'cash',
        sortBy: 'completed_at',
      },
      createJwtPayload(),
    );

    expect(repository.findTransactionHistory).toHaveBeenCalledWith(
      expect.objectContaining({
        dateFrom: new Date('2025-01-01T00:00:00.000Z'),
        dateTo: new Date('2025-01-31T23:59:59.999Z'),
        paymentMethod: 'cash',
        sortBy: 'completed_at',
      }),
    );
  });

  it('throws 400 when date_from is greater than date_to', async () => {
    await expect(
      service.listTransactionHistory(
        UNIT_ID,
        { date_from: '2025-02-01', date_to: '2025-01-31' },
        createJwtPayload({ roles: 'manajemen_grup_xyz' }),
      ),
    ).rejects.toMatchObject({
      status: 400,
    });

    expect(repository.findTransactionHistory).not.toHaveBeenCalled();
  });

  it('throws 403 when unit role requests an unassigned unit history', async () => {
    repository.userHasActiveUnit.mockResolvedValueOnce(false);

    await expect(
      service.listTransactionHistory(
        OTHER_UNIT_ID,
        {},
        createJwtPayload({ roles: 'manajer_unit' }),
      ),
    ).rejects.toMatchObject({
      code: DomainErrorCodes.AuthForbidden,
      status: 403,
    });

    expect(repository.findTransactionHistory).not.toHaveBeenCalled();
  });

  it('throws 404 when selected unit does not exist', async () => {
    repository.findUnitById.mockResolvedValueOnce(null);

    await expect(
      service.listTransactionHistory(UNIT_ID, {}, createJwtPayload()),
    ).rejects.toMatchObject({
      code: DomainErrorCodes.UnitNotFound,
      status: 404,
    });
  });
});
