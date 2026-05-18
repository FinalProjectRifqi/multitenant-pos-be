import type { Knex } from 'knex';
import type {
  AnalyticsCriticalStockUnitRow,
  AnalyticsDailyUsageRow,
  AnalyticsInventoryRow,
  AnalyticsInventoryPerformanceRow,
  AnalyticsMenuRow,
  AnalyticsMetricSummary,
  AnalyticsPaymentHistoryRow,
  AnalyticsPaymentRow,
  AnalyticsScope,
  AnalyticsStatusRow,
  AnalyticsUnitRow,
  AnalyticsUnitRevenueRow,
} from '../models/analytics.model';

export interface IAnalyticsRepository {
  findUnitById(unitId: string): Promise<AnalyticsUnitRow | null>;
  getMetrics(scope: AnalyticsScope): Promise<AnalyticsMetricSummary>;
  getStatusTransactions(scope: AnalyticsScope): Promise<AnalyticsStatusRow[]>;
  getTopMenus(
    scope: AnalyticsScope,
    limit?: number,
  ): Promise<AnalyticsMenuRow[]>;
  getRevenueByMenu(
    scope: AnalyticsScope,
    limit?: number,
  ): Promise<AnalyticsMenuRow[]>;
  getRevenueByUnit(scope: AnalyticsScope): Promise<AnalyticsUnitRevenueRow[]>;
  getTopMenusByUnit(
    scope: AnalyticsScope,
    limitPerUnit?: number,
  ): Promise<AnalyticsMenuRow[]>;
  getCriticalStockUnits(
    scope: AnalyticsScope,
  ): Promise<AnalyticsCriticalStockUnitRow[]>;
  getInventoryPerformanceByUnit(
    scope: AnalyticsScope,
  ): Promise<AnalyticsInventoryPerformanceRow[]>;
  getPaymentSummary(scope: AnalyticsScope): Promise<AnalyticsPaymentRow[]>;
  getPaymentHistory(
    scope: AnalyticsScope,
    limit?: number,
  ): Promise<AnalyticsPaymentHistoryRow[]>;
  getLowStockItems(scope: AnalyticsScope): Promise<AnalyticsInventoryRow[]>;
  getDailyInventoryUsage(
    scope: AnalyticsScope,
  ): Promise<AnalyticsDailyUsageRow[]>;
}

const COMPLETED_STATUS_SQL = `
  UPPER(REPLACE(COALESCE(os.order_status_code, os.order_status_name), ' ', '_')) IN ('SELESAI', 'COMPLETED')
`;

const CANCELLED_STATUS_SQL = `
  UPPER(REPLACE(COALESCE(os.order_status_code, os.order_status_name), ' ', '_')) IN ('DIBATALKAN', 'CANCELLED')
`;

export class AnalyticsRepository implements IAnalyticsRepository {
  constructor(private readonly db: Knex) {}

  async findUnitById(unitId: string): Promise<AnalyticsUnitRow | null> {
    const row = await this.db('units')
      .select('unit_id', 'unit_name', 'unit_address')
      .where('unit_id', unitId)
      .whereNull('deleted_at')
      .first<AnalyticsUnitRow | undefined>();

    return row ?? null;
  }

