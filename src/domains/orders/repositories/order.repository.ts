import type { Knex } from 'knex';
import type {
  MenuItemLookupRow,
  OrderItemRow,
  OrderRow,
} from '../models/order.model';

// ===========================
// Parameter & Data Types
// ===========================

export type OrderSortByColumn = 'ordered_at' | 'total_amount' | 'customer_name';

export interface FindAllOrdersParams {
  unitId: string;
  statusId?: string;
  page: number;
  limit: number;
  sortBy: OrderSortByColumn;
  sortType: 'ASC' | 'DESC';
}

export interface CreateOrderData {
  unit_id: string;
  user_id: string;
  order_number: string;
  order_type_id: string;
  order_status_id: string;
  customer_name: string;
  table_number: string | null;
  notes: string | null;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
}

export interface CreateOrderItemData {
  order_id: string;
  menu_item_id: string;
  quantity: number;
  item_price: number;
  notes: string | null;
}

export interface UpdateOrderData {
  order_type_id?: string;
  customer_name?: string;
  table_number?: string | null;
  notes?: string | null;
  subtotal?: number;
  tax_amount?: number;
  total_amount?: number;
}

export interface UpsertOrderItemData {
  order_item_id?: string;
  menu_item_id: string;
  quantity: number;
  item_price: number;
  notes: string | null;
}

// ===========================
// Repository Interface
// ===========================

export interface IOrderRepository {
  findUnitById(
    unitId: string,
  ): Promise<{ unit_id: string; unit_name: string } | null>;
  findOrderTypeById(
    orderTypeId: string,
  ): Promise<{ order_type_id: string; order_type_name: string } | null>;
  findMenuItemsByIds(
    menuItemIds: string[],
    unitId: string,
  ): Promise<MenuItemLookupRow[]>;

  findAll(
    params: FindAllOrdersParams,
  ): Promise<{ data: OrderRow[]; total: number }>;
  findById(unitId: string, orderId: string): Promise<OrderRow | null>;
  findOrderItemsByOrderId(orderId: string): Promise<OrderItemRow[]>;

  countOrdersToday(unitId: string): Promise<number>;

  create(
    data: CreateOrderData,
    trx: Knex.Transaction,
  ): Promise<{ order_id: string }>;
  createOrderItems(
    items: CreateOrderItemData[],
    trx: Knex.Transaction,
  ): Promise<void>;

  update(
    orderId: string,
    data: UpdateOrderData,
    trx: Knex.Transaction,
  ): Promise<void>;
  updateOrderItem(
    orderItemId: string,
    data: Omit<UpsertOrderItemData, 'order_item_id'>,
    trx: Knex.Transaction,
  ): Promise<void>;
  insertOrderItem(
    orderId: string,
    data: Omit<UpsertOrderItemData, 'order_item_id'>,
    trx: Knex.Transaction,
  ): Promise<void>;
  softDeleteOrderItemsByIds(
    orderItemIds: string[],
    trx: Knex.Transaction,
  ): Promise<void>;

  softDeleteOrder(
    orderId: string,
    cancelStatusId: string,
    trx: Knex.Transaction,
  ): Promise<void>;
  softDeleteOrderItemsByOrderId(
    orderId: string,
    trx: Knex.Transaction,
  ): Promise<void>;

  transaction<T>(callback: (trx: Knex.Transaction) => Promise<T>): Promise<T>;
}

// ===========================
// Sort Column Map
// ===========================

const SORT_COLUMN_MAP: Record<OrderSortByColumn, string> = {
  ordered_at: 'o.ordered_at',
  total_amount: 'o.total_amount',
  customer_name: 'o.customer_name',
};

// ===========================
// Select Columns
// ===========================

const ORDER_LIST_SELECT_COLUMNS = [
  'o.order_id',
  'o.unit_id',
  'o.user_id',
  'o.order_number',
  'o.customer_name',
  'o.table_number',
  'o.subtotal',
  'o.tax_amount',
  'o.total_amount',
  'o.notes',
  'o.ordered_at',
  'o.completed_at',
  'o.created_at',
  'o.updated_at',
  'o.deleted_at',
  'ot.order_type_id',
  'ot.order_type_name',
  'os.order_status_id',
  'os.order_status_name',
];

const ORDER_ITEM_SELECT_COLUMNS = [
  'oi.order_item_id',
  'oi.order_id',
  'oi.menu_item_id',
  'mi.menu_item_name',
  'oi.quantity',
  'oi.item_price',
  'oi.notes',
  'oi.created_at',
  'oi.updated_at',
];

