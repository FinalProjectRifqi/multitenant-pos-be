import type { Logger } from 'pino';
import { DomainErrorCodes } from '../../../common/errors/error-codes-domain';
import type { JwtTokenPayload } from '../../auth/models/auth.model';
import { AnalyticsService } from '../analytics.service';
import type { IAnalyticsRepository } from '../repositories/analytics.repository';

const UNIT_ID = '550e8400-e29b-41d4-a716-446655440000';
const OTHER_UNIT_ID = '550e8400-e29b-41d4-a716-446655440001';
const USER_ID = '550e8400-e29b-41d4-a716-446655440002';

const createMockLogger = (): jest.Mocked<Logger> =>
  ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  }) as unknown as jest.Mocked<Logger>;

const createRepository = (): jest.Mocked<IAnalyticsRepository> =>
  ({
    findUnitById: jest.fn(),
    getMetrics: jest.fn(),
    getStatusTransactions: jest.fn(),
    getTopMenus: jest.fn(),
    getRevenueByMenu: jest.fn(),
    getRevenueByUnit: jest.fn(),
    getTopMenusByUnit: jest.fn(),
    getCriticalStockUnits: jest.fn(),
    getInventoryPerformanceByUnit: jest.fn(),
    getPaymentSummary: jest.fn(),
    getPaymentHistory: jest.fn(),
    getLowStockItems: jest.fn(),
    getDailyInventoryUsage: jest.fn(),
  }) as unknown as jest.Mocked<IAnalyticsRepository>;

const createUser = (overrides?: Partial<JwtTokenPayload>): JwtTokenPayload => ({
  sub: USER_ID,
  typ: 'Bearer',
  roles: 'UNIT_MANAGER',
  permission: ['analytics:read'],
  full_name: 'Unit Manager',
  email: 'manager@example.com',
  units: [UNIT_ID],
  must_change_password: false,
  ...overrides,
});

const createQuery = () => ({
  startDate: '2026-05-01',
  endDate: '2026-05-17',
  period: 'daily' as const,
});

describe('AnalyticsService', () => {
  let repository: jest.Mocked<IAnalyticsRepository>;
  let service: AnalyticsService;

  beforeEach(() => {
    repository = createRepository();
    service = new AnalyticsService(repository, createMockLogger());
    repository.findUnitById.mockResolvedValue({
      unit_id: UNIT_ID,
      unit_name: 'Central Kitchen',
      unit_address: 'Jakarta',
    });
    repository.getMetrics.mockResolvedValue({
      total_revenue: 1_000_000,
      total_transactions: 12,
      average_order_value: 250_000,
      completed_transactions: 4,
      cancelled_transactions: 2,
    });
    repository.getStatusTransactions.mockResolvedValue([
      {
        status_code: 'COMPLETED',
        status_name: 'Completed',
        total_transactions: 4,
      },
      {
        status_code: 'CANCELLED',
        status_name: 'Cancelled',
        total_transactions: 2,
      },
      { status_code: 'PENDING', status_name: 'Pending', total_transactions: 6 },
    ]);
    repository.getTopMenus.mockResolvedValue([]);
    repository.getRevenueByMenu.mockResolvedValue([]);
    repository.getRevenueByUnit.mockResolvedValue([]);
    repository.getTopMenusByUnit.mockResolvedValue([]);
    repository.getCriticalStockUnits.mockResolvedValue([]);
    repository.getInventoryPerformanceByUnit.mockResolvedValue([]);
    repository.getPaymentSummary.mockResolvedValue([]);
    repository.getPaymentHistory.mockResolvedValue([]);
    repository.getLowStockItems.mockResolvedValue([]);
    repository.getDailyInventoryUsage.mockResolvedValue([]);
  });

  it('allows group management to see group summary with optional unit filter', async () => {
    const result = await service.getGroupSummary(
      createUser({ roles: 'GROUP_MANAGEMENT', units: [] }),
      { ...createQuery(), unitIds: [UNIT_ID] },
    );

    expect(result.statusCode).toBe(200);
    expect(repository.getMetrics).toHaveBeenCalledWith({
      unitIds: [UNIT_ID],
      startDate: '2026-05-01',
      endDate: '2026-05-17',
      period: 'daily',
    });
  });

  it('blocks unit manager from group summary', async () => {
    await expect(
      service.getGroupSummary(createUser(), createQuery()),
    ).rejects.toMatchObject({
      code: DomainErrorCodes.AuthForbidden,
    });
  });

  it('allows unit manager to see an assigned unit report', async () => {
    const result = await service.getUnitManagerReport(createUser(), {
      ...createQuery(),
      unitId: UNIT_ID,
    });

    expect(result.statusCode).toBe(200);
    expect(result.data.totalRevenue).toBe(1_000_000);
    expect(result.data.transactionStatus).toEqual({
      completed: 4,
      cancelled: 2,
      pending: 6,
    });
    expect(repository.getMetrics).toHaveBeenCalledWith({
      unitIds: [UNIT_ID],
      startDate: '2026-05-01',
      endDate: '2026-05-17',
      period: 'daily',
    });
  });

  it('blocks unit manager from another unit report', async () => {
    await expect(
      service.getUnitManagerReport(createUser(), {
        ...createQuery(),
        unitId: OTHER_UNIT_ID,
      }),
    ).rejects.toMatchObject({
      code: DomainErrorCodes.AuthForbidden,
    });
  });

  it('rejects invalid date range before querying analytics data', async () => {
    await expect(
      service.getUnitManagerReport(createUser(), {
        startDate: '2026-05-18',
        endDate: '2026-05-01',
      }),
    ).rejects.toMatchObject({
      status: 400,
    });

    expect(repository.getMetrics).not.toHaveBeenCalled();
  });
});