  async getMetrics(scope: AnalyticsScope): Promise<AnalyticsMetricSummary> {
    const row = await this.applyOrderScope(
      this.db('orders as o')
        .leftJoin('order_status as os', function () {
          this.on('os.order_status_id', '=', 'o.order_status_id').andOnNull(
            'os.deleted_at',
          );
        })
        .whereNull('o.deleted_at'),
      scope,
    )
      .select(
        this.db.raw(
          `COALESCE(SUM(CASE WHEN ${COMPLETED_STATUS_SQL} THEN o.total_amount ELSE 0 END), 0) as total_revenue`,
        ),
        this.db.raw('COUNT(o.order_id) as total_transactions'),
        this.db.raw(
          `COALESCE(AVG(CASE WHEN ${COMPLETED_STATUS_SQL} THEN o.total_amount END), 0) as average_order_value`,
        ),
        this.db.raw(
          `COUNT(*) FILTER (WHERE ${COMPLETED_STATUS_SQL}) as completed_transactions`,
        ),
        this.db.raw(
          `COUNT(*) FILTER (WHERE ${CANCELLED_STATUS_SQL}) as cancelled_transactions`,
        ),
      )
      .first<
        | {
            total_revenue: string | number;
            total_transactions: string | number;
            average_order_value: string | number;
            completed_transactions: string | number;
            cancelled_transactions: string | number;
          }
        | undefined
      >();

    return {
      total_revenue: Number(row?.total_revenue ?? 0),
      total_transactions: Number(row?.total_transactions ?? 0),
      average_order_value: Number(row?.average_order_value ?? 0),
      completed_transactions: Number(row?.completed_transactions ?? 0),
      cancelled_transactions: Number(row?.cancelled_transactions ?? 0),
    };
  }

  async getStatusTransactions(
    scope: AnalyticsScope,
  ): Promise<AnalyticsStatusRow[]> {
    const rows = await this.applyOrderScope(
      this.db('orders as o')
        .leftJoin('order_status as os', function () {
          this.on('os.order_status_id', '=', 'o.order_status_id').andOnNull(
            'os.deleted_at',
          );
        })
        .whereNull('o.deleted_at'),
      scope,
    )
      .select([
        this.db.raw(
          `CASE
            WHEN ${COMPLETED_STATUS_SQL} THEN 'COMPLETED'
            WHEN ${CANCELLED_STATUS_SQL} THEN 'CANCELLED'
            ELSE 'PENDING'
          END as status_code`,
        ),
        this.db.raw(
          `CASE
            WHEN ${COMPLETED_STATUS_SQL} THEN 'Completed'
            WHEN ${CANCELLED_STATUS_SQL} THEN 'Cancelled'
            ELSE 'Pending'
          END as status_name`,
        ),
        this.db.raw('COUNT(o.order_id) as total_transactions'),
      ])
      .groupByRaw(
        `CASE
          WHEN ${COMPLETED_STATUS_SQL} THEN 'COMPLETED'
          WHEN ${CANCELLED_STATUS_SQL} THEN 'CANCELLED'
          ELSE 'PENDING'
        END`,
      )
      .groupByRaw(
        `CASE
          WHEN ${COMPLETED_STATUS_SQL} THEN 'Completed'
          WHEN ${CANCELLED_STATUS_SQL} THEN 'Cancelled'
          ELSE 'Pending'
        END`,
      )
      .orderBy('total_transactions', 'desc');

    return rows.map((row) => ({
      status_code: row.status_code as 'COMPLETED' | 'CANCELLED' | 'PENDING',
      status_name: String(row.status_name),
      total_transactions: Number(row.total_transactions),
    }));
  }

  async getTopMenus(
    scope: AnalyticsScope,
    limit = 10,
  ): Promise<AnalyticsMenuRow[]> {
    return this.getMenuRows(scope, limit, 'quantity');
  }

  async getRevenueByMenu(
    scope: AnalyticsScope,
    limit = 10,
  ): Promise<AnalyticsMenuRow[]> {
    return this.getMenuRows(scope, limit, 'revenue');
  }

