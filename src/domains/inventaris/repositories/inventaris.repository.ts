import type { Knex } from 'knex';
import type {
  DailyInventoryPlan,
  DailyInventoryRealization,
  DailyUsageReportRow,
  InventoryItemWithUnit,
  InventoryStats,
  InventoryTransaction,
  InventoryVarianceReportRow,
} from '../models/inventaris.model';
import {
  dailyInventoryPlanAlreadyRealizedError,
  dailyInventoryPlanConflictError,
  dailyInventoryRealizationConflictError,
  inventoryInsufficientStockError,
} from '../errors/inventaris.errors';

export type InventorySortByColumn =
  | 'inventory_item_name'
  | 'current_stock'
  | 'min_threshold'
  | 'max_threshold'
  | 'updated_at';

export interface FindAllInventoryParams {
  businessId: string;
  page: number;
  limit: number;
  search?: string;
  sortBy: InventorySortByColumn;
  sortType: 'ASC' | 'DESC';
}

export interface ListInventoryTransactionsParams {
  businessId: string;
  page: number;
  limit: number;
  inventory_item_id?: string;
  transaction_type?: InventoryTransactionType;
}

export interface ListDailyInventoryPlansParams {
  businessId: string;
  date?: string;
  page: number;
  limit: number;
}

export interface ListDailyInventoryRealizationsParams {
  businessId: string;
  date?: string;
  page: number;
  limit: number;
}

export type InventoryTransactionType =
  | 'in'
  | 'out'
  | 'adjustment'
  | 'RESTOCK'
  | 'DAILY_USAGE'
  | 'WASTE'
  | 'MANUAL_ADJUSTMENT';

export interface CreateInventoryItemData {
  businessId: string;
  inventory_item_name: string;
  description: string;
  unit_of_measure: string;
  current_stock: number;
  min_threshold: number;
  max_threshold: number;
}

export interface UpdateInventoryItemData {
  inventory_item_name?: string;
  description?: string;
  unit_of_measure?: string;
  current_stock?: number;
  min_threshold?: number;
  max_threshold?: number;
  updated_by_user_id: string;
}

export interface CreateInventoryTransactionData {
  businessId: string;
  inventory_item_id: string;
  user_id: string;
  transaction_type: 'in' | 'out' | 'adjustment';
  quantity_changed: number;
  notes?: string;
}

export interface CreateDailyInventoryPlanData {
  businessId: string;
  date: string;
  inventory_item_id: string;
  planned_usage_qty: number;
  unit: string;
  notes?: string;
  created_by: string;
}

export interface UpdateDailyInventoryPlanData {
  planned_usage_qty?: number;
  unit?: string;
  notes?: string;
  updated_by: string;
}

export interface CreateDailyInventoryRealizationData {
  businessId: string;
  date: string;
  inventory_item_id: string;
  actual_usage_qty: number;
  waste_qty: number;
  remaining_qty?: number;
  notes?: string;
  submitted_by: string;
}

export interface IInventarisRepository {
  findUnitById(unitId: string): Promise<{ unit_id: string } | null>;
  findAll(
    params: FindAllInventoryParams,
  ): Promise<{ data: InventoryItemWithUnit[]; total: number }>;
  findById(
    businessId: string,
    inventoryItemId: string,
  ): Promise<InventoryItemWithUnit | null>;
  findByName(
    businessId: string,
    inventoryItemName: string,
    excludedInventoryItemId?: string,
  ): Promise<InventoryItemWithUnit | null>;
  create(data: CreateInventoryItemData): Promise<InventoryItemWithUnit>;
  update(
    businessId: string,
    inventoryItemId: string,
    data: UpdateInventoryItemData,
  ): Promise<InventoryItemWithUnit | null>;
  softDelete(businessId: string, inventoryItemId: string): Promise<boolean>;
  getStats(businessId: string): Promise<InventoryStats>;
  listTransactions(
    params: ListInventoryTransactionsParams,
  ): Promise<{ data: InventoryTransaction[]; total: number }>;
  createTransaction(
    data: CreateInventoryTransactionData,
  ): Promise<InventoryTransaction | null>;
  findDailyPlans(
    params: ListDailyInventoryPlansParams,
  ): Promise<{ data: DailyInventoryPlan[]; total: number }>;
  findDailyPlanById(
    businessId: string,
    dailyPlanId: string,
  ): Promise<DailyInventoryPlan | null>;
  findDailyPlanByDateAndItem(
    businessId: string,
    date: string,
    inventoryItemId: string,
  ): Promise<DailyInventoryPlan | null>;
  findRealizationByPlanId(
    businessId: string,
    dailyPlanId: string,
  ): Promise<DailyInventoryRealization | null>;
  createDailyPlan(
    data: CreateDailyInventoryPlanData,
  ): Promise<DailyInventoryPlan | null>;
  updateDailyPlan(
    businessId: string,
    dailyPlanId: string,
    data: UpdateDailyInventoryPlanData,
  ): Promise<DailyInventoryPlan | null>;
  deleteDailyPlan(businessId: string, dailyPlanId: string): Promise<boolean>;
  findDailyRealizations(
    params: ListDailyInventoryRealizationsParams,
  ): Promise<{ data: DailyInventoryRealization[]; total: number }>;
  findDailyRealizationById(
    businessId: string,
    dailyRealizationId: string,
  ): Promise<DailyInventoryRealization | null>;
  createDailyRealization(
    data: CreateDailyInventoryRealizationData,
  ): Promise<DailyInventoryRealization | null>;
  getDailyUsageReport(
    businessId: string,
    date: string,
  ): Promise<DailyUsageReportRow[]>;
  getVarianceReport(
    businessId: string,
    startDate: string,
    endDate: string,
  ): Promise<InventoryVarianceReportRow[]>;
}

