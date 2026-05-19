// analytics.service.spec.ts
import type { Logger } from 'pino';
import { ErrorCodes } from '../../../common/errors/error-codes';
import type { IAnalyticsRepository } from '../repositories/analytics.repository';
import { AnalyticsService } from '../analytics.service';
import type {
  DailyInventoryRow,
  InventoryStatusRow,
  PaymentHistoryRow,
  SalesTrendPoint,
  TopMenuRow,
} from '../models/analytics.model';

// ===========================
// Helpers
// ===========================

const UNIT_ID = '550e8400-e29b-41d4-a716-446655440000';

const createMockRepository = (): jest.Mocked<IAnalyticsRepository> => ({
  findUnitById: jest.fn(),
  getKpiRaw: jest.fn(),
  getStokKritis: jest.fn(),
  getSalesTrend: jest.fn(),
  getTopMenus: jest.fn(),
  getRecentPayments: jest.fn(),
  getInventoryStatus: jest.fn(),
  getDailyInventory: jest.fn(),
});

const createMockLogger = (): jest.Mocked<Logger> =>
  ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  }) as unknown as jest.Mocked<Logger>;

const makeKpiRow = (overrides = {}) => ({
  total_omzet: '5000000',
  total_transaksi: '50',
  selesai: '48',
  dibatalkan: '2',
  ...overrides,
});

const makeTopMenu = (overrides?: Partial<TopMenuRow>): TopMenuRow => ({
  menu_item_id: 'menu-1',
  menu_item_name: 'Nasi Goreng',
  category_name: 'Makanan',
  qty_terjual: 30,
  pendapatan: 750000,
  ...overrides,
});

const makeSalesTrend = (
  overrides?: Partial<SalesTrendPoint>,
): SalesTrendPoint => ({
  label: 'Sen',
  date: '2026-05-13',
  omzet: 750000,
  transaksi: 12,
  ...overrides,
});

const makePayment = (
  overrides?: Partial<PaymentHistoryRow>,
): PaymentHistoryRow => ({
  payment_id: 'pay-1',
  reference_number: 'REF-001',
  order_number: 'ORD-001',
  amount: 75000,
  payment_method: 'QRIS',
  payment_status: 'paid',
  created_at: '2026-05-19T10:00:00.000Z',
  ...overrides,
});

const makeInventoryStatusRow = (
  overrides?: Partial<InventoryStatusRow>,
): InventoryStatusRow => ({
  inventory_item_id: 'inv-1',
  inventory_item_name: 'Beras',
  current_stock: 5,
  min_threshold: 20,
  unit_of_measure: 'kg',
  status: 'CRITICAL',
  ...overrides,
});

const makeDailyInventoryRow = (
  overrides?: Partial<DailyInventoryRow>,
): DailyInventoryRow => ({
  inventory_item_name: 'Beras',
  unit: 'kg',
  planned_usage_qty: 10,
  actual_usage_qty: 9,
  waste_qty: 1,
  variance_qty: -1,
  ...overrides,
});

