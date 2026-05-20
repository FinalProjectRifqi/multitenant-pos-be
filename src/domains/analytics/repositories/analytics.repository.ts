import type { Knex } from 'knex';
import type {
  DailyInventoryRow,
  InventoryStatusRow,
  PaymentHistoryRow,
  SalesTrendPoint,
  StockStatus,
  TopMenuRow,
  UnitCompareRow,
  UnitPerformanceRow,
} from '../models/analytics.model';

// ===========================
// Period Helper
// ===========================

export function resolveDateRange(period: string): {
  startDate: Date;
  endDate: Date;
} {
  const now = new Date();
  const endDate = new Date(now);
  let startDate: Date;

  switch (period) {
    case 'today': {
      startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
      break;
    }
    case '30d': {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 30);
      break;
    }
    case 'month': {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      break;
    }
    case 'quarter': {
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 3);
      break;
    }
    case '7d':
    default: {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
      break;
    }
  }

  return { startDate, endDate };
}

/**
 * Returns the date range for the previous equivalent period.
 * Used to calculate growth % (current vs previous).
 */
export function resolvePreviousDateRange(period: string): {
  startDate: Date;
  endDate: Date;
} {
  const now = new Date();
  let startDate: Date;
  let endDate: Date;

  switch (period) {
    case 'today': {
      // Previous: yesterday (00:00 → 23:59:59)
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 1);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setHours(23, 59, 59, 999);
      break;
    }
    case '30d': {
      endDate = new Date(now);
      endDate.setDate(endDate.getDate() - 30);
      startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - 30);
      break;
    }
    case 'month': {
      // Previous calendar month
      startDate = new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        1,
        0,
        0,
        0,
        0,
      );
      endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      break;
    }
    case 'quarter': {
      endDate = new Date(now);
      endDate.setMonth(endDate.getMonth() - 3);
      startDate = new Date(endDate);
      startDate.setMonth(startDate.getMonth() - 3);
      break;
    }
    case '7d':
    default: {
      endDate = new Date(now);
      endDate.setDate(endDate.getDate() - 7);
      startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - 7);
      break;
    }
  }

  return { startDate, endDate };
}

// ===========================
// Raw DB Row Types
// ===========================

interface KpiRow {
  total_omzet: string | number;
  total_transaksi: string | number;
  selesai: string | number;
  dibatalkan: string | number;
}

type GroupKpiRaw = KpiRow;

interface UnitKpiRaw extends KpiRow {
  unit_id: string;
  unit_name: string;
}

interface SalesTrendRow {
  bucket: string;
  omzet: string | number;
  transaksi: string | number;
}

interface TopMenuRaw {
  menu_item_id: string;
  menu_item_name: string;
  category_name: string;
  qty_terjual: string | number;
  pendapatan: string | number;
}

interface PaymentRaw {
  payment_id: string;
  reference_number: string;
  order_number: string;
  amount: number;
  qr_string: string | null;
  payment_status: string;
  created_at: Date;
}

interface InventoryRaw {
  inventory_item_id: string;
  inventory_item_name: string;
  unit_of_measure: string;
  current_stock: number | null;
  min_threshold: number | null;
}

interface DailyInventoryRaw {
  inventory_item_name: string;
  unit: string;
  planned_usage_qty: number;
  actual_usage_qty: number | null;
  waste_qty: number | null;
  variance_qty: number | null;
}

// ===========================
// Repository Interface
// ===========================

