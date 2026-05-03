import type { Knex } from 'knex';
import type {
  MenuRow,
  MenuStats,
  RawMenuStats,
} from '../models/menu.model';

export type MenuSortByColumn = 'menu_name' | 'menu_category' | 'menu_price';

export interface FindAllMenusParams {
  businessId: string;
  page: number;
  limit: number;
  search?: string;
  sortBy: MenuSortByColumn;
  sortType: 'ASC' | 'DESC';
}

export interface CreateMenuData {
  menu_category_id: string;
  menu_item_name: string;
  item_price: number;
  is_available: boolean;
  blob_id: string | null;
}

export interface UpdateMenuData {
  menu_category_id?: string;
  menu_item_name?: string;
  item_price?: number;
  is_available?: boolean;
  blob_id?: string;
}

export interface IMenuRepository {
  findUnitById(unitId: string): Promise<{ unit_id: string; unit_name: string } | null>;
  findAll(params: FindAllMenusParams): Promise<{ data: MenuRow[]; total: number }>;
  findById(businessId: string, menuId: string): Promise<MenuRow | null>;
  getStats(businessId: string): Promise<MenuStats>;
  findCategoryById(
    categoryId: string,
    businessId: string,
  ): Promise<{ menu_category_id: string; category_name: string } | null>;
  findByName(
    name: string,
    businessId: string,
    excludeMenuId?: string,
  ): Promise<{ menu_item_id: string } | null>;
  create(data: CreateMenuData, businessId: string): Promise<{ menu_item_id: string }>;
  update(menuId: string, data: UpdateMenuData): Promise<void>;
  softDelete(menuId: string): Promise<void>;
  undoSoftDelete(menuId: string): Promise<void>;
}

const SORT_COLUMN_MAP: Record<MenuSortByColumn, string> = {
  menu_name: 'mi.menu_item_name',
  menu_category: 'mc.category_name',
  menu_price: 'mi.item_price',
};

const MENU_SELECT_COLUMNS = [
  'mi.menu_item_id as menu_id',
  'mi.menu_item_name as menu_name',
  'mc.menu_category_id',
  'mc.category_name as menu_category_name',
  'mi.item_price as menu_price',
  'mi.blob_id',
  'miu.unit_id as business_unit_id',
  'u.unit_name as business_unit_name',
  'mi.is_available',
];

export class MenuRepository implements IMenuRepository {
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

  async findAll(
    params: FindAllMenusParams,
  ): Promise<{ data: MenuRow[]; total: number }> {
    const { businessId, page, limit, search, sortBy, sortType } = params;
    const offset = (page - 1) * limit;

    const buildBaseQuery = () => {
      const query = this.db('menu_items_units as miu')
        .leftJoin('menu_items as mi', function () {
          this.on('mi.menu_item_id', '=', 'miu.menu_item_id').andOnNull(
            'mi.deleted_at',
          );
        })
        .leftJoin('menu_categories as mc', function () {
          this.on(
            'mc.menu_category_id',
            '=',
            'mi.menu_category_id',
          ).andOnNull('mc.deleted_at');
        })
        .leftJoin('units as u', function () {
          this.on('u.unit_id', '=', 'miu.unit_id').andOnNull('u.deleted_at');
        })
        .where('miu.unit_id', businessId)
        .whereNull('miu.deleted_at');

      if (search) {
        query.where(function () {
          this.whereILike('mi.menu_item_name', `%${search}%`).orWhereILike(
            'mc.category_name',
            `%${search}%`,
          );
        });
      }

      return query;
    };

    const col = SORT_COLUMN_MAP[sortBy];

    const [rows, countResult] = await Promise.all([
      buildBaseQuery()
        .select(MENU_SELECT_COLUMNS)
        .orderByRaw(`${col} ${sortType} NULLS LAST`)
        .limit(limit)
        .offset(offset),
      buildBaseQuery()
        .count('miu.menu_item_unit_id as count')
        .first<{ count: string | number }>(),
    ]);

    const total = Number(countResult?.count ?? 0);
    return { data: rows as MenuRow[], total };
  }

  async findById(businessId: string, menuId: string): Promise<MenuRow | null> {
    const row = await this.db('menu_items_units as miu')
      .leftJoin('menu_items as mi', function () {
        this.on('mi.menu_item_id', '=', 'miu.menu_item_id').andOnNull(
          'mi.deleted_at',
        );
      })
      .leftJoin('menu_categories as mc', function () {
        this.on('mc.menu_category_id', '=', 'mi.menu_category_id').andOnNull(
          'mc.deleted_at',
        );
      })
      .leftJoin('units as u', function () {
        this.on('u.unit_id', '=', 'miu.unit_id').andOnNull('u.deleted_at');
      })
      .select(MENU_SELECT_COLUMNS)
      .where('miu.unit_id', businessId)
      .where('miu.menu_item_id', menuId)
      .whereNull('miu.deleted_at')
      .first<MenuRow | undefined>();

    return row ?? null;
  }