// ===========================
// Test Suite
// ===========================

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let mockRepository: jest.Mocked<IAnalyticsRepository>;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    mockRepository = createMockRepository();
    mockLogger = createMockLogger();
    service = new AnalyticsService(mockRepository, mockLogger);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ─── assertUnitExists (via all methods) ─────────────────────────────────────
  describe('unit not found guard', () => {
    beforeEach(() => {
      mockRepository.findUnitById.mockResolvedValue(null);
    });

    it.each([
      ['getKpi', () => service.getKpi(UNIT_ID, '7d')],
      ['getSalesTrend', () => service.getSalesTrend(UNIT_ID, '7d')],
      ['getTopMenus', () => service.getTopMenus(UNIT_ID, '7d')],
      ['getRecentPayments', () => service.getRecentPayments(UNIT_ID)],
      ['getInventoryStatus', () => service.getInventoryStatus(UNIT_ID)],
      ['getDailyInventory', () => service.getDailyInventory(UNIT_ID)],
    ])('%s throws 404 when unit does not exist', async (_, fn) => {
      await expect(fn()).rejects.toMatchObject({
        code: ErrorCodes.NotFound,
        status: 404,
      });
    });
  });

  // ─── getKpi ─────────────────────────────────────────────────────────────────
  describe('getKpi', () => {
    beforeEach(() => {
      mockRepository.findUnitById.mockResolvedValue({ unit_id: UNIT_ID });
      mockRepository.getStokKritis.mockResolvedValue(3);
    });

    it('returns KPI with positive growth percentages', async () => {
      mockRepository.getKpiRaw
        .mockResolvedValueOnce(
          makeKpiRow({
            total_omzet: '5000000',
            total_transaksi: '50',
            selesai: '48',
            dibatalkan: '2',
          }),
        )
        .mockResolvedValueOnce(
          makeKpiRow({
            total_omzet: '4000000',
            total_transaksi: '40',
            selesai: '38',
            dibatalkan: '2',
          }),
        );

      const result = await service.getKpi(UNIT_ID, '7d');

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(200);
      expect(result.data.total_omzet).toBe(5000000);
      expect(result.data.total_transaksi).toBe(50);
      expect(result.data.selesai).toBe(48);
      expect(result.data.dibatalkan).toBe(2);
      expect(result.data.stok_kritis).toBe(3);
      expect(result.data.omzet_growth_pct).toBe(25);
      expect(result.data.transaksi_growth_pct).toBe(25);
    });

    it('sets growth_pct to null when previous period has no transactions', async () => {
      mockRepository.getKpiRaw
        .mockResolvedValueOnce(
          makeKpiRow({
            total_omzet: '5000000',
            total_transaksi: '50',
            selesai: '48',
            dibatalkan: '2',
          }),
        )
        .mockResolvedValueOnce(
          makeKpiRow({
            total_omzet: '0',
            total_transaksi: '0',
            selesai: '0',
            dibatalkan: '0',
          }),
        );

      const result = await service.getKpi(UNIT_ID, '7d');

      expect(result.data.omzet_growth_pct).toBeNull();
      expect(result.data.transaksi_growth_pct).toBeNull();
      expect(result.data.avg_growth_pct).toBeNull();
    });

    it('sets rata_rata_order to 0 when total_transaksi is 0', async () => {
      mockRepository.getKpiRaw
        .mockResolvedValueOnce(
          makeKpiRow({
            total_omzet: '0',
            total_transaksi: '0',
            selesai: '0',
            dibatalkan: '0',
          }),
        )
        .mockResolvedValueOnce(
          makeKpiRow({
            total_omzet: '0',
            total_transaksi: '0',
            selesai: '0',
            dibatalkan: '0',
          }),
        );

      const result = await service.getKpi(UNIT_ID, '7d');

      expect(result.data.rata_rata_order).toBe(0);
    });

    it('calculates negative growth when current < previous', async () => {
      mockRepository.getKpiRaw
        .mockResolvedValueOnce(
          makeKpiRow({
            total_omzet: '1000000',
            total_transaksi: '10',
            selesai: '10',
            dibatalkan: '0',
          }),
        )
        .mockResolvedValueOnce(
          makeKpiRow({
            total_omzet: '2000000',
            total_transaksi: '20',
            selesai: '20',
            dibatalkan: '0',
          }),
        );

      const result = await service.getKpi(UNIT_ID, '7d');

      expect(result.data.omzet_growth_pct).toBe(-50);
    });
  });

  // ─── getSalesTrend ──────────────────────────────────────────────────────────
  describe('getSalesTrend', () => {
    it('returns sales trend data array', async () => {
      mockRepository.findUnitById.mockResolvedValue({ unit_id: UNIT_ID });
      const trends = [
        makeSalesTrend(),
        makeSalesTrend({ label: 'Sel', date: '2026-05-14' }),
      ];
      mockRepository.getSalesTrend.mockResolvedValueOnce(trends);

      const result = await service.getSalesTrend(UNIT_ID, '7d');

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(200);
      expect(result.data).toHaveLength(2);
      expect(result.data[0].label).toBe('Sen');
    });

    it('returns empty array when no sales in period', async () => {
      mockRepository.findUnitById.mockResolvedValue({ unit_id: UNIT_ID });
      mockRepository.getSalesTrend.mockResolvedValueOnce([]);

      const result = await service.getSalesTrend(UNIT_ID, '7d');

      expect(result.data).toEqual([]);
    });
  });

  // ─── getTopMenus ─────────────────────────────────────────────────────────────
  describe('getTopMenus', () => {
    it('returns top menus list with default limit of 5', async () => {
      mockRepository.findUnitById.mockResolvedValue({ unit_id: UNIT_ID });
      const menus = [
        makeTopMenu(),
        makeTopMenu({ menu_item_id: 'menu-2', menu_item_name: 'Mie Goreng' }),
      ];
      mockRepository.getTopMenus.mockResolvedValueOnce(menus);

      const result = await service.getTopMenus(UNIT_ID, '7d');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(mockRepository.getTopMenus).toHaveBeenCalledWith(
        UNIT_ID,
        expect.any(Date),
        expect.any(Date),
        5,
      );
    });

    it('returns empty array when no sales in period', async () => {
      mockRepository.findUnitById.mockResolvedValue({ unit_id: UNIT_ID });
      mockRepository.getTopMenus.mockResolvedValueOnce([]);

      const result = await service.getTopMenus(UNIT_ID, '7d');

      expect(result.data).toEqual([]);
    });
  });

  // ─── getRecentPayments ──────────────────────────────────────────────────────
  describe('getRecentPayments', () => {
    it('returns payments list with default limit of 10', async () => {
      mockRepository.findUnitById.mockResolvedValue({ unit_id: UNIT_ID });
      const payments = Array.from({ length: 3 }, (_, i) =>
        makePayment({ payment_id: `pay-${i}`, order_number: `ORD-00${i}` }),
      );
      mockRepository.getRecentPayments.mockResolvedValueOnce(payments);

      const result = await service.getRecentPayments(UNIT_ID);

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(200);
      expect(result.data).toHaveLength(3);
      expect(mockRepository.getRecentPayments).toHaveBeenCalledWith(
        UNIT_ID,
        10,
      );
    });

    it('all returned payments have status paid', async () => {
      mockRepository.findUnitById.mockResolvedValue({ unit_id: UNIT_ID });
      const payments = [makePayment({ payment_status: 'paid' })];
      mockRepository.getRecentPayments.mockResolvedValueOnce(payments);

      const result = await service.getRecentPayments(UNIT_ID);

      result.data.forEach((p) => expect(p.payment_status).toBe('paid'));
    });

    it('returns empty array when no payments exist', async () => {
      mockRepository.findUnitById.mockResolvedValue({ unit_id: UNIT_ID });
      mockRepository.getRecentPayments.mockResolvedValueOnce([]);

      const result = await service.getRecentPayments(UNIT_ID);

      expect(result.data).toEqual([]);
    });
  });

  // ─── getInventoryStatus ─────────────────────────────────────────────────────
  describe('getInventoryStatus', () => {
    it('returns grouped inventory status with low_or_critical and out_of_stock', async () => {
      mockRepository.findUnitById.mockResolvedValue({ unit_id: UNIT_ID });
      const lowOrCritical = [
        makeInventoryStatusRow({ status: 'LOW' }),
        makeInventoryStatusRow({
          inventory_item_id: 'inv-2',
          status: 'CRITICAL',
        }),
      ];
      const outOfStock = [
        makeInventoryStatusRow({
          inventory_item_id: 'inv-3',
          status: 'OUT',
          current_stock: 0,
        }),
      ];
      mockRepository.getInventoryStatus.mockResolvedValueOnce({
        lowOrCritical,
        outOfStock,
      });

      const result = await service.getInventoryStatus(UNIT_ID);

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(200);
      expect(result.data.low_or_critical).toHaveLength(2);
      expect(result.data.out_of_stock).toHaveLength(1);
    });

    it('returns empty arrays when all stock is normal', async () => {
      mockRepository.findUnitById.mockResolvedValue({ unit_id: UNIT_ID });
      mockRepository.getInventoryStatus.mockResolvedValueOnce({
        lowOrCritical: [],
        outOfStock: [],
      });

      const result = await service.getInventoryStatus(UNIT_ID);

      expect(result.data.low_or_critical).toEqual([]);
      expect(result.data.out_of_stock).toEqual([]);
    });
  });

  // ─── getDailyInventory ──────────────────────────────────────────────────────
  describe('getDailyInventory', () => {
    it('uses provided date when given', async () => {
      mockRepository.findUnitById.mockResolvedValue({ unit_id: UNIT_ID });
      const rows = [makeDailyInventoryRow()];
      mockRepository.getDailyInventory.mockResolvedValueOnce(rows);

      const result = await service.getDailyInventory(UNIT_ID, '2026-05-19');

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(200);
      expect(result.data).toHaveLength(1);
      expect(mockRepository.getDailyInventory).toHaveBeenCalledWith(
        UNIT_ID,
        '2026-05-19',
      );
    });

    it('defaults to today when date is not provided', async () => {
      mockRepository.findUnitById.mockResolvedValue({ unit_id: UNIT_ID });
      mockRepository.getDailyInventory.mockResolvedValueOnce([]);

      const todayStr = new Date().toISOString().slice(0, 10);
      await service.getDailyInventory(UNIT_ID);

      expect(mockRepository.getDailyInventory).toHaveBeenCalledWith(
        UNIT_ID,
        todayStr,
      );
    });

    it('returns empty array when no plans exist for date', async () => {
      mockRepository.findUnitById.mockResolvedValue({ unit_id: UNIT_ID });
      mockRepository.getDailyInventory.mockResolvedValueOnce([]);

      const result = await service.getDailyInventory(UNIT_ID, '2026-05-19');

      expect(result.data).toEqual([]);
    });
  });
});
