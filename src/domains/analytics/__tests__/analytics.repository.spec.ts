// analytics.repository.spec.ts
import type { Knex } from 'knex';
import {
  AnalyticsRepository,
  resolveDateRange,
  resolvePreviousDateRange,
} from '../repositories/analytics.repository';

// ===========================
// Knex mock builder helper
// ===========================

type MockBuilder = Record<string, jest.Mock>;

const createBuilder = (): MockBuilder => {
  const b: MockBuilder = {
    join: jest.fn(),
    leftJoin: jest.fn(),
    where: jest.fn(),
    whereNull: jest.fn(),
    whereRaw: jest.fn(),
    whereNot: jest.fn(),
    select: jest.fn(),
    orderBy: jest.fn(),
    orderByRaw: jest.fn(),
    groupBy: jest.fn(),
    groupByRaw: jest.fn(),
    limit: jest.fn(),
    count: jest.fn(),
    first: jest.fn(),
    raw: jest.fn(),
  };

  // All chainable methods return `b` by default
  for (const key of Object.keys(b)) {
    if (key !== 'first' && key !== 'raw') {
      b[key].mockReturnValue(b);
    }
  }

  return b;
};

const createKnex = (builder: MockBuilder): Knex => {
  const knex = jest.fn().mockReturnValue(builder) as unknown as Knex;
  (knex as unknown as Record<string, jest.Mock>).raw = jest
    .fn()
    .mockReturnValue('raw_expr');
  return knex;
};

// ===========================
// resolveDateRange
// ===========================

describe('resolveDateRange', () => {
  const now = new Date('2026-05-19T12:00:00.000Z');

  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(now);
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('today: startDate is start of today', () => {
    const { startDate, endDate } = resolveDateRange('today');
    expect(startDate.getHours()).toBe(0);
    expect(startDate.getMinutes()).toBe(0);
    expect(startDate.getSeconds()).toBe(0);
    expect(endDate.getTime()).toBeGreaterThanOrEqual(startDate.getTime());
  });

  it('7d: startDate is 7 days before now', () => {
    const { startDate, endDate } = resolveDateRange('7d');
    const diffDays =
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    expect(diffDays).toBeCloseTo(7, 0);
  });

  it('30d: startDate is 30 days before now', () => {
    const { startDate, endDate } = resolveDateRange('30d');
    const diffDays =
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    expect(diffDays).toBeCloseTo(30, 0);
  });

  it('month: startDate is first day of current month', () => {
    const { startDate } = resolveDateRange('month');
    expect(startDate.getDate()).toBe(1);
    expect(startDate.getHours()).toBe(0);
  });

  it('quarter: startDate is 3 months before now', () => {
    const { startDate, endDate } = resolveDateRange('quarter');
    const diffMs = endDate.getTime() - startDate.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    // 3 months ≈ 90–92 days
    expect(diffDays).toBeGreaterThanOrEqual(89);
    expect(diffDays).toBeLessThanOrEqual(93);
  });

  it('defaults to 7d for unknown period', () => {
    const { startDate, endDate } = resolveDateRange('unknown');
    const diffDays =
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    expect(diffDays).toBeCloseTo(7, 0);
  });
});

// ===========================
// resolvePreviousDateRange
// ===========================