const SORT_COLUMN_MAP: Record<InventorySortByColumn, string> = {
  inventory_item_name: 'ii.inventory_item_name',
  current_stock: 'ii.current_stock',
  min_threshold: 'ii.min_threshold',
  max_threshold: 'ii.max_threshold',
  updated_at: 'ii.updated_at',
};

const INVENTORY_SELECT_COLUMNS = [
  'ii.inventory_item_id',
  'ii.inventory_item_name',
  'ii.description',
  'ii.unit_of_measure',
  'ii.current_stock',
  'ii.min_threshold',
  'ii.max_threshold',
  'ii.last_restocked_at',
  'ii.created_at',
  'ii.updated_at',
  'ii.deleted_at',
  'iiu.unit_id',
];

const DAILY_PLAN_SELECT_COLUMNS = [
  'dip.daily_inventory_plan_id',
  'dip.unit_id',
  'dip.date',
  'dip.inventory_item_id',
  'ii.inventory_item_name',
  'dip.planned_usage_qty',
  'dip.unit',
  'dip.notes',
  'dip.created_by',
  'dip.created_at',
  'dip.updated_at',
];

const DAILY_REALIZATION_SELECT_COLUMNS = [
  'dir.daily_inventory_realization_id',
  'dir.unit_id',
  'dir.date',
  'dir.inventory_item_id',
  'ii.inventory_item_name',
  'dir.daily_inventory_plan_id',
  'dir.planned_usage_qty',
  'dir.actual_usage_qty',
  'dir.waste_qty',
  'dir.remaining_qty',
  'dir.variance_qty',
  'dir.notes',
  'dir.status',
  'dir.submitted_by',
  'dir.submitted_at',
  'dir.created_at',
  'dir.updated_at',
];

const isUniqueViolation = (error: unknown): boolean =>
  typeof error === 'object' &&
  error !== null &&
  'code' in error &&
  (error as { code?: unknown }).code === '23505';

export class InventarisRepository implements IInventarisRepository {
  constructor(private readonly db: Knex) {}

  async findUnitById(unitId: string): Promise<{ unit_id: string } | null> {
    const row = await this.db('units')
      .select('unit_id')
      .where('unit_id', unitId)
      .whereNull('deleted_at')
      .first<{ unit_id: string } | undefined>();

    return row ?? null;
  }

  async findAll(
    params: FindAllInventoryParams,
  ): Promise<{ data: InventoryItemWithUnit[]; total: number }> {
    const { businessId, page, limit, search, sortBy, sortType } = params;
    const offset = (page - 1) * limit;

    const buildBaseQuery = () => {
      const query = this.db('inventory_items_units as iiu')
        .innerJoin('inventory_items as ii', function () {
          this.on(
            'iiu.inventory_item_id',
            '=',
            'ii.inventory_item_id',
          ).andOnNull('ii.deleted_at');
        })
        .where('iiu.unit_id', businessId)
        .whereNull('iiu.deleted_at');

      if (search) {
        const likeSearch = `%${search}%`;
        query.where(function () {
          this.whereILike('ii.inventory_item_name', likeSearch)
            .orWhereILike('ii.description', likeSearch)
            .orWhereILike('ii.unit_of_measure', likeSearch)
            .orWhereRaw('CAST(ii.current_stock AS TEXT) ILIKE ?', [likeSearch])
            .orWhereRaw('CAST(ii.min_threshold AS TEXT) ILIKE ?', [likeSearch])
            .orWhereRaw('CAST(ii.max_threshold AS TEXT) ILIKE ?', [likeSearch])
            .orWhereRaw(
              "to_char(ii.last_restocked_at, 'YYYY-MM-DD HH24:MI:SS') ILIKE ?",
              [likeSearch],
            )
            .orWhereRaw(
              "to_char(ii.last_restocked_at, 'DD/MM/YYYY HH24:MI') ILIKE ?",
              [likeSearch],
            )
            .orWhereRaw(
              `CASE
                WHEN ii.current_stock IS NOT NULL
                 AND ii.min_threshold IS NOT NULL
                 AND ii.current_stock <= ii.min_threshold
                THEN 'status stok rendah low'
                ELSE 'status stok normal normal'
              END ILIKE ?`,
              [likeSearch],
            );
        });
      }

      return query;
    };

    const sortColumn = SORT_COLUMN_MAP[sortBy];

    const [rows, countResult] = await Promise.all([
      buildBaseQuery()
        .select(INVENTORY_SELECT_COLUMNS)
        .orderByRaw(`${sortColumn} ${sortType} NULLS LAST`)
        .offset(offset)
        .limit(limit),
      buildBaseQuery()
        .countDistinct('iiu.inventory_item_unit_id as count')
        .first<{ count: string | number }>(),
    ]);

    return {
      data: rows as InventoryItemWithUnit[],
      total: Number(countResult?.count ?? 0),
    };
  }

