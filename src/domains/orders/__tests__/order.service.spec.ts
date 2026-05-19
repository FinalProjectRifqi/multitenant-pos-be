import type { Logger } from 'pino';
import type { Knex } from 'knex';
import { DomainErrorCodes } from '../../../common/errors/error-codes-domain';
import type { AppConfig } from '../../../config';
import type { JwtTokenPayload } from '../../auth/models/auth.model';
import type {
  OrderItemRow,
  OrderRow,
  OrderTransactionHistoryRow,
} from '../models/order.model';
import { OrderService } from '../order.service';
import type { IOrderRepository } from '../repositories/order.repository';

const UNIT_ID = '550e8400-e29b-41d4-a716-446655440000';
const OTHER_UNIT_ID = '550e8400-e29b-41d4-a716-446655440001';
const USER_ID = '660f9511-f3ac-42e5-b827-557766551111';
const ORDER_ID = 'a3bb4c2e-f123-4d56-b789-000000000010';
const PAYMENT_ID = 'f1cc5d3f-a234-4e67-b890-999999999999';
const ORDER_TYPE_ID = '7a9e8400-e29b-41d4-a716-446655440000';
const MENU_ITEM_ID = 'c2dd6e4d-a345-4f78-9901-222222222222';

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

const createOrderRow = (overrides?: Partial<OrderRow>): OrderRow => ({
  order_id: ORDER_ID,
  unit_id: UNIT_ID,
  user_id: USER_ID,
  order_number: 'ORD-A1B2C3',
  table_number: null,
  subtotal: 20000,
  tax_amount: 0,
  total_amount: 20000,
  notes: null,
  ordered_at: new Date('2025-01-15T10:00:00.000Z'),
  completed_at: null,
  created_at: new Date('2025-01-15T10:00:00.000Z'),
  updated_at: new Date('2025-01-15T10:00:00.000Z'),
  deleted_at: null,
  customer_name: 'Budi',
  order_type_id: ORDER_TYPE_ID,
  order_type_name: 'Takeaway',
  order_status_id: 'pending-status-uuid',
  order_status_name: 'baru masuk',
  order_status_code: 'pending',
  ...overrides,
});

const createOrderItemRow = (
  overrides?: Partial<OrderItemRow>,
): OrderItemRow => ({
  order_item_id: 'b1cc5d3f-a234-4e67-b890-111111111111',
  order_id: ORDER_ID,
  menu_item_id: MENU_ITEM_ID,
  menu_item_name: 'Nasi Goreng',
  quantity: 2,
  item_price: 10000,
  notes: null,
  created_at: new Date('2025-01-15T10:00:00.000Z'),
  updated_at: new Date('2025-01-15T10:00:00.000Z'),
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

describe('OrderService createOrder', () => {
  let service: OrderService;
  let repository: jest.Mocked<IOrderRepository>;
  let logger: jest.Mocked<Logger>;

  const validDto = {
    order_type_id: ORDER_TYPE_ID,
    customer_name: 'Budi',
    items: [
      {
        menu_item_id: MENU_ITEM_ID,
        quantity: 2,
        item_price: 10000,
      },
    ],
    subtotal: 20000,
    tax_amount: 0,
    total_amount: 20000,
  };

  beforeEach(() => {
    repository = createMockOrderRepository();
    logger = createMockLogger();
    service = new OrderService(repository, createMockConfig(), logger);

    repository.findUnitById.mockResolvedValue({
      unit_id: UNIT_ID,
      unit_name: 'Unit A',
    });
    repository.findOrderTypeById.mockResolvedValue({
      order_type_id: ORDER_TYPE_ID,
      order_type_name: 'Takeaway',
    });
    repository.findMenuItemsByIds.mockResolvedValue([
      {
        menu_item_id: MENU_ITEM_ID,
        menu_item_name: 'Nasi Goreng',
        item_price: 10000,
        is_available: true,
      },
    ]);
    repository.findOrderItemsByOrderId.mockResolvedValue([
      createOrderItemRow(),
    ]);
    repository.createOrderItems.mockResolvedValue();
    repository.transaction.mockImplementation(
      async (callback: (trx: Knex.Transaction) => Promise<unknown>) =>
        callback({} as Knex.Transaction),
    );
  });

  it('generates compact random order numbers without using per-unit counters', async () => {
    const createdOrderNumbers: string[] = [];

    repository.create.mockImplementation(async (data) => {
      createdOrderNumbers.push(data.order_number);
      return { order_id: ORDER_ID };
    });
    repository.findById.mockImplementation(async (unitId) =>
      createOrderRow({
        unit_id: unitId,
        order_number: createdOrderNumbers[createdOrderNumbers.length - 1],
      }),
    );

    await service.createOrder(UNIT_ID, USER_ID, validDto);
    await service.createOrder(OTHER_UNIT_ID, USER_ID, validDto);

    expect(repository.countOrdersToday).not.toHaveBeenCalled();
    expect(createdOrderNumbers).toHaveLength(2);
    expect(createdOrderNumbers[0]).toMatch(/^ORD-[A-Z0-9]{6}$/);
    expect(createdOrderNumbers[1]).toMatch(/^ORD-[A-Z0-9]{6}$/);
  });
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