export interface IAnalyticsRepository {
  getKpiRaw(unitId: string, startDate: Date, endDate: Date): Promise<KpiRow>;
  getStokKritis(unitId: string): Promise<number>;
  getSalesTrend(
    unitId: string,
    startDate: Date,
    endDate: Date,
    period: string,
  ): Promise<SalesTrendPoint[]>;
  getTopMenus(
    unitId: string,
    startDate: Date,
    endDate: Date,
    limit: number,
  ): Promise<TopMenuRow[]>;
  getRecentPayments(
    unitId: string,
    limit: number,
  ): Promise<PaymentHistoryRow[]>;
  getInventoryStatus(unitId: string): Promise<{
    lowOrCritical: InventoryStatusRow[];
    outOfStock: InventoryStatusRow[];
  }>;
  getDailyInventory(unitId: string, date: string): Promise<DailyInventoryRow[]>;
  findUnitById(unitId: string): Promise<{ unit_id: string } | null>;
  // ─── Group Analytics ────────────────────────────
  getGroupKpiRaw(startDate: Date, endDate: Date): Promise<GroupKpiRaw>;
  getGroupSalesTrend(
    startDate: Date,
    endDate: Date,
    period: string,
  ): Promise<SalesTrendPoint[]>;
  getGroupTopMenus(
    startDate: Date,
    endDate: Date,
    limit: number,
  ): Promise<TopMenuRow[]>;
  getGroupTotalStokKritis(): Promise<number>;
  getUnitPerformanceTable(
    startDate: Date,
    endDate: Date,
  ): Promise<UnitPerformanceRow[]>;
  getGroupCompare(
    unitIds: string[],
    startDate: Date,
    endDate: Date,
  ): Promise<UnitCompareRow[]>;
}

// ===========================
// Repository Implementation
// ===========================

export class AnalyticsRepository implements IAnalyticsRepository {
  constructor(private readonly knex: Knex) {}

  async findUnitById(unitId: string): Promise<{ unit_id: string } | null> {
    const row = await this.knex<{ unit_id: string }>('units')
      .where({ unit_id: unitId })
      .whereNull('deleted_at')
      .first();
    return row ?? null;
  }