  async getRevenueByUnit(
    scope: AnalyticsScope,
  ): Promise<AnalyticsUnitRevenueRow[]> {
    const rows = await this.applyOrderScope(
      this.db('orders as o')
        .innerJoin('units as u', function () {
          this.on('u.unit_id', '=', 'o.unit_id').andOnNull('u.deleted_at');
        })
        .leftJoin('order_status as os', function () {
          this.on('os.order_status_id', '=', 'o.order_status_id').andOnNull(
            'os.deleted_at',
          );
        })
        .whereNull('o.deleted_at'),
      scope,
    )
      .select([
        'u.unit_id',
        'u.unit_name',
        this.db.raw(
          `COALESCE(SUM(CASE WHEN ${COMPLETED_STATUS_SQL} THEN o.total_amount ELSE 0 END), 0) as total_revenue`,
        ),
        this.db.raw('COUNT(o.order_id) as total_transactions'),
        this.db.raw(
          `COALESCE(AVG(CASE WHEN ${COMPLETED_STATUS_SQL} THEN o.total_amount END), 0) as average_order_value`,
        ),
        this.db.raw(
          `COUNT(*) FILTER (WHERE ${COMPLETED_STATUS_SQL}) as completed_transactions`,
        ),
        this.db.raw(
          `COUNT(*) FILTER (WHERE ${CANCELLED_STATUS_SQL}) as cancelled_transactions`,
        ),
      ])
      .groupBy(['u.unit_id', 'u.unit_name'])
      .orderBy('total_revenue', 'desc');

    return rows.map((row) => this.mapUnitRevenueRow(row));
  }

  async getTopMenusByUnit(
    scope: AnalyticsScope,
    limitPerUnit = 5,
  ): Promise<AnalyticsMenuRow[]> {
    const scopedRows = this.applyOrderScope(
      this.db('order_items as oi')
        .innerJoin('orders as o', function () {
          this.on('o.order_id', '=', 'oi.order_id').andOnNull('o.deleted_at');
        })
        .innerJoin('units as u', function () {
          this.on('u.unit_id', '=', 'o.unit_id').andOnNull('u.deleted_at');
        })
        .innerJoin('menu_items as mi', function () {
          this.on('mi.menu_item_id', '=', 'oi.menu_item_id').andOnNull(
            'mi.deleted_at',
          );
        })
        .leftJoin('order_status as os', function () {
          this.on('os.order_status_id', '=', 'o.order_status_id').andOnNull(
            'os.deleted_at',
          );
        })
        .whereNull('oi.deleted_at')
        .whereRaw(COMPLETED_STATUS_SQL),
      scope,
    )
      .select([
        'o.unit_id',
        'u.unit_name',
        'mi.menu_item_id',
        'mi.menu_item_name',
        this.db.raw('COALESCE(SUM(oi.quantity), 0) as quantity_sold'),
        this.db.raw(
          'COALESCE(SUM(oi.quantity * oi.item_price), 0) as gross_revenue',
        ),
      ])
      .groupBy([
        'o.unit_id',
        'u.unit_name',
        'mi.menu_item_id',
        'mi.menu_item_name',
      ]);

    const rows = await this.db
      .select('*')
      .from(
        scopedRows
          .select(
            this.db.raw(
              'ROW_NUMBER() OVER (PARTITION BY o.unit_id ORDER BY COALESCE(SUM(oi.quantity), 0) DESC) as rank',
            ),
          )
          .as('ranked_menus'),
      )
      .where('rank', '<=', limitPerUnit)
      .orderBy('unit_name', 'asc')
      .orderBy('quantity_sold', 'desc');

    return rows.map((row) => ({
      unit_id: String(row.unit_id),
      unit_name: String(row.unit_name),
      menu_item_id: String(row.menu_item_id),
      menu_item_name: String(row.menu_item_name),
      quantity_sold: Number(row.quantity_sold),
      gross_revenue: Number(row.gross_revenue),
    }));
  }