describe('resolvePreviousDateRange', () => {
  const now = new Date('2026-05-19T12:00:00.000Z');

  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(now);
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('today: previous is yesterday (startDate hours=0)', () => {
    const { startDate, endDate } = resolvePreviousDateRange('today');
    expect(startDate.getHours()).toBe(0);
    expect(endDate.getHours()).toBe(23);
    expect(endDate.getMinutes()).toBe(59);
  });

  it('7d: previous is the 7d window before current 7d', () => {
    const { startDate, endDate } = resolvePreviousDateRange('7d');
    const diffDays =
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    expect(diffDays).toBeCloseTo(7, 0);
  });

  it('30d: previous is the 30d window before current 30d', () => {
    const { startDate, endDate } = resolvePreviousDateRange('30d');
    const diffDays =
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    expect(diffDays).toBeCloseTo(30, 0);
  });

  it('month: previous is the previous calendar month', () => {
    const { startDate, endDate } = resolvePreviousDateRange('month');
    // April 2026: month 3 (0-indexed)
    expect(startDate.getMonth()).toBe(3);
    expect(startDate.getDate()).toBe(1);
    // endDate is last day of April 2026
    expect(endDate.getMonth()).toBe(3);
    expect(endDate.getDate()).toBe(30);
  });

  it('quarter: previous is 3 months before current quarter', () => {
    const { startDate, endDate } = resolvePreviousDateRange('quarter');
    const diffDays =
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    expect(diffDays).toBeGreaterThanOrEqual(89);
    expect(diffDays).toBeLessThanOrEqual(93);
  });
});

// ===========================
// AnalyticsRepository
// ===========================