  async getKpiRaw(
    unitId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<KpiRow> {
    const row = await this.knex('orders as o')
      .join('order_status as os', 'o.order_status_id', 'os.order_status_id')
      .where('o.unit_id', unitId)
      .whereNull('o.deleted_at')
      .where('o.ordered_at', '>=', startDate)
      .where('o.ordered_at', '<=', endDate)
      .select(
        this.knex.raw('COALESCE(SUM(o.total_amount), 0) as total_omzet'),
        this.knex.raw(
          "COUNT(CASE WHEN os.order_status_code IN ('SELESAI', 'DIBATALKAN') THEN 1 END) as total_transaksi",
        ),
        this.knex.raw(
          "COUNT(CASE WHEN os.order_status_code = 'SELESAI' THEN 1 END) as selesai",
        ),
        this.knex.raw(
          "COUNT(CASE WHEN os.order_status_code = 'DIBATALKAN' THEN 1 END) as dibatalkan",
        ),
      )
      .first<KpiRow>();

    return (
      row ?? { total_omzet: 0, total_transaksi: 0, selesai: 0, dibatalkan: 0 }
    );
  }

  async getStokKritis(unitId: string): Promise<number> {
    const result = await this.knex('inventory_items as ii')
      .join(
        'inventory_items_units as iiu',
        'ii.inventory_item_id',
        'iiu.inventory_item_id',
      )
      .where('iiu.unit_id', unitId)
      .whereNull('ii.deleted_at')
      .whereNull('iiu.deleted_at')
      .whereRaw('ii.current_stock IS NOT NULL AND ii.min_threshold IS NOT NULL')
      .whereRaw('ii.current_stock < ii.min_threshold')
      .count<{ count: string }>('ii.inventory_item_id as count')
      .first();

    return parseInt(result?.count ?? '0', 10);
  }

  async getSalesTrend(
    unitId: string,
    startDate: Date,
    endDate: Date,
    period: string,
  ): Promise<SalesTrendPoint[]> {
    // Bucket by day always (for all periods within range)
    const rows = (await this.knex('orders as o')
      .where('o.unit_id', unitId)
      .whereNull('o.deleted_at')
      .where('o.ordered_at', '>=', startDate)
      .where('o.ordered_at', '<=', endDate)
      .select(
        this.knex.raw("DATE_TRUNC('day', o.ordered_at)::date::text as bucket"),
        this.knex.raw('COALESCE(SUM(o.total_amount), 0) as omzet'),
        this.knex.raw('COUNT(o.order_id) as transaksi'),
      )
      .groupByRaw("DATE_TRUNC('day', o.ordered_at)")
      .orderByRaw("DATE_TRUNC('day', o.ordered_at) ASC")) as SalesTrendRow[];

    return rows.map((r) => {
      const date = r.bucket;
      const d = new Date(date);
      const label = this.formatDayLabel(d, period);
      return {
        label,
        date,
        omzet: Number(r.omzet),
        transaksi: Number(r.transaksi),
      };
    });
  }

  private formatDayLabel(d: Date, period: string): string {
    if (period === 'today') {
      return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
    }
    if (period === '7d') {
      const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
      return (
        days[d.getDay()] ??
        d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })
      );
    }
    // 30d, month, quarter: show dd/MM
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' });
  }

  async getTopMenus(
    unitId: string,
    startDate: Date,
    endDate: Date,
    limit: number,
  ): Promise<TopMenuRow[]> {
    const rows = (await this.knex('order_items as oi')
      .join('orders as o', 'oi.order_id', 'o.order_id')
      .join('order_status as os', 'o.order_status_id', 'os.order_status_id')
      .join('menu_items as mi', 'oi.menu_item_id', 'mi.menu_item_id')
      .join(
        'menu_categories as mc',
        'mi.menu_category_id',
        'mc.menu_category_id',
      )
      .where('o.unit_id', unitId)
      .whereNull('o.deleted_at')
      .whereNull('oi.deleted_at')
      .where('o.ordered_at', '>=', startDate)
      .where('o.ordered_at', '<=', endDate)
      .whereNot('os.order_status_code', 'DIBATALKAN')
      .select(
        'mi.menu_item_id',
        'mi.menu_item_name',
        'mc.category_name',
        this.knex.raw('SUM(oi.quantity) as qty_terjual'),
        this.knex.raw('SUM(oi.quantity * oi.item_price) as pendapatan'),
      )
      .groupBy('mi.menu_item_id', 'mi.menu_item_name', 'mc.category_name')
      .orderBy('pendapatan', 'desc')
      .limit(limit)) as TopMenuRaw[];

    return rows.map((r) => ({
      menu_item_id: r.menu_item_id,
      menu_item_name: r.menu_item_name,
      category_name: r.category_name,
      qty_terjual: Number(r.qty_terjual),
      pendapatan: Number(r.pendapatan),
    }));
  }

  async getRecentPayments(
    unitId: string,
    limit: number,
  ): Promise<PaymentHistoryRow[]> {
    const rows = (await this.knex('payments as p')
      .join('orders as o', 'p.order_id', 'o.order_id')
      .where('o.unit_id', unitId)
      .where('p.payment_status', 'paid')
      .whereNull('p.deleted_at')
      .select(
        'p.payment_id',
        'p.reference_number',
        'o.order_number',
        'p.amount',
        'p.qr_string',
        'p.payment_status',
        'p.created_at',
      )
      .orderBy('p.created_at', 'desc')
      .limit(limit)) as PaymentRaw[];

    return rows.map((r) => ({
      payment_id: r.payment_id,
      reference_number: r.reference_number,
      order_number: r.order_number,
      amount: Number(r.amount),
      payment_method: r.qr_string ? 'QRIS' : 'Tunai',
      payment_status: r.payment_status as PaymentHistoryRow['payment_status'],
      created_at:
        r.created_at instanceof Date
          ? r.created_at.toISOString()
          : String(r.created_at),
    }));
  }

  async getInventoryStatus(unitId: string): Promise<{
    lowOrCritical: InventoryStatusRow[];
    outOfStock: InventoryStatusRow[];
  }> {
    const rows = (await this.knex('inventory_items as ii')
      .join(
        'inventory_items_units as iiu',
        'ii.inventory_item_id',
        'iiu.inventory_item_id',
      )
      .where('iiu.unit_id', unitId)
      .whereNull('ii.deleted_at')
      .whereNull('iiu.deleted_at')
      .whereRaw('ii.current_stock IS NOT NULL AND ii.min_threshold IS NOT NULL')
      .whereRaw('ii.current_stock < ii.min_threshold OR ii.current_stock = 0')
      .select(
        'ii.inventory_item_id',
        'ii.inventory_item_name',
        'ii.unit_of_measure',
        'ii.current_stock',
        'ii.min_threshold',
      )
      .orderBy('ii.current_stock', 'asc')) as InventoryRaw[];

    const mapped = rows.map((r) => {
      const stock = r.current_stock ?? 0;
      const min = r.min_threshold ?? 0;
      let status: StockStatus;
      if (stock === 0) {
        status = 'OUT';
      } else if (min > 0 && stock < min * 0.5) {
        status = 'CRITICAL';
      } else {
        // stock <= min && stock != 0 && stock >= min * 0.5
        status = 'LOW';
      }
      return {
        inventory_item_id: r.inventory_item_id,
        inventory_item_name: r.inventory_item_name,
        unit_of_measure: r.unit_of_measure,
        current_stock: stock,
        min_threshold: min,
        status,
      };
    });

    return {
      lowOrCritical: mapped.filter(
        (r) => r.status === 'LOW' || r.status === 'CRITICAL',
      ),
      outOfStock: mapped.filter((r) => r.status === 'OUT'),
    };
  }

  async getDailyInventory(
    unitId: string,
    date: string,
  ): Promise<DailyInventoryRow[]> {
    const rows = (await this.knex('daily_inventory_plans as dip')
      .join(
        'inventory_items as ii',
        'dip.inventory_item_id',
        'ii.inventory_item_id',
      )
      .leftJoin(
        'daily_inventory_realizations as dir',
        'dip.daily_inventory_plan_id',
        'dir.daily_inventory_plan_id',
      )
      .where('dip.unit_id', unitId)
      .where('dip.date', date)
      .select(
        'ii.inventory_item_name',
        'dip.unit',
        'dip.planned_usage_qty',
        'dir.actual_usage_qty',
        'dir.waste_qty',
        'dir.variance_qty',
      )
      .orderBy('ii.inventory_item_name', 'asc')) as DailyInventoryRaw[];

    return rows.map((r) => ({
      inventory_item_name: r.inventory_item_name,
      unit: r.unit,
      planned_usage_qty: r.planned_usage_qty,
      actual_usage_qty: r.actual_usage_qty ?? 0,
      waste_qty: r.waste_qty ?? null,
      variance_qty: r.variance_qty ?? 0,
    }));
  }

  // ─── Group Analytics ────────────────────────────

  async getGroupKpiRaw(startDate: Date, endDate: Date): Promise<GroupKpiRaw> {
    const row = await this.knex('orders as o')
      .join('order_status as os', 'o.order_status_id', 'os.order_status_id')
      .whereNull('o.deleted_at')
      .where('o.ordered_at', '>=', startDate)
      .where('o.ordered_at', '<=', endDate)
      .select(
        this.knex.raw('COALESCE(SUM(o.total_amount), 0) as total_omzet'),
        this.knex.raw(
          "COUNT(CASE WHEN os.order_status_code IN ('SELESAI', 'DIBATALKAN') THEN 1 END) as total_transaksi",
        ),
        this.knex.raw(
          "COUNT(CASE WHEN os.order_status_code = 'SELESAI' THEN 1 END) as selesai",
        ),
        this.knex.raw(
          "COUNT(CASE WHEN os.order_status_code = 'DIBATALKAN' THEN 1 END) as dibatalkan",
        ),
      )
      .first<GroupKpiRaw>();

    return (
      row ?? { total_omzet: 0, total_transaksi: 0, selesai: 0, dibatalkan: 0 }
    );
  }

  async getGroupSalesTrend(
    startDate: Date,
    endDate: Date,
    period: string,
  ): Promise<SalesTrendPoint[]> {
    const rows = (await this.knex('orders as o')
      .whereNull('o.deleted_at')
      .where('o.ordered_at', '>=', startDate)
      .where('o.ordered_at', '<=', endDate)
      .select(
        this.knex.raw("DATE_TRUNC('day', o.ordered_at)::date::text as bucket"),
        this.knex.raw('COALESCE(SUM(o.total_amount), 0) as omzet'),
        this.knex.raw('COUNT(o.order_id) as transaksi'),
      )
      .groupByRaw("DATE_TRUNC('day', o.ordered_at)")
      .orderByRaw("DATE_TRUNC('day', o.ordered_at) ASC")) as SalesTrendRow[];

    return rows.map((r) => {
      const date = r.bucket;
      const d = new Date(date);
      const label = this.formatDayLabel(d, period);
      return {
        label,
        date,
        omzet: Number(r.omzet),
        transaksi: Number(r.transaksi),
      };
    });
  }

  async getGroupTopMenus(
    startDate: Date,
    endDate: Date,
    limit: number,
  ): Promise<TopMenuRow[]> {
    const rows = (await this.knex('order_items as oi')
      .join('orders as o', 'oi.order_id', 'o.order_id')
      .join('order_status as os', 'o.order_status_id', 'os.order_status_id')
      .join('menu_items as mi', 'oi.menu_item_id', 'mi.menu_item_id')
      .join(
        'menu_categories as mc',
        'mi.menu_category_id',
        'mc.menu_category_id',
      )
      .whereNull('o.deleted_at')
      .whereNull('oi.deleted_at')
      .where('o.ordered_at', '>=', startDate)
      .where('o.ordered_at', '<=', endDate)
      .whereNot('os.order_status_code', 'DIBATALKAN')
      .select(
        'mi.menu_item_id',
        'mi.menu_item_name',
        'mc.category_name',
        this.knex.raw('SUM(oi.quantity) as qty_terjual'),
        this.knex.raw('SUM(oi.quantity * oi.item_price) as pendapatan'),
      )
      .groupBy('mi.menu_item_id', 'mi.menu_item_name', 'mc.category_name')
      .orderBy('pendapatan', 'desc')
      .limit(limit)) as TopMenuRaw[];

    return rows.map((r) => ({
      menu_item_id: r.menu_item_id,
      menu_item_name: r.menu_item_name,
      category_name: r.category_name,
      qty_terjual: Number(r.qty_terjual),
      pendapatan: Number(r.pendapatan),
    }));
  }

  async getGroupTotalStokKritis(): Promise<number> {
    const result = await this.knex('inventory_items as ii')
      .join(
        'inventory_items_units as iiu',
        'ii.inventory_item_id',
        'iiu.inventory_item_id',
      )
      .whereNull('ii.deleted_at')
      .whereNull('iiu.deleted_at')
      .whereRaw('ii.current_stock IS NOT NULL AND ii.min_threshold IS NOT NULL')
      .whereRaw('ii.current_stock < ii.min_threshold')
      .count<{ count: string }>('ii.inventory_item_id as count')
      .first();

    return parseInt(result?.count ?? '0', 10);
  }

  async getUnitPerformanceTable(
    startDate: Date,
    endDate: Date,
  ): Promise<UnitPerformanceRow[]> {
    const rows = (await this.knex('orders as o')
      .join('order_status as os', 'o.order_status_id', 'os.order_status_id')
      .join('units as u', 'o.unit_id', 'u.unit_id')
      .whereNull('o.deleted_at')
      .whereNull('u.deleted_at')
      .where('u.status', 'active')
      .where('o.ordered_at', '>=', startDate)
      .where('o.ordered_at', '<=', endDate)
      .select(
        'u.unit_id',
        'u.unit_name',
        this.knex.raw('COALESCE(SUM(o.total_amount), 0) as total_omzet'),
        this.knex.raw(
          "COUNT(CASE WHEN os.order_status_code IN ('SELESAI', 'DIBATALKAN') THEN 1 END) as total_transaksi",
        ),
        this.knex.raw(
          "COUNT(CASE WHEN os.order_status_code = 'SELESAI' THEN 1 END) as selesai",
        ),
        this.knex.raw(
          "COUNT(CASE WHEN os.order_status_code = 'DIBATALKAN' THEN 1 END) as dibatalkan",
        ),
      )
      .groupBy('u.unit_id', 'u.unit_name')
      .orderBy('total_omzet', 'desc')) as UnitKpiRaw[];

    const unitIds = rows.map((r) => r.unit_id);
    const stokKritisMap = await this.getStokKritisForUnits(unitIds);

    return rows.map((r) => {
      const totalTr = Number(r.total_transaksi);
      const totalOmzet = Number(r.total_omzet);
      return {
        unit_id: r.unit_id,
        unit_name: r.unit_name,
        omzet: totalOmzet,
        transaksi: totalTr,
        rata_rata_order: totalTr > 0 ? Math.round(totalOmzet / totalTr) : 0,
        selesai: Number(r.selesai),
        dibatalkan: Number(r.dibatalkan),
        stok_kritis: stokKritisMap.get(r.unit_id) ?? 0,
      };
    });
  }

  async getGroupCompare(
    unitIds: string[],
    startDate: Date,
    endDate: Date,
  ): Promise<UnitCompareRow[]> {
    if (unitIds.length === 0) return [];

    const rows = (await this.knex('orders as o')
      .join('order_status as os', 'o.order_status_id', 'os.order_status_id')
      .join('units as u', 'o.unit_id', 'u.unit_id')
      .whereNull('o.deleted_at')
      .whereIn('o.unit_id', unitIds)
      .where('o.ordered_at', '>=', startDate)
      .where('o.ordered_at', '<=', endDate)
      .select(
        'u.unit_id',
        'u.unit_name',
        this.knex.raw('COALESCE(SUM(o.total_amount), 0) as total_omzet'),
        this.knex.raw(
          "COUNT(CASE WHEN os.order_status_code IN ('SELESAI', 'DIBATALKAN') THEN 1 END) as total_transaksi",
        ),
        this.knex.raw(
          "COUNT(CASE WHEN os.order_status_code = 'SELESAI' THEN 1 END) as selesai",
        ),
        this.knex.raw(
          "COUNT(CASE WHEN os.order_status_code = 'DIBATALKAN' THEN 1 END) as dibatalkan",
        ),
      )
      .groupBy('u.unit_id', 'u.unit_name')) as UnitKpiRaw[];

    const stokKritisMap = await this.getStokKritisForUnits(unitIds);

    // Ensure all requested unit IDs are returned (even if no transactions)
    const resultMap = new Map(rows.map((r) => [r.unit_id, r]));
    return unitIds.map((id) => {
      const r = resultMap.get(id);
      const stokKritis = stokKritisMap.get(id) ?? 0;
      if (!r) {
        return {
          unit_id: id,
          unit_name: 'Unit tidak ditemukan',
          omzet: 0,
          transaksi: 0,
          rata_rata_order: 0,
          selesai: 0,
          dibatalkan: 0,
          stok_kritis: stokKritis,
        };
      }
      const totalTr = Number(r.total_transaksi);
      const totalOmzet = Number(r.total_omzet);
      return {
        unit_id: r.unit_id,
        unit_name: r.unit_name,
        omzet: totalOmzet,
        transaksi: totalTr,
        rata_rata_order: totalTr > 0 ? Math.round(totalOmzet / totalTr) : 0,
        selesai: Number(r.selesai),
        dibatalkan: Number(r.dibatalkan),
        stok_kritis: stokKritis,
      };
    });
  }

  private async getStokKritisForUnits(
    unitIds: string[],
  ): Promise<Map<string, number>> {
    if (unitIds.length === 0) return new Map();

    const rows = await this.knex('inventory_items as ii')
      .join(
        'inventory_items_units as iiu',
        'ii.inventory_item_id',
        'iiu.inventory_item_id',
      )
      .whereIn('iiu.unit_id', unitIds)
      .whereNull('ii.deleted_at')
      .whereNull('iiu.deleted_at')
      .whereRaw('ii.current_stock IS NOT NULL AND ii.min_threshold IS NOT NULL')
      .whereRaw('ii.current_stock < ii.min_threshold')
      .select('iiu.unit_id')
      .count<
        Array<{ unit_id: string; count: string }>
      >('ii.inventory_item_id as count')
      .groupBy('iiu.unit_id');

    const map = new Map<string, number>();
    for (const r of rows) {
      map.set(r.unit_id, parseInt(r.count, 10));
    }
    return map;
  }
}