  async findById(
    businessId: string,
    inventoryItemId: string,
  ): Promise<InventoryItemWithUnit | null> {
    const row = await this.db('inventory_items_units as iiu')
      .innerJoin('inventory_items as ii', function () {
        this.on('iiu.inventory_item_id', '=', 'ii.inventory_item_id').andOnNull(
          'ii.deleted_at',
        );
      })
      .select(INVENTORY_SELECT_COLUMNS)
      .where('iiu.unit_id', businessId)
      .where('ii.inventory_item_id', inventoryItemId)
      .whereNull('iiu.deleted_at')
      .first<InventoryItemWithUnit | undefined>();

    return row ?? null;
  }

  async findByName(
    businessId: string,
    inventoryItemName: string,
    excludedInventoryItemId?: string,
  ): Promise<InventoryItemWithUnit | null> {
    const query = this.db('inventory_items_units as iiu')
      .innerJoin('inventory_items as ii', function () {
        this.on('iiu.inventory_item_id', '=', 'ii.inventory_item_id').andOnNull(
          'ii.deleted_at',
        );
      })
      .select(INVENTORY_SELECT_COLUMNS)
      .where('iiu.unit_id', businessId)
      .whereRaw('LOWER(ii.inventory_item_name) = LOWER(?)', [inventoryItemName])
      .whereNull('iiu.deleted_at');

    if (excludedInventoryItemId) {
      query.andWhereNot('ii.inventory_item_id', excludedInventoryItemId);
    }

    const row = await query.first<InventoryItemWithUnit | undefined>();
    return row ?? null;
  }

  async create(data: CreateInventoryItemData): Promise<InventoryItemWithUnit> {
    return this.db.transaction(async (trx) => {
      const [item] = await trx('inventory_items')
        .insert({
          inventory_item_name: data.inventory_item_name,
          description: data.description,
          unit_of_measure: data.unit_of_measure,
          current_stock: data.current_stock,
          min_threshold: data.min_threshold,
          max_threshold: data.max_threshold,
          // Always managed by server-side timestamp logic.
          last_restocked_at: trx.fn.now(),
        })
        .returning([
          'inventory_item_id',
          'inventory_item_name',
          'description',
          'unit_of_measure',
          'current_stock',
          'min_threshold',
          'max_threshold',
          'last_restocked_at',
          'created_at',
          'updated_at',
          'deleted_at',
        ]);

      await trx('inventory_items_units').insert({
        inventory_item_id: item.inventory_item_id,
        unit_id: data.businessId,
      });

      return {
        ...(item as Omit<InventoryItemWithUnit, 'unit_id'>),
        unit_id: data.businessId,
      };
    });
  }

  async update(
    businessId: string,
    inventoryItemId: string,
    data: UpdateInventoryItemData,
  ): Promise<InventoryItemWithUnit | null> {
    return this.db.transaction(async (trx) => {
      const currentItem = await trx('inventory_items as ii')
        .innerJoin('inventory_items_units as iiu', function () {
          this.on(
            'ii.inventory_item_id',
            '=',
            'iiu.inventory_item_id',
          ).andOnNull('iiu.deleted_at');
        })
        .select([
          'ii.inventory_item_id',
          'ii.inventory_item_name',
          'ii.current_stock',
        ])
        .where('iiu.unit_id', businessId)
        .where('ii.inventory_item_id', inventoryItemId)
        .whereNull('ii.deleted_at')
        .forUpdate()
        .first<
          | {
              inventory_item_id: string;
              inventory_item_name: string;
              current_stock: number;
            }
          | undefined
        >();

      if (!currentItem) return null;

      const patchPayload: Record<string, unknown> = {
        updated_at: trx.fn.now(),
      };

      if (data.inventory_item_name !== undefined) {
        patchPayload.inventory_item_name = data.inventory_item_name;
      }
      if (data.description !== undefined) {
        patchPayload.description = data.description;
      }
      if (data.unit_of_measure !== undefined) {
        patchPayload.unit_of_measure = data.unit_of_measure;
      }
      if (data.current_stock !== undefined) {
        patchPayload.current_stock = data.current_stock;
        if (data.current_stock !== currentItem.current_stock) {
          patchPayload.last_restocked_at = trx.fn.now();
        }
      }
      if (data.min_threshold !== undefined) {
        patchPayload.min_threshold = data.min_threshold;
      }
      if (data.max_threshold !== undefined) {
        patchPayload.max_threshold = data.max_threshold;
      }

      await trx('inventory_items')
        .where({ inventory_item_id: inventoryItemId })
        .whereNull('deleted_at')
        .update(patchPayload);

      const row = await trx('inventory_items')
        .select([
          'inventory_item_id',
          'inventory_item_name',
          'description',
          'unit_of_measure',
          'current_stock',
          'min_threshold',
          'max_threshold',
          'last_restocked_at',
          'created_at',
          'updated_at',
          'deleted_at',
        ])
        .where({ inventory_item_id: inventoryItemId })
        .whereNull('deleted_at')
        .first<InventoryItemWithUnit | undefined>();

      if (!row) return null;

      if (
        data.current_stock !== undefined &&
        data.current_stock !== currentItem.current_stock
      ) {
        const isIncrease = data.current_stock > currentItem.current_stock;
        await trx('inventory_transactions').insert({
          user_id: data.updated_by_user_id,
          inventory_item_id: inventoryItemId,
          transaction_type: isIncrease ? 'in' : 'out',
          quantity_changed: Math.abs(
            data.current_stock - currentItem.current_stock,
          ),
          quantity_before: currentItem.current_stock,
          quantity_after: data.current_stock,
          notes: 'Penyesuaian stok melalui pembaruan item inventaris',
        });
      }

      return {
        ...row,
        unit_id: businessId,
      };
    });
  }

