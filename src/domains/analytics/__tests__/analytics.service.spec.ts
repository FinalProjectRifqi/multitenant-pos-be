import type { Logger } from 'pino';
import { DomainErrorCodes } from '../../../common/errors/error-codes-domain';
import type { JwtTokenPayload } from '../../auth/models/auth.model';
import { AnalyticsService } from '../analytics.service';
import type { AnalyticsSummaryData } from '../models/analytics.model';
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
    getCriticalStockUnits: jest.fn(),
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

const createEmptySummaryData = (): AnalyticsSummaryData => ({
  metrics: {
    total_revenue: 0,
    total_transactions: 0,
    average_order_value: 0,
    completed_transactions: 0,
    cancelled_transactions: 0,
  },
  status_transactions: [],
  top_menus: [],
  revenue_by_menu: [],
  revenue_by_unit: [],
  unit_comparison: [],
  critical_stock_units: [],
  payment_summary: [],
  payment_history: [],
  low_stock_items: [],
  daily_inventory_usage: [],
  waste_and_variance: [],
});

describe('AnalyticsService', () => {
  let repository: jest.Mocked<IAnalyticsRepository>;
  let service: AnalyticsService;

  beforeEach(() => {
    repository = createRepository();
    service = new AnalyticsService(repository, createMockLogger());
    repository.findUnitById.mockResolvedValue({ unit_id: UNIT_ID });
    repository.getMetrics.mockResolvedValue(createEmptySummaryData().metrics);
    repository.getStatusTransactions.mockResolvedValue([]);
    repository.getTopMenus.mockResolvedValue([]);
    repository.getRevenueByMenu.mockResolvedValue([]);
    repository.getRevenueByUnit.mockResolvedValue([]);
    repository.getCriticalStockUnits.mockResolvedValue([]);
    repository.getPaymentSummary.mockResolvedValue([]);
    repository.getPaymentHistory.mockResolvedValue([]);
    repository.getLowStockItems.mockResolvedValue([]);
    repository.getDailyInventoryUsage.mockResolvedValue([]);
  });

  it('allows group role to see group summary without unit scope', async () => {
    const result = await service.getGroupSummary(
      createUser({ roles: 'GROUP_MANAGER', units: [] }),
      {},
    );

    expect(result.statusCode).toBe(200);
    expect(repository.getMetrics).toHaveBeenCalledWith({});
  });

  it('blocks unit manager from group summary', async () => {
    await expect(
      service.getGroupSummary(createUser(), {}),
    ).rejects.toMatchObject({
      code: DomainErrorCodes.AuthForbidden,
    });
  });

  it('allows unit manager to see assigned unit summary', async () => {
    const result = await service.getUnitSummary(createUser(), UNIT_ID, {
      startDate: '2026-05-01',
      endDate: '2026-05-17',
    });

    expect(result.statusCode).toBe(200);
    expect(repository.getMetrics).toHaveBeenCalledWith({
      unitIds: [UNIT_ID],
      startDate: '2026-05-01',
      endDate: '2026-05-17',
    });
  });

  it('blocks unit manager from another unit summary', async () => {
    repository.findUnitById.mockResolvedValue({ unit_id: OTHER_UNIT_ID });

    await expect(
      service.getUnitSummary(createUser(), OTHER_UNIT_ID, {}),
    ).rejects.toMatchObject({
      code: DomainErrorCodes.AuthForbidden,
    });
  });
});