// ===========================
// Repository Implementation
// ===========================

export class OrderRepository implements IOrderRepository {
  constructor(private readonly db: Knex) {}

  async findUnitById(
    unitId: string,
  ): Promise<{ unit_id: string; unit_name: string } | null> {
    const row = await this.db('units')
      .select('unit_id', 'unit_name')
      .where('unit_id', unitId)
      .whereNull('deleted_at')
      .first<{ unit_id: string; unit_name: string } | undefined>();

    return row ?? null;
  }

  async findOrderTypeById(
    orderTypeId: string,
  ): Promise<{ order_type_id: string; order_type_name: string } | null> {
    const row = await this.db('order_types')
      .select('order_type_id', 'order_type_name')
      .where('order_type_id', orderTypeId)
      .whereNull('deleted_at')
      .first<{ order_type_id: string; order_type_name: string } | undefined>();

    return row ?? null;
  }

  async findMenuItemsByIds(
    menuItemIds: string[],
    unitId: string,
  ): Promise<MenuItemLookupRow[]> {
    if (menuItemIds.length === 0) return [];

    const rows = await this.db('menu_items as mi')
      .leftJoin('menu_items_units as miu', function () {
        this.on('miu.menu_item_id', '=', 'mi.menu_item_id').andOnNull(
          'miu.deleted_at',
        );
      })
      .select(
        'mi.menu_item_id',
        'mi.menu_item_name',
        'mi.item_price',
        'mi.is_available',
      )
      .whereIn('mi.menu_item_id', menuItemIds)
      .where('miu.unit_id', unitId)
      .whereNull('mi.deleted_at');

    return rows as MenuItemLookupRow[];
  }

  async findAll(
    params: FindAllOrdersParams,
  ): Promise<{ data: OrderRow[]; total: number }> {
    const { unitId, statusId, page, limit, sortBy, sortType } = params;
    const offset = (page - 1) * limit;

    const buildBaseQuery = () => {
      const query = this.db('orders as o')
        .leftJoin('order_types as ot', function () {
          this.on('ot.order_type_id', '=', 'o.order_type_id').andOnNull(
            'ot.deleted_at',
          );
        })
        .leftJoin('order_status as os', function () {
          this.on('os.order_status_id', '=', 'o.order_status_id').andOnNull(
            'os.deleted_at',
          );
        })
        .where('o.unit_id', unitId)
        .whereNull('o.deleted_at');

      if (statusId) {
        query.where('o.order_status_id', statusId);
      }

      return query;
    };

    const col = SORT_COLUMN_MAP[sortBy];

    const [rows, countResult] = await Promise.all([
      buildBaseQuery()
        .select(ORDER_LIST_SELECT_COLUMNS)
        .orderByRaw(`${col} ${sortType} NULLS LAST`)
        .limit(limit)
        .offset(offset),
      buildBaseQuery()
        .count('o.order_id as count')
        .first<{ count: string | number }>(),
    ]);

    const total = Number(countResult?.count ?? 0);
    return { data: rows as OrderRow[], total };
  }

  async findById(unitId: string, orderId: string): Promise<OrderRow | null> {
    const row = await this.db('orders as o')
      .leftJoin('order_types as ot', function () {
        this.on('ot.order_type_id', '=', 'o.order_type_id').andOnNull(
          'ot.deleted_at',
        );
      })
      .leftJoin('order_status as os', function () {
        this.on('os.order_status_id', '=', 'o.order_status_id').andOnNull(
          'os.deleted_at',
        );
      })
      .select(ORDER_LIST_SELECT_COLUMNS)
      .where('o.order_id', orderId)
      .where('o.unit_id', unitId)
      .whereNull('o.deleted_at')
      .first<OrderRow | undefined>();

    return row ?? null;
  }

  async findOrderItemsByOrderId(orderId: string): Promise<OrderItemRow[]> {
    const rows = await this.db('order_items as oi')
      .leftJoin('menu_items as mi', function () {
        this.on('mi.menu_item_id', '=', 'oi.menu_item_id').andOnNull(
          'mi.deleted_at',
        );
      })
      .select(ORDER_ITEM_SELECT_COLUMNS)
      .where('oi.order_id', orderId)
      .whereNull('oi.deleted_at')
      .orderBy('oi.created_at', 'asc');

    return rows as OrderItemRow[];
  }