  async softDelete(
    businessId: string,
    inventoryItemId: string,
  ): Promise<boolean> {
    return this.db.transaction(async (trx) => {
      const linked = await trx('inventory_items_units')
        .where({ unit_id: businessId, inventory_item_id: inventoryItemId })
        .whereNull('deleted_at')
        .first();

      if (!linked) {
        return false;
      }

      await trx('inventory_items_units')
        .where({ unit_id: businessId, inventory_item_id: inventoryItemId })
        .whereNull('deleted_at')
        .update({
          deleted_at: trx.fn.now(),
          updated_at: trx.fn.now(),
        });

      await trx('inventory_items')
        .where({ inventory_item_id: inventoryItemId })
        .whereNull('deleted_at')
        .update({
          deleted_at: trx.fn.now(),
          updated_at: trx.fn.now(),
        });

      return true;
    });
  }

  async getStats(businessId: string): Promise<InventoryStats> {
    const row = await this.db('inventory_items_units as iiu')
      .innerJoin('inventory_items as ii', function () {
        this.on('iiu.inventory_item_id', '=', 'ii.inventory_item_id').andOnNull(
          'ii.deleted_at',
        );
      })
      .where('iiu.unit_id', businessId)
      .whereNull('iiu.deleted_at')
      .countDistinct('ii.inventory_item_id as total_inventory_item')
      .select(
        this.db.raw(
          `COALESCE(
            SUM(
              CASE
                WHEN ii.current_stock IS NOT NULL
                 AND ii.min_threshold IS NOT NULL
                 AND ii.current_stock <= ii.min_threshold
                THEN 1
                ELSE 0
              END
            ),
            0
          ) as inventory_item_low_stock`,
        ),
      )
      .select(
        this.db.raw(
          `COALESCE(
            SUM(
              CASE
                WHEN ii.current_stock IS NOT NULL
                 AND ii.min_threshold IS NOT NULL
                 AND ii.current_stock > ii.min_threshold
                THEN 1
                ELSE 0
              END
            ),
            0
          ) as inventory_item_normal_stock`,
        ),
      )
      .select(
        this.db.raw(
          `COALESCE(
            SUM(
              CASE
                WHEN ii.current_stock = 0
                THEN 1
                ELSE 0
              END
            ),
            0
          ) as inventory_item_out_of_stock`,
        ),
      )
      .first<
        | {
            total_inventory_item: string | number;
            inventory_item_low_stock: string | number;
            inventory_item_normal_stock: string | number;
            inventory_item_out_of_stock: string | number;
          }
        | undefined
      >();

    return {
      total_inventory_item: Number(row?.total_inventory_item ?? 0),
      inventory_item_low_stock: Number(row?.inventory_item_low_stock ?? 0),
      inventory_item_normal_stock: Number(
        row?.inventory_item_normal_stock ?? 0,
      ),
      inventory_item_out_of_stock: Number(
        row?.inventory_item_out_of_stock ?? 0,
      ),
    };
  }

  async listTransactions(
    params: ListInventoryTransactionsParams,
  ): Promise<{ data: InventoryTransaction[]; total: number }> {
    const { businessId, page, limit, inventory_item_id, transaction_type } =
      params;
    const offset = (page - 1) * limit;

    const buildBaseQuery = () => {
      const query = this.db('inventory_transactions as it')
        .innerJoin('inventory_items as ii', function () {
          this.on(
            'it.inventory_item_id',
            '=',
            'ii.inventory_item_id',
          ).andOnNull('ii.deleted_at');
        })
        .innerJoin('inventory_items_units as iiu', function () {
          this.on(
            'ii.inventory_item_id',
            '=',
            'iiu.inventory_item_id',
          ).andOnNull('iiu.deleted_at');
        })
        .where('iiu.unit_id', businessId);

      if (inventory_item_id) {
        query.andWhere('it.inventory_item_id', inventory_item_id);
      }

      if (transaction_type) {
        query.andWhere('it.transaction_type', transaction_type);
      }

      return query;
    };

    const [rows, countResult] = await Promise.all([
      buildBaseQuery()
        .select([
          'it.inventory_transaction_id',
          'it.user_id',
          'it.inventory_item_id',
          'ii.inventory_item_name',
          'it.transaction_type',
          'it.quantity_changed',
          'it.quantity_before',
          'it.quantity_after',
          'it.notes',
          'it.reference_type',
          'it.reference_id',
          'it.transacted_at',
          'it.created_at',
          'it.updated_at',
        ])
        .orderBy('it.transacted_at', 'DESC')
        .offset(offset)
        .limit(limit),
      buildBaseQuery()
        .countDistinct('it.inventory_transaction_id as count')
        .first<{ count: string | number }>(),
    ]);

    return {
      data: rows as InventoryTransaction[],
      total: Number(countResult?.count ?? 0),
    };
  }