  async getStats(businessId: string): Promise<MenuStats> {
    const row = await this.db('menu_items_units as miu')
      .leftJoin('menu_items as mi', function () {
        this.on('mi.menu_item_id', '=', 'miu.menu_item_id');
      })
      .where('miu.unit_id', businessId)
      .whereNull('miu.deleted_at')
      .select(
        this.db.raw(
          'COUNT(*) FILTER (WHERE mi.deleted_at IS NULL) as total_menu',
        ),
        this.db.raw(
          'COUNT(*) FILTER (WHERE mi.deleted_at IS NULL AND mi.is_available = true) as menu_active',
        ),
        this.db.raw(
          'COUNT(*) FILTER (WHERE mi.deleted_at IS NULL AND mi.is_available = false) as menu_inactive',
        ),
      )
      .first<RawMenuStats | undefined>();

    return {
      total_menu: Number(row?.total_menu ?? 0),
      menu_active: Number(row?.menu_active ?? 0),
      menu_inactive: Number(row?.menu_inactive ?? 0),
    };
  }

  async findCategoryById(
    categoryId: string,
    businessId: string,
  ): Promise<{ menu_category_id: string; category_name: string } | null> {
    const row = await this.db('menu_categories')
      .select('menu_category_id', 'category_name')
      .where('menu_category_id', categoryId)
      .where('unit_id', businessId)
      .whereNull('deleted_at')
      .first<
        { menu_category_id: string; category_name: string } | undefined
      >();

    return row ?? null;
  }

  async findByName(
    name: string,
    businessId: string,
    excludeMenuId?: string,
  ): Promise<{ menu_item_id: string } | null> {
    const query = this.db('menu_items as mi')
      .leftJoin('menu_items_units as miu', function () {
        this.on('miu.menu_item_id', '=', 'mi.menu_item_id').andOnNull(
          'miu.deleted_at',
        );
      })
      .select('mi.menu_item_id')
      .whereRaw('LOWER(mi.menu_item_name) = LOWER(?)', [name])
      .where('miu.unit_id', businessId)
      .whereNull('mi.deleted_at');

    if (excludeMenuId) {
      query.whereNot('mi.menu_item_id', excludeMenuId);
    }

    const row = await query.first<{ menu_item_id: string } | undefined>();
    return row ?? null;
  }

  async create(
    data: CreateMenuData,
    businessId: string,
  ): Promise<{ menu_item_id: string }> {
    return this.db.transaction(async (trx) => {
      const [row] = await trx('menu_items')
        .insert({
          menu_category_id: data.menu_category_id,
          menu_item_name: data.menu_item_name,
          item_price: data.item_price,
          is_available: data.is_available,
          blob_id: data.blob_id,
          created_at: trx.fn.now(),
          updated_at: trx.fn.now(),
        })
        .returning(['menu_item_id']);

      await trx('menu_items_units').insert({
        menu_item_id: row.menu_item_id,
        unit_id: businessId,
        created_at: trx.fn.now(),
        updated_at: trx.fn.now(),
      });

      return row as { menu_item_id: string };
    });
  }

  async update(menuId: string, data: UpdateMenuData): Promise<void> {
    const payload: Record<string, unknown> = {
      updated_at: this.db.fn.now(),
    };

    if (data.menu_category_id !== undefined)
      payload.menu_category_id = data.menu_category_id;
    if (data.menu_item_name !== undefined)
      payload.menu_item_name = data.menu_item_name;
    if (data.item_price !== undefined) payload.item_price = data.item_price;
    if (data.is_available !== undefined)
      payload.is_available = data.is_available;
    if (data.blob_id !== undefined) payload.blob_id = data.blob_id;

    await this.db('menu_items')
      .where('menu_item_id', menuId)
      .whereNull('deleted_at')
      .update(payload);
  }

  async softDelete(menuId: string): Promise<void> {
    await this.db.transaction(async (trx) => {
      await trx('menu_items')
        .where('menu_item_id', menuId)
        .whereNull('deleted_at')
        .update({ deleted_at: trx.fn.now(), updated_at: trx.fn.now() });

      await trx('menu_items_units')
        .where('menu_item_id', menuId)
        .whereNull('deleted_at')
        .update({ deleted_at: trx.fn.now(), updated_at: trx.fn.now() });
    });
  }

  async undoSoftDelete(menuId: string): Promise<void> {
    await this.db.transaction(async (trx) => {
      await trx('menu_items')
        .where('menu_item_id', menuId)
        .update({ deleted_at: null, updated_at: trx.fn.now() });

      await trx('menu_items_units')
        .where('menu_item_id', menuId)
        .update({ deleted_at: null, updated_at: trx.fn.now() });
    });
  }
}