  async getCriticalStockUnits(
    scope: AnalyticsScope,
  ): Promise<AnalyticsCriticalStockUnitRow[]> {
    const query = this.db('inventory_items_units as iiu')
      .innerJoin('units as u', function () {
        this.on('u.unit_id', '=', 'iiu.unit_id').andOnNull('u.deleted_at');
      })
      .innerJoin('inventory_items as ii', function () {
        this.on('ii.inventory_item_id', '=', 'iiu.inventory_item_id').andOnNull(
          'ii.deleted_at',
        );
      })
      .whereNull('iiu.deleted_at');

    this.applyUnitScope(query, 'iiu.unit_id', scope.unitIds);

    const rows = await query
      .select([
        'u.unit_id',
        'u.unit_name',
        this.db.raw(
          `COUNT(*) FILTER (
            WHERE ii.current_stock IS NOT NULL
              AND ii.min_threshold IS NOT NULL
              AND ii.current_stock <= ii.min_threshold
              AND ii.current_stock > 0
          ) as low_stock_items`,
        ),
        this.db.raw(
          `COUNT(*) FILTER (
            WHERE COALESCE(ii.current_stock, 0) <= 0
          ) as out_of_stock_items`,
        ),
      ])
      .groupBy(['u.unit_id', 'u.unit_name'])
      .havingRaw(
        `(COUNT(*) FILTER (
          WHERE ii.current_stock IS NOT NULL
            AND ii.min_threshold IS NOT NULL
            AND ii.current_stock <= ii.min_threshold
            AND ii.current_stock > 0
        ) + COUNT(*) FILTER (
          WHERE COALESCE(ii.current_stock, 0) <= 0
        )) > 0`,
      )
      .orderBy('low_stock_items', 'desc');

    return rows.map((row) => ({
      unit_id: String(row.unit_id),
      unit_name: String(row.unit_name),
      low_stock_items: Number(row.low_stock_items),
      out_of_stock_items: Number(row.out_of_stock_items),
    }));
  }

  async getInventoryPerformanceByUnit(
    scope: AnalyticsScope,
  ): Promise<AnalyticsInventoryPerformanceRow[]> {
    const query = this.db('daily_inventory_realizations as dir').innerJoin(
      'units as u',
      function () {
        this.on('u.unit_id', '=', 'dir.unit_id').andOnNull('u.deleted_at');
      },
    );

    this.applyDateScope(query, 'dir.date', scope);
    this.applyUnitScope(query, 'dir.unit_id', scope.unitIds);

    const rows = await query
      .select([
        'dir.unit_id',
        'u.unit_name',
        this.db.raw(
          'COALESCE(SUM(dir.actual_usage_qty), 0) as actual_usage_qty',
        ),
        this.db.raw('COALESCE(SUM(dir.waste_qty), 0) as waste_qty'),
        this.db.raw('COALESCE(SUM(dir.variance_qty), 0) as variance_qty'),
      ])
      .groupBy(['dir.unit_id', 'u.unit_name'])
      .orderBy('u.unit_name', 'asc');

    return rows.map((row) => ({
      unit_id: String(row.unit_id),
      unit_name: String(row.unit_name),
      actual_usage_qty: Number(row.actual_usage_qty),
      waste_qty: Number(row.waste_qty),
      variance_qty: Number(row.variance_qty),
    }));
  }

  async getPaymentSummary(
    scope: AnalyticsScope,
  ): Promise<AnalyticsPaymentRow[]> {
    const rows = await this.applyPaymentScope(
      this.db('payments as p')
        .innerJoin('orders as o', function () {
          this.on('o.order_id', '=', 'p.order_id').andOnNull('o.deleted_at');
        })
        .whereNull('p.deleted_at'),
      scope,
    )
      .select([
        'p.payment_status',
        this.db.raw('COUNT(p.payment_id) as total_payments'),
        this.db.raw('COALESCE(SUM(p.amount), 0) as total_amount'),
      ])
      .groupBy('p.payment_status')
      .orderBy('total_amount', 'desc');

    return rows.map((row) => ({
      payment_status: String(row.payment_status),
      total_payments: Number(row.total_payments),
      total_amount: Number(row.total_amount),
    }));
  }