  async createTransaction(
    data: CreateInventoryTransactionData,
  ): Promise<InventoryTransaction | null> {
    return this.db.transaction(async (trx) => {
      const item = await trx('inventory_items as ii')
        .innerJoin('inventory_items_units as iiu', function () {
          this.on(
            'ii.inventory_item_id',
            '=',
            'iiu.inventory_item_id',
          ).andOnNull('iiu.deleted_at');
        })
        .select([
          'ii.inventory_item_id',
          'ii.inventory_item_name',
          'ii.current_stock',
          'ii.last_restocked_at',
        ])
        .where('iiu.unit_id', data.businessId)
        .where('ii.inventory_item_id', data.inventory_item_id)
        .whereNull('ii.deleted_at')
        .forUpdate()
        .first<
          | {
              inventory_item_id: string;
              inventory_item_name: string;
              current_stock: number;
              last_restocked_at: Date;
            }
          | undefined
        >();

      if (!item) return null;

      if (
        data.transaction_type === 'out' &&
        item.current_stock < data.quantity_changed
      ) {
        throw inventoryInsufficientStockError({
          inventory_item_id: data.inventory_item_id,
          current_stock: item.current_stock,
          requested: data.quantity_changed,
        });
      }

      let quantityAfter = item.current_stock;
      if (data.transaction_type === 'in') {
        quantityAfter += data.quantity_changed;
      } else if (data.transaction_type === 'out') {
        quantityAfter -= data.quantity_changed;
      } else {
        quantityAfter = data.quantity_changed;
      }

      const [created] = await trx('inventory_transactions')
        .insert({
          user_id: data.user_id,
          inventory_item_id: data.inventory_item_id,
          transaction_type: data.transaction_type,
          quantity_changed: data.quantity_changed,
          quantity_before: item.current_stock,
          quantity_after: quantityAfter,
          notes: data.notes ?? null,
        })
        .returning([
          'inventory_transaction_id',
          'user_id',
          'inventory_item_id',
          'transaction_type',
          'quantity_changed',
          'quantity_before',
          'quantity_after',
          'notes',
          'reference_type',
          'reference_id',
          'transacted_at',
          'created_at',
          'updated_at',
        ]);

      await trx('inventory_items')
        .where({ inventory_item_id: data.inventory_item_id })
        .whereNull('deleted_at')
        .update({
          current_stock: quantityAfter,
          last_restocked_at:
            data.transaction_type === 'in' ||
            data.transaction_type === 'adjustment'
              ? trx.fn.now()
              : item.last_restocked_at,
          updated_at: trx.fn.now(),
        });

      return {
        ...(created as Omit<InventoryTransaction, 'inventory_item_name'>),
        inventory_item_name: item.inventory_item_name,
      };
    });
  }

  async findDailyPlans(
    params: ListDailyInventoryPlansParams,
  ): Promise<{ data: DailyInventoryPlan[]; total: number }> {
    const { businessId, date, page, limit } = params;
    const offset = (page - 1) * limit;

    const buildBaseQuery = () => {
      const query = this.db('daily_inventory_plans as dip')
        .innerJoin('inventory_items as ii', function () {
          this.on(
            'dip.inventory_item_id',
            '=',
            'ii.inventory_item_id',
          ).andOnNull('ii.deleted_at');
        })
        .where('dip.unit_id', businessId);

      if (date) {
        query.andWhere('dip.date', date);
      }

      return query;
    };

    const [rows, countResult] = await Promise.all([
      buildBaseQuery()
        .select(DAILY_PLAN_SELECT_COLUMNS)
        .orderBy('dip.date', 'DESC')
        .orderBy('ii.inventory_item_name', 'ASC')
        .offset(offset)
        .limit(limit),
      buildBaseQuery()
        .countDistinct('dip.daily_inventory_plan_id as count')
        .first<{ count: string | number }>(),
    ]);

    return {
      data: rows as DailyInventoryPlan[],
      total: Number(countResult?.count ?? 0),
    };
  }

  async findDailyPlanById(
    businessId: string,
    dailyPlanId: string,
  ): Promise<DailyInventoryPlan | null> {
    const row = await this.db('daily_inventory_plans as dip')
      .innerJoin('inventory_items as ii', function () {
        this.on('dip.inventory_item_id', '=', 'ii.inventory_item_id').andOnNull(
          'ii.deleted_at',
        );
      })
      .select(DAILY_PLAN_SELECT_COLUMNS)
      .where('dip.unit_id', businessId)
      .where('dip.daily_inventory_plan_id', dailyPlanId)
      .first<DailyInventoryPlan | undefined>();

    return row ?? null;
  }