  async countOrdersToday(unitId: string): Promise<number> {
    const result = await this.db('orders')
      .where('unit_id', unitId)
      .whereRaw("DATE(ordered_at AT TIME ZONE 'UTC') = CURRENT_DATE")
      .count('order_id as count')
      .first<{ count: string | number }>();

    return Number(result?.count ?? 0);
  }

  async create(
    data: CreateOrderData,
    trx: Knex.Transaction,
  ): Promise<{ order_id: string }> {
    const [row] = await trx('orders')
      .insert({
        unit_id: data.unit_id,
        user_id: data.user_id,
        order_number: data.order_number,
        order_type_id: data.order_type_id,
        order_status_id: data.order_status_id,
        customer_name: data.customer_name,
        table_number: data.table_number,
        notes: data.notes,
        subtotal: data.subtotal,
        tax_amount: data.tax_amount,
        total_amount: data.total_amount,
        ordered_at: trx.fn.now(),
        created_at: trx.fn.now(),
        updated_at: trx.fn.now(),
      })
      .returning(['order_id']);

    return row as { order_id: string };
  }

  async createOrderItems(
    items: CreateOrderItemData[],
    trx: Knex.Transaction,
  ): Promise<void> {
    if (items.length === 0) return;

    await trx('order_items').insert(
      items.map((item) => ({
        order_id: item.order_id,
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
        item_price: item.item_price,
        notes: item.notes,
        created_at: trx.fn.now(),
        updated_at: trx.fn.now(),
      })),
    );
  }

  async update(
    orderId: string,
    data: UpdateOrderData,
    trx: Knex.Transaction,
  ): Promise<void> {
    const payload: Record<string, unknown> = {
      updated_at: trx.fn.now(),
    };

    if (data.order_type_id !== undefined)
      payload.order_type_id = data.order_type_id;
    if (data.customer_name !== undefined)
      payload.customer_name = data.customer_name;
    if ('table_number' in data) payload.table_number = data.table_number;
    if ('notes' in data) payload.notes = data.notes;
    if (data.subtotal !== undefined) payload.subtotal = data.subtotal;
    if (data.tax_amount !== undefined) payload.tax_amount = data.tax_amount;
    if (data.total_amount !== undefined)
      payload.total_amount = data.total_amount;

    await trx('orders')
      .where('order_id', orderId)
      .whereNull('deleted_at')
      .update(payload);
  }

  async updateOrderItem(
    orderItemId: string,
    data: Omit<UpsertOrderItemData, 'order_item_id'>,
    trx: Knex.Transaction,
  ): Promise<void> {
    await trx('order_items')
      .where('order_item_id', orderItemId)
      .whereNull('deleted_at')
      .update({
        menu_item_id: data.menu_item_id,
        quantity: data.quantity,
        item_price: data.item_price,
        notes: data.notes,
        updated_at: trx.fn.now(),
      });
  }

  async insertOrderItem(
    orderId: string,
    data: Omit<UpsertOrderItemData, 'order_item_id'>,
    trx: Knex.Transaction,
  ): Promise<void> {
    await trx('order_items').insert({
      order_id: orderId,
      menu_item_id: data.menu_item_id,
      quantity: data.quantity,
      item_price: data.item_price,
      notes: data.notes,
      created_at: trx.fn.now(),
      updated_at: trx.fn.now(),
    });
  }

  async softDeleteOrderItemsByIds(
    orderItemIds: string[],
    trx: Knex.Transaction,
  ): Promise<void> {
    if (orderItemIds.length === 0) return;

    await trx('order_items')
      .whereIn('order_item_id', orderItemIds)
      .whereNull('deleted_at')
      .update({
        deleted_at: trx.fn.now(),
        updated_at: trx.fn.now(),
      });
  }

  async softDeleteOrder(
    orderId: string,
    cancelStatusId: string,
    trx: Knex.Transaction,
  ): Promise<void> {
    await trx('orders')
      .where('order_id', orderId)
      .whereNull('deleted_at')
      .update({
        deleted_at: trx.fn.now(),
        order_status_id: cancelStatusId,
        updated_at: trx.fn.now(),
      });
  }

  async softDeleteOrderItemsByOrderId(
    orderId: string,
    trx: Knex.Transaction,
  ): Promise<void> {
    await trx('order_items')
      .where('order_id', orderId)
      .whereNull('deleted_at')
      .update({
        deleted_at: trx.fn.now(),
        updated_at: trx.fn.now(),
      });
  }

  async transaction<T>(
    callback: (trx: Knex.Transaction) => Promise<T>,
  ): Promise<T> {
    return this.db.transaction(callback);
  }
}