  async getPaymentHistory(
    scope: AnalyticsScope,
    limit = 25,
  ): Promise<AnalyticsPaymentHistoryRow[]> {
    const rows = await this.applyPaymentScope(
      this.db('payments as p')
        .innerJoin('orders as o', function () {
          this.on('o.order_id', '=', 'p.order_id').andOnNull('o.deleted_at');
        })
        .innerJoin('units as u', function () {
          this.on('u.unit_id', '=', 'o.unit_id').andOnNull('u.deleted_at');
        })
        .whereNull('p.deleted_at'),
      scope,
    )
      .select([
        'p.payment_id',
        'p.order_id',
        'o.order_number',
        'o.unit_id',
        'u.unit_name',
        'p.reference_number',
        'p.amount',
        this.db.raw("'UNKNOWN' as payment_method"),
        'p.payment_status',
        'p.paid_at',
        'p.created_at',
      ])
      .orderBy('p.created_at', 'desc')
      .limit(limit);

    return rows.map((row) => ({
      payment_id: String(row.payment_id),
      order_id: String(row.order_id),
      order_number: String(row.order_number),
      unit_id: String(row.unit_id),
      unit_name: String(row.unit_name),
      reference_number: String(row.reference_number),
      amount: Number(row.amount),
      payment_method: String(row.payment_method),
      payment_status: String(row.payment_status),
      paid_at: (row.paid_at as Date | null) ?? null,
      created_at: row.created_at as Date,
    }));
  }

  async getLowStockItems(
    scope: AnalyticsScope,
  ): Promise<AnalyticsInventoryRow[]> {
    const query = this.db('inventory_items_units as iiu')
      .innerJoin('units as u', function () {
        this.on('u.unit_id', '=', 'iiu.unit_id').andOnNull('u.deleted_at');
      })
      .innerJoin('inventory_items as ii', function () {
        this.on('ii.inventory_item_id', '=', 'iiu.inventory_item_id').andOnNull(
          'ii.deleted_at',
        );
      })
      .whereNull('iiu.deleted_at')
      .where(function () {
        this.where('ii.current_stock', '<=', 0).orWhereRaw(
          `ii.current_stock IS NOT NULL
            AND ii.min_threshold IS NOT NULL
            AND ii.current_stock > 0
            AND ii.current_stock <= ii.min_threshold`,
        );
      });

    this.applyUnitScope(query, 'iiu.unit_id', scope.unitIds);

    const rows = await query
      .select([
        'ii.inventory_item_id',
        'ii.inventory_item_name',
        'u.unit_id',
        'u.unit_name',
        'ii.current_stock',
        'ii.min_threshold',
        'ii.unit_of_measure',
        this.db.raw(
          `CASE
            WHEN COALESCE(ii.current_stock, 0) <= 0 THEN 'OUT_OF_STOCK'
            ELSE 'LOW_STOCK'
          END as stock_status`,
        ),
      ])
      .orderBy('stock_status', 'asc')
      .orderBy('ii.inventory_item_name', 'asc');

    return rows.map((row) => ({
      inventory_item_id: String(row.inventory_item_id),
      inventory_item_name: String(row.inventory_item_name),
      unit_id: String(row.unit_id),
      unit_name: String(row.unit_name),
      current_stock: Number(row.current_stock ?? 0),
      min_threshold: Number(row.min_threshold ?? 0),
      unit_of_measure: String(row.unit_of_measure),
      stock_status: row.stock_status as 'LOW_STOCK' | 'OUT_OF_STOCK',
    }));
  }

  async getDailyInventoryUsage(
    scope: AnalyticsScope,
  ): Promise<AnalyticsDailyUsageRow[]> {
    const query = this.db('daily_inventory_realizations as dir')
      .innerJoin('inventory_items as ii', function () {
        this.on('ii.inventory_item_id', '=', 'dir.inventory_item_id').andOnNull(
          'ii.deleted_at',
        );
      })
      .innerJoin('units as u', function () {
        this.on('u.unit_id', '=', 'dir.unit_id').andOnNull('u.deleted_at');
      });

    this.applyDateScope(query, 'dir.date', scope);
    this.applyUnitScope(query, 'dir.unit_id', scope.unitIds);

    const rows = await query
      .select([
        'dir.date',
        'dir.unit_id',
        'u.unit_name',
        'dir.inventory_item_id',
        'ii.inventory_item_name',
        'dir.planned_usage_qty',
        'dir.actual_usage_qty',
        'dir.waste_qty',
        'dir.variance_qty',
        'ii.unit_of_measure as usage_unit',
      ])
      .orderBy('dir.date', 'desc')
      .orderBy('u.unit_name', 'asc')
      .orderBy('ii.inventory_item_name', 'asc');

    return rows.map((row) => ({
      date: String(row.date),
      unit_id: String(row.unit_id),
      unit_name: String(row.unit_name),
      inventory_item_id: String(row.inventory_item_id),
      inventory_item_name: String(row.inventory_item_name),
      planned_usage_qty: Number(row.planned_usage_qty),
      actual_usage_qty: Number(row.actual_usage_qty),
      waste_qty: Number(row.waste_qty),
      variance_qty: Number(row.variance_qty),
      usage_unit: String(row.usage_unit),
    }));
  }