  async findDailyPlanByDateAndItem(
    businessId: string,
    date: string,
    inventoryItemId: string,
  ): Promise<DailyInventoryPlan | null> {
    const row = await this.db('daily_inventory_plans as dip')
      .innerJoin('inventory_items as ii', function () {
        this.on('dip.inventory_item_id', '=', 'ii.inventory_item_id').andOnNull(
          'ii.deleted_at',
        );
      })
      .select(DAILY_PLAN_SELECT_COLUMNS)
      .where('dip.unit_id', businessId)
      .where('dip.date', date)
      .where('dip.inventory_item_id', inventoryItemId)
      .first<DailyInventoryPlan | undefined>();

    return row ?? null;
  }

  async findRealizationByPlanId(
    businessId: string,
    dailyPlanId: string,
  ): Promise<DailyInventoryRealization | null> {
    const row = await this.db('daily_inventory_realizations as dir')
      .innerJoin('inventory_items as ii', function () {
        this.on('dir.inventory_item_id', '=', 'ii.inventory_item_id').andOnNull(
          'ii.deleted_at',
        );
      })
      .select(DAILY_REALIZATION_SELECT_COLUMNS)
      .where('dir.unit_id', businessId)
      .where('dir.daily_inventory_plan_id', dailyPlanId)
      .first<DailyInventoryRealization | undefined>();

    return row ?? null;
  }