describe('AnalyticsRepository', () => {
  // ─── findUnitById ───────────────────────────────────────────────────────────
  describe('findUnitById', () => {
    it('returns the unit when found', async () => {
      const unit = { unit_id: 'u1' };
      const b = createBuilder();
      b.first.mockResolvedValueOnce(unit);
      const knex = createKnex(b);

      const repo = new AnalyticsRepository(knex);
      const result = await repo.findUnitById('u1');

      expect(result).toEqual(unit);
      expect(b.whereNull).toHaveBeenCalledWith('deleted_at');
    });

    it('returns null when unit is not found', async () => {
      const b = createBuilder();
      b.first.mockResolvedValueOnce(undefined);
      const knex = createKnex(b);

      const repo = new AnalyticsRepository(knex);
      const result = await repo.findUnitById('not-exist');

      expect(result).toBeNull();
    });
  });

  // ─── getStokKritis ──────────────────────────────────────────────────────────
  describe('getStokKritis', () => {
    it('returns parsed count', async () => {
      const b = createBuilder();
      b.first.mockResolvedValueOnce({ count: '5' });
      const knex = createKnex(b);

      const repo = new AnalyticsRepository(knex);
      const result = await repo.getStokKritis('u1');

      expect(result).toBe(5);
    });

    it('returns 0 when no critical stock items', async () => {
      const b = createBuilder();
      b.first.mockResolvedValueOnce(undefined);
      const knex = createKnex(b);

      const repo = new AnalyticsRepository(knex);
      const result = await repo.getStokKritis('u1');

      expect(result).toBe(0);
    });
  });

  // ─── getKpiRaw ──────────────────────────────────────────────────────────────
  describe('getKpiRaw', () => {
    it('returns KPI row values', async () => {
      const kpiRow = {
        total_omzet: '1000000',
        total_transaksi: '10',
        selesai: '9',
        dibatalkan: '1',
      };
      const b = createBuilder();
      b.first.mockResolvedValueOnce(kpiRow);
      const knex = createKnex(b);

      const repo = new AnalyticsRepository(knex);
      const result = await repo.getKpiRaw('u1', new Date(), new Date());

      expect(result).toEqual(kpiRow);
    });

    it('returns zeros when no orders exist', async () => {
      const b = createBuilder();
      b.first.mockResolvedValueOnce(undefined);
      const knex = createKnex(b);

      const repo = new AnalyticsRepository(knex);
      const result = await repo.getKpiRaw('u1', new Date(), new Date());

      expect(result.total_omzet).toBe(0);
      expect(result.total_transaksi).toBe(0);
    });
  });

  // ─── getRecentPayments ──────────────────────────────────────────────────────
  describe('getRecentPayments', () => {
    it('maps rows to PaymentHistoryRow and sets QRIS for qr_string rows', async () => {
      const rawRows = [
        {
          payment_id: 'p1',
          reference_number: 'REF-001',
          order_number: 'ORD-001',
          amount: 75000,
          qr_string: 'some-qr-data',
          payment_status: 'paid',
          created_at: new Date('2026-05-19T10:00:00Z'),
        },
        {
          payment_id: 'p2',
          reference_number: 'REF-002',
          order_number: 'ORD-002',
          amount: 50000,
          qr_string: null,
          payment_status: 'paid',
          created_at: new Date('2026-05-19T09:00:00Z'),
        },
      ];

      const b = createBuilder();
      b.limit.mockResolvedValueOnce(rawRows);
      const knex = createKnex(b);

      const repo = new AnalyticsRepository(knex);
      const result = await repo.getRecentPayments('u1', 10);

      expect(result).toHaveLength(2);
      expect(result[0].payment_method).toBe('QRIS');
      expect(result[1].payment_method).toBe('Tunai');
      expect(result[0].payment_status).toBe('paid');
      expect(result[0].amount).toBe(75000);
      // verify filter was applied
      expect(b.where).toHaveBeenCalledWith('p.payment_status', 'paid');
    });

    it('returns empty array when no paid payments exist', async () => {
      const b = createBuilder();
      b.limit.mockResolvedValueOnce([]);
      const knex = createKnex(b);

      const repo = new AnalyticsRepository(knex);
      const result = await repo.getRecentPayments('u1', 10);

      expect(result).toEqual([]);
    });

    it('created_at as string is kept as string', async () => {
      const rawRows = [
        {
          payment_id: 'p1',
          reference_number: 'REF-001',
          order_number: 'ORD-001',
          amount: 60000,
          qr_string: null,
          payment_status: 'paid',
          created_at: '2026-05-19T10:00:00.000Z',
        },
      ];

      const b = createBuilder();
      b.limit.mockResolvedValueOnce(rawRows);
      const knex = createKnex(b);

      const repo = new AnalyticsRepository(knex);
      const result = await repo.getRecentPayments('u1', 10);

      expect(typeof result[0].created_at).toBe('string');
    });
  });

  // ─── getInventoryStatus ─────────────────────────────────────────────────────
  describe('getInventoryStatus', () => {
    const makeInventoryRow = (
      id: string,
      name: string,
      stock: number,
      min: number,
    ) => ({
      inventory_item_id: id,
      inventory_item_name: name,
      unit_of_measure: 'kg',
      current_stock: stock,
      min_threshold: min,
    });

    it('classifies OUT when stock = 0', async () => {
      const rows = [makeInventoryRow('i1', 'Tepung', 0, 10)];
      const b = createBuilder();
      b.orderBy.mockResolvedValueOnce(rows);
      const knex = createKnex(b);

      const repo = new AnalyticsRepository(knex);
      const { lowOrCritical, outOfStock } = await repo.getInventoryStatus('u1');

      expect(outOfStock).toHaveLength(1);
      expect(outOfStock[0].status).toBe('OUT');
      expect(lowOrCritical).toHaveLength(0);
    });

    it('classifies CRITICAL when stock > 0 and stock < min * 0.5', async () => {
      const rows = [makeInventoryRow('i2', 'Gula', 3, 10)]; // 3 < 10 * 0.5 = 5
      const b = createBuilder();
      b.orderBy.mockResolvedValueOnce(rows);
      const knex = createKnex(b);

      const repo = new AnalyticsRepository(knex);
      const { lowOrCritical, outOfStock } = await repo.getInventoryStatus('u1');

      expect(lowOrCritical).toHaveLength(1);
      expect(lowOrCritical[0].status).toBe('CRITICAL');
      expect(outOfStock).toHaveLength(0);
    });

    it('classifies LOW when stock > 0 and stock >= min * 0.5', async () => {
      const rows = [makeInventoryRow('i3', 'Beras', 6, 10)]; // 6 >= 5 && 6 <= 10
      const b = createBuilder();
      b.orderBy.mockResolvedValueOnce(rows);
      const knex = createKnex(b);

      const repo = new AnalyticsRepository(knex);
      const { lowOrCritical, outOfStock } = await repo.getInventoryStatus('u1');

      expect(lowOrCritical).toHaveLength(1);
      expect(lowOrCritical[0].status).toBe('LOW');
      expect(outOfStock).toHaveLength(0);
    });

    it('classifies CRITICAL at boundary: stock = min * 0.5 - 1', async () => {
      const rows = [makeInventoryRow('i4', 'Minyak', 4, 10)]; // 4 < 5
      const b = createBuilder();
      b.orderBy.mockResolvedValueOnce(rows);
      const knex = createKnex(b);

      const repo = new AnalyticsRepository(knex);
      const { lowOrCritical } = await repo.getInventoryStatus('u1');

      expect(lowOrCritical[0].status).toBe('CRITICAL');
    });

    it('classifies LOW at boundary: stock = min * 0.5 exactly', async () => {
      const rows = [makeInventoryRow('i5', 'Kopi', 5, 10)]; // 5 = 5 exactly
      const b = createBuilder();
      b.orderBy.mockResolvedValueOnce(rows);
      const knex = createKnex(b);

      const repo = new AnalyticsRepository(knex);
      const { lowOrCritical } = await repo.getInventoryStatus('u1');

      expect(lowOrCritical[0].status).toBe('LOW');
    });

    it('separates mixed statuses correctly', async () => {
      const rows = [
        makeInventoryRow('i1', 'Tepung', 0, 10), // OUT
        makeInventoryRow('i2', 'Gula', 3, 10), // CRITICAL
        makeInventoryRow('i3', 'Beras', 6, 10), // LOW
      ];
      const b = createBuilder();
      b.orderBy.mockResolvedValueOnce(rows);
      const knex = createKnex(b);

      const repo = new AnalyticsRepository(knex);
      const { lowOrCritical, outOfStock } = await repo.getInventoryStatus('u1');

      expect(outOfStock).toHaveLength(1);
      expect(lowOrCritical).toHaveLength(2);
    });

    it('returns empty arrays when all stock is normal', async () => {
      const b = createBuilder();
      b.orderBy.mockResolvedValueOnce([]);
      const knex = createKnex(b);

      const repo = new AnalyticsRepository(knex);
      const { lowOrCritical, outOfStock } = await repo.getInventoryStatus('u1');

      expect(lowOrCritical).toEqual([]);
      expect(outOfStock).toEqual([]);
    });
  });

  // ─── getDailyInventory ──────────────────────────────────────────────────────
  describe('getDailyInventory', () => {
    it('maps null actual/variance to 0 and null waste to null', async () => {
      const rawRows = [
        {
          inventory_item_name: 'Beras',
          unit: 'kg',
          planned_usage_qty: 10,
          actual_usage_qty: null,
          waste_qty: null,
          variance_qty: null,
        },
      ];
      const b = createBuilder();
      b.orderBy.mockResolvedValueOnce(rawRows);
      const knex = createKnex(b);

      const repo = new AnalyticsRepository(knex);
      const result = await repo.getDailyInventory('u1', '2026-05-19');

      expect(result[0].actual_usage_qty).toBe(0);
      expect(result[0].variance_qty).toBe(0);
      expect(result[0].waste_qty).toBeNull();
    });

    it('maps actual values when realization exists', async () => {
      const rawRows = [
        {
          inventory_item_name: 'Gula',
          unit: 'kg',
          planned_usage_qty: 5,
          actual_usage_qty: 4,
          waste_qty: 1,
          variance_qty: -1,
        },
      ];
      const b = createBuilder();
      b.orderBy.mockResolvedValueOnce(rawRows);
      const knex = createKnex(b);

      const repo = new AnalyticsRepository(knex);
      const result = await repo.getDailyInventory('u1', '2026-05-19');

      expect(result[0].actual_usage_qty).toBe(4);
      expect(result[0].waste_qty).toBe(1);
      expect(result[0].variance_qty).toBe(-1);
    });

    it('returns empty array when no plans exist', async () => {
      const b = createBuilder();
      b.orderBy.mockResolvedValueOnce([]);
      const knex = createKnex(b);

      const repo = new AnalyticsRepository(knex);
      const result = await repo.getDailyInventory('u1', '2026-05-19');

      expect(result).toEqual([]);
    });
  });
});