  private async getMenuRows(
    scope: AnalyticsScope,
    limit: number,
    orderBy: 'quantity' | 'revenue',
  ): Promise<AnalyticsMenuRow[]> {
    const rows = await this.applyOrderScope(
      this.db('order_items as oi')
        .innerJoin('orders as o', function () {
          this.on('o.order_id', '=', 'oi.order_id').andOnNull('o.deleted_at');
        })
        .innerJoin('menu_items as mi', function () {
          this.on('mi.menu_item_id', '=', 'oi.menu_item_id').andOnNull(
            'mi.deleted_at',
          );
        })
        .leftJoin('order_status as os', function () {
          this.on('os.order_status_id', '=', 'o.order_status_id').andOnNull(
            'os.deleted_at',
          );
        })
        .whereNull('oi.deleted_at')
        .whereRaw(COMPLETED_STATUS_SQL),
      scope,
    )
      .select([
        'mi.menu_item_id',
        'mi.menu_item_name',
        this.db.raw('COALESCE(SUM(oi.quantity), 0) as quantity_sold'),
        this.db.raw(
          'COALESCE(SUM(oi.quantity * oi.item_price), 0) as gross_revenue',
        ),
      ])
      .groupBy(['mi.menu_item_id', 'mi.menu_item_name'])
      .orderBy(
        orderBy === 'quantity' ? 'quantity_sold' : 'gross_revenue',
        'desc',
      )
      .limit(limit);

    return rows.map((row) => ({
      menu_item_id: String(row.menu_item_id),
      menu_item_name: String(row.menu_item_name),
      quantity_sold: Number(row.quantity_sold),
      gross_revenue: Number(row.gross_revenue),
    }));
  }

  private applyOrderScope<T extends Knex.QueryBuilder>(
    query: T,
    scope: AnalyticsScope,
  ): T {
    this.applyUnitScope(query, 'o.unit_id', scope.unitIds);
    this.applyDateScope(query, 'o.ordered_at', scope);
    return query;
  }

  private applyPaymentScope<T extends Knex.QueryBuilder>(
    query: T,
    scope: AnalyticsScope,
  ): T {
    this.applyUnitScope(query, 'o.unit_id', scope.unitIds);
    this.applyDateScope(query, 'p.created_at', scope);
    return query;
  }

  private applyUnitScope(
    query: Knex.QueryBuilder,
    column: string,
    unitIds?: string[],
  ): void {
    if (unitIds && unitIds.length > 0) {
      query.whereIn(column, unitIds);
    }
  }

  private applyDateScope(
    query: Knex.QueryBuilder,
    column: string,
    scope: AnalyticsScope,
  ): void {
    query.whereRaw(`${column} >= ?::date`, [scope.startDate]);
    query.whereRaw(`${column} < (?::date + interval '1 day')`, [scope.endDate]);
  }

  private mapUnitRevenueRow(
    row: Record<string, unknown>,
  ): AnalyticsUnitRevenueRow {
    return {
      unit_id: String(row.unit_id),
      unit_name: String(row.unit_name),
      total_revenue: Number(row.total_revenue),
      total_transactions: Number(row.total_transactions),
      average_order_value: Number(row.average_order_value),
      completed_transactions: Number(row.completed_transactions),
      cancelled_transactions: Number(row.cancelled_transactions),
    };
  }
}