  async createDailyPlan(
    data: CreateDailyInventoryPlanData,
  ): Promise<DailyInventoryPlan | null> {
    try {
      return await this.db.transaction(async (trx) => {
        const item = await trx('inventory_items as ii')
          .innerJoin('inventory_items_units as iiu', function () {
            this.on(
              'ii.inventory_item_id',
              '=',
              'iiu.inventory_item_id',
            ).andOnNull('iiu.deleted_at');
          })
          .select(['ii.inventory_item_id', 'ii.inventory_item_name'])
          .where('iiu.unit_id', data.businessId)
          .where('ii.inventory_item_id', data.inventory_item_id)
          .whereNull('ii.deleted_at')
          .forUpdate()
          .first<
            | {
                inventory_item_id: string;
                inventory_item_name: string;
              }
            | undefined
          >();

        if (!item) return null;

        const existing = await trx('daily_inventory_plans')
          .where('unit_id', data.businessId)
          .where('date', data.date)
          .where('inventory_item_id', data.inventory_item_id)
          .first();

        if (existing) {
          throw dailyInventoryPlanConflictError({
            businessId: data.businessId,
            date: data.date,
            inventory_item_id: data.inventory_item_id,
          });
        }

        const [created] = await trx('daily_inventory_plans')
          .insert({
            unit_id: data.businessId,
            date: data.date,
            inventory_item_id: data.inventory_item_id,
            planned_usage_qty: data.planned_usage_qty,
            unit: data.unit,
            notes: data.notes ?? null,
            created_by: data.created_by,
          })
          .returning([
            'daily_inventory_plan_id',
            'unit_id',
            'date',
            'inventory_item_id',
            'planned_usage_qty',
            'unit',
            'notes',
            'created_by',
            'created_at',
            'updated_at',
          ]);

        return {
          ...(created as Omit<DailyInventoryPlan, 'inventory_item_name'>),
          inventory_item_name: item.inventory_item_name,
        };
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw dailyInventoryPlanConflictError({
          businessId: data.businessId,
          date: data.date,
          inventory_item_id: data.inventory_item_id,
        });
      }
      throw error;
    }
  }

  async updateDailyPlan(
    businessId: string,
    dailyPlanId: string,
    data: UpdateDailyInventoryPlanData,
  ): Promise<DailyInventoryPlan | null> {
    return this.db.transaction(async (trx) => {
      const current = await trx('daily_inventory_plans')
        .select('daily_inventory_plan_id')
        .where('unit_id', businessId)
        .where('daily_inventory_plan_id', dailyPlanId)
        .forUpdate()
        .first<{ daily_inventory_plan_id: string } | undefined>();

      if (!current) return null;

      const realization = await trx('daily_inventory_realizations')
        .where('unit_id', businessId)
        .where('daily_inventory_plan_id', dailyPlanId)
        .first();

      if (realization) {
        throw dailyInventoryPlanAlreadyRealizedError({
          businessId,
          dailyPlanId,
        });
      }

      const patchPayload: Record<string, unknown> = {
        updated_at: trx.fn.now(),
      };

      if (data.planned_usage_qty !== undefined) {
        patchPayload.planned_usage_qty = data.planned_usage_qty;
      }
      if (data.unit !== undefined) {
        patchPayload.unit = data.unit;
      }
      if (data.notes !== undefined) {
        patchPayload.notes = data.notes;
      }

      await trx('daily_inventory_plans')
        .where('unit_id', businessId)
        .where('daily_inventory_plan_id', dailyPlanId)
        .update(patchPayload);

      const row = await trx('daily_inventory_plans as dip')
        .innerJoin('inventory_items as ii', function () {
          this.on(
            'dip.inventory_item_id',
            '=',
            'ii.inventory_item_id',
          ).andOnNull('ii.deleted_at');
        })
        .select(DAILY_PLAN_SELECT_COLUMNS)
        .where('dip.unit_id', businessId)
        .where('dip.daily_inventory_plan_id', dailyPlanId)
        .first<DailyInventoryPlan | undefined>();

      return row ?? null;
    });
  }

  async deleteDailyPlan(
    businessId: string,
    dailyPlanId: string,
  ): Promise<boolean> {
    return this.db.transaction(async (trx) => {
      const realization = await trx('daily_inventory_realizations')
        .where('unit_id', businessId)
        .where('daily_inventory_plan_id', dailyPlanId)
        .first();

      if (realization) {
        throw dailyInventoryPlanAlreadyRealizedError({ dailyPlanId });
      }

      const deleted = await trx('daily_inventory_plans')
        .where('unit_id', businessId)
        .where('daily_inventory_plan_id', dailyPlanId)
        .delete();

      return deleted > 0;
    });
  }

  async findDailyRealizations(
    params: ListDailyInventoryRealizationsParams,
  ): Promise<{ data: DailyInventoryRealization[]; total: number }> {
    const { businessId, date, page, limit } = params;
    const offset = (page - 1) * limit;

    const buildBaseQuery = () => {
      const query = this.db('daily_inventory_realizations as dir')
        .innerJoin('inventory_items as ii', function () {
          this.on(
            'dir.inventory_item_id',
            '=',
            'ii.inventory_item_id',
          ).andOnNull('ii.deleted_at');
        })
        .where('dir.unit_id', businessId);

      if (date) {
        query.andWhere('dir.date', date);
      }

      return query;
    };

    const [rows, countResult] = await Promise.all([
      buildBaseQuery()
        .select(DAILY_REALIZATION_SELECT_COLUMNS)
        .orderBy('dir.date', 'DESC')
        .orderBy('ii.inventory_item_name', 'ASC')
        .offset(offset)
        .limit(limit),
      buildBaseQuery()
        .countDistinct('dir.daily_inventory_realization_id as count')
        .first<{ count: string | number }>(),
    ]);

    return {
      data: rows as DailyInventoryRealization[],
      total: Number(countResult?.count ?? 0),
    };
  }

  async findDailyRealizationById(
    businessId: string,
    dailyRealizationId: string,
  ): Promise<DailyInventoryRealization | null> {
    const row = await this.db('daily_inventory_realizations as dir')
      .innerJoin('inventory_items as ii', function () {
        this.on('dir.inventory_item_id', '=', 'ii.inventory_item_id').andOnNull(
          'ii.deleted_at',
        );
      })
      .select(DAILY_REALIZATION_SELECT_COLUMNS)
      .where('dir.unit_id', businessId)
      .where('dir.daily_inventory_realization_id', dailyRealizationId)
      .first<DailyInventoryRealization | undefined>();

    return row ?? null;
  }

  async createDailyRealization(
    data: CreateDailyInventoryRealizationData,
  ): Promise<DailyInventoryRealization | null> {
    return this.db.transaction(async (trx) => {
      const plan = await trx('daily_inventory_plans as dip')
        .innerJoin('inventory_items as ii', function () {
          this.on(
            'dip.inventory_item_id',
            '=',
            'ii.inventory_item_id',
          ).andOnNull('ii.deleted_at');
        })
        .innerJoin('inventory_items_units as iiu', function () {
          this.on(
            'ii.inventory_item_id',
            '=',
            'iiu.inventory_item_id',
          ).andOnNull('iiu.deleted_at');
        })
        .select([
          'dip.daily_inventory_plan_id',
          'dip.unit_id',
          'dip.date',
          'dip.inventory_item_id',
          'dip.planned_usage_qty',
          'dip.unit',
          'ii.inventory_item_name',
          'ii.current_stock',
        ])
        .where('dip.unit_id', data.businessId)
        .where('dip.date', data.date)
        .where('dip.inventory_item_id', data.inventory_item_id)
        .where('iiu.unit_id', data.businessId)
        .forUpdate()
        .first<
          | {
              daily_inventory_plan_id: string;
              unit_id: string;
              date: string;
              inventory_item_id: string;
              planned_usage_qty: number;
              unit: string;
              inventory_item_name: string;
              current_stock: number;
            }
          | undefined
        >();

      if (!plan) return null;

      const existing = await trx('daily_inventory_realizations')
        .where('unit_id', data.businessId)
        .where('date', data.date)
        .where('inventory_item_id', data.inventory_item_id)
        .first();

      if (existing) {
        throw dailyInventoryRealizationConflictError({
          date: data.date,
          inventory_item_id: data.inventory_item_id,
        });
      }

      const totalDeduction = data.actual_usage_qty + data.waste_qty;
      if (plan.current_stock < totalDeduction) {
        throw inventoryInsufficientStockError({
          inventory_item_id: data.inventory_item_id,
          current_stock: plan.current_stock,
          requested: totalDeduction,
        });
      }

      // Variance dihitung sebagai selisih antara planned usage dengan total aktual usage (actual usage + waste).
      // Apabila Variance bernilai positif, berarti penggunaan aktual lebih sedikit dari yang direncanakan (under usage).
      // Apabila Variance bernilai negatif, berarti penggunaan aktual lebih banyak dari yang direncanakan (over usage).
      const varianceQty =
        plan.planned_usage_qty - data.actual_usage_qty - data.waste_qty;
      const endingStock = plan.current_stock - totalDeduction;

      const [created] = await trx('daily_inventory_realizations')
        .insert({
          unit_id: data.businessId,
          date: data.date,
          inventory_item_id: data.inventory_item_id,
          daily_inventory_plan_id: plan.daily_inventory_plan_id,
          planned_usage_qty: plan.planned_usage_qty,
          actual_usage_qty: data.actual_usage_qty,
          waste_qty: data.waste_qty,
          remaining_qty: data.remaining_qty ?? null,
          variance_qty: varianceQty,
          notes: data.notes ?? null,
          status: 'SUBMITTED',
          submitted_by: data.submitted_by,
          submitted_at: trx.fn.now(),
        })
        .returning([
          'daily_inventory_realization_id',
          'unit_id',
          'date',
          'inventory_item_id',
          'daily_inventory_plan_id',
          'planned_usage_qty',
          'actual_usage_qty',
          'waste_qty',
          'remaining_qty',
          'variance_qty',
          'notes',
          'status',
          'submitted_by',
          'submitted_at',
          'created_at',
          'updated_at',
        ]);

      const realization = created as Omit<
        DailyInventoryRealization,
        'inventory_item_name'
      >;
      const afterUsage = plan.current_stock - data.actual_usage_qty;

      await trx('inventory_transactions').insert({
        user_id: data.submitted_by,
        inventory_item_id: data.inventory_item_id,
        transaction_type: 'DAILY_USAGE',
        quantity_changed: data.actual_usage_qty,
        quantity_before: plan.current_stock,
        quantity_after: afterUsage,
        notes: data.notes ?? 'Pemakaian aktual inventaris harian',
        reference_type: 'daily_inventory_realization',
        reference_id: realization.daily_inventory_realization_id,
      });

      if (data.waste_qty > 0) {
        await trx('inventory_transactions').insert({
          user_id: data.submitted_by,
          inventory_item_id: data.inventory_item_id,
          transaction_type: 'WASTE',
          quantity_changed: data.waste_qty,
          quantity_before: afterUsage,
          quantity_after: endingStock,
          notes: data.notes ?? 'Waste inventaris harian',
          reference_type: 'daily_inventory_realization',
          reference_id: realization.daily_inventory_realization_id,
        });
      }

      await trx('inventory_items')
        .where('inventory_item_id', data.inventory_item_id)
        .whereNull('deleted_at')
        .update({
          current_stock: endingStock,
          updated_at: trx.fn.now(),
        });

      return {
        ...realization,
        inventory_item_name: plan.inventory_item_name,
      };
    });
  }

  async getDailyUsageReport(
    businessId: string,
    date: string,
  ): Promise<DailyUsageReportRow[]> {
    const rows = await this.db('daily_inventory_plans as dip')
      .innerJoin('inventory_items as ii', function () {
        this.on('dip.inventory_item_id', '=', 'ii.inventory_item_id').andOnNull(
          'ii.deleted_at',
        );
      })
      .leftJoin('daily_inventory_realizations as dir', function () {
        this.on(
          'dip.daily_inventory_plan_id',
          '=',
          'dir.daily_inventory_plan_id',
        );
      })
      .select([
        'dip.date',
        'dip.inventory_item_id',
        'ii.inventory_item_name',
        'dip.unit',
        'dip.planned_usage_qty',
        'dir.actual_usage_qty',
        'dir.waste_qty',
        'dir.variance_qty',
        'dir.status',
      ])
      .where('dip.unit_id', businessId)
      .where('dip.date', date)
      .orderBy('ii.inventory_item_name', 'ASC');

    return rows as DailyUsageReportRow[];
  }

  async getVarianceReport(
    businessId: string,
    startDate: string,
    endDate: string,
  ): Promise<InventoryVarianceReportRow[]> {
    const rows = await this.db('daily_inventory_realizations as dir')
      .innerJoin('inventory_items as ii', function () {
        this.on('dir.inventory_item_id', '=', 'ii.inventory_item_id').andOnNull(
          'ii.deleted_at',
        );
      })
      .select([
        'dir.inventory_item_id',
        'ii.inventory_item_name',
        'dir.unit_id',
        this.db.raw('SUM(dir.planned_usage_qty) as planned_usage_qty'),
        this.db.raw('SUM(dir.actual_usage_qty) as actual_usage_qty'),
        this.db.raw('SUM(dir.waste_qty) as waste_qty'),
        this.db.raw('SUM(dir.variance_qty) as variance_qty'),
      ])
      .select(
        this.db.raw(
          `(SELECT dip.unit
            FROM daily_inventory_plans dip
            WHERE dip.inventory_item_id = dir.inventory_item_id
              AND dip.unit_id = dir.unit_id
            ORDER BY dip.date DESC
            LIMIT 1) as unit`,
        ),
      )
      .where('dir.unit_id', businessId)
      .whereBetween('dir.date', [startDate, endDate])
      .groupBy([
        'dir.inventory_item_id',
        'ii.inventory_item_name',
        'dir.unit_id',
      ])
      .orderBy('ii.inventory_item_name', 'ASC');

    return rows as InventoryVarianceReportRow[];
  }
}
